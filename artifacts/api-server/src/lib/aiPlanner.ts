import { openai } from "@workspace/integrations-openai-ai-server";

export interface GeneratedTask {
  title: string;
  description: string;
}

export interface GeneratedPhase {
  title: string;
  description: string;
  estimatedDuration: string;
  tasks: GeneratedTask[];
}

export interface GeneratedPlan {
  title: string;
  summary: string;
  phases: GeneratedPhase[];
}

const PLAN_SYSTEM_PROMPT = `You are Journey AI, a senior project manager and life coach.
A user gives you a goal. You return a structured execution plan as STRICT JSON.

Rules:
- 3 to 6 phases, ordered logically.
- Each phase has 4 to 8 concrete, actionable tasks.
- Tasks must be specific and verb-led ("Set up X", "Run 3 mile pace test", "Draft outline of chapter 1").
- Each task description is ONE short sentence (no fluff).
- estimatedDuration is short like "1 week", "2-3 weeks", "1 month".
- title is a punchy 3-7 word name for the journey.
- summary is one motivating sentence (max 200 chars).
- Output JSON only, matching this exact shape:

{
  "title": string,
  "summary": string,
  "phases": [
    {
      "title": string,
      "description": string,
      "estimatedDuration": string,
      "tasks": [ { "title": string, "description": string } ]
    }
  ]
}`;

function clampLen(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function validatePlan(raw: unknown): GeneratedPlan {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Plan is not an object");
  }
  const p = raw as Record<string, unknown>;
  if (typeof p["title"] !== "string" || typeof p["summary"] !== "string") {
    throw new Error("Plan missing title/summary");
  }
  if (!Array.isArray(p["phases"]) || p["phases"].length === 0) {
    throw new Error("Plan has no phases");
  }
  const phases: GeneratedPhase[] = p["phases"].map((ph, i) => {
    if (typeof ph !== "object" || ph === null) {
      throw new Error(`Phase ${i} not an object`);
    }
    const phObj = ph as Record<string, unknown>;
    const tasks = Array.isArray(phObj["tasks"]) ? phObj["tasks"] : [];
    return {
      title: clampLen(String(phObj["title"] ?? `Phase ${i + 1}`), 120),
      description: clampLen(String(phObj["description"] ?? ""), 600),
      estimatedDuration: clampLen(String(phObj["estimatedDuration"] ?? ""), 60),
      tasks: tasks
        .map((t) => {
          if (typeof t !== "object" || t === null) return null;
          const tObj = t as Record<string, unknown>;
          const title = String(tObj["title"] ?? "").trim();
          if (!title) return null;
          return {
            title: clampLen(title, 200),
            description: clampLen(String(tObj["description"] ?? ""), 600),
          };
        })
        .filter((x): x is GeneratedTask => x !== null),
    };
  });
  return {
    title: clampLen(p["title"] as string, 120),
    summary: clampLen(p["summary"] as string, 280),
    phases,
  };
}

export async function generatePlan(args: {
  goalText: string;
  timeline?: string | null;
  experienceLevel?: string | null;
}): Promise<GeneratedPlan> {
  const userPrompt = [
    `Goal: ${args.goalText}`,
    args.timeline ? `Desired timeline: ${args.timeline}` : null,
    args.experienceLevel ? `Experience level: ${args.experienceLevel}` : null,
    "Return JSON only.",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 4096,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: PLAN_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");
  const parsed = JSON.parse(content);
  return validatePlan(parsed);
}

const COACH_SYSTEM_PROMPT = `You are Journey AI's coach — supportive, sharp, concise.
You help the user push their plan forward. You never use emojis.
Keep replies under 150 words. Be specific to the user's plan and their progress.
If the user is stuck, suggest the single next concrete action.
If they completed something, acknowledge briefly and point to what's next.`;

export interface CoachContext {
  journeyTitle: string;
  journeySummary: string;
  progressPercent: number;
  currentPhaseTitle: string | null;
  recentlyCompleted: string[];
  upcomingTasks: string[];
  history: Array<{ role: "user" | "coach"; content: string }>;
  userMessage: string;
}

const CHECKIN_SYSTEM_PROMPT = `You are Journey AI's weekly coach. A user just submitted their weekly check-in.
Be direct, warm, and insightful — like a good mentor, not a chatbot.
Max 200 words. No emojis. Structure your response in 2-3 short paragraphs:
1. Acknowledge what they did (specific, not generic)
2. Address blockers or give encouragement based on their rating
3. One concrete suggestion for next week`;

export async function generateCheckInFeedback(args: {
  journeyTitle: string;
  journeySummary: string;
  progressPercent: number;
  accomplished: string;
  rating: number;
  blockers: string;
  upcomingTasks: string[];
}): Promise<string> {
  const ratingLabel = ["", "behind", "some progress", "solid", "productive", "exceptional"][args.rating] ?? "";
  const userBlock = [
    `Journey: ${args.journeyTitle}`,
    `Overall progress: ${args.progressPercent}%`,
    `This week (rated ${args.rating}/5 — ${ratingLabel}):`,
    `Accomplished: ${args.accomplished}`,
    args.blockers ? `Blockers: ${args.blockers}` : null,
    args.upcomingTasks.length
      ? `Upcoming tasks: ${args.upcomingTasks.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 500,
    messages: [
      { role: "system", content: CHECKIN_SYSTEM_PROMPT },
      { role: "user", content: userBlock },
    ],
  });
  const content = response.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty check-in response");
  return content;
}

export async function generateCoachReply(ctx: CoachContext): Promise<string> {
  const stateBlock = [
    `Journey: ${ctx.journeyTitle}`,
    `Summary: ${ctx.journeySummary}`,
    `Progress: ${ctx.progressPercent}%`,
    ctx.currentPhaseTitle ? `Current phase: ${ctx.currentPhaseTitle}` : null,
    ctx.recentlyCompleted.length
      ? `Recently completed:\n- ${ctx.recentlyCompleted.join("\n- ")}`
      : null,
    ctx.upcomingTasks.length
      ? `Next up:\n- ${ctx.upcomingTasks.join("\n- ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [
    { role: "system", content: COACH_SYSTEM_PROMPT },
    { role: "system", content: `Plan state:\n${stateBlock}` },
  ];
  for (const m of ctx.history.slice(-10)) {
    messages.push({
      role: m.role === "coach" ? "assistant" : "user",
      content: m.content,
    });
  }
  messages.push({ role: "user", content: ctx.userMessage });

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 600,
    messages,
  });
  const content = response.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty coach response");
  return content;
}
