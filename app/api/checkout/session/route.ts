import { NextResponse } from "next/server";
import { getStripeServer, STRIPE_PRICES } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

type GiftCheckoutBody = {
  mode: "payment";
  email: string;
  scanId: string;
  repoUrl: string;
  giftFix: boolean;
  giftCert: boolean;
};

type SubscriptionCheckoutBody = {
  mode: "subscription";
  email: string;
  planId: "plus" | "pro";
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
  if (!body.giftFix && !body.giftCert) {
    return NextResponse.json(
      { error: "Select at least one gift item." },
      { status: 400 }
    );
  }

  const lineItems: Array<{ price: string; quantity: number }> = [];
  const itemLabels: string[] = [];

  if (body.giftFix) {
    if (!STRIPE_PRICES.FIX_PASS) {
      return NextResponse.json(
        { error: "Fix Pass price is not configured." },
        { status: 500 }
      );
    }
    lineItems.push({ price: STRIPE_PRICES.FIX_PASS, quantity: 1 });
    itemLabels.push("Cocurity Fix Pass");
  }

  if (body.giftCert) {
    if (!STRIPE_PRICES.CERT_PASS) {
      return NextResponse.json(
        { error: "Cert Pass price is not configured." },
        { status: 500 }
      );
    }
    lineItems.push({ price: STRIPE_PRICES.CERT_PASS, quantity: 1 });
    itemLabels.push("Certification Pass");
  }

  const successUrl = body.scanId
    ? `${origin}/scan/${body.scanId}?payment_done=1&session_id={CHECKOUT_SESSION_ID}`
    : `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`;

  const cancelUrl = body.scanId
    ? `${origin}/scan/${body.scanId}`
    : `${origin}/pricing`;

  const session = await getStripeServer().checkout.sessions.create({
    mode: "payment",
    customer_email: body.email,
    line_items: lineItems,
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

  // Compute amount from line items (we know the prices from our config)
  const amount = session.amount_total ?? 0;

  await prisma.order.create({
    data: {
      type: "ONE_TIME",
      status: "PENDING",
      amount,
      currency: "usd",
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
  const priceId =
    body.planId === "plus" ? STRIPE_PRICES.PLUS_MONTHLY : STRIPE_PRICES.PRO_MONTHLY;

  if (!priceId) {
    return NextResponse.json(
      { error: `Price for plan "${body.planId}" is not configured.` },
      { status: 500 }
    );
  }

  const session = await getStripeServer().checkout.sessions.create({
    mode: "subscription",
    customer_email: body.email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      email: body.email,
      planId: body.planId,
      orderType: "SUBSCRIPTION",
    },
    subscription_data: {
      metadata: {
        email: body.email,
        planId: body.planId,
      },
    },
    success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing`,
  });

  const amount = body.planId === "plus" ? 1900 : 4900; // cents

  await prisma.order.create({
    data: {
      type: "SUBSCRIPTION",
      status: "PENDING",
      amount,
      currency: "usd",
      email: body.email,
      items: JSON.stringify([`${body.planId === "plus" ? "Plus" : "Pro"} Membership`]),
      stripeSessionId: session.id,
      stripeSubId: typeof session.subscription === "string" ? session.subscription : null,
    },
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
