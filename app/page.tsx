import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const recentScans = await prisma.scanRun.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="space-y-8">
      <section className="lp-panel space-y-5 p-8">
        <p className="lp-badge">LaunchPass Dashboard</p>
        <h1 className="text-4xl font-black tracking-tight">출시 전 보안 프리플라이트</h1>
        <p className="max-w-2xl text-sm text-slate-700">
          Public GitHub 저장소를 검사하고, 리스크를 요약하고, 조건 충족 시 인증서를 발급합니다.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link className="lp-button lp-button-primary text-base" href="/scan">
            검사 시작
          </Link>
          <Link className="lp-button lp-button-ghost" href="/verify">
            인증서 검증 검색
          </Link>
          <Link className="lp-button lp-button-ghost" href="/changelog">
            Changelog
          </Link>
        </div>
      </section>

      <section className="lp-panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent Scans</h2>
          <Link href="/scan" className="text-sm">
            새 검사 만들기
          </Link>
        </div>
        {recentScans.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
            아직 스캔 이력이 없습니다. &quot;검사 시작&quot;으로 첫 스캔을 만들어보세요.
          </p>
        ) : (
          <ul className="grid gap-3">
            {recentScans.map((scan) => (
              <li className="rounded-xl border border-slate-200 bg-white p-4" key={scan.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{scan.repoUrl}</p>
                  <Link className="text-sm" href={`/scan/${scan.id}`}>
                    결과 보기
                  </Link>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="lp-badge">Score {scan.score}</span>
                  <span className="lp-badge">Grade {scan.grade}</span>
                  <span className="lp-badge">Verdict {scan.verdict}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
