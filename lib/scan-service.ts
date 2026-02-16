import { prisma } from "@/lib/prisma";
import { computeScore } from "@/lib/scoring";
import { scanGitHubRepository } from "@/lib/scanner";

export async function createOrReuseScan(repoUrl: string) {
  const scanResult = await scanGitHubRepository(repoUrl);
  const cachedScan = await prisma.scanRun.findFirst({
    where: {
      repoUrl: scanResult.canonicalRepoUrl,
      commitHash: scanResult.commitHash,
      scanConfigVersion: scanResult.scanConfigVersion,
    },
    orderBy: { createdAt: "desc" },
  });

  if (cachedScan) {
    return cachedScan.id;
  }

  const criticalCount = scanResult.findings.filter((item) => item.severity === "CRITICAL").length;
  const warningCount = scanResult.findings.filter((item) => item.severity === "WARNING").length;
  const { score, grade, verdict } = computeScore(criticalCount, warningCount);

  let project = await prisma.project.findFirst({
    where: { repoUrl: scanResult.canonicalRepoUrl },
    orderBy: { createdAt: "asc" },
  });
  if (!project) {
    project = await prisma.project.create({
      data: { repoUrl: scanResult.canonicalRepoUrl },
    });
  }

  const created = await prisma.scanRun.create({
    data: {
      projectId: project.id,
      repoUrl: scanResult.canonicalRepoUrl,
      commitHash: scanResult.commitHash,
      scanConfigVersion: scanResult.scanConfigVersion,
      score,
      grade,
      verdict,
      criticalCount,
      warningCount,
      findings: {
        create: scanResult.findings,
      },
    },
  });

  return created.id;
}
