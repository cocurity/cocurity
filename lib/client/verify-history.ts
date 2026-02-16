"use client";

export type VerifyHistoryItem = {
  certId: string;
  repoUrl?: string;
  status?: "valid" | "outdated" | "invalid";
  checkedAt: string;
};

const VERIFY_HISTORY_KEY = "cocurity_verify_history_v1";
const VERIFY_HISTORY_LIMIT = 20;

function readVerifyHistory(): VerifyHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(VERIFY_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VerifyHistoryItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeVerifyHistory(items: VerifyHistoryItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VERIFY_HISTORY_KEY, JSON.stringify(items.slice(0, VERIFY_HISTORY_LIMIT)));
}

export function getVerifyHistory() {
  return readVerifyHistory();
}

export function upsertVerifyHistoryItem(item: VerifyHistoryItem) {
  const current = readVerifyHistory();
  const next = [item, ...current.filter((entry) => entry.certId !== item.certId)];
  writeVerifyHistory(next);
}
