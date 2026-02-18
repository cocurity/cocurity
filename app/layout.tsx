import type { Metadata } from "next";
import Link from "next/link";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import AuthProvider from "@/components/auth/AuthProvider";
import TopNav from "@/components/layout/TopNav";
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
  title: "Cocurity",
  description: "Cocurity security workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${spaceGrotesk.variable}`}>
        <AuthProvider>
          <header className="lp-topbar">
            <div className="lp-topbar-inner">
              <Link href="/" className="lp-brand">
                <span className="lp-brand-dot" />
                Cocurity
              </Link>
              <TopNav />
            </div>
          </header>
          <div className="lp-shell">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
