import type {
  Journey as JourneyRow,
  Phase as PhaseRow,
  Task as TaskRow,
  CoachMessageRow,
} from "@workspace/db";

export function serializeTask(t: TaskRow) {
  return {
    id: t.id,
    phaseId: t.phaseId,
    orderIndex: t.orderIndex,
    title: t.title,
    description: t.description,
    isCompleted: t.isCompleted,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
  };
}

export function serializePhase(p: PhaseRow, tasks: TaskRow[]) {
  return {
    id: p.id,
    journeyId: p.journeyId,
    orderIndex: p.orderIndex,
    title: p.title,
    description: p.description,
    estimatedDuration: p.estimatedDuration,
    tasks: tasks
      .filter((t) => t.phaseId === p.id)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(serializeTask),
  };
}

export function serializeJourney(
  j: JourneyRow,
  phases: PhaseRow[],
  tasks: TaskRow[],
) {
  return {
    id: j.id,
    goalText: j.goalText,
    title: j.title,
    summary: j.summary,
    status: j.status,
    createdAt: j.createdAt.toISOString(),
    updatedAt: j.updatedAt.toISOString(),
    phases: phases
      .filter((p) => p.journeyId === j.id)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((p) => serializePhase(p, tasks)),
  };
}

export function serializeCoachMessage(m: CoachMessageRow) {
  return {
    id: m.id,
    journeyId: m.journeyId,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  };
}
