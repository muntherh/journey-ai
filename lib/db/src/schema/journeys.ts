import { pgTable, text, timestamp, integer, boolean, uuid } from "drizzle-orm/pg-core";

export const journeysTable = pgTable("journeys", {
  id: uuid("id").primaryKey().defaultRandom(),
  goalText: text("goal_text").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const phasesTable = pgTable("phases", {
  id: uuid("id").primaryKey().defaultRandom(),
  journeyId: uuid("journey_id")
    .notNull()
    .references(() => journeysTable.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  estimatedDuration: text("estimated_duration").notNull().default(""),
});

export const tasksTable = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  phaseId: uuid("phase_id")
    .notNull()
    .references(() => phasesTable.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  isCompleted: boolean("is_completed").notNull().default(false),
  status: text("status").notNull().default("not_started"),
  userResource: text("user_resource"),
  note: text("note").notNull().default(""),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const coachMessagesTable = pgTable("coach_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  journeyId: uuid("journey_id")
    .notNull()
    .references(() => journeysTable.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Journey = typeof journeysTable.$inferSelect;
export type Phase = typeof phasesTable.$inferSelect;
export type Task = typeof tasksTable.$inferSelect;
export type CoachMessageRow = typeof coachMessagesTable.$inferSelect;
