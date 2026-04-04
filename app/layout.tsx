import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TopBar from "./components/TopBar";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Coco Footy",
    template: "%s | Coco Footy",
  },
  description: "Play AFL games, live scores, and more on Coco Footy",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2276050414767400"
     crossorigin="anonymous"></script>
</head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <TopBar />
        {children}
        <Analytics />
      </body>
    </html>
  );
}