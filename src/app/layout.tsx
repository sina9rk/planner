import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

// Geist گلیف فارسی ندارد (فقط subsets لاتین)، پس برای متن رابط کاربری
// از Vazirmatn استفاده می‌کنیم. Geist_Mono فقط برای کد/مقادیر عددی می‌ماند.
const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "برنامه‌ریز",
  description: "برنامه‌ریز شخصی کارها و رویدادها",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
