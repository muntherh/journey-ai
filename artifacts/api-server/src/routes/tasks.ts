import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, tasksTable, phasesTable } from "@workspace/db";
import {
  CreateTaskBody,
  CreateTaskParams,
  UpdateTaskBody,
  UpdateTaskParams,
} from "@workspace/api-zod";
import { serializeTask } from "../lib/serializers";

const router: IRouter = Router();

router.patch("/tasks/:id", async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateTaskBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const updates: Record<string, unknown> = {};
  if (body.data.title !== undefined) updates["title"] = body.data.title;
  if (body.data.description !== undefined)
    updates["description"] = body.data.description;
  if (body.data.isCompleted !== undefined) {
    updates["isCompleted"] = body.data.isCompleted;
    updates["completedAt"] = body.data.isCompleted ? new Date() : null;
  }
  if (Object.keys(updates).length === 0) {
    const [t] = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.id, params.data.id));
    if (!t) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json(serializeTask(t));
    return;
  }
  const [updated] = await db
    .update(tasksTable)
    .set(updates)
    .where(eq(tasksTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(serializeTask(updated));
});

router.post("/phases/:id/tasks", async (req, res): Promise<void> => {
  const params = CreateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = CreateTaskBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [phase] = await db
    .select()
    .from(phasesTable)
    .where(eq(phasesTable.id, params.data.id));
  if (!phase) {
    res.status(404).json({ error: "Phase not found" });
    return;
  }
  const [last] = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.phaseId, params.data.id))
    .orderBy(desc(tasksTable.orderIndex))
    .limit(1);
  const nextIndex = last ? last.orderIndex + 1 : 0;
  const [created] = await db
    .insert(tasksTable)
    .values({
      phaseId: params.data.id,
      orderIndex: nextIndex,
      title: body.data.title,
      description: body.data.description ?? "",
    })
    .returning();
  if (!created) {
    res.status(500).json({ error: "Failed to create task" });
    return;
  }
  res.status(201).json(serializeTask(created));
});

export default router;
