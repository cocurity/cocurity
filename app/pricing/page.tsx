"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  type: "ONE_TIME" | "SUBSCRIPTION";
  interval: string | null;
  features: string;
  benefit: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type ProductsResponse = {
  oneTime: Product[];
  subscription: Product[];
};

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get("plan");
  const context = searchParams.get("context");
  const scanId = searchParams.get("scanId") ?? "";
  const repoUrl = searchParams.get("repoUrl") ?? "";

  const [selectedPlanSlug, setSelectedPlanSlug] = useState(initialPlan === "plus" ? "plus" : "pro");
  const [selectedGiftSlugs, setSelectedGiftSlugs] = useState<string[]>(() => {
    const initial: string[] = [];
    if (searchParams.get("giftFix") === "1") initial.push("fix-pass");
    if (searchParams.get("giftCert") === "1") initial.push("cert-pass");
    return initial;
  });
  const [oneTimeProducts, setOneTimeProducts] = useState<Product[]>([]);
  const [subscriptionProducts, setSubscriptionProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const isGiftCheckout = context === "gift";
  const giftFixSelected = selectedGiftSlugs.includes("fix-pass");
  const giftCertSelected = selectedGiftSlugs.includes("cert-pass");

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoadingProducts(true);
      setLoadError(null);

      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        const data = (await res.json()) as ProductsResponse & { error?: string };

        if (!res.ok) {
          throw new Error(data.error ?? "Failed to load products.");
        }

        if (!cancelled) {
          setOneTimeProducts(data.oneTime ?? []);
          setSubscriptionProducts(data.subscription ?? []);
        }
      } catch {
        if (!cancelled) {
          setLoadError("Failed to load products. Please refresh and try again.");
        }
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (subscriptionProducts.length === 0) return;
    if (subscriptionProducts.some((product) => product.slug === selectedPlanSlug)) return;
    setSelectedPlanSlug(subscriptionProducts[0].slug);
  }, [selectedPlanSlug, subscriptionProducts]);

  useEffect(() => {
    if (oneTimeProducts.length === 0) return;
    const validSlugs = new Set(oneTimeProducts.map((product) => product.slug));
    setSelectedGiftSlugs((prev) => prev.filter((slug) => validSlugs.has(slug)));
  }, [oneTimeProducts]);

  const selectedMembership = useMemo(
    () =>
      subscriptionProducts.find((plan) => plan.slug === selectedPlanSlug) ??
      subscriptionProducts[0] ??
      null,
    [selectedPlanSlug, subscriptionProducts]
  );

  const giftSubtotal = oneTimeProducts.reduce((sum, product) => {
    return sum + (selectedGiftSlugs.includes(product.slug) ? product.price / 100 : 0);
  }, 0);
  const giftBundleDiscount = giftFixSelected && giftCertSelected ? 19 : 0;
  const giftTotal = Math.max(0, giftSubtotal - giftBundleDiscount);
  const amountDue = isGiftCheckout ? giftTotal : (selectedMembership?.price ?? 0) / 100;
  const canPay = isGiftCheckout
    ? selectedGiftSlugs.length > 0 && oneTimeProducts.length > 0
    : Boolean(selectedMembership);

  function parseFeatures(features: string): string[] {
    try {
      const parsed = JSON.parse(features);
      return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
    } catch {
      return [];
    }
  }

  function formatDollars(cents: number): string {
    return `${(cents / 100).toFixed(0)}`;
  }

  function toggleGiftProduct(slug: string, checked: boolean) {
    setSelectedGiftSlugs((prev) => {
      if (checked) {
        if (prev.includes(slug)) return prev;
        return [...prev, slug];
      }

      return prev.filter((item) => item !== slug);
    });
  }

  async function onCheckout() {
    if (!canPay) {
      setMessage(isGiftCheckout ? "Select at least one gift pass." : "Select a membership plan.");
      return;
    }

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      return;
    }

    setMessage(null);
    setProcessing(true);

    try {
      const payload = isGiftCheckout
        ? {
            mode: "payment" as const,
            email: email.trim(),
            scanId: scanId || undefined,
            repoUrl: repoUrl || undefined,
            items: selectedGiftSlugs,
          }
        : {
            mode: "subscription" as const,
            email: email.trim(),
            slug: selectedMembership?.slug ?? "",
          };

      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        setMessage(data.error ?? "Failed to create checkout session.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <main className="space-y-6">
      <section className="co-noise-card rounded-2xl p-6">
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/20 bg-gradient-to-br from-[#121a33] via-[#0d1429] to-[#182345] p-6">
          <div className="pointer-events-none absolute -left-20 top-8 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-cyan-300/15 blur-3xl" />
          <p className="relative z-10 text-xs uppercase tracking-[0.2em] text-amber-100">Secure Checkout</p>
          <h1 className="relative z-10 mt-3 text-2xl font-semibold text-slate-100">
            {isGiftCheckout ? "Gift Pack Checkout" : "Membership Checkout"}
          </h1>
          <p className="relative z-10 mt-2 text-sm text-slate-300">
            {isGiftCheckout
              ? "One-time special gift passes for security remediation and certification."
              : "Choose your Cocurity membership for higher scan capacity."}
          </p>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="co-noise-card rounded-2xl p-6">
          {loadingProducts ? (
            <div className="rounded-xl border border-white/15 bg-white/5 p-4 text-sm text-slate-300">
              Loading products...
            </div>
          ) : loadError ? (
            <div className="rounded-xl border border-amber-300/40 bg-amber-300/10 p-4 text-sm text-amber-100">
              {loadError}
            </div>
          ) : isGiftCheckout ? (
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Select Gift Pack Benefits</h2>
              <p className="mt-1 text-sm text-slate-300">Each gift pass is a one-time entitlement.</p>

              <div className="mt-4 space-y-3">
                {oneTimeProducts.map((product) => {
                  const checked = selectedGiftSlugs.includes(product.slug);
                  return (
                    <label key={product.id} className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/5 p-4">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={checked}
                        onChange={(event) => toggleGiftProduct(product.slug, event.target.checked)}
                      />
                      <span>
                        <span className="text-sm font-semibold text-slate-100">
                          {product.name} (${formatDollars(product.price)})
                        </span>
                        <p className="mt-1 text-sm text-slate-300">{product.description}</p>
                        {product.benefit ? <p className="mt-1 text-xs text-amber-100">{product.benefit}</p> : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Choose Membership</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {subscriptionProducts.map((plan) => {
                  const selected = selectedPlanSlug === plan.slug;
                  const features = parseFeatures(plan.features);
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanSlug(plan.slug)}
                      className={[
                        "rounded-xl border p-4 text-left transition",
                        selected
                          ? "border-amber-200/60 bg-gradient-to-b from-amber-50 to-slate-100 text-slate-900"
                          : "border-white/15 bg-white/5 text-slate-100 hover:border-amber-200/35",
                      ].join(" ")}
                    >
                      <p className={["text-xs uppercase tracking-[0.14em]", selected ? "text-slate-600" : "text-slate-400"].join(" ")}>
                        {plan.name}
                      </p>
                      <p className={["mt-2 text-3xl font-semibold", selected ? "text-slate-900" : "text-slate-100"].join(" ")}>
                        ${formatDollars(plan.price)}
                      </p>
                      <p className={["text-xs", selected ? "text-slate-600" : "text-slate-400"].join(" ")}>
                        {plan.currency.toUpperCase()} / {plan.interval ?? "month"}
                      </p>
                      <p className={["mt-2 text-sm", selected ? "text-slate-700" : "text-slate-200"].join(" ")}>
                        {plan.description}
                      </p>
                      <ul className={["mt-2 space-y-1 text-sm", selected ? "text-slate-700" : "text-slate-200"].join(" ")}>
                        {features.map((feature) => (
                          <li key={feature}>{feature}</li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 rounded-xl border border-white/15 bg-black/25 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Your Email</p>
            <div className="mt-3">
              <label className="text-xs text-slate-300">
                Email address
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="security@company.com"
                  className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none"
                />
              </label>
              <p className="mt-2 text-xs text-slate-400">
                You will be redirected to Stripe for secure payment processing.
              </p>
            </div>
          </div>
        </div>

        <aside className="co-noise-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-100">Order Summary</h2>
          {isGiftCheckout ? (
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              {oneTimeProducts.map((product) => {
                const selected = selectedGiftSlugs.includes(product.slug);
                return (
                  <div key={product.id} className="flex items-center justify-between">
                    <span>{product.name}</span>
                    <span>{selected ? `$${formatDollars(product.price)}` : "$0"}</span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between text-emerald-200">
                <span>Bundle discount (display only)</span>
                <span>{giftBundleDiscount > 0 ? `-$${giftBundleDiscount}` : "$0"}</span>
              </div>
              <div className="my-2 border-t border-white/15" />
              <div className="flex items-center justify-between text-base font-semibold text-slate-100">
                <span>Total (one-time)</span>
                <span>${giftTotal}</span>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              <div className="flex items-center justify-between">
                <span>{selectedMembership?.name ?? "Membership"}</span>
                <span>${selectedMembership ? formatDollars(selectedMembership.price) : "0"}</span>
              </div>
              <div className="my-2 border-t border-white/15" />
              <div className="flex items-center justify-between text-base font-semibold text-slate-100">
                <span>Total (monthly)</span>
                <span>${selectedMembership ? formatDollars(selectedMembership.price) : "0"}</span>
              </div>
            </div>
          )}

          <button
            type="button"
            className="lp-button lp-button-primary mt-5 w-full justify-center"
            onClick={onCheckout}
            disabled={processing || !canPay || loadingProducts || Boolean(loadError)}
          >
            {processing ? "Redirecting to Stripe..." : `Pay $${amountDue}`}
          </button>

          <p className="mt-3 text-xs text-slate-400">
            Powered by Stripe. Your payment details are handled securely.
          </p>
          {message ? <p className="mt-3 text-sm text-amber-200">{message}</p> : null}

          <div className="mt-5">
            <button
              type="button"
              className="text-sm text-cyan-200 underline-offset-2 hover:underline"
              onClick={() => router.back()}
            >
              Back
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}
