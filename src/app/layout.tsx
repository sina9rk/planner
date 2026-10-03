import type { Metadata } from "next";
import { Geist_Mono, Vazirmatn, Geist } from "next/font/google";
import "./globals.css";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_ACCENT,
  normalizeAccent,
  normalizeThemeMode,
  type ThemeMode,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
  description: "مشاور کارهای روزانه؛ می‌گوید کِی چه کاری انجام بدهی.",
};

const FALLBACK = { mode: "dark" as ThemeMode, accent: DEFAULT_ACCENT };

/**
 * تم فقط از دیتابیس خوانده می‌شود، نه از کوکی و نه از localStorage.
 *
 * دلیل: هر منبع دیگری (کوکی، localStorage، مقدار پیش‌فرض مرورگر) می‌تواند
 * بین رندر سرور و کلاینت فرق کند و آن‌وقت React در hydration اعتراض می‌کند.
 * دیتابیس یک منبع حقیقت دارد و در همان درخواستی که HTML تولید می‌شود در
 * دسترس است، پس attribute رندرشده با آنچه کلاینت می‌بیند یکی است.
 *
 * به همین دلیل هیچ اسکریپتی برای اعمال تم در <head> نمی‌گذاریم. آن اسکریپت
 * در نسخهٔ قبل cssText را جایگزین می‌کرد و attribute رندرشدهٔ React را پاک
 * می‌کرد، که دقیقاً همان چیزی بود که mismatch می‌ساخت.
 *
 * هزینهٔ این تصمیم: چون auth() و prisma در layout صدا زده می‌شوند، هیچ
 * صفحه‌ای static prerender نمی‌شود. برای یک اپ احراز هویت‌محور این هزینه
 * پذیرفتنی است و در عوض تم همیشه درست است.
 */
async function resolveTheme(): Promise<{ mode: ThemeMode; accent: string }> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return FALLBACK;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { themeAccent: true, themeMode: true },
  });

  if (!user) return FALLBACK;

  return {
    mode: normalizeThemeMode(user.themeMode),
    accent: normalizeAccent(user.themeAccent),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = await resolveTheme();

  /*
    هم کلاس و هم data-theme روی <html> می‌نشینند و هر دو لازم است:
    - data-theme: پالت خودِ اپ را تعیین می‌کند؛ globals.css آن را با
      :root[data-theme="..."] می‌گیرد.
    - کلاس dark/light: واریانت `dark:` تِیلویند و توکن‌های shadcn در بلوک
      `.dark` را فعال می‌کند؛ بدون آن کامپوننت‌های shadcn در حالت تیره هم
      توکن‌های روشن می‌گرفتند.

    هر دو از همین theme.mode می‌آیند، پس سرور و اولین رندر کلاینت یکی‌اند و
    theme-section هم هنگام پیش‌نمایش زنده دقیقاً همین دو را عوض می‌کند.
  */
  return (
    <html
      lang="fa"
      dir="rtl"
      data-theme={theme.mode}
      className={cn(theme.mode, "h-full", "antialiased", vazirmatn.variable, geistMono.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        {/*
          accent عمداً در یک تگ style می‌نشیند، نه در استایل inline المان html.

          دلیلش یک باگ واقعی React است: وقتی --accent داخل `style` object باشد،
          React در hydration مقدار property های سفارشی CSS را نرمال سازی می کند
          و رشته ی سرور را با رشته ی کلاینت برابر نمی گیرد، حتی وقتی مقدارشان
          دقیقاً یکسان است. نتیجه خطای "attributes of the server rendered HTML
          didn't match" روی <html> بود. با `style` رشته ای هم React ۱۹ خطا
          می دهد و کل رندر می شکند. متن این تگ در هر دو طرف یک رشته ی یکسان
          است، پس مقایسه ی متن همیشه قبول می شود.

          selector هم دقیقاً :root[data-theme] است تا specificity آن با قاعده ی
          پیش فرض هر دو حالت در globals.css برابر بماند (هر دو 0,2,0). اگر
          :root خالی بود، قاعده ی light با specificity بالاتر برنده می شد و
          رنگ انتخابی کاربر بی سروصدا نادیده گرفته می شد؛ چون این تگ بعد از
          stylesheet اصلی می آید، در برابر تساوی برنده است.
        */}
        <style>{`:root[data-theme]{--accent:${theme.accent}}`}</style>
        {children}
      </body>
    </html>
  );
}
