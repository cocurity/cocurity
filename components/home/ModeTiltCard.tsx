"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { MouseEvent } from "react";

type ModeTiltCardProps = {
  title: string;
  summary: string;
  cta: string;
  href: string;
  accent: "cyan" | "violet";
  tag?: string;
};

export default function ModeTiltCard({
  title,
  summary,
  cta,
  href,
  accent,
  tag = "Cocurity Mode",
}: ModeTiltCardProps) {
  const rotateXInput = useMotionValue(0);
  const rotateYInput = useMotionValue(0);
  const rotateX = useSpring(rotateXInput, { stiffness: 190, damping: 16, mass: 0.25 });
  const rotateY = useSpring(rotateYInput, { stiffness: 190, damping: 16, mass: 0.25 });
  const glow = useTransform(rotateY, [-9, 0, 9], [0.28, 0.45, 0.28]);

  function handleMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const px = x / rect.width - 0.5;
    const py = y / rect.height - 0.5;
    rotateYInput.set(px * 12);
    rotateXInput.set(-py * 12);
  }

  function reset() {
    rotateXInput.set(0);
    rotateYInput.set(0);
  }

  const accentClass =
    accent === "cyan"
      ? "from-cyan-300/45 via-cyan-300/10 to-transparent"
      : "from-violet-300/45 via-violet-300/10 to-transparent";

  return (
    <motion.div
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className="group relative rounded-2xl"
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 250, damping: 18 }}
      onMouseMove={handleMove}
      onMouseLeave={reset}
    >
      <motion.div
        style={{ opacity: glow }}
        className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${accentClass}`}
      />
      <div className="co-noise-card relative rounded-2xl p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{tag}</p>
        <h3 className="mt-3 text-2xl font-semibold text-slate-100">{title}</h3>
        <p className="mt-2 text-sm text-slate-300">{summary}</p>
        <Link
          className="mt-6 inline-flex items-center rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 no-underline transition hover:bg-white/10"
          href={href}
        >
          {cta}
        </Link>
      </div>
    </motion.div>
  );
}
