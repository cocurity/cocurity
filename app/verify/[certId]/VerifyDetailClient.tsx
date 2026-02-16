"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import CopyButton from "@/components/ui/CopyButton";
import VerdictBadge from "@/components/ui/VerdictBadge";
import { upsertVerifyHistoryItem } from "@/lib/client/verify-history";

type VerifyResponse = {
  status: "valid" | "outdated" | "invalid" | "not_found";
  certificate: {
    certId: string;
    issuedAt: string;
    expiresAt: string | null;
    revokedAt: string | null;
    pngPath: string;
    verifyUrl: string;
  } | null;
  scanSummary: {
    scanId: string;
    repoUrl: string;
    commitHash: string;
    score: number;
    grade: string;
    verdict: string;
  } | null;
};

export default function VerifyDetailClient({ certId }: { certId: string }) {
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/verify/${encodeURIComponent(certId)}`, { cache: "no-store" });
        const body = (await res.json()) as VerifyResponse;
        if (!mounted) return;
        setData(body);
      } catch {
        if (!mounted) return;
        setError("Network error while verifying certificate.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [certId]);

  useEffect(() => {
    if (!data?.certificate || !data?.scanSummary) return;
    const verifyUrl = data.certificate.verifyUrl.startsWith("http")
      ? data.certificate.verifyUrl
      : `${window.location.origin}${data.certificate.verifyUrl}`;
    QRCode.toDataURL(verifyUrl, { margin: 1, width: 220 })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(""));

    if (data.status !== "not_found") {
      upsertVerifyHistoryItem({
        certId: data.certificate.certId,
        repoUrl: data.scanSummary.repoUrl,
        status: data.status === "valid" || data.status === "outdated" ? data.status : "invalid",
        checkedAt: new Date().toISOString(),
      });
    }
  }, [data]);

  const statusUi = useMemo(() => {
    if (!data || data.status === "not_found") {
      return {
        label: "Invalid",
        badge: "lp-badge lp-badge-block",
        desc: "Certificate record was not found.",
      };
    }
    if (data.status === "valid") {
      return {
        label: "Valid (Up-to-date)",
        badge: "lp-badge lp-badge-ready",
        desc: "Certificate scope matches the latest tracked repository commit.",
      };
    }
    if (data.status === "outdated") {
      return {
        label: "Outdated (new commits exist)",
        badge: "lp-badge lp-badge-caution",
        desc: "Scope has been exceeded by newer commits. This does not automatically mean vulnerabilities exist.",
      };
    }
    return {
      label: "Invalid",
      badge: "lp-badge lp-badge-block",
      desc: "Certificate is revoked, expired, or cannot be trusted.",
    };
  }, [data]);

  if (loading) {
    return (
      <main className="space-y-6">
        <section className="co-noise-card rounded-2xl p-6">
          <div className="h-6 w-56 animate-pulse rounded bg-white/10" />
          <div className="mt-3 h-4 w-80 animate-pulse rounded bg-white/10" />
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="space-y-6">
        <section className="co-noise-card rounded-2xl p-6">
          <p className="text-sm text-red-300">{error}</p>
        </section>
      </main>
    );
  }

  if (!data || !data.certificate || !data.scanSummary || data.status === "not_found") {
    return (
      <main className="space-y-6">
        <section className="co-noise-card rounded-2xl p-6">
          <p className={statusUi.badge}>{statusUi.label}</p>
          <p className="mt-3 text-sm text-slate-300">{statusUi.desc}</p>
        </section>
      </main>
    );
  }

  const verifyUrl = data.certificate.verifyUrl.startsWith("http")
    ? data.certificate.verifyUrl
    : `${typeof window !== "undefined" ? window.location.origin : ""}${data.certificate.verifyUrl}`;

  return (
    <main className="space-y-6">
      <section className="co-noise-card rounded-2xl p-6">
        <p className="lp-badge">Official Cocurity Verification</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-100">Certificate Status</h1>
          <VerdictBadge
            kind={
              data.status === "valid" ? "valid" : data.status === "outdated" ? "outdated" : "invalid"
            }
          />
        </div>
        <p className="mt-2 text-sm text-slate-300">{statusUi.desc}</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="co-noise-card rounded-2xl p-5"
        >
          <h2 className="text-lg font-semibold text-slate-100">Certificate Preview</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
            <Image
              src={data.certificate.pngPath}
              alt={`Certificate ${data.certificate.certId}`}
              width={960}
              height={540}
              className="h-auto w-full"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="co-noise-card rounded-2xl p-5"
        >
          <h2 className="text-lg font-semibold text-slate-100">Verification Metadata</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            <li>
              <strong>Certificate ID:</strong> {data.certificate.certId}
            </li>
            <li>
              <strong>Repository:</strong> {data.scanSummary.repoUrl}
            </li>
            <li>
              <strong>Certified commit:</strong> {data.scanSummary.commitHash.slice(0, 7)}
            </li>
            <li>
              <strong>Issued at:</strong> {new Date(data.certificate.issuedAt).toISOString()}
            </li>
          </ul>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Verify URL</p>
            <p className="mt-1 break-all text-sm text-slate-200">{verifyUrl}</p>
            <div className="mt-3 flex items-center gap-2">
              <CopyButton value={verifyUrl} label="Copy verify URL" />
              <Link className="text-sm text-cyan-200" href={verifyUrl} target="_blank">
                Open
              </Link>
            </div>
          </div>

          <AnimatePresence>
            {qrDataUrl ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 inline-flex rounded-xl border border-white/10 bg-white p-2"
              >
                <Image src={qrDataUrl} alt="Verify QR" width={150} height={150} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </section>
    </main>
  );
}
