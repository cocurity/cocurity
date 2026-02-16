import { cn } from "@/lib/cn";

export function GlassCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-white/10 bg-white/[0.04] shadow-glass backdrop-blur-xl",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-60",
        className
      )}
      {...props}
    />
  );
}

export default GlassCard;
