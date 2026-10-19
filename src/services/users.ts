import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { OnboardingAnswer } from "@/lib/personas";

/**
 * دسترسی به دادهٔ کاربر. همهٔ کوئری‌های User اینجا جمع شده‌اند تا صفحات و
 * اکشن‌ها مستقیم به Prisma وابسته نباشند.
 */

/** برای ورود: فقط فیلدهایی که authorize لازم دارد. */
export function findUserForLogin(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      displayName: true,
      passwordHash: true,
    },
  });
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, displayName: true, personaId: true },
  });
}

export function findUserIdentityByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, personaId: true },
  });
}

export function findUserPersonaByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { personaId: true },
  });
}

export function findUserThemeByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { themeAccent: true, themeMode: true },
  });
}

/** کاربر جاری صفحه‌های داخل اپ؛ دقیقاً همان فیلدهای CurrentUser. */
export function findSessionUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      displayName: true,
      timezone: true,
      personaId: true,
      onboardingAnswers: true,
      themeAccent: true,
      themeMode: true,
    },
  });
}

export function findUserPersonaId(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { personaId: true },
  });
}

export function findOnboardingAnswers(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { onboardingAnswers: true },
  });
}

export function updateOnboardingAnswers(
  userId: string,
  answers: OnboardingAnswer[],
) {
  return prisma.user.update({
    where: { id: userId },
    data: { onboardingAnswers: answers as Prisma.InputJsonValue },
  });
}

/** null یعنی پاک‌کردن پاسخ‌ها؛ Prisma.DbNull برای ستون JSON لازم است. */
export function resetOnboarding(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { onboardingAnswers: Prisma.DbNull, personaId: null },
  });
}

export function setUserPersona(userId: string, personaId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { personaId },
  });
}

export function setUserTheme(
  userId: string,
  accent: string,
  mode: string,
) {
  return prisma.user.update({
    where: { id: userId },
    data: { themeAccent: accent, themeMode: mode },
  });
}

export async function emailExists(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  return Boolean(user);
}

export function createUserWithPassword(input: {
  email: string;
  displayName: string;
  passwordHash: string;
}) {
  return prisma.user.create({
    data: input,
    select: { id: true },
  });
}

export function markBehaviorLogConsent(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { consentBehaviorLog: new Date() },
  });
}
