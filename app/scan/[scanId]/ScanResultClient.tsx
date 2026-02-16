"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import StatTiles from "@/components/ui/StatTiles";
import VerdictBadge from "@/components/ui/VerdictBadge";
import SeverityPills from "@/components/ui/SeverityPills";

type Finding = {
  id: string;
  severity: "critical" | "warning";
  location: string;
  riskSummary: string;
  hint: string;
  confidence: "high" | "medium" | "low";
};

type ScanPayload = {
  scan: {
    id: string;
    repoUrl: string;
    score: number;
    grade: string;
    verdict: string;
    criticalCount: number;
    warningCount: number;
    commitHash: string;
    createdAt: string;
  };
  findings: Finding[];
};

function getVerdictTone(scan: ScanPayload["scan"]): "safe" | "caution" | "avoid" {
  if (scan.criticalCount === 0 && scan.warningCount === 0) return "safe";
  if (scan.criticalCount >= 1) return "avoid";
  if (scan.warningCount >= 1) return "caution";
  return "safe";
}

function categoryFromFinding(finding: Finding): string {
  const text = `${finding.riskSummary} ${finding.hint}`.toLowerCase();
  if (text.includes("secret") || text.includes("credential") || text.includes("key")) return "Secrets";
  if (text.includes("dependency") || text.includes("package")) return "Dependencies";
  if (text.includes("cors") || text.includes("access") || text.includes("permission")) return "Access Control";
  if (text.includes("config") || text.includes("policy")) return "Configuration";
  return "General Risk";
}

function topRiskCategories(findings: Finding[]) {
  const counts = new Map<string, number>();
  for (const finding of findings) {
    const category = categoryFromFinding(finding);
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
}

export default function ScanResultClient({
  initialData,
  mode,
}: {
  initialData: ScanPayload;
  mode: "audit" | "dependency";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isIssuing, setIsIssuing] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showGiftOptions, setShowGiftOptions] = useState(false);
  const [giftFixPass, setGiftFixPass] = useState(true);
  const [giftCertPass, setGiftCertPass] = useState(true);
  const [showPaymentDoneModal, setShowPaymentDoneModal] = useState(false);

  const ffCert = process.env.NEXT_PUBLIC_FF_CERT_ENABLED === "1";

  const categories = useMemo(() => topRiskCategories(initialData.findings), [initialData.findings]);
  const tone = getVerdictTone(initialData.scan);
  const canIssueCertificate = ffCert && initialData.scan.criticalCount === 0;
  const isNoFindingsAudit = mode === "audit" && initialData.findings.length === 0;
  const isNoCategoryDependency = mode === "dependency" && categories.length === 0;
  const reportId = initialData.scan.id;
  const repoName = initialData.scan.repoUrl.split("/").slice(-1)[0] || "repository";
  const giftPurchased = searchParams.get("gift_paid") === "1";
  const paymentDone = searchParams.get("payment_done") === "1";
  const notifyTemplate = giftPurchased
    ? [
        `Hi maintainer of ${repoName}, Cocurity found potential security issues.`,
        `View report: https://cocurity.com/r/${reportId}`,
        "🎁 Gift from cocurity — Gift code: COCU-FREE-DIAG (free full diagnostic + certificate)",
      ].join("\n")
    : [
        `Hi maintainer of ${repoName}, Cocurity found potential security issues.`,
        `View report: https://cocurity.com/r/${reportId}`,
      ].join("\n");

  useEffect(() => {
    if (!giftPurchased) return;
    setShowNotifyModal(true);
    setShowGiftOptions(false);
  }, [giftPurchased]);

  useEffect(() => {
    if (!paymentDone) return;
    setShowPaymentDoneModal(true);
  }, [paymentDone]);

  useEffect(() => {
    if (!actionMessage) return;
    const timer = window.setTimeout(() => setActionMessage(null), 1800);
    return () => window.clearTimeout(timer);
  }, [actionMessage]);

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function onIssueCertificate() {
    setActionMessage(null);
    setIsIssuing(true);
    try {
      const res = await fetch("/api/certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId: initialData.scan.id }),
      });
      const body = (await res.json()) as { certId?: string; error?: string };
      if (!res.ok || !body.certId) {
        setActionMessage(body.error ?? "Certificate issuance failed.");
        return;
      }
      router.push(`/verify/${body.certId}?issued=1`);
    } catch {
      setActionMessage("Network error during certificate issuance.");
    } finally {
      setIsIssuing(false);
    }
  }

  async function onSendMessage() {
    try {
      await navigator.clipboard.writeText(notifyTemplate);
      setActionMessage("Message sent!");
    } catch {
      setActionMessage("Message sending failed.");
    }
  }

  function onGiftCheckout() {
    const returnTo = `/scan/${initialData.scan.id}?mode=${mode}&gift_paid=1`;
    const href =
      `/pricing?plan=pro&context=gift` +
      `&returnTo=${encodeURIComponent(returnTo)}` +
      `&scanId=${encodeURIComponent(initialData.scan.id)}` +
      `&repoUrl=${encodeURIComponent(initialData.scan.repoUrl)}` +
      `&giftFix=${giftFixPass ? "1" : "0"}` +
      `&giftCert=${giftCertPass ? "1" : "0"}`;
    router.push(href);
  }

  function onCocourityFixCheckout() {
    const returnTo = `/scan/${initialData.scan.id}?mode=${mode}`;
    router.push(
      `/pricing?context=gift&plan=pro&giftFix=1&giftCert=0` +
        `&scanId=${encodeURIComponent(initialData.scan.id)}` +
        `&repoUrl=${encodeURIComponent(initialData.scan.repoUrl)}` +
        `&returnTo=${encodeURIComponent(returnTo)}`
    );
  }

  return (
    <main className="space-y-6">
      <section className="co-noise-card rounded-2xl p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Cocurity Scan Result</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-100">{mode === "dependency" ? "Dependency Mode" : "Audit Mode"}</h1>
          </div>
          <VerdictBadge kind={tone} />
        </div>

        <StatTiles
          items={[
            { label: "Score", value: initialData.scan.score },
            { label: "Commit", value: initialData.scan.commitHash.slice(0, 7) },
            { label: "Scanned At", value: new Date(initialData.scan.createdAt).toLocaleDateString() },
          ]}
        />
        <div className="mt-3">
          <SeverityPills critical={initialData.scan.criticalCount} warning={initialData.scan.warningCount} />
        </div>
      </section>

      {mode === "dependency" ? (
        <section className="co-noise-card rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-slate-100">Top 3 Risks (Category Summary)</h2>
          <p className="mt-1 text-sm text-slate-300">
            Condensed dependency-focused summary only. Sensitive details are intentionally hidden.
          </p>
          <ul className="mt-4 space-y-2">
            {categories.length === 0 ? (
              <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                No category-level risks detected.
              </li>
            ) : (
              categories.map(([category, count]) => (
                <li key={category} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                  {category} ({count})
                </li>
              ))
            )}
          </ul>
          <div className="mt-5">
            {isNoCategoryDependency ? (
              <button type="button" className="lp-button lp-button-ghost" onClick={() => router.push("/scan")}>
                Back
              </button>
            ) : (
              <button type="button" className="lp-button lp-button-primary" onClick={() => setShowNotifyModal(true)}>
                Notify maintainer
              </button>
            )}
          </div>
        </section>
      ) : (
        <section className="co-noise-card rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-slate-100">Findings</h2>
          <p className="mt-1 text-sm text-slate-300">
            Expand each finding for detail, hints, and remediation workflow actions.
          </p>
          <ul className="mt-4 space-y-3">
            {initialData.findings.length === 0 ? (
              <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-300">
                No findings for this scan.
              </li>
            ) : (
              initialData.findings.map((finding) => {
                const expanded = Boolean(expandedIds[finding.id]);
                return (
                  <li key={finding.id} className="rounded-xl border border-white/10 bg-white/5">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                      onClick={() => toggleExpanded(finding.id)}
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{finding.severity.toUpperCase()}</p>
                        <p className="text-xs text-slate-400">{categoryFromFinding(finding)}</p>
                      </div>
                      <span className="text-xs text-slate-400">{expanded ? "Collapse" : "Expand"}</span>
                    </button>
                    <AnimatePresence initial={false}>
                      {expanded ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-white/10 px-4 py-3 text-sm text-slate-200"
                        >
                          <p>{finding.riskSummary}</p>
                          <p className="mt-2 text-slate-300">Hint: {finding.hint}</p>
                          <p className="mt-1 text-xs text-slate-400">Confidence: {finding.confidence}</p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </li>
                );
              })
            )}
          </ul>

          <div className="mt-5 flex flex-wrap gap-2">
            {isNoFindingsAudit ? (
              <>
                <button type="button" className="lp-button lp-button-ghost" onClick={() => router.push("/scan")}>
                  Back
                </button>
                <button
                  type="button"
                  className="lp-button lp-button-primary"
                  onClick={onIssueCertificate}
                  disabled={isIssuing || !canIssueCertificate}
                >
                  {isIssuing ? "Issuing..." : "Get Certification"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="lp-button lp-button-primary"
                  onClick={() => router.push(`/r/${initialData.scan.id}`)}
                >
                  Open report
                </button>
                <button type="button" className="lp-button lp-button-ghost" onClick={onCocourityFixCheckout}>
                  Cocourity Fix
                </button>
              </>
            )}
          </div>
        </section>
      )}

      {mode === "dependency" && !isNoFindingsAudit && !isNoCategoryDependency ? (
        <Link
          className="inline-flex items-center text-sm text-cyan-200 no-underline hover:underline"
          href={`/r/${initialData.scan.id}`}
        >
          Open issue report →
        </Link>
      ) : null}

      <AnimatePresence>
        {showNotifyModal ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 18, opacity: 0 }}
              className="co-noise-card w-full max-w-2xl rounded-2xl p-6"
            >
              <h3 className="text-xl font-semibold text-slate-100">Notify maintainer</h3>
              <p className="mt-1 text-sm text-slate-300">
                Share a concise security notification without exposing sensitive report details.
              </p>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                <div className="space-y-1 whitespace-pre-line">
                  {notifyTemplate}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="lp-button lp-button-primary" onClick={onSendMessage}>
                  Send message
                </button>
                <button type="button" className="lp-button lp-button-ghost" onClick={() => setShowNotifyModal(false)}>
                  Close
                </button>
                {!giftPurchased ? (
                  <>
                    <button
                      type="button"
                      className="lp-button lp-button-ghost"
                      onClick={() => setShowGiftOptions((prev) => !prev)}
                    >
                      Gift remediation rights
                    </button>
                  </>
                ) : null}
              </div>

              {showGiftOptions && !giftPurchased ? (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Gift options</p>
                  <div className="mt-3 space-y-2">
                    <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        checked={giftFixPass}
                        onChange={(event) => setGiftFixPass(event.target.checked)}
                        className="mt-1"
                      />
                      <span>
                        <strong>Cocurity Fix Pass</strong>: Cocurity directly fixes detected issues.
                      </span>
                    </label>
                    <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        checked={giftCertPass}
                        onChange={(event) => setGiftCertPass(event.target.checked)}
                        className="mt-1"
                      />
                      <span>
                        <strong>Certification Pass</strong>: After fixes and Cocurity re-scan, certification can be issued.
                      </span>
                    </label>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      className="lp-button lp-button-primary"
                      onClick={onGiftCheckout}
                      disabled={!giftFixPass && !giftCertPass}
                    >
                      Gift now
                    </button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {actionMessage ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed left-1/2 top-6 z-[70] -translate-x-1/2 rounded-lg border border-white/15 bg-black/85 px-4 py-2 text-sm text-white shadow-xl backdrop-blur"
          >
            {actionMessage}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showPaymentDoneModal ? (
          <motion.div
            className="fixed inset-0 z-[75] flex items-center justify-center bg-black/60 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              className="co-noise-card w-full max-w-md rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-slate-100">결제완료!</h3>
              <p className="mt-2 text-sm text-slate-300">결제 당시 입력한 이메일함을 확인해주세요</p>
              <div className="mt-5">
                <button type="button" className="lp-button lp-button-primary" onClick={() => setShowPaymentDoneModal(false)}>
                  닫기
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
