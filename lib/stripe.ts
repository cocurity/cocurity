import Stripe from "stripe";

const globalForStripe = globalThis as unknown as { stripe: Stripe | undefined };

export function getStripeServer(): Stripe {
  if (globalForStripe.stripe) return globalForStripe.stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }

  const instance = new Stripe(key, {
    apiVersion: "2026-01-28.clover",
    typescript: true,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForStripe.stripe = instance;
  }

  return instance;
}

export const STRIPE_PRICES = {
  FIX_PASS: process.env.STRIPE_PRICE_FIX_PASS ?? "",
  CERT_PASS: process.env.STRIPE_PRICE_CERT_PASS ?? "",
  PLUS_MONTHLY: process.env.STRIPE_PRICE_PLUS_MONTHLY ?? "",
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
} as const;
