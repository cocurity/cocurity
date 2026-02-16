import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ scanId: string }> };

export async function GET(_: Request, { params }: Props) {
  const { scanId } = await params;
  const scan = await prisma.scanRun.findUnique({
    where: { id: scanId },
    include: { findings: true },
  });

  if (!scan) {
    return NextResponse.json({ error: "Scan not found." }, { status: 404 });
  }

  const { findings, ...scanSummary } = scan;
  return NextResponse.json({
    scan: scanSummary,
    findings: findings.map((finding) => ({
      ...finding,
      severity: finding.severity.toLowerCase(),
      confidence: finding.confidence.toLowerCase(),
    })),
  });
}
