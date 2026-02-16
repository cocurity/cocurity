export type CocurityFixOrder = {
  id: string;
  scanId: string;
  repoUrl: string;
  email: string;
  items: string[];
  status: "received" | "in_review" | "in_progress" | "completed";
  createdAt: string;
};

const STORAGE_KEY = "cocurity_fix_orders_v1";

function readOrders(): CocurityFixOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CocurityFixOrder[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeOrders(items: CocurityFixOrder[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getFixOrders() {
  return readOrders().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addFixOrder(order: CocurityFixOrder) {
  const existing = readOrders();
  const next = [order, ...existing.filter((item) => item.id !== order.id)];
  writeOrders(next);
}

export function updateFixOrderStatus(id: string, status: CocurityFixOrder["status"]) {
  const existing = readOrders();
  const next = existing.map((item) => (item.id === id ? { ...item, status } : item));
  writeOrders(next);
}
