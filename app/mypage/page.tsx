import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserSubscription } from "@/lib/subscription";
import MyPageClient from "./MyPageClient";

export default async function MyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const subscription = session.user.id
    ? await getUserSubscription(session.user.id)
    : null;

  return (
    <MyPageClient
      user={session.user}
      subscription={
        subscription
          ? {
              plan: subscription.plan,
              currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
            }
          : null
      }
    />
  );
}
