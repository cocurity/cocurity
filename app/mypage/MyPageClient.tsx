"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getFixOrders,
  updateFixOrderStatus,
  type CocurityFixOrder,
} from "@/lib/client/fix-orders";
import { getScanHistory } from "@/lib/client/scan-history";

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function statusLabel(status: string) {
  if (status === "received") return "Received";
  if (status === "in_review") return "In review";
  if (status === "in_progress") return "In progress";
  if (status === "completed") return "Completed";
  return status;
}

export default function MyPageClient({ user }: Props) {
  const [fixOrders, setFixOrders] = useState<CocurityFixOrder[]>([]);

  useEffect(() => {
    setFixOrders(getFixOrders());
  }, []);

  const reports = useMemo(() => getScanHistory().slice(0, 20), []);

  function onAdvanceStatus(item: CocurityFixOrder) {
    const nextStatus =
      item.status === "received"
        ? "in_review"
        : item.status === "in_review"
          ? "in_progress"
          : item.status === "in_progress"
            ? "completed"
            : "completed";
    updateFixOrderStatus(item.id, nextStatus);
    setFixOrders(getFixOrders());
  }

  function advanceLabel(status: CocurityFixOrder["status"]) {
    if (status === "received") return "Move to In review";
    if (status === "in_review") return "Move to In progress";
    if (status === "in_progress") return "Mark completed";
    return "Completed";
  }

  return (
    <main className="space-y-6">
      <section className="co-noise-card rounded-2xl p-6">
        <p className="lp-badge">My Workspace</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-100">
          My page
        </h1>
        <div className="mt-2 flex items-center gap-3">
          {user.image && (
            <Image
              src={user.image}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-full"
            />
          )}
          <div>
            <p className="text-sm font-medium text-slate-100">{user.name}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
      </section>

      <section className="co-noise-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-100">
          My Cocurity Fix
        </h2>
        {fixOrders.length === 0 ? (
          <p className="mt-3 text-sm text-slate-300">No fix requests yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {fixOrders.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-100">
                    {item.repoUrl || `Scan ${item.scanId}`}
                  </p>
                  <span className="text-xs text-cyan-200">
                    {statusLabel(item.status)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {formatDate(item.createdAt)}
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  Email: {item.email || "not provided"}
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  Items: {item.items.join(", ")}
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    className="lp-button lp-button-ghost"
                    onClick={() => onAdvanceStatus(item)}
                    disabled={item.status === "completed"}
                  >
                    {advanceLabel(item.status)}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="co-noise-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-100">Reports</h2>
        {reports.length === 0 ? (
          <p className="mt-3 text-sm text-slate-300">No reports yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {reports.map((report) => (
              <li
                key={report.scanId}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      {report.repoUrl}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(report.createdAt)}
                    </p>
                  </div>
                  <Link
                    className="text-sm text-cyan-200 no-underline hover:underline"
                    href={`/r/${report.scanId}`}
                  >
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
