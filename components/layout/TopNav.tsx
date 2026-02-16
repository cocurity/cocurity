"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const AUTH_KEY = "cocurity_logged_in";

export default function TopNav() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(window.localStorage.getItem(AUTH_KEY) === "1");
  }, []);

  function onLogin() {
    window.localStorage.setItem(AUTH_KEY, "1");
    setLoggedIn(true);
    router.push("/mypage");
  }

  return (
    <div className="flex items-center gap-3">
      <nav className="lp-nav">
        <Link href="/">Home</Link>
        <Link href="/scan">Scans</Link>
        <Link href="/verify">Verify</Link>
      </nav>
      {loggedIn ? (
        <Link href="/mypage" className="lp-button lp-button-ghost no-underline">
          My page
        </Link>
      ) : (
        <button type="button" className="lp-button lp-button-ghost" onClick={onLogin}>
          Login
        </button>
      )}
    </div>
  );
}
