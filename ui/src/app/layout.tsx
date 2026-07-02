import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Open-Job",
  description: "Find your next career opportunity",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-scroll-behavior="smooth" className={`${inter.variable} font-sans antialiased`}>
      <body className="min-h-screen flex flex-col text-oj-text bg-oj-bg">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
