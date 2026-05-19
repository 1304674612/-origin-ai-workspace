import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ORIGIN AI Workspace",
  description: "Modern self-hosted AI workspace for developers, students, NAS users, and personal workflows.",
  metadataBase: new URL("http://localhost:3000")
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
