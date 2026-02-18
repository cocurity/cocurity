import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeServer } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

type GiftCheckoutBody = {
  mode: "payment";
  email: string;
  scanId?: string;
  repoUrl?: string;
  items: string[];
};

type SubscriptionCheckoutBody = {
  mode: "subscription";
  email: string;
  slug: string;
};

type CheckoutBody = GiftCheckoutBody | SubscriptionCheckoutBody;

export async function POST(request: Request) {
  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.email?.trim()) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const origin =
    request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    if (body.mode === "payment") {
      return await handleGiftCheckout(body, origin);
    }

    if (body.mode === "subscription") {
      return await handleSubscriptionCheckout(body, origin);
    }

    return NextResponse.json({ error: "Invalid mode." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[checkout/session] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleGiftCheckout(body: GiftCheckoutBody, origin: string) {
  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: "items must be an array of product slugs." }, { status: 400 });
  }

  const itemSlugs = Array.from(new Set(body.items.map((item) => item.trim()).filter(Boolean)));

  if (itemSlugs.length === 0) {
    return NextResponse.json(
      { error: "Select at least one gift item." },
      { status: 400 }
    );
  }

  const products = await prisma.product.findMany({
    where: {
      slug: { in: itemSlugs },
      active: true,
      type: "ONE_TIME",
    },
  });

  if (products.length !== itemSlugs.length) {
    return NextResponse.json(
      { error: "One or more selected products are invalid or inactive." },
      { status: 400 }
    );
  }

  const productsBySlug = new Map(products.map((product) => [product.slug, product]));
  const orderedProducts = itemSlugs
    .map((slug) => productsBySlug.get(slug))
    .filter((product): product is (typeof products)[number] => Boolean(product));

  if (orderedProducts.length !== itemSlugs.length) {
    return NextResponse.json(
      { error: "One or more selected products are invalid or inactive." },
      { status: 400 }
    );
  }

  const lineItems = orderedProducts.map((product) => ({
    price_data: {
      currency: product.currency,
      unit_amount: product.price,
      product_data: {
        name: product.name,
        description: product.description ?? undefined,
      },
    },
    quantity: 1,
  }));

  const itemLabels = orderedProducts.map((product) => product.name);
  const amount = orderedProducts.reduce((sum, product) => sum + product.price, 0);
  const currency = orderedProducts[0]?.currency ?? "usd";

  const successUrl = body.scanId
    ? `${origin}/scan/${body.scanId}?payment_done=1&session_id={CHECKOUT_SESSION_ID}`
    : `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`;

  const cancelUrl = body.scanId
    ? `${origin}/scan/${body.scanId}`
    : `${origin}/pricing`;

  const session = await getStripeServer().checkout.sessions.create({
    mode: "payment",
    customer_email: body.email,
    line_items: lineItems satisfies Stripe.Checkout.SessionCreateParams.LineItem[],
    metadata: {
      scanId: body.scanId ?? "",
      repoUrl: body.repoUrl ?? "",
      email: body.email,
      items: JSON.stringify(itemLabels),
      orderType: "ONE_TIME",
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  });

  await prisma.order.create({
    data: {
      type: "ONE_TIME",
      status: "PENDING",
      amount,
      currency,
      email: body.email,
      scanRunId: body.scanId || null,
      repoUrl: body.repoUrl || null,
      items: JSON.stringify(itemLabels),
      stripeSessionId: session.id,
    },
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}

async function handleSubscriptionCheckout(body: SubscriptionCheckoutBody, origin: string) {
  if (!body.slug?.trim()) {
    return NextResponse.json({ error: "slug is required for subscription checkout." }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: {
      slug: body.slug.trim(),
      active: true,
      type: "SUBSCRIPTION",
    },
  });

  if (!product) {
    return NextResponse.json(
      { error: "Subscription product is invalid or inactive." },
      { status: 400 }
    );
  }

  const recurringInterval = parseRecurringInterval(product.interval);
  if (!recurringInterval) {
    return NextResponse.json(
      { error: "Subscription product interval is invalid." },
      { status: 400 }
    );
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: product.currency,
        unit_amount: product.price,
        product_data: {
          name: product.name,
          description: product.description ?? undefined,
        },
        recurring: {
          interval: recurringInterval,
        },
      },
      quantity: 1,
    },
  ];

  const session = await getStripeServer().checkout.sessions.create({
    mode: "subscription",
    customer_email: body.email,
    line_items: lineItems,
    metadata: {
      email: body.email,
      slug: product.slug,
      orderType: "SUBSCRIPTION",
    },
    subscription_data: {
      metadata: {
        email: body.email,
        slug: product.slug,
      },
    },
    success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing`,
  });

  await prisma.order.create({
    data: {
      type: "SUBSCRIPTION",
      status: "PENDING",
      amount: product.price,
      currency: product.currency,
      email: body.email,
      items: JSON.stringify([product.name]),
      stripeSessionId: session.id,
      stripeSubId: typeof session.subscription === "string" ? session.subscription : null,
    },
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}

function parseRecurringInterval(
  interval: string | null
): Stripe.Checkout.SessionCreateParams.LineItem.PriceData.Recurring.Interval | null {
  if (
    interval === "day" ||
    interval === "week" ||
    interval === "month" ||
    interval === "year"
  ) {
    return interval;
  }

  return null;
}
