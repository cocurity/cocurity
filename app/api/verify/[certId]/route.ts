import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveCertificateStatus } from "@/lib/status";
import { fetchDefaultBranchAndCommit, parseGitHubRepoUrl } from "@/lib/scanner";

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

  const baseStatus = resolveCertificateStatus(certificate);
  let status: "valid" | "outdated" | "invalid" = "valid";

  if (baseStatus !== "valid") {
    status = "invalid";
  } else {
    try {
      const parsed = parseGitHubRepoUrl(certificate.scanRun.repoUrl);
      const { commitHash: latestCommitHash } = await fetchDefaultBranchAndCommit(parsed.owner, parsed.repo);
      status = latestCommitHash === certificate.scanRun.commitHash ? "valid" : "outdated";
    } catch {
      status = "valid";
    }
  }

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
