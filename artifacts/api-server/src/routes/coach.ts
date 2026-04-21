import { Router, type IRouter } from "express";
import { eq, asc, desc, inArray } from "drizzle-orm";
import {
  db,
  journeysTable,
  phasesTable,
  tasksTable,
  coachMessagesTable,
} from "@workspace/db";
import {
  ListCoachMessagesParams,
  SendCoachMessageBody,
  SendCoachMessageParams,
} from "@workspace/api-zod";
import { generateCoachReply } from "../lib/aiPlanner";
import { serializeCoachMessage } from "../lib/serializers";

const router: IRouter = Router();

router.get("/journeys/:id/coach/messages", async (req, res): Promise<void> => {
  const params = ListCoachMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const messages = await db
    .select()
    .from(coachMessagesTable)
    .where(eq(coachMessagesTable.journeyId, params.data.id))
    .orderBy(asc(coachMessagesTable.createdAt));
  res.json(messages.map(serializeCoachMessage));
});

router.post("/journeys/:id/coach/messages", async (req, res): Promise<void> => {
  const params = SendCoachMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = SendCoachMessageBody.safeParse(req.body);
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

  const total = tasks.length;
  const done = tasks.filter((t) => t.isCompleted).length;
  const progressPercent = total === 0 ? 0 : Math.round((done / total) * 100);

  let currentPhaseTitle: string | null = null;
  for (const p of phases) {
    const phaseTasks = tasks.filter((t) => t.phaseId === p.id);
    const allDone = phaseTasks.length > 0 && phaseTasks.every((t) => t.isCompleted);
    if (!allDone) {
      currentPhaseTitle = p.title;
      break;
    }
  }

  const recentlyCompleted = tasks
    .filter((t) => t.isCompleted && t.completedAt)
    .sort((a, b) => (a.completedAt! < b.completedAt! ? 1 : -1))
    .slice(0, 5)
    .map((t) => t.title);
  const upcomingTasks = tasks
    .filter((t) => !t.isCompleted)
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .slice(0, 5)
    .map((t) => t.title);

  const history = await db
    .select()
    .from(coachMessagesTable)
    .where(eq(coachMessagesTable.journeyId, journey.id))
    .orderBy(desc(coachMessagesTable.createdAt))
    .limit(10);

  let coachReply: string;
  try {
    coachReply = await generateCoachReply({
      journeyTitle: journey.title,
      journeySummary: journey.summary,
      progressPercent,
      currentPhaseTitle,
      recentlyCompleted,
      upcomingTasks,
      history: history
        .reverse()
        .map((m) => ({ role: m.role as "user" | "coach", content: m.content })),
      userMessage: body.data.content,
    });
  } catch (err) {
    req.log.error({ err }, "Coach reply failed");
    res.status(502).json({ error: "Coach unavailable" });
    return;
  }

  const inserted = await db
    .insert(coachMessagesTable)
    .values([
      { journeyId: journey.id, role: "user", content: body.data.content },
      { journeyId: journey.id, role: "coach", content: coachReply },
    ])
    .returning();

  const userMsg = inserted.find((m) => m.role === "user")!;
  const coachMsg = inserted.find((m) => m.role === "coach")!;
  res.json({
    userMessage: serializeCoachMessage(userMsg),
    coachMessage: serializeCoachMessage(coachMsg),
  });
});

export default router;
