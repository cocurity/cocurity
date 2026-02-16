/*
  Warnings:

  - You are about to drop the `Scan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `scanId` on the `Certificate` table. All the data in the column will be lost.
  - You are about to drop the column `scanId` on the `Finding` table. All the data in the column will be lost.
  - You are about to drop the column `scanId` on the `FixRequest` table. All the data in the column will be lost.
  - Added the required column `scanRunId` to the `Certificate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `verifyUrl` to the `Certificate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scanRunId` to the `Finding` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scanRunId` to the `FixRequest` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Scan_repoUrl_commitHash_scanConfigVersion_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Scan";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repoUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScanRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "commitHash" TEXT NOT NULL,
    "scanConfigVersion" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "grade" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "criticalCount" INTEGER NOT NULL,
    "warningCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScanRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Certificate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "certId" TEXT NOT NULL,
    "scanRunId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'VALID',
    "pngPath" TEXT NOT NULL,
    "verifyUrl" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Certificate_scanRunId_fkey" FOREIGN KEY ("scanRunId") REFERENCES "ScanRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Certificate" ("certId", "createdAt", "expiresAt", "id", "issuedAt", "pngPath", "revokedAt", "status") SELECT "certId", "createdAt", "expiresAt", "id", "issuedAt", "pngPath", "revokedAt", "status" FROM "Certificate";
DROP TABLE "Certificate";
ALTER TABLE "new_Certificate" RENAME TO "Certificate";
CREATE UNIQUE INDEX "Certificate_certId_key" ON "Certificate"("certId");
CREATE INDEX "Certificate_certId_idx" ON "Certificate"("certId");
CREATE INDEX "Certificate_scanRunId_idx" ON "Certificate"("scanRunId");
CREATE TABLE "new_Finding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scanRunId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "riskSummary" TEXT NOT NULL,
    "hint" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Finding_scanRunId_fkey" FOREIGN KEY ("scanRunId") REFERENCES "ScanRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Finding" ("confidence", "createdAt", "hint", "id", "location", "riskSummary", "severity") SELECT "confidence", "createdAt", "hint", "id", "location", "riskSummary", "severity" FROM "Finding";
DROP TABLE "Finding";
ALTER TABLE "new_Finding" RENAME TO "Finding";
CREATE INDEX "Finding_scanRunId_idx" ON "Finding"("scanRunId");
CREATE TABLE "new_FixRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scanRunId" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FixRequest_scanRunId_fkey" FOREIGN KEY ("scanRunId") REFERENCES "ScanRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FixRequest" ("contact", "createdAt", "id", "notes", "urgency") SELECT "contact", "createdAt", "id", "notes", "urgency" FROM "FixRequest";
DROP TABLE "FixRequest";
ALTER TABLE "new_FixRequest" RENAME TO "FixRequest";
CREATE INDEX "FixRequest_scanRunId_idx" ON "FixRequest"("scanRunId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Project_repoUrl_idx" ON "Project"("repoUrl");

-- CreateIndex
CREATE INDEX "ScanRun_repoUrl_idx" ON "ScanRun"("repoUrl");

-- CreateIndex
CREATE INDEX "ScanRun_commitHash_idx" ON "ScanRun"("commitHash");

-- CreateIndex
CREATE INDEX "ScanRun_repoUrl_commitHash_scanConfigVersion_idx" ON "ScanRun"("repoUrl", "commitHash", "scanConfigVersion");
