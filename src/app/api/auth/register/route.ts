import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { normalizeEmail, registerSchema } from "@/lib/validation";

const DEFAULT_TIMEZONE = "Asia/Tehran";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { email, password, displayName, timezone } = parsed.data;
  const normalizedEmail = normalizeEmail(email);

  // authId در طراحی اولیه برای شناسهٔ Supabase بود. چون احراز هویت
  // خودمدیریت است، همان id داخلی خودمان را در آن می‌گذاریم تا قید
  // NOT NULL/UNIQUE حفظ شود. اگر بعداً Supabase اضافه شد، این فیلد
  // همان‌جایی است که باید پر شود.
  const userId = randomUUID();

  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: {
        id: userId,
        authId: userId,
        email: normalizedEmail,
        passwordHash,
        displayName: displayName ?? null,
        timezone: timezone ?? DEFAULT_TIMEZONE,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        timezone: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    // دو درخواست هم‌زمان با یک ایمیل: یکی درج می‌شود، دیگری P2002 می‌گیرد.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }
    throw error;
  }
}
