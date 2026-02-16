import Link from "next/link";
import HeroScene from "@/components/home/HeroScene";
import ModeTiltCard from "@/components/home/ModeTiltCard";
import PageTransition from "@/components/home/PageTransition";

export default function HomePage() {
  return (
    <PageTransition>
      <main className="space-y-8">
        <section className="relative overflow-hidden rounded-[28px] border border-white/15 p-8 shadow-2xl">
          <HeroScene />
          <div className="relative z-10">
            <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-slate-200">
              Code Security Service
            </p>
            <h1
              className="mt-5 max-w-3xl bg-gradient-to-r from-cyan-200 via-violet-200 to-cyan-100 bg-clip-text text-6xl font-bold leading-tight tracking-tight text-transparent sm:text-7xl"
              style={{ fontFamily: "var(--font-space), sans-serif" }}
            >
              Cocurity
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-200">
              Before you ship it. Before you clone it. Verify it.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="lp-button lp-button-primary" href="/scan">
                Start Audit
              </Link>
              <Link className="lp-button lp-button-ghost" href="/verify">
                Verify Certificate
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <ModeTiltCard
            title="Pre-Launch Security Audit"
            summary="Identify critical risks before you ship to production."
            cta="Before Launch"
            href="/scan"
            accent="cyan"
            tag="<Before Launch>"
          />
          <ModeTiltCard
            title="Dependency Risk Check"
            summary="Assess security risks before you clone or integrate."
            cta="Before Clone"
            href="/scan?mode=dependency"
            accent="violet"
            tag="<Before Clone>"
          />
        </section>
      </main>
    </PageTransition>
  );
}
