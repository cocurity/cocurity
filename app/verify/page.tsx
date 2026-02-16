import VerifyLookupForm from "./VerifyLookupForm";

export default function VerifyPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Certificate Verification</h1>
      <p className="text-slate-700">Enter a certificate ID to validate status.</p>
      <VerifyLookupForm />
    </main>
  );
}
