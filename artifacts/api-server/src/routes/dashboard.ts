import { Router, type IRouter } from "express";
import { db, journeysTable, tasksTable, phasesTable } from "@workspace/db";
import { inArray } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/overview", async (_req, res): Promise<void> => {
  const journeys = await db.select().from(journeysTable);
  const journeyIds = journeys.map((j) => j.id);
  const phases = journeyIds.length
    ? await db.select().from(phasesTable).where(inArray(phasesTable.journeyId, journeyIds))
    : [];
  const phaseIds = phases.map((p) => p.id);
  const tasks = phaseIds.length
    ? await db.select().from(tasksTable).where(inArray(tasksTable.phaseId, phaseIds))
    : [];

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const totalJourneys = journeys.length;
  const activeJourneys = journeys.filter((j) => j.status === "active").length;
  const completedJourneys = journeys.filter((j) => j.status === "completed").length;

  // Compute current streak (consecutive days with at least one completed task, ending today or yesterday)
  const completionDays = new Set<string>();
  for (const t of tasks) {
    if (t.isCompleted && t.completedAt) {
      completionDays.add(t.completedAt.toISOString().slice(0, 10));
    }
  }
  let streak = 0;
  const today = new Date();
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!completionDays.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (completionDays.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  res.json({
    totalJourneys,
    activeJourneys,
    completedJourneys,
    totalTasks,
    completedTasks,
    currentStreak: streak,
  });
});

export default router;
