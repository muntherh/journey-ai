import { Router, type IRouter } from "express";
import { eq, desc, inArray } from "drizzle-orm";
import {
  db,
  journeysTable,
  phasesTable,
  tasksTable,
  coachMessagesTable,
} from "@workspace/db";
import {
  CreateJourneyBody,
  UpdateJourneyBody,
  GetJourneyParams,
  UpdateJourneyParams,
  DeleteJourneyParams,
  GetJourneySummaryParams,
  GetJourneyActivityParams,
} from "@workspace/api-zod";
import { generatePlan } from "../lib/aiPlanner";
import { serializeJourney } from "../lib/serializers";

const router: IRouter = Router();

async function loadJourneyBundle(journeyId: string) {
  const [j] = await db
    .select()
    .from(journeysTable)
    .where(eq(journeysTable.id, journeyId));
  if (!j) return null;
  const phases = await db
    .select()
    .from(phasesTable)
    .where(eq(phasesTable.journeyId, journeyId));
  const phaseIds = phases.map((p) => p.id);
  const tasks =
    phaseIds.length > 0
      ? await db.select().from(tasksTable).where(inArray(tasksTable.phaseId, phaseIds))
      : [];
  return { journey: j, phases, tasks };
}

router.get("/journeys", async (_req, res): Promise<void> => {
  const journeys = await db
    .select()
    .from(journeysTable)
    .orderBy(desc(journeysTable.createdAt));

  const journeyIds = journeys.map((j) => j.id);
  const phases = journeyIds.length
    ? await db.select().from(phasesTable).where(inArray(phasesTable.journeyId, journeyIds))
    : [];
  const phaseIds = phases.map((p) => p.id);
  const tasks = phaseIds.length
    ? await db.select().from(tasksTable).where(inArray(tasksTable.phaseId, phaseIds))
    : [];

  const result = journeys.map((j) => {
    const jPhaseIds = phases.filter((p) => p.journeyId === j.id).map((p) => p.id);
    const jTasks = tasks.filter((t) => jPhaseIds.includes(t.phaseId));
    const total = jTasks.length;
    const done = jTasks.filter((t) => t.isCompleted).length;
    const next =
      jTasks
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .find((t) => !t.isCompleted) ?? null;
    return {
      id: j.id,
      title: j.title,
      summary: j.summary,
      status: j.status,
      createdAt: j.createdAt.toISOString(),
      totalTasks: total,
      completedTasks: done,
      progressPercent: total === 0 ? 0 : Math.round((done / total) * 100),
      nextTaskTitle: next ? next.title : null,
    };
  });

  res.json(result);
});

router.post("/journeys", async (req, res): Promise<void> => {
  const parsed = CreateJourneyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let plan;
  try {
    plan = await generatePlan({
      goalText: parsed.data.goalText,
      timeline: parsed.data.timeline ?? null,
      experienceLevel: parsed.data.experienceLevel ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Plan generation failed");
    res.status(502).json({ error: "Failed to generate plan" });
    return;
  }

  const [journey] = await db
    .insert(journeysTable)
    .values({
      goalText: parsed.data.goalText,
      title: plan.title,
      summary: plan.summary,
      status: "active",
    })
    .returning();

  if (!journey) {
    res.status(500).json({ error: "Failed to create journey" });
    return;
  }

  const phaseRows = await db
    .insert(phasesTable)
    .values(
      plan.phases.map((p, i) => ({
        journeyId: journey.id,
        orderIndex: i,
        title: p.title,
        description: p.description,
        estimatedDuration: p.estimatedDuration,
      })),
    )
    .returning();

  const allTaskValues: Array<{
    phaseId: string;
    orderIndex: number;
    title: string;
    description: string;
  }> = [];
  phaseRows.forEach((row, idx) => {
    const planPhase = plan.phases[idx];
    if (!planPhase) return;
    planPhase.tasks.forEach((t, ti) => {
      allTaskValues.push({
        phaseId: row.id,
        orderIndex: ti,
        title: t.title,
        description: t.description,
      });
    });
  });

  const taskRows = allTaskValues.length
    ? await db.insert(tasksTable).values(allTaskValues).returning()
    : [];

  res.status(201).json(serializeJourney(journey, phaseRows, taskRows));
});

router.get("/journeys/:id", async (req, res): Promise<void> => {
  const params = GetJourneyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const bundle = await loadJourneyBundle(params.data.id);
  if (!bundle) {
    res.status(404).json({ error: "Journey not found" });
    return;
  }
  res.json(serializeJourney(bundle.journey, bundle.phases, bundle.tasks));
});

router.patch("/journeys/:id", async (req, res): Promise<void> => {
  const params = UpdateJourneyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateJourneyBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const updates: Record<string, unknown> = {};
  if (body.data.title !== undefined) updates["title"] = body.data.title;
  if (body.data.status !== undefined) updates["status"] = body.data.status;
  if (Object.keys(updates).length === 0) {
    const bundle = await loadJourneyBundle(params.data.id);
    if (!bundle) {
      res.status(404).json({ error: "Journey not found" });
      return;
    }
    res.json(serializeJourney(bundle.journey, bundle.phases, bundle.tasks));
    return;
  }
  const [updated] = await db
    .update(journeysTable)
    .set(updates)
    .where(eq(journeysTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Journey not found" });
    return;
  }
  const bundle = await loadJourneyBundle(updated.id);
  if (!bundle) {
    res.status(404).json({ error: "Journey not found" });
    return;
  }
  res.json(serializeJourney(bundle.journey, bundle.phases, bundle.tasks));
});

router.delete("/journeys/:id", async (req, res): Promise<void> => {
  const params = DeleteJourneyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(journeysTable)
    .where(eq(journeysTable.id, params.data.id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Journey not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/journeys/:id/summary", async (req, res): Promise<void> => {
  const params = GetJourneySummaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const bundle = await loadJourneyBundle(params.data.id);
  if (!bundle) {
    res.status(404).json({ error: "Journey not found" });
    return;
  }
  const phasesSorted = bundle.phases.slice().sort((a, b) => a.orderIndex - b.orderIndex);
  const phaseBreakdown = phasesSorted.map((p) => {
    const phaseTasks = bundle.tasks.filter((t) => t.phaseId === p.id);
    const total = phaseTasks.length;
    const done = phaseTasks.filter((t) => t.isCompleted).length;
    return {
      phaseId: p.id,
      title: p.title,
      totalTasks: total,
      completedTasks: done,
      progressPercent: total === 0 ? 0 : Math.round((done / total) * 100),
    };
  });
  const totalTasks = bundle.tasks.length;
  const completedTasks = bundle.tasks.filter((t) => t.isCompleted).length;
  const currentPhase = phaseBreakdown.find((p) => p.progressPercent < 100) ?? null;
  res.json({
    journeyId: bundle.journey.id,
    totalTasks,
    completedTasks,
    progressPercent: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
    currentPhaseId: currentPhase ? currentPhase.phaseId : null,
    currentPhaseTitle: currentPhase ? currentPhase.title : null,
    phaseBreakdown,
  });
});

router.get("/journeys/:id/activity", async (req, res): Promise<void> => {
  const params = GetJourneyActivityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const bundle = await loadJourneyBundle(params.data.id);
  if (!bundle) {
    res.status(404).json({ error: "Journey not found" });
    return;
  }
  const events: Array<{
    id: string;
    type: "task_completed" | "task_added" | "coach_reply";
    title: string;
    timestamp: string;
  }> = [];
  for (const t of bundle.tasks) {
    if (t.isCompleted && t.completedAt) {
      events.push({
        id: `task-done-${t.id}`,
        type: "task_completed",
        title: `Completed: ${t.title}`,
        timestamp: t.completedAt.toISOString(),
      });
    }
    events.push({
      id: `task-add-${t.id}`,
      type: "task_added",
      title: `Added: ${t.title}`,
      timestamp: t.createdAt.toISOString(),
    });
  }
  const recentCoach = await db
    .select()
    .from(coachMessagesTable)
    .where(eq(coachMessagesTable.journeyId, params.data.id))
    .orderBy(desc(coachMessagesTable.createdAt))
    .limit(10);
  for (const m of recentCoach) {
    if (m.role === "coach") {
      events.push({
        id: `coach-${m.id}`,
        type: "coach_reply",
        title: m.content.slice(0, 80),
        timestamp: m.createdAt.toISOString(),
      });
    }
  }
  events.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  res.json(events.slice(0, 20));
});

export default router;
