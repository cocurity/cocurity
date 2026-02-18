import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildCertId, renderCertificateImage } from "@/lib/certificate";

type CertificateRequestBody = { scanId?: string };

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (process.env.FF_CERT_ENABLED !== "1") {
    return NextResponse.json(
      { error: "Certificate issuance is disabled by feature flag." },
      { status: 403 }
    );
  }

  let body: CertificateRequestBody;
  try {
    body = (await request.json()) as CertificateRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const scanId = body.scanId?.trim();
  if (!scanId) {
    return NextResponse.json({ error: "scanId is required." }, { status: 400 });
  }

  const scanRun = await prisma.scanRun.findUnique({
    where: { id: scanId },
    include: { certificates: true },
  });
  if (!scanRun) {
    return NextResponse.json({ error: "Scan not found." }, { status: 404 });
  }
  if (scanRun.criticalCount > 0) {
    return NextResponse.json(
      { error: "Certificate can only be issued when critical findings are zero." },
      { status: 400 }
    );
  }

  const existing = scanRun.certificates[0];
  if (existing) {
    return NextResponse.json({ certId: existing.certId });
  }

  const certId = buildCertId();
  const publicBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ?? "";
  const verifyUrl = publicBaseUrl ? `${publicBaseUrl}/verify/${certId}` : `/verify/${certId}`;
  const rendered = await renderCertificateImage({
    certId,
    issuedAt: new Date(),
    repoUrl: scanRun.repoUrl,
    commitHash: scanRun.commitHash,
    score: scanRun.score,
    grade: scanRun.grade,
    verifyUrl,
  });

  await prisma.certificate.create({
    data: {
      certId,
      scanRunId: scanRun.id,
      userId: session.user.id,
      status: "VALID",
      pngPath: rendered.imagePath,
      verifyUrl,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({ certId });
}
