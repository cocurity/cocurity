import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrReuseScan } from "@/lib/scan-service";
import { formatScanError } from "@/lib/scanner";

type Props = { params: Promise<{ scanId: string }> };

export async function POST(_: Request, { params }: Props) {
  const { scanId } = await params;
  const existing = await prisma.scanRun.findUnique({ where: { id: scanId } });
  if (!existing) {
    return NextResponse.json({ error: "Scan not found." }, { status: 404 });
  }

  try {
    const nextScanId = await createOrReuseScan(existing.repoUrl);
    return NextResponse.json({ scanId: nextScanId });
  } catch (error) {
    const formatted = formatScanError(error);
    return NextResponse.json({ error: formatted.message }, { status: formatted.status });
  }
}
