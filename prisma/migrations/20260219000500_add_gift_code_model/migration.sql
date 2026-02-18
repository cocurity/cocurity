CREATE TABLE "GiftCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "scanRunId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "includesFix" BOOLEAN NOT NULL DEFAULT false,
    "includesCert" BOOLEAN NOT NULL DEFAULT false,
    "claimedByUserId" TEXT,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GiftCode_code_key" ON "GiftCode"("code");

CREATE INDEX "GiftCode_scanRunId_idx" ON "GiftCode"("scanRunId");

CREATE INDEX "GiftCode_senderUserId_idx" ON "GiftCode"("senderUserId");

CREATE INDEX "GiftCode_claimedByUserId_idx" ON "GiftCode"("claimedByUserId");

ALTER TABLE "GiftCode" ADD CONSTRAINT "GiftCode_scanRunId_fkey" FOREIGN KEY ("scanRunId") REFERENCES "ScanRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GiftCode" ADD CONSTRAINT "GiftCode_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GiftCode" ADD CONSTRAINT "GiftCode_claimedByUserId_fkey" FOREIGN KEY ("claimedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
