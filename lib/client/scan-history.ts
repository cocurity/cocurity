"use client";

export type ScanHistoryItem = {
  scanId: string;
  repoUrl: string;
  score?: number;
  grade?: string;
  verdict?: string;
  createdAt: string;
};

const HISTORY_KEY = "launchpass_scan_history_v1";
const HISTORY_LIMIT = 25;

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
  return readHistory();
}

export function upsertScanHistoryItem(item: ScanHistoryItem) {
  const current = readHistory();
  const next = [item, ...current.filter((entry) => entry.scanId !== item.scanId)];
  writeHistory(next);
}
