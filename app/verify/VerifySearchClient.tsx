"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useState } from "react";
import { getVerifyHistory, VerifyHistoryItem } from "@/lib/client/verify-history";

export default function VerifySearchClient() {
  const router = useRouter();
  const [certId, setCertId] = useState("");
  const [focused, setFocused] = useState(false);
  const [history, setHistory] = useState<VerifyHistoryItem[]>([]);

  useEffect(() => {
    setHistory(getVerifyHistory());
  }, []);

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
        <h2 className="text-lg font-semibold text-slate-100">Recent Verified</h2>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-slate-300">No recent verification activity in this browser.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            <AnimatePresence>
              {history.slice(0, 8).map((item) => (
                <motion.li
                  key={item.certId}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{item.certId}</p>
                      <p className="text-xs text-slate-400">
                        {item.status ? item.status.toUpperCase() : "CHECKED"} ·{" "}
                        {new Date(item.checkedAt).toLocaleString()}
                      </p>
                    </div>
                    <Link className="text-sm text-cyan-200" href={`/verify/${item.certId}`}>
                      Open
                    </Link>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </main>
  );
}
