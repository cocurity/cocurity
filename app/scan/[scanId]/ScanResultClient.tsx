"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import CopyButton from "@/components/ui/CopyButton";
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
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isRescanning, setIsRescanning] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [senderGhUsername, setSenderGhUsername] = useState("your_github_username");
  const [giftCode, setGiftCode] = useState("COCU-FREE-DIAG");
  const [fixRequesting, setFixRequesting] = useState(false);

  const ffFix = process.env.NEXT_PUBLIC_FF_FIX_ENABLED === "1";
  const ffCert = process.env.NEXT_PUBLIC_FF_CERT_ENABLED === "1";

  const categories = useMemo(() => topRiskCategories(initialData.findings), [initialData.findings]);
  const tone = getVerdictTone(initialData.scan);
  const canIssueCertificate = ffCert && initialData.scan.criticalCount === 0;
  const reportId = initialData.scan.id;
  const repoName = initialData.scan.repoUrl.split("/").slice(-1)[0] || "repository";
  const notifyTemplate = `Hi maintainer of ${repoName}, Cocurity found potential security issues. View report: https://cocurity.com/r/${reportId} 🎁 Gift from ${senderGhUsername} — Gift code: ${giftCode} (free full diagnostic + certificate)`;

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function onRescan() {
    setActionMessage(null);
    setIsRescanning(true);
    try {
      const res = await fetch(`/api/scan/${initialData.scan.id}/rescan`, { method: "POST" });
      const body = (await res.json()) as { scanId?: string; error?: string };
      if (!res.ok || !body.scanId) {
        setActionMessage(body.error ?? "Rescan failed.");
        return;
      }
      router.push(`/scan/${body.scanId}?mode=${mode}`);
      router.refresh();
    } catch {
      setActionMessage("Network error during rescan.");
    } finally {
      setIsRescanning(false);
    }
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
      router.push(`/verify/${body.certId}`);
    } catch {
      setActionMessage("Network error during certificate issuance.");
    } finally {
      setIsIssuing(false);
    }
  }

  async function onRequestFix() {
    setActionMessage(null);
    setFixRequesting(true);
    try {
      const res = await fetch("/api/fix-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanId: initialData.scan.id,
          contact: "security-contact@example.com",
          urgency: "medium",
          notes: "Please review and prioritize remediation steps.",
        }),
      });
      const body = (await res.json()) as { requestId?: string; error?: string };
      if (!res.ok || !body.requestId) {
        setActionMessage(body.error ?? "Fix request failed.");
        return;
      }
      setActionMessage(`Fix request submitted: ${body.requestId}`);
    } catch {
      setActionMessage("Network error during fix request.");
    } finally {
      setFixRequesting(false);
    }
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
            <button type="button" className="lp-button lp-button-primary" onClick={() => setShowNotifyModal(true)}>
              Notify maintainer
            </button>
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
            <button type="button" className="lp-button lp-button-primary" onClick={onRescan} disabled={isRescanning}>
              {isRescanning ? "Rescanning..." : "Rescan"}
            </button>
            {ffFix ? (
              <button type="button" className="lp-button lp-button-ghost" onClick={onRequestFix} disabled={fixRequesting}>
                {fixRequesting ? "Requesting..." : "Request Fix"}
              </button>
            ) : null}
            {canIssueCertificate ? (
              <button type="button" className="lp-button lp-button-ghost" onClick={onIssueCertificate} disabled={isIssuing}>
                {isIssuing ? "Issuing..." : "Issue Certificate"}
              </button>
            ) : null}
          </div>
        </section>
      )}

      {actionMessage ? <p className="text-sm text-slate-300">{actionMessage}</p> : null}

      <Link
        className="inline-flex items-center text-sm text-cyan-200 no-underline hover:underline"
        href={`/r/${initialData.scan.id}`}
      >
        Open public report summary →
      </Link>

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

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-slate-300">
                  Sender GitHub Username
                  <input
                    className="mt-1 w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-slate-100"
                    value={senderGhUsername}
                    onChange={(event) => setSenderGhUsername(event.target.value)}
                  />
                </label>
                <label className="text-xs text-slate-300">
                  Gift Code
                  <input
                    className="mt-1 w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-slate-100"
                    value={giftCode}
                    onChange={(event) => setGiftCode(event.target.value)}
                  />
                </label>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                {notifyTemplate}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <CopyButton value={notifyTemplate} label="Copy message" />
                <button type="button" className="lp-button lp-button-ghost" onClick={() => setShowNotifyModal(false)}>
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
