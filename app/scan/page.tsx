import ScanForm from "./ScanForm";

export default function ScanPage() {
  return (
    <main className="space-y-6">
      <section className="lp-panel space-y-3 p-6">
        <h1 className="text-2xl font-semibold">Repository Scan</h1>
        <p className="text-sm text-slate-700">
          GitHub public repo URL을 입력하면 브랜치/커밋 기준으로 보안 리스크를 점검합니다.
        </p>
      </section>
      <section className="lp-panel p-6">
        <ScanForm />
      </section>
    </main>
  );
}
