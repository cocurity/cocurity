import Link from "next/link";
import SeverityPills from "@/components/ui/SeverityPills";
import VerdictBadge from "@/components/ui/VerdictBadge";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ reportId: string }> };

function categoryFromText(riskSummary: string, hint: string) {
  const text = `${riskSummary} ${hint}`.toLowerCase();
  if (text.includes("secret") || text.includes("credential") || text.includes("key")) return "Secrets";
  if (text.includes("dependency") || text.includes("package")) return "Dependencies";
  if (text.includes("cors") || text.includes("access") || text.includes("permission")) return "Access Control";
  if (text.includes("config") || text.includes("policy")) return "Configuration";
  return "General Risk";
}

function verdictTone(criticalCount: number, warningCount: number) {
  if (criticalCount === 0 && warningCount === 0) return "safe" as const;
  if (criticalCount >= 1) return "avoid" as const;
  if (warningCount >= 1) return "caution" as const;
  return "safe" as const;
}

export default async function ReportDetailPage({ params }: Props) {
  const { reportId } = await params;
  const scan = await prisma.scanRun.findUnique({
    where: { id: reportId },
    include: { findings: true },
  });
  const categoryMap = new Map<string, number>();
  if (scan) {
    for (const finding of scan.findings) {
      const cat = categoryFromText(finding.riskSummary, finding.hint);
      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1);
    }
  }
  const categories = [...categoryMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const hasRealReport = Boolean(scan);
  const criticalCount = scan?.criticalCount ?? 0;
  const warningCount = scan?.warningCount ?? 0;
  const commitHash = scan?.commitHash.slice(0, 7) ?? "unknown";
  const scannedAt = scan?.createdAt.toISOString() ?? "not available";

  return (
    <main className="space-y-6">
      <section className="co-noise-card rounded-2xl p-6">
        <p className="lp-badge">Cocurity Public Report</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-100">Safe Issue Report</h1>
          <VerdictBadge kind={verdictTone(criticalCount, warningCount)} />
        </div>
        {!hasRealReport ? (
          <p className="mt-2 text-sm text-amber-200">
            Report ID not found. Showing a placeholder public summary shell.
          </p>
        ) : null}
      </section>

      <section className="co-noise-card rounded-2xl p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <p className="text-sm text-slate-200">
            <strong>Commit:</strong> {commitHash}
          </p>
          <p className="text-sm text-slate-200">
            <strong>Scanned at:</strong> {scannedAt}
          </p>
        </div>
        <div className="mt-4">
          <SeverityPills critical={criticalCount} warning={warningCount} />
        </div>
      </section>

      <section className="co-noise-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-100">Risk Categories</h2>
        <ul className="mt-3 space-y-2">
          {categories.length === 0 ? (
            <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
              No category-level risks identified.
            </li>
          ) : (
            categories.map(([category, count]) => (
              <li key={category} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                {category} ({count})
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="co-noise-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-100">Detailed Findings</h2>
        <ul className="mt-3 space-y-3">
          {!scan || scan.findings.length === 0 ? (
            <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-300">
              No findings for this report.
            </li>
          ) : (
            scan.findings.map((finding) => (
              <li key={finding.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-sm font-semibold text-slate-100">
                  {finding.severity.toUpperCase()} • {finding.location}
                </p>
                <p className="mt-1 text-sm text-slate-200">{finding.riskSummary}</p>
                <p className="mt-1 text-sm text-slate-300">Hint: {finding.hint}</p>
                <p className="mt-1 text-xs text-slate-400">Confidence: {finding.confidence}</p>
              </li>
            ))
          )}
        </ul>
        <div className="mt-4">
          <Link href="/scan" className="lp-button lp-button-ghost no-underline">
            Back
          </Link>
        </div>
      </section>
    </main>
  );
}
