import {
  PrismaClient,
  Confidence,
  Grade,
  ProductType,
  Severity,
  Verdict,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = [
    {
      slug: "fix-pass",
      name: "Cocurity Fix Pass",
      description:
        "One-time specialist remediation: Cocurity directly fixes detected security issues.",
      price: 14900,
      type: ProductType.ONE_TIME,
      interval: null,
      features: "[]",
      benefit:
        "Includes direct patch work for identified vulnerabilities in the selected scope.",
      sortOrder: 0,
    },
    {
      slug: "cert-pass",
      name: "Certification Pass",
      description: "One-time certification entitlement after fix + Cocurity re-scan.",
      price: 3900,
      type: ProductType.ONE_TIME,
      interval: null,
      features: "[]",
      benefit:
        "Enables certificate issuance if the post-fix scan meets certification criteria.",
      sortOrder: 1,
    },
    {
      slug: "plus",
      name: "Plus",
      description: "For growing teams that need larger scan capacity.",
      price: 1900,
      type: ProductType.SUBSCRIPTION,
      interval: "month",
      features: JSON.stringify([
        "300 scans/month",
        "2,000 files/scan",
        "20MB text/scan",
        "Priority processing",
      ]),
      benefit: null,
      sortOrder: 0,
    },
    {
      slug: "pro",
      name: "Pro",
      description: "For security-focused teams running high-volume checks.",
      price: 4900,
      type: ProductType.SUBSCRIPTION,
      interval: "month",
      features: JSON.stringify([
        "2,000 scans/month",
        "10,000 files/scan",
        "100MB text/scan",
        "Priority support",
      ]),
      benefit: null,
      sortOrder: 1,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }

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
