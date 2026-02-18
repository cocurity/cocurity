import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PricingClient from "./PricingClient";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PricingPage({ searchParams }: Props) {
  const session = await auth();

  if (!session?.user) {
    const params = await searchParams;
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") qs.set(key, value);
    }
    const fullPath = qs.toString() ? `/pricing?${qs.toString()}` : "/pricing";
    redirect(`/login?callbackUrl=${encodeURIComponent(fullPath)}`);
  }

  return <PricingClient />;
}
