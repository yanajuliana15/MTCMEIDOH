import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MTC MEIDOH - Manajemen Sparepart Mesin Industri",
  description: "Sistem manajemen inventaris sparepart mesin industri MTC MEIDOH: dashboard, katalog, mesin, supplier, transaksi stok.",
  keywords: ["MTC MEIDOH", "sparepart", "mesin industri", "inventaris", "manajemen stok", "maintenance"],
  authors: [{ name: "MTC MEIDOH" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
