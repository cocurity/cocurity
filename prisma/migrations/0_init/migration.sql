-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('CRITICAL', 'WARNING');

-- CreateEnum
CREATE TYPE "Confidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "Grade" AS ENUM ('READY', 'CAUTION', 'BLOCK');

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('LAUNCH_READY', 'BLOCKED');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('VALID', 'REVOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanRun" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "commitHash" TEXT NOT NULL,
    "scanConfigVersion" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "grade" "Grade" NOT NULL,
    "verdict" "Verdict" NOT NULL,
    "criticalCount" INTEGER NOT NULL,
    "warningCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScanRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finding" (
    "id" TEXT NOT NULL,
    "scanRunId" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "location" TEXT NOT NULL,
    "riskSummary" TEXT NOT NULL,
    "hint" TEXT NOT NULL,
    "confidence" "Confidence" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "certId" TEXT NOT NULL,
    "scanRunId" TEXT NOT NULL,
    "status" "CertificateStatus" NOT NULL DEFAULT 'VALID',
    "pngPath" TEXT NOT NULL,
    "verifyUrl" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixRequest" (
    "id" TEXT NOT NULL,
    "scanRunId" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FixRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_repoUrl_idx" ON "Project"("repoUrl");

-- CreateIndex
CREATE INDEX "ScanRun_repoUrl_idx" ON "ScanRun"("repoUrl");

-- CreateIndex
CREATE INDEX "ScanRun_commitHash_idx" ON "ScanRun"("commitHash");

-- CreateIndex
CREATE INDEX "ScanRun_repoUrl_commitHash_scanConfigVersion_idx" ON "ScanRun"("repoUrl", "commitHash", "scanConfigVersion");

-- CreateIndex
CREATE INDEX "Finding_scanRunId_idx" ON "Finding"("scanRunId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certId_key" ON "Certificate"("certId");

-- CreateIndex
CREATE INDEX "Certificate_certId_idx" ON "Certificate"("certId");

-- CreateIndex
CREATE INDEX "Certificate_scanRunId_idx" ON "Certificate"("scanRunId");

-- CreateIndex
CREATE INDEX "FixRequest_scanRunId_idx" ON "FixRequest"("scanRunId");

-- AddForeignKey
ALTER TABLE "ScanRun" ADD CONSTRAINT "ScanRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_scanRunId_fkey" FOREIGN KEY ("scanRunId") REFERENCES "ScanRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_scanRunId_fkey" FOREIGN KEY ("scanRunId") REFERENCES "ScanRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixRequest" ADD CONSTRAINT "FixRequest_scanRunId_fkey" FOREIGN KEY ("scanRunId") REFERENCES "ScanRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
