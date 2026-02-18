import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { issueGiftCode } from "@/lib/gift";

type GiftRequestBody = {
  scanId?: string;
  recipientEmail?: string;
  includesFix?: boolean;
  includesCert?: boolean;
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: GiftRequestBody;
  try {
    body = (await request.json()) as GiftRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const scanId = body.scanId?.trim();
  if (!scanId) {
    return NextResponse.json({ error: "scanId is required." }, { status: 400 });
  }

  const includesFix = Boolean(body.includesFix);
  const includesCert = Boolean(body.includesCert);

  if (!includesFix && !includesCert) {
    return NextResponse.json({ error: "At least one gift item is required." }, { status: 400 });
  }

  const scanRun = await prisma.scanRun.findUnique({ where: { id: scanId } });
  if (!scanRun) {
    return NextResponse.json({ error: "Scan not found." }, { status: 404 });
  }

  const gift = await issueGiftCode({
    scanId,
    senderUserId: session.user.id,
    recipientEmail: body.recipientEmail?.trim() || undefined,
    includesFix,
    includesCert,
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ?? "";
  const redeemPath = `/gift/${gift.code}`;

  return NextResponse.json({
    giftCode: gift.code,
    redeemUrl: baseUrl ? `${baseUrl}${redeemPath}` : redeemPath,
    includesFix: gift.includesFix,
    includesCert: gift.includesCert,
  });
}
