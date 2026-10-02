-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "horizon" TEXT NOT NULL DEFAULT 'weekly',
ADD COLUMN     "targetEndDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "GoalLog" ADD COLUMN     "taskId" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "goalId" TEXT;

-- CreateIndex
CREATE INDEX "GoalLog_taskId_idx" ON "GoalLog"("taskId");

-- CreateIndex
CREATE INDEX "Task_goalId_idx" ON "Task"("goalId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
