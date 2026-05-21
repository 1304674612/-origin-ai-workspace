import type { Metadata } from "next";
import { ToastProvider } from "@/lib/toast";
import { DesktopPet } from "@/components/layout/desktop-pet";
import "./globals.css";

export const metadata: Metadata = {
  title: "ORIGIN AI Workspace",
  description: "Modern self-hosted AI workspace for developers, students, NAS users, and personal workflows.",
  metadataBase: new URL("http://localhost:3000")
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <meta name="theme-color" content="#050506" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <ToastProvider>{children}<DesktopPet /></ToastProvider>
      </body>
    </html>
  );
}
