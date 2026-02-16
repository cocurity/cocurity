import type { Metadata } from "next";
import Link from "next/link";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space",
});

export const metadata: Metadata = {
  title: "LaunchPass",
  description: "Pre-launch security checker MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${spaceGrotesk.variable}`}>
        <header className="lp-topbar">
          <div className="lp-topbar-inner">
            <Link href="/" className="lp-brand">
              <span className="lp-brand-dot" />
              LaunchPass Security Console
            </Link>
            <nav className="lp-nav">
              <Link href="/scan">Scan</Link>
              <Link href="/verify">Verify</Link>
              <Link href="/changelog">Changelog</Link>
            </nav>
          </div>
        </header>
        <div className="lp-shell">{children}</div>
      </body>
    </html>
  );
}
