import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCertificateStatus } from "@/lib/status";

type Props = { params: Promise<{ certId: string }> };

export async function GET(_: Request, { params }: Props) {
  const { certId } = await params;
  const certificate = await prisma.certificate.findUnique({
    where: { certId },
    include: { scanRun: true },
  });

  if (!certificate) {
    return NextResponse.json({
      status: "not_found",
      certificate: null,
      scanSummary: null,
    });
  }

  const status = resolveCertificateStatus(certificate);
  return NextResponse.json({
    status,
    certificate: {
      certId: certificate.certId,
      issuedAt: certificate.issuedAt,
      expiresAt: certificate.expiresAt,
      revokedAt: certificate.revokedAt,
      pngPath: certificate.pngPath,
      verifyUrl: certificate.verifyUrl,
    },
    scanSummary: {
      scanId: certificate.scanRun.id,
      repoUrl: certificate.scanRun.repoUrl,
      commitHash: certificate.scanRun.commitHash,
      score: certificate.scanRun.score,
      grade: certificate.scanRun.grade,
      verdict: certificate.scanRun.verdict,
    },
  });
}
