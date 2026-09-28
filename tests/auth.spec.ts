import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

/**
 * این تست‌ها روی همان دیتابیس واقعی اجرا می‌شوند. برای اینکه رکورد آزمایشی
 * با ایمیل واقعیِ کسی قاطی نشود، همهٔ ایمیل‌ها با پیشوند e2e- ساخته
 * می‌شوند و در afterAll پاک می‌شوند.
 */
const prisma = new PrismaClient();
const uniq = () => Math.random().toString(36).slice(2, 8);
const emailOf = (tag: string) => `e2e-${tag}-${uniq()}@example.test`;

test.beforeAll(async ({ request }) => {
  // اولین درخواستِ واقعاً دیتابیسی به سرور ریموت حدود ۳۰ ثانیه طول می‌کشد.
  // اینجا یک‌بار هزینه‌اش را می‌دهیم تا داخل assertها نباشد. ایمیل با پیشوند
  // e2e- است و در afterAll پاک می‌شود.
  const res = await request.post("/api/auth/register", {
    data: { email: "e2e-warmup@example.test", password: "warmup-pass-123" },
  });
  expect([201, 409]).toContain(res.status());
});

test.afterAll(async () => {
  // با startsWith فقط کاربران تستی همین فایل حذف می‌شوند.
  await prisma.user.deleteMany({ where: { email: { startsWith: "e2e-" } } });
  await prisma.$disconnect();
});

const emailField = (page: Page) => page.getByLabel("ایمیل", { exact: true });
const passwordField = (page: Page) => page.getByLabel("رمز عبور", { exact: true });

async function register(page: Page, email: string, password = "correct-horse-42", name = "") {
  await page.goto("/register");
  if (name) await page.getByLabel("نام نمایشی (اختیاری)").fill(name);
  await emailField(page).fill(email);
  await passwordField(page).fill(password);
  await page.getByRole("button", { name: "ساخت حساب" }).click();
}

test.describe("اعتبارسنجی سمت کلاینت", () => {
  test("ورودی نامعتبر در مرورگر رد می‌شود و اصلاً به سرور نمی‌رود", async ({ page }) => {
    const calls: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/api/auth/register")) calls.push(r.method());
    });

    await page.goto("/register");
    await emailField(page).fill("not-an-email");
    await passwordField(page).fill("short");
    await page.getByRole("button", { name: "ساخت حساب" }).click();

    await expect(page.getByText("ایمیل معتبر نیست")).toBeVisible();
    await expect(page.getByText("رمز عبور باید حداقل ۸ کاراکتر باشد")).toBeVisible();
    // اگر zodResolver کار کند، هیچ درخواستی نباید ثبت شود.
    expect(calls).toEqual([]);
    await expect(page).toHaveURL(/\/register/);
  });

  test("شمارنده بایت زنده به‌روز می‌شود و بایت می‌شمارد نه کاراکتر", async ({ page }) => {
    await page.goto("/register");
    const counter = page.getByText(/از ۷۲ بایت/).first();

    await expect(counter).toHaveText(/^۰ از ۷۲ بایت/);

    await passwordField(page).fill("12345678");
    await expect(counter).toHaveText(/^۸ از ۷۲ بایت/);

    // هر حرف فارسی ۲ بایت UTF-8 است، پس ۱۰ حرف باید ۲۰ بایت شود.
    // اگر کاراکتر می‌شمرد، ۱۰ نشان می‌داد و تست عمداً لو می‌رفت.
    await passwordField(page).fill("ا".repeat(10));
    await expect(counter).toHaveText(/^۲۰ از ۷۲ بایت/);
  });

  test("سقف ۷۲ بایت برای متن فارسی هم اعمال می‌شود", async ({ page }) => {
    const calls: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/api/auth/register")) calls.push(r.method());
    });

    await page.goto("/register");
    await emailField(page).fill("someone@example.test");
    // ۴۰ حرف فارسی = ۸۰ بایت: از نظر «کاراکتر» کوتاه است، از نظر بایت نه.
    await passwordField(page).fill("ا".repeat(40));
    await page.getByRole("button", { name: "ساخت حساب" }).click();

    await expect(page.getByText("رمز عبور نباید بیشتر از ۷۲ بایت باشد")).toBeVisible();
    expect(calls).toEqual([]);
  });

  test("رمز عبور نمایش/پنهان می‌شود", async ({ page }) => {
    await page.goto("/login");
    await expect(passwordField(page)).toHaveAttribute("type", "password");

    await page.getByRole("button", { name: "نمایش رمز عبور" }).click();
    await expect(passwordField(page)).toHaveAttribute("type", "text");

    await page.getByRole("button", { name: "پنهان کردن رمز عبور" }).click();
    await expect(passwordField(page)).toHaveAttribute("type", "password");
  });
});

test.describe("ثبت‌نام و اتصال به بک‌اند", () => {
  test("ثبت‌نام موفق، خودکار وارد می‌کند و به داشبورد می‌رود", async ({ page }) => {
    const email = emailOf("register");
    await register(page, email, "correct-horse-42", "کاربر آزمایشی");

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(email)).toBeVisible();
    // نام نمایشی دو بار روی صفحه هست (در «خوش آمدید» و در فهرست جزئیات)،
    // پس فقط همان ddِ فهرست را می‌سنجیم تا مطمئن شویم نشست آن را حمل می‌کند.
    await expect(page.locator("dd").filter({ hasText: "کاربر آزمایشی" })).toBeVisible();
  });

  test("ایمیل تکراری زیر همان فیلد ایمیل گزارش می‌شود", async ({ page }) => {
    const email = emailOf("dup");
    await register(page, email);
    await expect(page).toHaveURL(/\/dashboard/);

    // بعد از ثبت‌نام کاربر وارد شده است و صفحهٔ /register کاربرِ واردشده را
    // به داشبورد می‌فرستد، پس برای تلاش دوم باید اول خارج شویم.
    await page.getByRole("button", { name: "خروج از حساب" }).click();
    await expect(page).toHaveURL(/\/login/);

    await register(page, email);
    await expect(page.getByText("این ایمیل قبلاً ثبت شده است.")).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
  });

  test("نمایش‌نام خالی یعنی فیلد ارسال نمی‌شود و ثبت‌نام کار می‌کند", async ({ page }) => {
    const email = emailOf("noname");
    await register(page, email);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("ایمیل با بزرگی/کوچکی حروف یکسان دیده می‌شود", async ({ page }) => {
    const local = `E2e-Case-${uniq()}`;
    const mixedCase = `${local}@Example.TEST`;
    const normalized = `${local.toLowerCase()}@example.test`;

    await register(page, mixedCase);
    await expect(page).toHaveURL(/\/dashboard/);
    // سرور ایمیل را کوچک می‌کند و نشست باید همان نسخهٔ normalize‌شده را
    // برگرداند، نه چیزی که کاربر تایپ کرده بود.
    await expect(page.getByText(normalized)).toBeVisible();

    // حالا با حروف کاملاً بزرگ وارد می‌شویم؛ باید همان کاربر باشد.
    await page.getByRole("button", { name: "خروج از حساب" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/login");
    await emailField(page).fill(`${local.toUpperCase()}@EXAMPLE.TEST`);
    await passwordField(page).fill("correct-horse-42");
    await page.getByRole("button", { name: "ورود" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe("ورود و نشست", () => {
  test("رمز غلط پیام عمومی می‌دهد و در صفحهٔ ورود می‌مانیم", async ({ page }) => {
    await page.goto("/login");
    await emailField(page).fill("definitely-not-a-user@example.test");
    await passwordField(page).fill("whatever-1234");
    await page.getByRole("button", { name: "ورود" }).click();

    // getByRole("alert") تنها با alert داخل فرم محدود می‌شود، چون
    // __next-route-announcer__ خود Next.js هم role="alert" دارد.
    await expect(page.locator("form").getByRole("alert")).toHaveText(
      "ایمیل یا رمز عبور درست نیست.",
    );
    await expect(page).toHaveURL(/\/login/);
  });

  test("ورود موفق و سپس خروج، نشست را واقعاً از بین می‌برد", async ({ page }) => {
    const email = emailOf("flow");
    await register(page, email);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole("button", { name: "خروج از حساب" }).click();
    await expect(page).toHaveURL(/\/login/);

    // اگر کوکی هنوز معتبر بود، این بار به داشبورد می‌رسیدیم.
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("داشبورد بدون نشست در دسترس نیست", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("کاربر واردشده از صفحهٔ ورود و ثبت‌نام دور رانده می‌شود", async ({ page }) => {
    const email = emailOf("guard");
    await register(page, email);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto("/register");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("callbackUrl نتواند کاربر را به دامنهٔ دیگری ببرد", async ({ page }) => {
    const email = emailOf("openredirect");
    await register(page, email);
    await expect(page).toHaveURL(/\/dashboard/);

    // نشست را پاک می‌کنیم ولی همان صفحهٔ ورود را با URL مخرب باز می‌کنیم.
    await page.getByRole("button", { name: "خروج از حساب" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/login?callbackUrl=//evil.example.com");
    await emailField(page).fill(email);
    await passwordField(page).fill("correct-horse-42");
    await page.getByRole("button", { name: "ورود" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    expect(page.url()).not.toContain("evil.example.com");
  });
});
