"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { upsertScanHistoryItem } from "@/lib/client/scan-history";

const STEP_LABELS = [
  "Validating repository URL",
  "Fetching default branch and latest commit",
  "Scanning repository file tree",
  "Calculating risk score",
];

export default function ScanForm() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!isSubmitting) return;
    const timer = window.setInterval(() => {
      setStepIndex((prev) => (prev + 1) % STEP_LABELS.length);
    }, 900);
    return () => window.clearInterval(timer);
  }, [isSubmitting]);

  const activeStep = useMemo(() => STEP_LABELS[stepIndex], [stepIndex]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    setStepIndex(0);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });
      const data = (await res.json()) as { scanId?: string; error?: string };
      if (!res.ok || !data.scanId) {
        setError(data.error ?? "Scan failed.");
        return;
      }
      upsertScanHistoryItem({
        scanId: data.scanId,
        repoUrl,
        createdAt: new Date().toISOString(),
      });
      router.push(`/scan/${data.scanId}`);
    } catch {
      setError("Network error while creating scan.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Public GitHub Repository URL</span>
        <input
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
          placeholder="https://github.com/org/repo"
          value={repoUrl}
          onChange={(event) => setRepoUrl(event.target.value)}
          required
        />
      </label>
      <button
        className="lp-button lp-button-primary disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Scanning..." : "Start Scan"}
      </button>
      {isSubmitting ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-3">
          <p className="text-sm font-medium">[SCANNER] {activeStep}</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded bg-slate-200">
            <div className="h-full w-1/3 animate-pulse rounded bg-slate-700" />
          </div>
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
