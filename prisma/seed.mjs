import { PrismaClient, Confidence, Grade, Severity, Verdict } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.upsert({
    where: { id: "demo_project" },
    update: {},
    create: {
      id: "demo_project",
      repoUrl: "https://github.com/acme/launchpass-demo",
    },
  });

  const scanRun = await prisma.scanRun.create({
    data: {
      projectId: project.id,
      repoUrl: project.repoUrl,
      commitHash: "abc1234def5678",
      scanConfigVersion: "v1",
      score: 70,
      grade: Grade.CAUTION,
      verdict: Verdict.LAUNCH_READY,
      criticalCount: 0,
      warningCount: 3,
      findings: {
        create: [
          {
            severity: Severity.WARNING,
            location: "server/config.ts",
            riskSummary: "Permissive CORS pattern may allow unintended access paths.",
            hint: "Scope CORS to trusted origins and audit regularly.",
            confidence: Confidence.HIGH,
          },
        ],
      },
    },
  });

  await prisma.fixRequest.create({
    data: {
      scanRunId: scanRun.id,
      contact: "security@acme.dev",
      urgency: "medium",
      notes: "Please provide a prioritized remediation summary.",
    },
  });

  console.log("Seed complete:", { projectId: project.id, scanRunId: scanRun.id });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
