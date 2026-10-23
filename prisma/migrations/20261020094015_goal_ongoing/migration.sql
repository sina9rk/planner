/*
  Warnings:

  - You are about to drop the column `active` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `horizon` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `targetEndDate` on the `Goal` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Goal_userId_active_idx";

-- AlterTable
ALTER TABLE "Goal" DROP COLUMN "active",
DROP COLUMN "horizon",
DROP COLUMN "targetEndDate",
ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "GoalLog" ALTER COLUMN "durationMinutes" SET DEFAULT 0;

-- CreateIndex
CREATE INDEX "Goal_userId_archivedAt_idx" ON "Goal"("userId", "archivedAt");
