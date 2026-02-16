"use client";

import { useState } from "react";
import {
  CopyButton,
  GlassCard,
  ModeCard,
  NeonButton,
  SectionHeader,
  SeverityPills,
  StatTiles,
  Toast,
  VerdictBadge,
} from "@/components/ui";

export default function ShowcaseClient() {
  const [toastOpen, setToastOpen] = useState(false);

  return (
    <main className="space-y-6">
      <SectionHeader
        title="Cocurity UI System"
        subtitle="Dark neo-glass design primitives"
        action={<NeonButton onClick={() => setToastOpen(true)}>Trigger Toast</NeonButton>}
      />

      <GlassCard>
        <p className="text-sm text-slate-300">
          GlassCard: reusable translucent surface for dashboards and workflows.
        </p>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-3">
        <ModeCard title="Scan Mode" description="Repository-level security analysis flow." active />
        <ModeCard title="Verify Mode" description="Certificate authenticity and status checks." />
        <ModeCard title="Report Mode" description="Risk report interpretation and handoff." />
      </div>

      <StatTiles
        items={[
          { label: "Score", value: 87 },
          { label: "Critical", value: 1 },
          { label: "Warnings", value: 2 },
        ]}
      />

      <GlassCard className="space-y-3">
        <SectionHeader title="Status Primitives" />
        <div className="flex flex-wrap gap-2">
          <VerdictBadge kind="safe" />
          <VerdictBadge kind="caution" />
          <VerdictBadge kind="avoid" />
          <VerdictBadge kind="valid" />
          <VerdictBadge kind="outdated" />
          <VerdictBadge kind="invalid" />
        </div>
        <SeverityPills critical={1} warning={2} />
      </GlassCard>

      <GlassCard className="space-y-3">
        <SectionHeader title="Action Controls" />
        <div className="flex flex-wrap gap-2">
          <NeonButton>Neon Primary</NeonButton>
          <NeonButton variant="ghost">Ghost Action</NeonButton>
          <CopyButton value="COC-REPORT-2026-0001" label="Copy Report ID" />
        </div>
      </GlassCard>

      <Toast
        open={toastOpen}
        message="Toast component active. This is a Cocurity UI system preview."
        tone="info"
        onClose={() => setToastOpen(false)}
      />
    </main>
  );
}
