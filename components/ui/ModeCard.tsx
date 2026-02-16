import { ReactNode } from "react";

type ModeCardProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  active?: boolean;
};

export default function ModeCard({ title, description, icon, active = false }: ModeCardProps) {
  return (
    <div
      className={[
        "co-noise-card rounded-xl p-4 transition",
        active ? "ring-2 ring-cyan-300/60" : "ring-1 ring-white/5",
      ].join(" ")}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/18 text-cyan-200">
          {icon ?? "◈"}
        </div>
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      </div>
      <p className="text-xs text-slate-300">{description}</p>
    </div>
  );
}
