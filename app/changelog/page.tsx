const changelogItems = [
  "Alyak-style dashboard UI with a large Start Scan CTA and recent scans list added.",
  "Scan page now shows staged progress feedback while backend scan is running.",
  "Scan result page moved to API-driven client rendering with loading/error/empty states.",
  "Rescan, Fix Request, and Certificate issuance actions are wired to real APIs.",
  "Certificate verification detail now shows status, metadata, and generated asset preview.",
  "Feature-flag based UI visibility for Fix Request and Certificate actions applied.",
  "Scanner engine now uses GitHub API + rule-based detection with file/size limits.",
];

export default function ChangelogPage() {
  return (
    <main className="space-y-6">
      <section className="lp-panel p-6">
        <h1 className="text-2xl font-semibold">Changelog</h1>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          {changelogItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="lp-panel p-6">
        <h2 className="text-xl font-semibold">How To Demo</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
          <li>Open `/` and click &quot;Start Scan&quot; to move to `/scan`.</li>
          <li>Scan the example URL `https://github.com/octocat/Hello-World`.</li>
          <li>Review score, grade, verdict, findings, and the rescan action in `/scan/[scanId]`.</li>
          <li>If critical findings are zero, issue a certificate and check preview in `/verify/[certId]`.</li>
          <li>Use `/verify` search to reproduce the public verification flow.</li>
        </ol>
      </section>
    </main>
  );
}
