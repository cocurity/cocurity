-- CreateEnum
CREATE TYPE "FindingSource" AS ENUM ('RULE', 'AI');

-- AlterTable
ALTER TABLE "Finding" ADD COLUMN     "source" "FindingSource" NOT NULL DEFAULT 'RULE';

-- AlterTable
ALTER TABLE "ScanRun" ADD COLUMN     "aiEnabled" BOOLEAN NOT NULL DEFAULT false;
