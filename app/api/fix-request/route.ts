import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type FixRequestBody = {
  scanId?: string;
  contact?: string;
  urgency?: string;
  notes?: string;
};

export async function POST(request: Request) {
  if (process.env.FF_FIX_ENABLED !== "1") {
    return NextResponse.json(
      { error: "Fix request is disabled by feature flag." },
      { status: 403 }
    );
  }

  let body: FixRequestBody;
  try {
    body = (await request.json()) as FixRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const scanId = body.scanId?.trim();
  const contact = body.contact?.trim();
  const urgency = body.urgency?.trim();
  const notes = body.notes?.trim() ?? "";

  if (!scanId || !contact || !urgency) {
    return NextResponse.json(
      { error: "scanId, contact, and urgency are required." },
      { status: 400 }
    );
  }

  const scanRun = await prisma.scanRun.findUnique({ where: { id: scanId } });
  if (!scanRun) {
    return NextResponse.json({ error: "Scan not found." }, { status: 404 });
  }

  const requestRecord = await prisma.fixRequest.create({
    data: {
      scanRunId: scanId,
      contact,
      urgency,
      notes,
    },
  });

  return NextResponse.json({ requestId: requestRecord.id });
}
