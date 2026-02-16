"use client";

import { useState } from "react";
import NeonButton from "@/components/ui/NeonButton";

type CopyButtonProps = {
  value: string;
  label?: string;
};

export default function CopyButton({ value, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <NeonButton type="button" variant="ghost" onClick={onCopy}>
      {copied ? "Copied" : label}
    </NeonButton>
  );
}
