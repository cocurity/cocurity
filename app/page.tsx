import Link from "next/link";
import ScanHistoryPanel from "./ScanHistoryPanel";

export default function HomePage() {
  return (
    <main className="space-y-8">
      <section className="lp-panel lp-panel-hero space-y-5 p-8">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="lp-badge lp-badge-ready">PROTECTION ACTIVE</span>
          <span className="lp-badge">Repository Security Assessment</span>
          <span className="lp-badge">Certificate Verification</span>
        </div>
        <div className="flex items-center gap-4">
          <span
            className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-4xl font-black text-white shadow-sm sm:h-20 sm:w-20 sm:text-5xl"
            aria-hidden
          >
            ✓
          </span>
          <h1
            className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-5xl font-bold leading-[0.9] tracking-tight text-transparent sm:text-7xl"
            style={{ fontFamily: "var(--font-space), sans-serif" }}
          >
            Launch Pass
          </h1>
        </div>
        <p className="max-w-2xl text-sm text-slate-700">
          Pre-launch security checks. Diagnostic reports & remediation. Certificate-based security notarization.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link className="lp-button lp-button-primary text-base" href="/scan">
            Start Scan
          </Link>
          <Link className="lp-button lp-button-ghost" href="/verify">
            Search Certificates
          </Link>
        </div>
      </section>

      <ScanHistoryPanel />
    </main>
  );
}
