import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * تنها نوشتن روی جدول Event. این جدول append-only است و هیچ update/delete
 * برایش تعریف نمی‌شود.
 */
export function createEvent(input: {
  userId: string;
  eventType: string;
  taskId?: string | null;
  goalId?: string | null;
  metadata?: Prisma.InputJsonObject;
}) {
  return prisma.event.create({
    data: {
      userId: input.userId,
      eventType: input.eventType,
      taskId: input.taskId ?? null,
      goalId: input.goalId ?? null,
      metadata: input.metadata,
    },
  });
}
