"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getScanHistory, ScanHistoryItem } from "@/lib/client/scan-history";

export default function ScanHistoryPanel() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);

  useEffect(() => {
    setHistory(getScanHistory());
  }, []);

  return (
    <section className="lp-panel p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Scan History</h2>
      </div>
      {history.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
          No local scan history yet. Run a scan and it will appear only in this browser.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {history.map((scan) => (
            <li className="rounded-xl border border-slate-200 bg-white p-4" key={scan.scanId}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold">{scan.repoUrl}</p>
                <Link className="text-sm" href={`/scan/${scan.scanId}`}>
                  View Result
                </Link>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="lp-badge">Score {scan.score ?? "-"}</span>
                <span className="lp-badge">Grade {scan.grade ?? "-"}</span>
                <span className="lp-badge">Verdict {scan.verdict ?? "-"}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
