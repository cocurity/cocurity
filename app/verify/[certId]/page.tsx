import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveCertificateStatus } from "@/lib/status";

type Props = { params: Promise<{ certId: string }> };

export default async function VerifyDetailPage({ params }: Props) {
  const { certId } = await params;
  const certificate = await prisma.certificate.findUnique({
    where: { certId },
    include: { scanRun: true },
  });
  if (!certificate) {
    notFound();
  }
  const status = resolveCertificateStatus(certificate);

  return (
    <main className="space-y-6">
      <section className="lp-panel space-y-3 p-6">
        <h1 className="text-2xl font-semibold">Certificate {certificate.certId}</h1>
        <div className="flex flex-wrap gap-2">
          <span
            className={
              status === "valid"
                ? "lp-badge lp-badge-ready"
                : status === "expired"
                  ? "lp-badge lp-badge-caution"
                  : "lp-badge lp-badge-block"
            }
          >
            STATUS: {status.toUpperCase()}
          </span>
        </div>
      </section>

      <section className="lp-panel space-y-2 p-6">
        <p>
          <strong>Issued:</strong> {certificate.issuedAt.toISOString()}
        </p>
        <p>
          <strong>Repo:</strong> {certificate.scanRun.repoUrl}
        </p>
        <p>
          <strong>Commit (7):</strong> {certificate.scanRun.commitHash.slice(0, 7)}
        </p>
        <p>
          <strong>Score / Grade:</strong> {certificate.scanRun.score} / {certificate.scanRun.grade}
        </p>
        <p>
          <strong>Verify URL:</strong> {certificate.verifyUrl}
        </p>
      </section>

      <section className="lp-panel space-y-3 p-6">
        <h2 className="text-xl font-semibold">Certificate Image</h2>
        <Image
          src={certificate.pngPath}
          alt={`Certificate ${certificate.certId}`}
          width={900}
          height={506}
          className="h-auto w-full rounded border border-slate-200"
        />
        <Link href={certificate.pngPath} target="_blank">
          Open certificate asset
        </Link>
      </section>
    </main>
  );
}
