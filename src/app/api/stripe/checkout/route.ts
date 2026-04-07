import { NextResponse } from "next/server";
import { getStripeServerClient } from "@/lib/stripe";
import { getPlanPriceId, pricingPlans, type PlanKey } from "@/lib/plans";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const planKey = String(body.planKey || "") as PlanKey;

    const plan = pricingPlans.find((x) => x.key === planKey);
    if (!plan || plan.key === "free") {
      return NextResponse.json({ ok: false, error: "Invalid paid plan selected." }, { status: 400 });
    }

    const priceId = getPlanPriceId(plan.key);
    if (!priceId || priceId.startsWith("REPLACE_WITH")) {
      return NextResponse.json({ ok: false, error: "Stripe price ID is not configured for this plan." }, { status: 500 });
    }

    const stripe = getStripeServerClient();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: process.env.NEXT_PUBLIC_STRIPE_SUCCESS_URL || "http://localhost:3000/dashboard?checkout=success",
      cancel_url: process.env.NEXT_PUBLIC_STRIPE_CANCEL_URL || "http://localhost:3000/pricing?checkout=cancelled",
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown Stripe checkout error",
      },
      { status: 500 }
    );
  }
}