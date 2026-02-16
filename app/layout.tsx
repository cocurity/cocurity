import type { Metadata } from "next";
import "./globals.css";

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
      <body>
        <div className="lp-shell">{children}</div>
      </body>
    </html>
  );
}
