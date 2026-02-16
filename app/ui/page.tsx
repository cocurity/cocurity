import ShowcaseClient from "./ShowcaseClient";

export default function UiShowcasePage() {
  return (
    <main className="space-y-6">
      <div className="lp-panel p-6">
        <p className="lp-badge">Cocurity</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-100">/ui Component Showcase</h1>
        <p className="mt-2 text-sm text-slate-300">
          Story-like preview for the premium Cocurity design system.
        </p>
      </div>
      <ShowcaseClient />
    </main>
  );
}
