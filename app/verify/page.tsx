import VerifyLookupForm from "./VerifyLookupForm";

export default function VerifyPage() {
  return (
    <main className="space-y-6">
      <section className="lp-panel space-y-3 p-6">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="lp-badge">Public Verification Portal</span>
          <span className="lp-badge">Integrity Validation</span>
        </div>
        <h1 className="text-2xl font-semibold">Certificate Verification</h1>
        <p className="text-sm text-slate-700">
          Enter a certificate ID to check status, scan summary, and issuance metadata.
        </p>
      </section>
      <section className="lp-panel p-6">
        <VerifyLookupForm />
      </section>
    </main>
  );
}
