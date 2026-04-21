# Journey AI

A web app that turns a user's goal into a structured, AI-generated execution plan with phases, tasks, progress tracking, and an AI coach.

## Stack

- **Frontend**: React + Vite + Tailwind + shadcn/ui + framer-motion + wouter, in `artifacts/journey-ai`
- **Backend**: Express + Drizzle ORM, in `artifacts/api-server`
- **Database**: Replit PostgreSQL (via `DATABASE_URL`)
- **AI**: Replit OpenAI integration (`@workspace/integrations-openai-ai-server`), model `gpt-5.2`
- **API contract**: OpenAPI spec at `lib/api-spec/openapi.yaml`, codegen produces `lib/api-zod` (server validation) and `lib/api-client-react` (client hooks)

## Data model

Tables defined in `lib/db/src/schema/journeys.ts`:
- `journeys` — top-level goal record
- `phases` — ordered phases per journey (cascade delete)
- `tasks` — ordered tasks per phase, with completion state (cascade delete)
- `coach_messages` — chat history per journey

## Backend routes (mounted at `/api`)

- `GET /journeys`, `POST /journeys`, `GET/PATCH/DELETE /journeys/:id`
- `GET /journeys/:id/summary`, `GET /journeys/:id/activity`
- `PATCH /tasks/:id`, `POST /phases/:id/tasks`
- `GET/POST /journeys/:id/coach/messages`
- `GET /dashboard/overview`

`POST /journeys` calls the AI planner to generate phases/tasks in one shot. The coach endpoint includes plan state (progress %, current phase, recent completions, upcoming tasks) plus the last 10 messages of history.

## Frontend pages

- `/` — submit a goal, generate plan
- `/dashboard` — all journeys, streak, totals
- `/journey/:id` — phase accordion with task checkboxes, activity feed, AI coach chat drawer

## Conventions

- API spec `info.title` must stay as `Api`.
- `lib/api-zod/src/index.ts` re-exports types with explicit `export type` to avoid duplicate Zod schema name conflicts.
- Use the AI integration through the workspace lib — never store an OpenAI API key directly.
