"use client";

import Link from "next/link";
import { useMemo } from "react";
import { getScanHistory, ScanHistoryItem } from "@/lib/client/scan-history";

type ReportGroup = {
  serviceName: string;
  repoUrl: string;
  reports: ScanHistoryItem[];
  latestAt: string;
};

function getServiceName(repoUrl: string) {
  const segments = repoUrl.split("/").filter(Boolean);
  return segments[segments.length - 1] || "unknown-service";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function ReportsIndexClient() {
  const groups = useMemo<ReportGroup[]>(() => {
    const history = getScanHistory();
    const map = new Map<string, ScanHistoryItem[]>();

    for (const item of history) {
      const key = item.repoUrl;
      const existing = map.get(key) ?? [];
      existing.push(item);
      map.set(key, existing);
    }

    return [...map.entries()]
      .map(([repoUrl, reports]) => {
        const sortedReports = [...reports].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        return {
          serviceName: getServiceName(repoUrl),
          repoUrl,
          reports: sortedReports,
          latestAt: sortedReports[0]?.createdAt ?? "",
        };
      })
      .sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());
  }, []);

  return (
    <main className="space-y-6">
      <section className="co-noise-card rounded-2xl p-6">
        <p className="lp-badge">Cocurity Reports</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-100">Service Report History</h1>
        <p className="mt-2 text-sm text-slate-300">
          Your scan history is grouped by service. Open a report to view full issue details.
        </p>
      </section>

      {groups.length === 0 ? (
        <section className="co-noise-card rounded-2xl p-6">
          <p className="text-sm text-slate-300">No reports yet. Start a scan to generate your first report.</p>
          <div className="mt-4">
            <Link className="lp-button lp-button-primary no-underline" href="/scan">
              Start Scan
            </Link>
          </div>
        </section>
      ) : (
        <section className="grid gap-4">
          {groups.map((group) => (
            <article key={group.repoUrl} className="co-noise-card rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">{group.serviceName}</h2>
                  <p className="text-xs text-slate-400">{group.repoUrl}</p>
                </div>
                <p className="text-xs text-slate-400">Latest: {formatDate(group.latestAt)}</p>
              </div>

              <ul className="mt-4 space-y-2">
                {group.reports.slice(0, 6).map((report) => (
                  <li
                    key={report.scanId}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">Report ID: {report.scanId}</p>
                        <p className="text-xs text-slate-400">{formatDate(report.createdAt)}</p>
                      </div>
                      <Link className="text-sm text-cyan-200 no-underline hover:underline" href={`/r/${report.scanId}`}>
                        View Report
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
