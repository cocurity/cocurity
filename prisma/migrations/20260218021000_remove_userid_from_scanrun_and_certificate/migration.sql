-- DropIndex
DROP INDEX "Certificate_userId_idx";

-- DropIndex
DROP INDEX "ScanRun_userId_idx";

-- AlterTable
ALTER TABLE "Certificate" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "ScanRun" DROP COLUMN "userId";
