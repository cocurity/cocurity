import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

type IssueGiftInput = {
  scanId: string;
  senderUserId: string;
  recipientEmail?: string;
  includesFix: boolean;
  includesCert: boolean;
};

function buildGiftCode() {
  return `COCU-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function issueGiftCode(input: IssueGiftInput) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await prisma.giftCode.create({
        data: {
          code: buildGiftCode(),
          scanRunId: input.scanId,
          senderUserId: input.senderUserId,
          recipientEmail: input.recipientEmail,
          includesFix: input.includesFix,
          includesCert: input.includesCert,
        },
      });
    } catch {
      if (attempt === 4) throw new Error("Could not issue gift code.");
    }
  }

  throw new Error("Could not issue gift code.");
}

export async function hasClaimedCertGiftForScan(userId: string, scanId: string) {
  const gift = await prisma.giftCode.findFirst({
    where: {
      scanRunId: scanId,
      claimedByUserId: userId,
      includesCert: true,
    },
    select: { id: true },
  });

  return Boolean(gift);
}
