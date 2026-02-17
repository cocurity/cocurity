"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PricingSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}

type OrderInfo = {
  type: string;
  status: string;
  amount: number;
  currency: string;
  items: string[];
} | null;

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState<OrderInfo>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/checkout/session/verify?session_id=${sessionId}`);
        if (res.ok) {
          const data = (await res.json()) as OrderInfo;
          setOrder(data);
        }
      } catch {
        // Ignore — show generic success
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [sessionId]);

  return (
    <main className="space-y-6">
      <section className="co-noise-card rounded-2xl p-6">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/20 bg-gradient-to-br from-[#0d2818] via-[#0d1429] to-[#182345] p-6">
          <div className="pointer-events-none absolute -left-20 top-8 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-cyan-300/15 blur-3xl" />
          <p className="relative z-10 text-xs uppercase tracking-[0.2em] text-emerald-100">Payment Confirmed</p>
          <h1 className="relative z-10 mt-3 text-2xl font-semibold text-slate-100">
            Thank you for your purchase!
          </h1>
          <p className="relative z-10 mt-2 text-sm text-slate-300">
            Your payment has been processed successfully. A confirmation email will be sent shortly.
          </p>
        </div>
      </section>

      <section className="co-noise-card rounded-2xl p-6">
        {loading ? (
          <p className="text-sm text-slate-300">Loading order details...</p>
        ) : order ? (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-100">Order Details</h2>
            <div className="space-y-2 text-sm text-slate-200">
              <div className="flex items-center justify-between">
                <span>Type</span>
                <span>{order.type === "ONE_TIME" ? "One-time purchase" : "Subscription"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Amount</span>
                <span>
                  ${(order.amount / 100).toFixed(2)} {order.currency.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span className="text-emerald-200">{order.status}</span>
              </div>
              {order.items.length > 0 ? (
                <div className="flex items-center justify-between">
                  <span>Items</span>
                  <span>{order.items.join(", ")}</span>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-100">Order Received</h2>
            <p className="text-sm text-slate-300">
              Your payment is being processed. Check your email for order confirmation.
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/mypage" className="lp-button lp-button-primary">
            Go to My Page
          </Link>
          <Link href="/scan" className="lp-button lp-button-ghost">
            Start New Scan
          </Link>
        </div>
      </section>
    </main>
  );
}
