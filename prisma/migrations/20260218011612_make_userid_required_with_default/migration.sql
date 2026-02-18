/*
  Warnings:

  - Made the column `userId` on table `Certificate` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `FixRequest` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `ScanRun` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Certificate" DROP CONSTRAINT "Certificate_userId_fkey";

-- DropForeignKey
ALTER TABLE "FixRequest" DROP CONSTRAINT "FixRequest_userId_fkey";

-- DropForeignKey
ALTER TABLE "ScanRun" DROP CONSTRAINT "ScanRun_userId_fkey";

-- Backfill existing NULL values
UPDATE "Certificate" SET "userId" = '' WHERE "userId" IS NULL;
UPDATE "FixRequest" SET "userId" = '' WHERE "userId" IS NULL;
UPDATE "ScanRun" SET "userId" = '' WHERE "userId" IS NULL;

-- AlterTable
ALTER TABLE "Certificate" ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "userId" SET DEFAULT '';

-- AlterTable
ALTER TABLE "FixRequest" ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "userId" SET DEFAULT '';

-- AlterTable
ALTER TABLE "ScanRun" ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "userId" SET DEFAULT '';
