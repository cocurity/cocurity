import { FindingSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeScore } from "@/lib/scoring";
import { scanGitHubRepository } from "@/lib/scanner";
import { aiAnalyzeFiles, type AiFindingInput } from "@/lib/ai-scanner";
import { getUserPlan } from "@/lib/subscription";

export async function createOrReuseScan(repoUrl: string, userId?: string) {
  const scanResult = await scanGitHubRepository(repoUrl);

  const aiFeatureOn = process.env.FF_AI_SCAN_ENABLED === "1";
  const userPlan = aiFeatureOn && userId ? await getUserPlan(userId) : "FREE";
  const shouldRunAi = aiFeatureOn && (userPlan === "PLUS" || userPlan === "PRO");

  const cachedScan = await prisma.scanRun.findFirst({
    where: {
      repoUrl: scanResult.canonicalRepoUrl,
      commitHash: scanResult.commitHash,
      scanConfigVersion: scanResult.scanConfigVersion,
      aiEnabled: shouldRunAi,
    },
    orderBy: { createdAt: "desc" },
  });

  if (cachedScan) {
    return cachedScan.id;
  }

  const ruleFindings = scanResult.findings.map((f) => ({
    ...f,
    source: FindingSource.RULE,
  }));

  let allFindings: AiFindingInput[] = [...ruleFindings];

  if (shouldRunAi) {
    const aiResult = await aiAnalyzeFiles(scanResult.fetchedFiles, scanResult.findings);
    allFindings = [...ruleFindings, ...aiResult.findings];
  }

  const criticalCount = allFindings.filter((item) => item.severity === "CRITICAL").length;
  const warningCount = allFindings.filter((item) => item.severity === "WARNING").length;
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
      aiEnabled: shouldRunAi,
      findings: {
        create: allFindings,
      },
    },
  });

  return created.id;
}
