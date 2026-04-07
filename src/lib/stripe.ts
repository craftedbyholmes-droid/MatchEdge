import Stripe from "stripe";

export function getStripeServerClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey || secretKey.startsWith("REPLACE_WITH")) {
    throw new Error("Stripe is not configured. Fill in STRIPE_SECRET_KEY.");
  }

  return new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia",
  });
}

export function getStripePublishableKey() {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  if (!key || key.startsWith("REPLACE_WITH")) {
    return "";
  }
  return key;
}