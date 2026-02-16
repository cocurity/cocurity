const MAP = {
  safe: "✅ Safe",
  caution: "⚠️ Caution",
  avoid: "⛔ Avoid",
  valid: "✅ Valid (Up-to-date)",
  outdated: "⚠️ Outdated",
  invalid: "⛔ Invalid",
} as const;

export function VerdictBadge({ kind }: { kind: keyof typeof MAP }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 shadow-glow">
      <span className="text-sm font-semibold">{MAP[kind]}</span>
    </div>
  );
}

export default VerdictBadge;
