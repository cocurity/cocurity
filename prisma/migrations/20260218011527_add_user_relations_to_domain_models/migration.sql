-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "FixRequest" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "ScanRun" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "Certificate_userId_idx" ON "Certificate"("userId");

-- CreateIndex
CREATE INDEX "FixRequest_userId_idx" ON "FixRequest"("userId");

-- CreateIndex
CREATE INDEX "ScanRun_userId_idx" ON "ScanRun"("userId");

-- AddForeignKey
ALTER TABLE "ScanRun" ADD CONSTRAINT "ScanRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixRequest" ADD CONSTRAINT "FixRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
