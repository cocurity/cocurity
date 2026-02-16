"use client";

import { useEffect } from "react";

type ToastProps = {
  open: boolean;
  message: string;
  tone?: "info" | "success" | "error";
  onClose: () => void;
};

export default function Toast({ open, message, tone = "info", onClose }: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose(), 2200);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  const toneClass =
    tone === "success"
      ? "border-emerald-300/45 text-emerald-200"
      : tone === "error"
        ? "border-red-300/45 text-red-200"
        : "border-cyan-300/45 text-cyan-200";

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`co-noise-card rounded-xl border px-4 py-3 text-sm ${toneClass}`}>{message}</div>
    </div>
  );
}
