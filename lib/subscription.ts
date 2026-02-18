import { Plan } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getUserPlan(userId: string): Promise<Plan> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true },
  });
  return subscription?.plan ?? Plan.FREE;
}

export async function getUserSubscription(userId: string) {
  return prisma.subscription.findUnique({
    where: { userId },
  });
}

export async function upsertSubscription(userId: string, plan: Plan) {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  return prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
    update: {
      plan,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });
}

/** Valid plan IDs that map to Plan enum */
const VALID_PLANS: Record<string, Plan> = {
  free: Plan.FREE,
  plus: Plan.PLUS,
  pro: Plan.PRO,
};

export function parsePlanId(planId: string): Plan | null {
  return VALID_PLANS[planId.toLowerCase()] ?? null;
}
