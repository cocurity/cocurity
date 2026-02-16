"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { getScanHistory, ScanHistoryItem, upsertScanHistoryItem } from "@/lib/client/scan-history";

const PROGRESS_STEPS = ["queued", "fetching", "analyzing", "reporting"] as const;
const EXAMPLE_REPO = "https://github.com/octocat/Hello-World";
const PLANS = [
  {
    id: "plus",
    name: "Plus",
    price: 19,
    monthlyScans: 300,
    fileLimit: "2,000 files/scan",
    textLimit: "20MB text/scan",
    cta: "Upgrade to Plus",
  },
  {
    id: "pro",
    name: "Pro",
    price: 49,
    monthlyScans: 2000,
    fileLimit: "10,000 files/scan",
    textLimit: "100MB text/scan",
    cta: "Upgrade to Pro",
  },
] as const;

function isScanLimitError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("exceeds mvp scan limits") ||
    lower.includes("max 200 files") ||
    lower.includes("max 2mb text")
  );
}

function isValidGithubRepoUrl(value: string) {
  try {
    const parsed = new URL(value.trim());
    if (parsed.hostname !== "github.com") return false;
    const segments = parsed.pathname.split("/").filter(Boolean);
    return segments.length >= 2;
  } catch {
    return false;
  }
}

export default function ScanClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const mode = modeParam === "dependency" ? "dependency" : "audit";
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [recent, setRecent] = useState<ScanHistoryItem[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [scanLimitMessage, setScanLimitMessage] = useState<string | null>(null);

  useEffect(() => {
    setRecent(getScanHistory().slice(0, 8));
    const timer = window.setTimeout(() => setRecentLoading(false), 300);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isSubmitting) return;
    const timer = window.setInterval(() => {
      setStepIndex((prev) => (prev + 1) % PROGRESS_STEPS.length);
    }, 700);
    return () => window.clearInterval(timer);
  }, [isSubmitting]);

  const modeTitle = useMemo(
    () => (mode === "audit" ? "Pre-Launch Security Audit" : "Open Source Risk Check"),
    [mode]
  );

  function setMode(nextMode: "audit" | "dependency") {
    router.replace(`/scan?mode=${nextMode}`);
  }

  async function onStartScan() {
    setError(null);
    if (!isValidGithubRepoUrl(repoUrl)) {
      setError("Please enter a valid public GitHub repository URL.");
      return;
    }

    setIsSubmitting(true);
    setStepIndex(0);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
      });
      const data = (await res.json()) as { scanId?: string; error?: string };
      if (!res.ok || !data.scanId) {
        const message = data.error ?? "Scan request failed.";
        setError(message);
        if (isScanLimitError(message)) {
          setScanLimitMessage(message);
          setShowUpgradeModal(true);
        }
        return;
      }

      upsertScanHistoryItem({
        scanId: data.scanId,
        repoUrl: repoUrl.trim(),
        mode,
        createdAt: new Date().toISOString(),
      });

      router.push(`/scan/${data.scanId}?mode=${mode}`);
    } catch {
      setError("Network error while starting the scan.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="space-y-6">
      <section className="co-noise-card rounded-2xl p-6">
        <p className="lp-badge">Security Scan</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-100">{modeTitle}</h1>
        <p className="mt-2 text-sm text-slate-300">
          Run a security scan on your repository before launching or cloning.
        </p>

        <div className="mt-5 inline-flex rounded-xl border border-white/15 bg-white/5 p-1">
          <button
            type="button"
            className={[
              "rounded-lg px-4 py-2 text-sm font-semibold transition",
              mode === "audit" ? "bg-cyan-400/25 text-cyan-100" : "text-slate-300 hover:bg-white/10",
            ].join(" ")}
            onClick={() => setMode("audit")}
          >
            Pre-Launch Security Audit
          </button>
          <button
            type="button"
            className={[
              "rounded-lg px-4 py-2 text-sm font-semibold transition",
              mode === "dependency" ? "bg-violet-400/25 text-violet-100" : "text-slate-300 hover:bg-white/10",
            ].join(" ")}
            onClick={() => setMode("dependency")}
          >
            Open Source Risk Check
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <label className="block text-sm font-medium text-slate-200">Repository URL</label>
          <div className="flex flex-col gap-3">
            <input
              className="w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-cyan-300/55"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
            />
          </div>
          <p className="text-xs text-slate-400">Example: {EXAMPLE_REPO}</p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="lp-button lp-button-primary"
            onClick={onStartScan}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Running Scan..." : "Start Security Scan"}
          </button>
        </div>

        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      </section>

      <AnimatePresence mode="wait">
        {isSubmitting ? (
          <motion.section
            key="progress"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="co-noise-card rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-slate-100">Scan Progress</h2>
            <p className="mt-1 text-sm text-slate-300">Your repository is being processed.</p>
            <ul className="mt-4 space-y-3">
              {PROGRESS_STEPS.map((step, index) => {
                const active = index <= stepIndex;
                return (
                  <motion.li
                    key={step}
                    initial={{ opacity: 0.3, x: -8 }}
                    animate={{ opacity: active ? 1 : 0.4, x: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <motion.span
                      animate={{
                        scale: active ? [1, 1.12, 1] : 1,
                        backgroundColor: active ? "rgba(56,189,248,0.75)" : "rgba(148,163,184,0.35)",
                      }}
                      transition={{ duration: 0.8, repeat: active ? Infinity : 0 }}
                      className="h-2.5 w-2.5 rounded-full"
                    />
                    <span className="text-sm capitalize text-slate-200">{step}</span>
                  </motion.li>
                );
              })}
            </ul>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <section className="co-noise-card rounded-2xl p-6">
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-slate-100">Scan History</h2>
        </div>
        {recentLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-14 rounded-xl border border-white/10 bg-white/5"
                animate={{ opacity: [0.35, 0.6, 0.35] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
              />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <p className="text-sm text-slate-300">No recent scans yet. Run a scan to start your history.</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((item) => (
              <li key={item.scanId} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-100">{item.repoUrl}</p>
                  <Link
                    className="text-sm text-cyan-200"
                    href={`/scan/${item.scanId}${item.mode ? `?mode=${item.mode}` : ""}`}
                  >
                    Open
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AnimatePresence>
        {showUpgradeModal ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="co-noise-card w-full max-w-3xl rounded-2xl p-6"
            >
              <p className="lp-badge">Scan Limit Reached</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-100">Unlock larger scans with Plus or Pro</h2>
              <p className="mt-2 text-sm text-slate-300">
                {scanLimitMessage ??
                  "This repository exceeds the current free scan limits. Upgrade to continue with larger repositories."}
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {PLANS.map((plan) => (
                  <div key={plan.id} className="rounded-xl border border-white/15 bg-white/5 p-4">
                    <p className="text-sm uppercase tracking-[0.14em] text-slate-300">{plan.name}</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-100">${plan.price}</p>
                    <p className="text-xs text-slate-400">USD / month</p>
                    <ul className="mt-3 space-y-1 text-sm text-slate-200">
                      <li>{plan.monthlyScans.toLocaleString()} scans / month</li>
                      <li>{plan.fileLimit}</li>
                      <li>{plan.textLimit}</li>
                    </ul>
                    <Link
                      href={`/pricing?plan=${plan.id}`}
                      className="lp-button lp-button-primary mt-4 inline-flex no-underline"
                    >
                      {plan.cta}
                    </Link>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <button type="button" className="lp-button lp-button-ghost" onClick={() => setShowUpgradeModal(false)}>
                  Continue on Free
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
