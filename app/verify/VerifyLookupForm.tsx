"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyLookupForm() {
  const router = useRouter();
  const [certId, setCertId] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(`/verify/${encodeURIComponent(certId.trim())}`);
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Certificate ID</span>
        <input
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
          value={certId}
          onChange={(event) => setCertId(event.target.value)}
          placeholder="LP-ABCD-EFGH"
          required
        />
      </label>
      <button className="lp-button lp-button-primary" type="submit">
        Verify Certificate
      </button>
    </form>
  );
}
