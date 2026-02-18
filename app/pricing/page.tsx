import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PricingClient from "./PricingClient";

export default async function PricingPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/pricing");
  }

  return <PricingClient />;
}
