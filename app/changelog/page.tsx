const changelogItems = [
  "Alyak-style dashboard UI with large 검사 시작 CTA and recent scans list added.",
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
          <li>`/`에서 &quot;검사 시작&quot; 클릭 후 `/scan`으로 이동합니다.</li>
          <li>예시 URL `https://github.com/octocat/Hello-World`로 스캔합니다.</li>
          <li>`/scan/[scanId]`에서 점수/등급/판정, findings, rescan 버튼을 확인합니다.</li>
          <li>Critical이 0이면 Certificate 발급 후 `/verify/[certId]` 미리보기를 확인합니다.</li>
          <li>`/verify`에서 certId 검색으로 공개 검증 흐름을 재현합니다.</li>
        </ol>
      </section>
    </main>
  );
}
