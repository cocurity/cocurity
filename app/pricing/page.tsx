"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addFixOrder } from "@/lib/client/fix-orders";

const MEMBERSHIPS = [
  {
    id: "plus",
    name: "Plus",
    price: 19,
    summary: "For growing teams that need larger scan capacity.",
    features: ["300 scans/month", "2,000 files/scan", "20MB text/scan", "Priority processing"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 49,
    summary: "For security-focused teams running high-volume checks.",
    features: ["2,000 scans/month", "10,000 files/scan", "100MB text/scan", "Priority support"],
  },
] as const;

const GIFT_ITEMS = {
  fix: {
    label: "Cocurity Fix Pass",
    price: 149,
    detail: "One-time specialist remediation: Cocurity directly fixes detected security issues.",
    benefit: "Includes direct patch work for identified vulnerabilities in the selected scope.",
  },
  cert: {
    label: "Certification Pass",
    price: 39,
    detail: "One-time certification entitlement after fix + Cocurity re-scan.",
    benefit: "Enables certificate issuance if the post-fix scan meets certification criteria.",
  },
} as const;

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get("plan");
  const context = searchParams.get("context");
  const returnTo = searchParams.get("returnTo");
  const scanId = searchParams.get("scanId") ?? "";
  const repoUrl = searchParams.get("repoUrl") ?? "";

  const [selectedPlanId, setSelectedPlanId] = useState<"plus" | "pro">(initialPlan === "plus" ? "plus" : "pro");
  const [giftFix, setGiftFix] = useState(searchParams.get("giftFix") === "1");
  const [giftCert, setGiftCert] = useState(searchParams.get("giftCert") === "1");
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [country, setCountry] = useState("US");

  const selectedMembership = useMemo(
    () => MEMBERSHIPS.find((plan) => plan.id === selectedPlanId) ?? MEMBERSHIPS[1],
    [selectedPlanId]
  );

  const isGiftCheckout = context === "gift";
  const giftSubtotal = (giftFix ? GIFT_ITEMS.fix.price : 0) + (giftCert ? GIFT_ITEMS.cert.price : 0);
  const giftBundleDiscount = giftFix && giftCert ? 19 : 0;
  const giftTotal = Math.max(0, giftSubtotal - giftBundleDiscount);
  const amountDue = isGiftCheckout ? giftTotal : selectedMembership.price;
  const canPay = isGiftCheckout ? giftFix || giftCert : true;

  async function onPayNow() {
    if (!canPay) {
      setMessage("Select at least one gift pass.");
      return;
    }
    setMessage(null);
    setProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setProcessing(false);

    if (isGiftCheckout && giftFix) {
      addFixOrder({
        id: `fix_${Date.now()}`,
        scanId,
        repoUrl,
        email,
        items: [giftFix ? "Cocurity Fix Pass" : null, giftCert ? "Certification Pass" : null].filter(
          Boolean
        ) as string[],
        status: "received",
        createdAt: new Date().toISOString(),
      });
    }

    if (returnTo) {
      const separator = returnTo.includes("?") ? "&" : "?";
      router.push(`${returnTo}${separator}payment_done=1`);
      return;
    }
    setMessage("Payment completed successfully.");
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
          {isGiftCheckout ? (
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Select Gift Pack Benefits</h2>
              <p className="mt-1 text-sm text-slate-300">Each gift pass is a one-time entitlement.</p>

              <div className="mt-4 space-y-3">
                <label className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/5 p-4">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={giftFix}
                    onChange={(event) => setGiftFix(event.target.checked)}
                  />
                  <span>
                    <span className="text-sm font-semibold text-slate-100">
                      {GIFT_ITEMS.fix.label} (${GIFT_ITEMS.fix.price})
                    </span>
                    <p className="mt-1 text-sm text-slate-300">{GIFT_ITEMS.fix.detail}</p>
                    <p className="mt-1 text-xs text-amber-100">{GIFT_ITEMS.fix.benefit}</p>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/5 p-4">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={giftCert}
                    onChange={(event) => setGiftCert(event.target.checked)}
                  />
                  <span>
                    <span className="text-sm font-semibold text-slate-100">
                      {GIFT_ITEMS.cert.label} (${GIFT_ITEMS.cert.price})
                    </span>
                    <p className="mt-1 text-sm text-slate-300">{GIFT_ITEMS.cert.detail}</p>
                    <p className="mt-1 text-xs text-amber-100">{GIFT_ITEMS.cert.benefit}</p>
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Choose Membership</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {MEMBERSHIPS.map((plan) => {
                  const selected = selectedPlanId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
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
                        ${plan.price}
                      </p>
                      <p className={["text-xs", selected ? "text-slate-600" : "text-slate-400"].join(" ")}>USD / month</p>
                      <p className={["mt-2 text-sm", selected ? "text-slate-700" : "text-slate-200"].join(" ")}>{plan.summary}</p>
                      <ul className={["mt-2 space-y-1 text-sm", selected ? "text-slate-700" : "text-slate-200"].join(" ")}>
                        {plan.features.map((feature) => (
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
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Payment Details</p>
            <div className="mt-3 grid gap-3">
              <label className="text-xs text-slate-300">
                Email
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="security@company.com"
                  className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none"
                />
              </label>
              <label className="text-xs text-slate-300">
                Cardholder name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Jane Doe"
                  className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none"
                />
              </label>
              <label className="text-xs text-slate-300">
                Card information
                <input
                  value={cardNumber}
                  onChange={(event) => setCardNumber(event.target.value)}
                  placeholder="4242 4242 4242 4242"
                  className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-slate-300">
                  Expiration
                  <input
                    value={exp}
                    onChange={(event) => setExp(event.target.value)}
                    placeholder="MM / YY"
                    className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none"
                  />
                </label>
                <label className="text-xs text-slate-300">
                  CVC
                  <input
                    value={cvc}
                    onChange={(event) => setCvc(event.target.value)}
                    placeholder="123"
                    className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none"
                  />
                </label>
              </div>
              <label className="text-xs text-slate-300">
                Country
                <select
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none"
                >
                  <option value="US">United States</option>
                  <option value="KR">South Korea</option>
                  <option value="JP">Japan</option>
                  <option value="DE">Germany</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <aside className="co-noise-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-100">Order Summary</h2>
          {isGiftCheckout ? (
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              <div className="flex items-center justify-between">
                <span>{giftFix ? GIFT_ITEMS.fix.label : "Cocurity Fix Pass"}</span>
                <span>{giftFix ? `$${GIFT_ITEMS.fix.price}` : "$0"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{giftCert ? GIFT_ITEMS.cert.label : "Certification Pass"}</span>
                <span>{giftCert ? `$${GIFT_ITEMS.cert.price}` : "$0"}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-200">
                <span>Bundle discount</span>
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
                <span>{selectedMembership.name}</span>
                <span>${selectedMembership.price}</span>
              </div>
              <div className="my-2 border-t border-white/15" />
              <div className="flex items-center justify-between text-base font-semibold text-slate-100">
                <span>Total (monthly)</span>
                <span>${selectedMembership.price}</span>
              </div>
            </div>
          )}

          <button
            type="button"
            className="lp-button lp-button-primary mt-5 w-full justify-center"
            onClick={onPayNow}
            disabled={processing || !canPay}
          >
            {processing ? "Processing..." : `Pay $${amountDue}`}
          </button>

          <p className="mt-3 text-xs text-slate-400">This is a simulated checkout UI. No real charge will be made.</p>
          {message ? <p className="mt-3 text-sm text-emerald-200">{message}</p> : null}

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
