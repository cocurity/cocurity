import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeServer } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripeServer().webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[webhook] Signature verification failed: ${message}`);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`[webhook] Handler error for ${event.type}:`, err);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!session.id) return;

  const order = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
  });

  if (!order) {
    console.warn(`[webhook] No order found for session ${session.id}`);
    return;
  }

  const updateData: Record<string, unknown> = {
    status: "PAID",
    paidAt: new Date(),
    amount: session.amount_total ?? order.amount,
  };

  if (session.payment_intent) {
    updateData.stripePaymentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent.id;
  }

  if (session.customer) {
    updateData.stripeCustomerId =
      typeof session.customer === "string" ? session.customer : session.customer.id;
  }

  if (session.subscription) {
    updateData.stripeSubId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription.id;
  }

  await prisma.order.update({
    where: { id: order.id },
    data: updateData,
  });

  console.log(`[webhook] Order ${order.id} marked as PAID (session: ${session.id})`);
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  if (!session.id) return;

  await prisma.order.updateMany({
    where: { stripeSessionId: session.id, status: "PENDING" },
    data: { status: "CANCELLED" },
  });

  console.log(`[webhook] Session expired, order cancelled: ${session.id}`);
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) return;

  await prisma.order.updateMany({
    where: { stripePaymentId: paymentIntentId },
    data: { status: "REFUNDED" },
  });

  console.log(`[webhook] Charge refunded: ${paymentIntentId}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.order.updateMany({
    where: { stripeSubId: subscription.id },
    data: { status: "CANCELLED" },
  });

  console.log(`[webhook] Subscription cancelled: ${subscription.id}`);
}
