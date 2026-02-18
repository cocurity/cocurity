"use client";

export type ScanHistoryItem = {
  scanId: string;
  repoUrl: string;
  mode?: "audit" | "dependency";
  score?: number;
  grade?: string;
  verdict?: string;
  createdAt: string;
};

const HISTORY_KEY = "launchpass_scan_history_v1";
const HISTORY_LIMIT = 25;

function byCreatedAtDesc(a: ScanHistoryItem, b: ScanHistoryItem) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function dedupeByScanId(items: ScanHistoryItem[]) {
  const seen = new Set<string>();
  const sorted = [...items].sort(byCreatedAtDesc);
  return sorted.filter((item) => {
    if (!item.scanId) return false;
    if (seen.has(item.scanId)) return false;
    seen.add(item.scanId);
    return true;
  });
}

function readHistory(): ScanHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScanHistoryItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeHistory(items: ScanHistoryItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, HISTORY_LIMIT)));
}

export function getScanHistory() {
  const current = readHistory();
  const deduped = dedupeByScanId(current);
  if (deduped.length !== current.length) {
    writeHistory(deduped);
  }
  return deduped;
}

export function upsertScanHistoryItem(item: ScanHistoryItem) {
  const current = readHistory();
  const next = dedupeByScanId([
    {
      ...item,
      repoUrl: item.repoUrl.trim(),
    },
    ...current,
  ]);
  writeHistory(next);
}
