"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getScanHistory } from "@/lib/client/scan-history";

type ApiOrder = {
  id: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  email: string;
  scanRunId: string | null;
  repoUrl: string | null;
  items: string[];
  paidAt: string | null;
  createdAt: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function orderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Pending",
    PAID: "Paid",
    FAILED: "Failed",
    REFUNDED: "Refunded",
    CANCELLED: "Cancelled",
  };
  return labels[status] ?? status;
}

function orderStatusColor(status: string) {
  if (status === "PAID") return "text-emerald-200";
  if (status === "PENDING") return "text-amber-200";
  if (status === "REFUNDED") return "text-slate-400";
  return "text-red-300";
}

export default function MyPage() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const reports = useMemo(() => getScanHistory().slice(0, 20), []);

  async function fetchOrders() {
    if (!email.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/orders?email=${encodeURIComponent(email.trim())}`);
      if (res.ok) {
        const data = (await res.json()) as { orders: ApiOrder[] };
        setOrders(data.orders);
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("cocurity_email") : null;
    if (stored) {
      setEmail(stored);
    }
  }, []);

  return (
    <main className="space-y-6">
      <section className="co-noise-card rounded-2xl p-6">
        <p className="lp-badge">My Workspace</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-100">My page</h1>
        <p className="mt-2 text-sm text-slate-300">Track your orders and report history.</p>
      </section>

      <section className="co-noise-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-100">My Orders</h2>
        <div className="mt-3 flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") fetchOrders(); }}
            placeholder="Enter your email to view orders"
            className="flex-1 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none"
          />
          <button
            type="button"
            className="lp-button lp-button-primary"
            onClick={fetchOrders}
            disabled={loading || !email.trim()}
          >
            {loading ? "Loading..." : "Search"}
          </button>
        </div>

        {searched && !loading && orders.length === 0 ? (
          <p className="mt-4 text-sm text-slate-300">No orders found for this email.</p>
        ) : null}

        {orders.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {orders.map((item) => (
              <li key={item.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-100">
                    {item.repoUrl || (item.type === "SUBSCRIPTION" ? "Membership" : `Order ${item.id.slice(0, 8)}`)}
                  </p>
                  <span className={`text-xs ${orderStatusColor(item.status)}`}>
                    {orderStatusLabel(item.status)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{formatDate(item.createdAt)}</p>
                <p className="mt-1 text-xs text-slate-300">
                  ${(item.amount / 100).toFixed(2)} {item.currency.toUpperCase()}
                </p>
                {item.items.length > 0 ? (
                  <p className="mt-1 text-xs text-slate-300">Items: {item.items.join(", ")}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="co-noise-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-100">Reports</h2>
        {reports.length === 0 ? (
          <p className="mt-3 text-sm text-slate-300">No reports yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {reports.map((report) => (
              <li key={report.scanId} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{report.repoUrl}</p>
                    <p className="text-xs text-slate-400">{formatDate(report.createdAt)}</p>
                  </div>
                  <Link className="text-sm text-cyan-200 no-underline hover:underline" href={`/r/${report.scanId}`}>
                    Open report
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
