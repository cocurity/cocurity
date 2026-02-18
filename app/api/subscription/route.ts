import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserSubscription, upsertSubscription, parsePlanId } from "@/lib/subscription";

type SubscriptionRequestBody = {
  planId?: string;
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const subscription = await getUserSubscription(session.user.id);

  return NextResponse.json({
    plan: subscription?.plan ?? "FREE",
    subscription: subscription
      ? {
          id: subscription.id,
          plan: subscription.plan,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
        }
      : null,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: SubscriptionRequestBody;
  try {
    body = (await request.json()) as SubscriptionRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const planId = body.planId?.trim();
  if (!planId) {
    return NextResponse.json({ error: "planId is required." }, { status: 400 });
  }

  const plan = parsePlanId(planId);
  if (!plan) {
    return NextResponse.json(
      { error: "Invalid planId. Must be one of: free, plus, pro." },
      { status: 400 }
    );
  }

  const subscription = await upsertSubscription(session.user.id, plan);

  return NextResponse.json({
    plan: subscription.plan,
    subscription: {
      id: subscription.id,
      plan: subscription.plan,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
    },
  });
}
