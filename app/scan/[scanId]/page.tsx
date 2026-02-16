import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ScanResultClient from "./ScanResultClient";

type Props = {
  params: Promise<{ scanId: string }>;
  searchParams: Promise<{ mode?: string }>;
};

export default async function ScanResultPage({ params, searchParams }: Props) {
  const { scanId } = await params;
  const search = await searchParams;
  const mode = search.mode === "dependency" ? "dependency" : "audit";

  const scan = await prisma.scanRun.findUnique({
    where: { id: scanId },
    include: { findings: true },
  });
  if (!scan) notFound();

  const normalizedFindings = scan.findings.map((finding) => ({
    id: finding.id,
    severity: finding.severity.toLowerCase() as "critical" | "warning",
    location: finding.location,
    riskSummary: finding.riskSummary,
    hint: finding.hint,
    confidence: finding.confidence.toLowerCase() as "high" | "medium" | "low",
  }));

  return (
    <ScanResultClient
      mode={mode}
      initialData={{
        scan: {
          id: scan.id,
          repoUrl: scan.repoUrl,
          score: scan.score,
          grade: scan.grade,
          verdict: scan.verdict,
          criticalCount: scan.criticalCount,
          warningCount: scan.warningCount,
          commitHash: scan.commitHash,
          createdAt: scan.createdAt.toISOString(),
        },
        findings: normalizedFindings,
      }}
    />
  );
}
