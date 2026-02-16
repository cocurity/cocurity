"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FormEvent, useState } from "react";

export default function VerifySearchClient() {
  const router = useRouter();
  const [certId, setCertId] = useState("");
  const [focused, setFocused] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = certId.trim();
    if (!normalized) return;
    router.push(`/verify/${encodeURIComponent(normalized)}`);
  }

  return (
    <main className="space-y-6">
      <section className="co-noise-card rounded-2xl p-6">
        <p className="lp-badge">Official Verification Portal</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-100">Certificate Verification</h1>
        <p className="mt-2 text-sm text-slate-300">
          Verify certificate authenticity and scope directly from Cocurity records.
        </p>

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <motion.div
            animate={{
              boxShadow: focused
                ? "0 0 0 2px rgba(94, 234, 212, 0.45), 0 18px 35px rgba(0,0,0,0.35)"
                : "0 0 0 1px rgba(148,163,184,0.25), 0 10px 24px rgba(0,0,0,0.24)",
            }}
            className="rounded-xl border border-white/10 bg-black/25 px-4 py-3"
          >
            <label className="block text-xs uppercase tracking-[0.16em] text-slate-400">Certificate ID</label>
            <input
              className="mt-2 w-full bg-transparent text-lg font-semibold text-slate-100 outline-none placeholder:text-slate-500"
              placeholder="LP-ABCD-EFGH"
              value={certId}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChange={(event) => setCertId(event.target.value.toUpperCase())}
              required
            />
          </motion.div>
          <button className="lp-button lp-button-primary" type="submit">
            Verify Certificate
          </button>
        </form>
      </section>

      <section className="co-noise-card rounded-2xl p-6">
        <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-[#0d152d] via-[#0a1022] to-[#141d3b] p-4 sm:p-6">
          <div className="pointer-events-none absolute -left-24 top-14 h-60 w-60 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-60 w-60 rounded-full bg-indigo-300/20 blur-3xl" />

          <p className="relative z-10 text-xs uppercase tracking-[0.22em] text-cyan-100/85">
            What is Cocurity certification?
          </p>
          <div className="relative z-10 mt-4 grid items-stretch gap-4 sm:gap-6 lg:grid-cols-2">
            <motion.div
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="h-full"
            >
              <div className="mb-3 inline-flex rounded-xl border border-cyan-200/30 bg-cyan-200/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-cyan-100">
                OFFICIAL CERTIFICATE
              </div>
              <div className="h-full overflow-hidden rounded-2xl border-0 bg-transparent p-2 shadow-[0_24px_48px_rgba(0,0,0,0.45)]">
                <Image
                  src="/cocurity-cert-preview.svg"
                  alt="Cocurity certificate preview"
                  width={1200}
                  height={760}
                  className="h-auto w-full rounded-xl object-contain"
                />
              </div>
            </motion.div>

            <motion.div
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.06 }}
              className="mt-2 flex h-full flex-col justify-start rounded-2xl border-0 bg-transparent p-0 text-sm text-slate-100 shadow-none sm:mt-3 lg:mt-4"
            >
              <h3 className="px-1 text-xl font-semibold leading-snug text-white sm:text-2xl">Cocurity Certification</h3>
              <div className="mt-3 space-y-3 text-[14px] leading-6 text-slate-100 sm:mt-4 sm:space-y-4 sm:text-[15px] sm:leading-7">
                <div className="rounded-xl border border-white/15 px-4 py-3">
                  Cocurity Certification verifies your code’s security.
                  <br />
                  It checks for vulnerabilities, private keys, malicious behavior, and other security risks.
                </div>
                <div className="rounded-xl border border-amber-200/35 px-4 py-3 text-amber-100">
                  Certification expires if the code changes.
                </div>
                <div className="rounded-xl border border-white/15 px-4 py-3">
                  Each certificate has a unique ID and can be publicly verified via URL or QR code.
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
