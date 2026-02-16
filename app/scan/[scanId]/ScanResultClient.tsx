"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Finding = {
  id: string;
  severity: "critical" | "warning" | string;
  location: string;
  riskSummary: string;
  hint: string;
  confidence: "high" | "medium" | "low" | string;
};

type ScanResponse = {
  scan: {
    id: string;
    repoUrl: string;
    score: number;
    grade: string;
    verdict: string;
    criticalCount: number;
    warningCount: number;
    commitHash: string;
  };
  findings: Finding[];
};

export default function ScanResultClient({ scanId }: { scanId: string }) {
  const router = useRouter();
  const [data, setData] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rescanLoading, setRescanLoading] = useState(false);
  const [fixLoading, setFixLoading] = useState(false);
  const [certLoading, setCertLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [contact, setContact] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [notes, setNotes] = useState("");
  const ffCert = process.env.NEXT_PUBLIC_FF_CERT_ENABLED === "1";
  const ffFix = process.env.NEXT_PUBLIC_FF_FIX_ENABLED === "1";

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/scan/${scanId}`, { cache: "no-store" });
        const body = (await res.json()) as ScanResponse & { error?: string };
        if (!res.ok) {
          setError(body.error ?? "스캔 결과를 불러오지 못했습니다.");
          return;
        }
        setData(body);
      } catch {
        setError("네트워크 문제로 결과를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [scanId]);

  const gradeBadgeClass = useMemo(() => {
    const grade = data?.scan.grade;
    if (grade === "READY") return "lp-badge lp-badge-ready";
    if (grade === "CAUTION") return "lp-badge lp-badge-caution";
    return "lp-badge lp-badge-block";
  }, [data?.scan.grade]);

  async function onRescan() {
    setActionMessage(null);
    setRescanLoading(true);
    try {
      const res = await fetch(`/api/scan/${scanId}/rescan`, { method: "POST" });
      const body = (await res.json()) as { scanId?: string; error?: string };
      if (!res.ok || !body.scanId) {
        setActionMessage(body.error ?? "재검사 요청 실패");
        return;
      }
      router.push(`/scan/${body.scanId}`);
      router.refresh();
    } catch {
      setActionMessage("재검사 중 네트워크 오류가 발생했습니다.");
    } finally {
      setRescanLoading(false);
    }
  }

  async function onIssueCertificate() {
    setActionMessage(null);
    setCertLoading(true);
    try {
      const res = await fetch("/api/certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId }),
      });
      const body = (await res.json()) as { certId?: string; error?: string };
      if (!res.ok || !body.certId) {
        setActionMessage(body.error ?? "인증서 발급 실패");
        return;
      }
      router.push(`/verify/${body.certId}`);
    } catch {
      setActionMessage("인증서 발급 중 네트워크 오류가 발생했습니다.");
    } finally {
      setCertLoading(false);
    }
  }

  async function onFixRequestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionMessage(null);
    setFixLoading(true);
    try {
      const res = await fetch("/api/fix-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId, contact, urgency, notes }),
      });
      const body = (await res.json()) as { requestId?: string; error?: string };
      if (!res.ok || !body.requestId) {
        setActionMessage(body.error ?? "Fix Request 전송 실패");
        return;
      }
      setActionMessage(`Fix Request 접수됨: ${body.requestId}`);
      setContact("");
      setNotes("");
      setUrgency("medium");
    } catch {
      setActionMessage("Fix Request 전송 중 네트워크 오류가 발생했습니다.");
    } finally {
      setFixLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold">Scan Result</h1>
        <div className="lp-panel animate-pulse p-6">
          <div className="mb-3 h-4 w-1/3 rounded bg-slate-200" />
          <div className="mb-2 h-4 w-full rounded bg-slate-200" />
          <div className="h-4 w-5/6 rounded bg-slate-200" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold">Scan Result</h1>
        <div className="lp-panel space-y-3 p-6">
          <p className="text-sm text-red-700">{error}</p>
          <button className="lp-button lp-button-primary" onClick={() => location.reload()} type="button">
            다시 시도
          </button>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold">Scan Result</h1>
        <div className="lp-panel p-6 text-sm text-slate-700">데이터가 비어 있습니다.</div>
      </main>
    );
  }

  const canIssueCert = ffCert && data.scan.criticalCount === 0;

  return (
    <main className="space-y-6">
      <section className="lp-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Scan Result</h1>
            <p className="mt-1 text-xs text-slate-600">{data.scan.repoUrl}</p>
          </div>
          <span className={gradeBadgeClass}>{data.scan.grade}</span>
        </div>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
          <p className="rounded bg-white p-3">Score: {data.scan.score}</p>
          <p className="rounded bg-white p-3">Verdict: {data.scan.verdict}</p>
          <p className="rounded bg-white p-3">Commit: {data.scan.commitHash.slice(0, 7)}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="lp-badge">Critical {data.scan.criticalCount}</span>
          <span className="lp-badge">Warning {data.scan.warningCount}</span>
        </div>
      </section>

      <section className="lp-panel p-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <button className="lp-button lp-button-primary" type="button" onClick={onRescan} disabled={rescanLoading}>
            {rescanLoading ? "Rescanning..." : "Rescan"}
          </button>
          {ffFix ? (
            <a className="lp-button lp-button-ghost" href="#fix-request">
              Fix Request
            </a>
          ) : null}
          {canIssueCert ? (
            <button
              className="lp-button lp-button-ghost"
              type="button"
              onClick={onIssueCertificate}
              disabled={certLoading}
            >
              {certLoading ? "Issuing..." : "Issue Certificate"}
            </button>
          ) : null}
          <Link href="/verify" className="lp-button lp-button-ghost">
            Verify Search
          </Link>
        </div>
        {!ffCert ? <p className="text-xs text-slate-600">Certificate 기능은 현재 비활성화되어 있습니다.</p> : null}
        {ffCert && data.scan.criticalCount > 0 ? (
          <p className="text-xs text-slate-600">Critical 이슈가 있으면 인증서 발급이 불가합니다.</p>
        ) : null}
        {actionMessage ? <p className="mt-2 text-sm text-slate-700">{actionMessage}</p> : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Findings ({data.findings.length})</h2>
        {data.findings.length === 0 ? (
          <div className="lp-panel p-4 text-sm text-slate-700">발견된 이슈가 없습니다.</div>
        ) : (
          <ul className="space-y-3">
            {data.findings.map((finding) => (
              <li className="lp-panel p-4" key={finding.id}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={
                      finding.severity === "critical" ? "lp-badge lp-badge-block" : "lp-badge lp-badge-caution"
                    }
                  >
                    {finding.severity.toUpperCase()}
                  </span>
                  <code className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold">{finding.location}</code>
                </div>
                <p className="text-sm">{finding.riskSummary}</p>
                <p className="mt-2 text-sm text-slate-700">Hint: {finding.hint}</p>
                <p className="mt-1 text-xs text-slate-600">Confidence: {finding.confidence}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {ffFix ? (
        <section id="fix-request" className="lp-panel p-6">
          <h2 className="text-xl font-semibold">Fix Request</h2>
          <p className="mt-1 text-sm text-slate-700">결과 기반 수정 지원 요청을 접수합니다.</p>
          <form className="mt-4 grid gap-3 sm:max-w-xl" onSubmit={onFixRequestSubmit}>
            <input
              className="rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Contact (email/slack)"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              required
            />
            <select
              className="rounded-lg border border-slate-300 px-3 py-2"
              value={urgency}
              onChange={(event) => setUrgency(event.target.value)}
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
            <textarea
              className="rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
            />
            <button className="lp-button lp-button-primary w-fit" disabled={fixLoading} type="submit">
              {fixLoading ? "Submitting..." : "Submit Fix Request"}
            </button>
          </form>
        </section>
      ) : null}
    </main>
  );
}
