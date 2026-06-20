import { Router, type IRouter } from "express";
import { eq, asc, desc, inArray } from "drizzle-orm";
import {
  db,
  journeysTable,
  phasesTable,
  tasksTable,
  checkInsTable,
} from "@workspace/db";
import { ListCheckInsParams, CreateCheckInBody, CreateCheckInParams } from "@workspace/api-zod";
import { generateCheckInFeedback } from "../lib/aiPlanner";

const router: IRouter = Router();

router.get("/journeys/:id/checkins", async (req, res): Promise<void> => {
  const params = ListCheckInsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db
    .select()
    .from(checkInsTable)
    .where(eq(checkInsTable.journeyId, params.data.id))
    .orderBy(desc(checkInsTable.createdAt));
  res.json(
    rows.map((r) => ({
      id: r.id,
      journeyId: r.journeyId,
      accomplished: r.accomplished,
      rating: r.rating,
      blockers: r.blockers,
      aiFeedback: r.aiFeedback,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

router.post("/journeys/:id/checkins", async (req, res): Promise<void> => {
  const params = CreateCheckInParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = CreateCheckInBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [journey] = await db
    .select()
    .from(journeysTable)
    .where(eq(journeysTable.id, params.data.id));
  if (!journey) {
    res.status(404).json({ error: "Journey not found" });
    return;
  }

  const phases = await db
    .select()
    .from(phasesTable)
    .where(eq(phasesTable.journeyId, journey.id))
    .orderBy(asc(phasesTable.orderIndex));
  const phaseIds = phases.map((p) => p.id);
  const tasks = phaseIds.length
    ? await db.select().from(tasksTable).where(inArray(tasksTable.phaseId, phaseIds))
    : [];

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const progressPercent =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  let aiFeedback = "";
  try {
    aiFeedback = await generateCheckInFeedback({
      journeyTitle: journey.title,
      journeySummary: journey.summary,
      progressPercent,
      accomplished: body.data.accomplished,
      rating: body.data.rating,
      blockers: body.data.blockers ?? "",
      upcomingTasks: tasks
        .filter((t) => !t.isCompleted)
        .slice(0, 5)
        .map((t) => t.title),
    });
  } catch (err) {
    req.log.error({ err }, "Check-in AI feedback failed");
    aiFeedback = "Your progress has been recorded. Keep pushing forward.";
  }

  const [row] = await db
    .insert(checkInsTable)
    .values({
      journeyId: journey.id,
      accomplished: body.data.accomplished,
      rating: body.data.rating,
      blockers: body.data.blockers ?? "",
      aiFeedback,
    })
    .returning();

  if (!row) {
    res.status(500).json({ error: "Failed to save check-in" });
    return;
  }

  res.status(201).json({
    id: row.id,
    journeyId: row.journeyId,
    accomplished: row.accomplished,
    rating: row.rating,
    blockers: row.blockers,
    aiFeedback: row.aiFeedback,
    createdAt: row.createdAt.toISOString(),
  });
});

export default router;
