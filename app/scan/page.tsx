import ScanForm from "./ScanForm";

export default function ScanPage() {
  return (
    <main className="space-y-6">
      <section className="lp-panel space-y-3 p-6">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="lp-badge">Step 1: Repository Validation</span>
          <span className="lp-badge">Step 2: Threat Scan</span>
          <span className="lp-badge">Step 3: Security Scoring</span>
        </div>
        <h1 className="text-2xl font-semibold">Repository Security Scan</h1>
        <p className="text-sm text-slate-700">
          Enter a public GitHub repository URL to scan security risks on the latest default-branch commit.
        </p>
      </section>
      <section className="lp-panel p-6">
        <ScanForm />
      </section>
    </main>
  );
}
