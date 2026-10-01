import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { loginSchema, normalizeEmail } from "@/lib/validation";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

// رابط JWT در ماژول @auth/core/jwt تعریف شده و next-auth/jwt فقط آن را
// دوباره export می‌کند؛ پس باید همان ماژول اصلی را augment کنیم.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: THIRTY_DAYS },
  // چون روی دامنه‌ی vercel.app میزبانی نمی‌شود، Auth.js نمی‌تواند
  // هدرهای Host را معتبر بداند. (در محیط واقعی بهتر است از AUTH_TRUST_HOST
  // در متغیرهای محیطی استفاده شود، نه مقدار ثابت اینجا.)
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
      select: {
        id: true,
        email: true,
        displayName: true,
        passwordHash: true,
      },
    });

    // اگر کاربر فقط با گوگل آمده باشد، passwordHash خالی است و compare
    // بی‌معنی می‌شود؛ در این حالت همان مسیر تأخیر مصنوعی را می‌رود.

        // همیشه compare اجرا می‌شود (حتی وقتی کاربر نیست) تا زمان پاسخ
        // اطلاعاتی دربارهٔ وجودِ ایمیل لو ندهد.
        const valid = await verifyPassword(password, user?.passwordHash);
        if (!user || !valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
        };
      },
    }),
  ],
  callbacks: {
    // در اولین ورود، id را از کاربر برمی‌داریم و در توکن می‌گذاریم.
    // در درخواست‌های بعدی user وجود ندارد و توکن از کوکی خوانده می‌شود.
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      return session;
    },
  },
});
