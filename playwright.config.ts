import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

// تست‌ها برای پاک‌کردن کاربران ساخته‌شده به DATABASE_URL نیاز دارند، و
// پروسهٔ خود Playwright فایل .env را نمی‌خواند.
loadEnvConfig(process.cwd());

// پورتی جدا از ۳۰۰۰ تا با dev server در حال اجرای شما تداخل نکند.
const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  // تست‌ها روی دیتابیس واقعی رکورد می‌سازند، پس موازی اجرا نشوند.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",

  use: {
    baseURL,
    locale: "fa-IR",
    timezoneId: "Asia/Tehran",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // دیتابیس ریموت در اولین اتصال بعد از بیکاری حدود ۳۰ ثانیه طول می‌کشد
    // (TLS + راه‌اندازی اتصال). پیش‌فرض ۵ ثانیه برای انتظارها کافی نیست و
    // تست را flake می‌کند؛ هزینهٔ این تأخیر یک‌بار در beforeAll پرداخت می‌شود.
    actionTimeout: 30_000,
    navigationTimeout: 90_000,
  },

  expect: {
    timeout: 30_000,
  },

  projects: [
    {
      name: "chrome",
      use: {
        ...devices["Desktop Chrome"],
        // دانلود مرورگر از cdn.playwright.dev با خطای ۴۰۳ مسدود است،
        // پس به‌جای آن از Chrome نصب‌شدهٔ سیستم استفاده می‌کنیم.
        channel: "chrome",
      },
    },
  ],

  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
