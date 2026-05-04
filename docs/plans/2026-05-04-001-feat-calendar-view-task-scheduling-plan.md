---
title: "feat: Add calendar view with due dates, drag-to-reschedule, and multi-board aggregation"
type: feat
status: active
date: 2026-05-04
---

# feat: Add calendar view with due dates, drag-to-reschedule, and multi-board aggregation

## Summary

Add a calendar view to the task manager using `@fullcalendar/react` with month and week layouts. Tasks get a `dueDate` field (Prisma migration). A global `/calendar` page aggregates tasks across all user boards with color-coding and filtering. A board-level Kanban/Calendar toggle scopes to one board. Drag-to-reschedule changes due dates via FullCalendar's built-in drag system with optimistic TanStack Query updates. An unscheduled sidebar shows tasks without due dates, draggable onto the calendar.

---

## Problem Frame

The app is Kanban-only. Users have no way to see tasks across a timeline, schedule due dates, or get a high-level view of their workload. Adding a due date means going to a task's Kanban card, setting a date, and hoping to remember it. A calendar view solves scheduling — users see what's due when, drag to reschedule, and spot date conflicts across boards at a glance.

---

## Requirements

- R1. Tasks support an optional `dueDate` (date-only, nullable) — stored in PostgreSQL, surfaced in API responses and type definitions
- R2. Global calendar at `/calendar` renders a month grid (default) and week view, showing color-coded tasks from all user-owned boards within the visible date range
- R3. Board-level Kanban/Calendar toggle at `/boards/[id]?view=calendar` — same calendar component, scoped to one board's tasks
- R4. Drag a task on the calendar to a different day → due date updates via `PATCH /tasks/:id { dueDate }` with optimistic cache update and error rollback
- R5. Unscheduled sidebar (collapsible) lists tasks without `dueDate` — draggable onto calendar days to assign a date
- R6. Board color-coding via deterministic hash from board ID → predefined palette (8 colors). Tasks render with their board's color on the calendar
- R7. Filters by board, priority, and status via URL search params, backed by server-side query parameters on the calendar endpoint
- R8. Calendar state (current month, view mode, filters) persisted in URL search params — survives browser back/forward but resets on fresh `/calendar` navigation
- R9. Calendar page joins all user-owned board WebSocket rooms — invalidates the calendar query cache on task create/update/delete events, keeping the view fresh across sessions
- R10. Three-state rendering: loading (skeleton grid), error (retry banner), empty (grid with "No scheduled tasks yet" message + unscheduled sidebar)

---

## Scope Boundaries

- No time-of-day scheduling (hour slots) — due dates are date-only
- No recurring tasks
- No task dependencies or Gantt/timeline view
- No calendar notifications, reminders, or browser push
- No iCal/Google Calendar sync
- No creating tasks directly from the calendar — tasks are created in Kanban, scheduled via calendar
- No table/list view (separate follow-up feature)
- No dark mode (already deferred in prior plan)
- No mobile-optimized calendar layout — the month grid may be cramped on narrow viewports

### Deferred to Follow-Up Work

- `Board.color` field for user-customizable board colors — currently using hash-derived palette
- Calendar event resizing (changing task duration) — fullcalendar supports it, but tasks are single-day
- Day view option beyond month and week

---

## Context & Research

### Relevant Code and Patterns

| Pattern | Location | Calendar Relevance |
|---------|----------|-------------------|
| Task model + CRUD | `apps/api/prisma/schema.prisma`, `apps/api/src/tasks/` | Add `dueDate`, extend DTOs, add date-range query |
| JWT auth + ownership | `apps/api/src/auth/`, `apps/api/src/common/board-access.service.ts` | Calendar queries must filter by `board.ownerId === req.user.id` |
| Container/presentational modules | `apps/web/src/modules/board/`, `apps/web/src/modules/dashboard/` | New `modules/calendar/` follows same structure |
| DnD + optimistic updates | `apps/web/src/modules/board/containers/BoardView.tsx` | FullCalendar handles calendar DnD; optimistic pattern reused for mutations |
| TanStack Query caching | `apps/web/src/modules/dashboard/containers/BoardGrid.tsx` | Calendar uses `['calendar', filters]` query key |
| WebSocket rooms | `apps/api/src/websocket/websocket.gateway.ts` | Calendar joins all user board rooms for cross-board real-time |
| Three-state pattern | `docs/solutions/design-patterns/ui-design-system-redesign-2026-05-03.md` | Loading/error/empty states for calendar |
| `@/` path aliases | `docs/solutions/build-errors/nextjs-incorrect-relative-import-depth.md` | All new files use `@/` imports exclusively |
| AuthGuard hydration | `docs/solutions/runtime-errors/nextjs-hydration-mismatch-auth-guard.md` | Calendar page wrapped in `<AuthGuard>` same as existing pages |

### Institutional Learnings

- **Module architecture rulebook** (`docs/plans/2026-05-03-001-refactor-migrate-to-shadcn-ui-plan.md`, U6): New `modules/calendar/` with `components/` (presentational) and `containers/` (data-fetching). Pages are thin shells. No cross-module imports — only from `@task-manager/ui`, `@/stores/*`, `@/lib/*`, `@/hooks/*`
- **DnD + optimistic pattern** (`docs/solutions/design-patterns/ui-design-system-redesign-2026-05-03.md`, Layer 3): For calendar drag, FullCalendar's built-in drag replaces @dnd-kit. The optimistic `queryClient.setQueryData` pattern from BoardView is reused for mutation feedback, with the addition of error rollback (a gap the calendar fixes)
- **Three-state rendering** (same doc, Layer 4): Every data-fetching page must handle loading, error, and empty states. Calendar skeleton mirrors the month grid layout
- **Path alias enforcement** (`docs/solutions/build-errors/nextjs-incorrect-relative-import-depth.md`): All imports use `@/` aliases. The existing `tsconfig.json` `paths: { "@/*": ["./src/*"] }` covers the new module directory

### External References

- FullCalendar CSS customization: https://fullcalendar.io/docs/css-customization — CSS variables (`--fc-*`) map directly to shadcn tokens
- FullCalendar React component: https://fullcalendar.io/docs/react — `eventContent` for custom event rendering, `eventDrop` for drag-to-reschedule
- FullCalendar event dragging/resizing: https://fullcalendar.io/docs/event-dragging-resizing
- FullCalendar Next.js example: https://github.com/fullcalendar/fullcalendar-examples — uses `next/dynamic` + `ssr: false`
- date-fns v4: https://date-fns.org/v4.1.0/docs — `startOfMonth`, `endOfMonth`, `startOfWeek`, `endOfWeek`, `format`, `parseISO`
- Prisma DateTime filtering: https://www.prisma.io/docs/orm/prisma-client/queries/crud#filter-records — `gte`/`lte` on DateTime fields
- TanStack Query keys: https://tanstack.com/query/v5/docs/guides/query-keys
- shadcn/ui theming: https://ui.shadcn.com/docs/theming

---

## Key Technical Decisions

- **Calendar library: `@fullcalendar/react` v6.1.20** — Chosen over `react-big-calendar` for superior CSS customization (CSS variables map to shadcn tokens), built-in drag-to-reschedule that understands the calendar grid (date snapping, month boundary crossing), and a clear upgrade path to v7 (native React, SSR, StrictMode-safe). The Preact rendering layer in v6 is handled via `next/dynamic({ ssr: false })` — the standard FullCalendar + Next.js pattern. v7 is in RC and replaces Preact with native React; migration from v6 → v7 is package restructure only. `date-fns` v4 is the companion date library (tree-shakeable, no existing date library in the codebase to conflict with). (see origin: external research)

- **Drag-to-reschedule uses FullCalendar's built-in drag, not @dnd-kit** — FullCalendar's `eventDrop` callback gives the new start/end dates directly, handles date snapping, ghost positioning, and month boundary crossing. Wrapping calendar day cells with @dnd-kit droppables would require reimplementing all of that. @dnd-kit remains for Kanban drag-and-drop only. The optimistic cache update pattern from BoardView is reused for the mutation. (see origin: external research, local DnD pattern)

- **Board color-coding via hash-derived palette** — No `color` field migration needed. Deterministic: `hash(boardId) % 8` → predefined Tailwind-compatible palette. This avoids a migration and keeps colors consistent across sessions. A `Board.color` field is deferred for future user customization. (see origin: flow analysis gap resolution)

- **Unscheduled sidebar is a collapsible right panel** — Tasks without `dueDate` appear in a sidebar. Dragging from sidebar to a calendar day sets `dueDate` (from `null` to a date). Without this, users must switch to Kanban to assign dates, creating a fragmented workflow. The sidebar uses the same TaskItem draggable component. (see origin: flow analysis gap 1 resolution)

- **API endpoint: `GET /tasks/calendar` on TasksController** — Query params: `startDate`, `endDate` (ISO strings), optional `boardId[]`, `priority[]`, `status[]`. Server-side filters by `board.ownerId === userId` via Prisma nested relation filtering (`list.board.ownerId`). Returns tasks with board metadata for color-coding. This avoids N+1 (fetching all boards with nested tasks) and keeps filtering server-side. (see origin: flow analysis gap 2 resolution)

- **Date handling: store as midnight UTC, render in local timezone** — `dueDate` is a Prisma `DateTime?`. A task due "May 10" is stored as `2026-05-10T00:00:00.000Z`. Queries use `gte`/`lte` on the UTC values. Rendering uses the browser's `Intl.DateTimeFormat` for local date display. This treats the due date as date-level intent (not time-level), avoiding timezone shift issues. (see origin: flow analysis gap 6 resolution)

- **Optimistic update with error rollback** — On drag-to-reschedule: `queryClient.setQueryData` moves the task immediately → mutation fires → on error, restore previous cache state and show toast. The existing BoardView mutation does NOT roll back on error (a pre-existing gap in the codebase). The calendar implements the pattern correctly; a follow-up can backport to BoardView. (see origin: flow analysis gap 5 resolution)

- **WebSocket: join all user-owned board rooms on calendar mount** — The calendar page fetches the user's boards, joins each board's WebSocket room via the existing `WsEvent.JOIN_BOARD` event, and listens for `task:created`, `task:updated`, `task:deleted` events (matching the existing `WsEvent` enum) to invalidate `['calendar', ...]` query caches. A `board:deleted` event also triggers calendar cache invalidation. (see origin: flow analysis gap 4 resolution)

- **URL search params for calendar state** — `/calendar?month=2026-05&view=week&board=abc&priority=HIGH`. State survives browser back/forward but resets on fresh navigation (no localStorage). Board-level toggle at `/boards/[id]?view=calendar`. The board-level calendar reuses the same calendar component with a different data source (board detail cache vs. calendar API query). (see origin: flow analysis gap 3 resolution)

- **Three tasks per day cell before "+N more"** — Month grid cells show up to 3 task chips. Additional tasks are hidden behind a "+N more" link that opens a popover or navigates to a focused day view. This keeps month cells at a consistent, readable height. (see origin: flow analysis gap 3 resolution)

---

## Open Questions

### Resolved During Planning

- Calendar library: `@fullcalendar/react` v6 over `react-big-calendar` (CSS variable integration wins)
- Drag approach: FullCalendar built-in over @dnd-kit wrapping (library handles date snapping)
- Unscheduled tasks: collapsible sidebar (not hidden, not special column)
- Color source: hash-derived from board ID (no Board.color migration)
- Calendar API: `GET /tasks/calendar` on TasksController (not a separate controller)
- WebSocket: join all user board rooms (not a new user-level room)
- Date storage: midnight UTC, local rendering (date-only semantics)

### Deferred to Implementation

- Exact HSL values for the 8-color board palette — implementer chooses visually distinct Tailwind-compatible colors
- Exact threshold for "+N more" overflow (default: 3 tasks) — adjustable via constant
- Unscheduled sidebar width and collapse/expand animation specifics
- Exact toast wording for drag error feedback
- Whether to add a "Today" button next to navigation arrows or rely on FullCalendar's built-in toolbar

---

## Implementation Units

- U1. **Add `dueDate` to Task model — schema, types, and DTOs**

**Goal:** Add a nullable `dueDate DateTime?` field to the Task Prisma model, run the migration, regenerate the client, and update the shared types package and DTOs.

**Requirements:** R1

**Dependencies:** None

**Files:**
- Modify: `apps/api/prisma/schema.prisma` — add `dueDate DateTime?` to Task model
- Create: `apps/api/prisma/migrations/*_add_due_date_to_task/migration.sql` (generated)
- Modify: `packages/types/src/index.ts` — add `dueDate?: string | Date` to Task interface and `UpdateTaskDto` interface
- Modify: `apps/api/src/tasks/dto/create-task.dto.ts` — add optional `dueDate` field with `@IsOptional()`, `@IsISO8601()`
- Modify: `apps/api/src/tasks/dto/update-task.dto.ts` — add optional `dueDate` field

**Approach:**
- Add `dueDate DateTime?` to the Task model in `schema.prisma` (no `@default` — existing rows get `NULL`)
- Run `pnpm db:migrate --name add_due_date_to_task` to generate and apply the migration
- Run `pnpm db:generate` to regenerate Prisma Client
- Add `dueDate?: string | Date` to the `Task` interface in the shared types package — mirrors the existing optional fields pattern
- Add `@IsOptional()` `@IsISO8601({ strict: true })` `dueDate?: string` to `CreateTaskDto`
- Add `@IsOptional()` `@IsISO8601({ strict: true })` `dueDate?: string` to `UpdateTaskDto`

**Patterns to follow:**
- Existing optional fields on Task: `description String?`, `assigneeId String?`
- Existing class-validator decorators in `CreateTaskDto` and `UpdateTaskDto`
- Existing Task interface structure in `packages/types/src/index.ts`

**Test scenarios:**
- Happy path: `pnpm db:migrate` creates migration SQL `ALTER TABLE "Task" ADD COLUMN "dueDate" TIMESTAMP(3);`
- Happy path: `pnpm db:generate` regenerates client with `dueDate` in Task type
- Happy path: `PATCH /tasks/:id` with `{ dueDate: "2026-05-10T00:00:00.000Z" }` succeeds
- Edge case: `POST /tasks` without `dueDate` creates task with `dueDate: null`
- Edge case: `PATCH /tasks/:id` with `{ dueDate: null }` clears the due date
- Edge case: Invalid date string like `"not-a-date"` returns 400 validation error

**Verification:**
- `pnpm run type-check` passes in `apps/api` and `packages/types`
- Prisma Studio (`pnpm db:studio`) shows `dueDate` column on Task, nullable, with no default

---

- U2. **Install calendar dependencies and theme FullCalendar with shadcn tokens**

**Goal:** Install `@fullcalendar/react`, its plugins, and `date-fns`. Map FullCalendar CSS variables to shadcn design tokens so the calendar inherits the app's theme.

**Requirements:** R2 (calendar rendering foundation)

**Dependencies:** None

**Files:**
- Modify: `apps/web/package.json` — add dependencies
- Modify: `apps/web/src/app/globals.css` — add FullCalendar CSS variable mapping
- Create: `apps/web/src/lib/date-utils.ts` — date range helpers using date-fns
- Create: `apps/web/src/lib/calendar-colors.ts` — board ID → color hash utility

**Approach:**
- Install deps in `apps/web/`: `@fullcalendar/core@^6.1.20`, `@fullcalendar/react@^6.1.20`, `@fullcalendar/daygrid@^6.1.20`, `@fullcalendar/timegrid@^6.1.20`, `@fullcalendar/interaction@^6.1.20`, `date-fns@^4.1.0`
- Add `@fullcalendar/common/main.css` import handling — FullCalendar CSS is imported in the client component that renders the calendar (not in globals.css), keeping it scoped
- In `globals.css`, add a `.fc {}` block mapping FullCalendar's CSS custom properties to shadcn tokens:
  ```
  --fc-border-color: hsl(var(--border))
  --fc-page-bg-color: hsl(var(--background))
  --fc-neutral-bg-color: hsl(var(--muted) / 0.3)
  --fc-neutral-text-color: hsl(var(--muted-foreground))
  --fc-button-bg-color: hsl(var(--primary))
  --fc-button-text-color: hsl(var(--primary-foreground))
  --fc-button-hover-bg-color: hsl(var(--primary) / 0.9)
  --fc-button-active-bg-color: hsl(var(--primary) / 0.8)
  --fc-today-bg-color: hsl(var(--accent) / 0.15)
  --fc-event-bg-color: hsl(var(--primary))
  --fc-event-border-color: hsl(var(--primary))
  --fc-now-indicator-color: hsl(var(--destructive))
  ```
- Override button border-radius to match shadcn via `.fc .fc-button { @apply rounded-md text-sm; }`
- Create `lib/date-utils.ts` with `getMonthRange(date)` → `{ start: ISO, end: ISO }`, `getWeekRange(date, weekStartsOn)` → `{ start: ISO, end: ISO }`, and `formatTaskDate(date)` helpers
- Create `lib/calendar-colors.ts` — `getBoardColor(boardId: string): string` using a simple hash → 8-color palette (Tailwind-compatible colors like blue, emerald, amber, red, purple, pink, cyan, orange)

**Patterns to follow:**
- Existing utility file pattern: `apps/web/src/lib/api.ts`, `apps/web/src/lib/socket.ts`
- shadcn CSS variable usage from existing `globals.css` `:root` block
- Tailwind `@apply` patterns from existing `globals.css` `@layer base`

**Test scenarios:**
- Happy path: `pnpm install` succeeds with all new deps
- Happy path: `pnpm run build` succeeds — no import errors from new packages
- Happy path: Dev server loads, `globals.css` compiles without CSS syntax errors
- Edge case: `getMonthRange(new Date('2026-01-15'))` returns `{ start: '2026-01-01T00:00:00.000Z', end: '2026-01-31T23:59:59.999Z' }`
- Edge case: `getBoardColor('board-uuid-1')` returns a consistent color across calls

**Verification:**
- FullCalendar CSS variables appear in browser DevTools Elements panel on the calendar page
- `getBoardColor` returns stable, visually distinct colors for different board IDs
- `pnpm run type-check` passes

---

- U3. **Calendar API endpoint — date-range task query with ownership filtering**

**Goal:** Add `GET /tasks/calendar` to the TasksController that returns tasks across all user-owned boards within a date range, with optional filters. Implement server-side ownership enforcement.

**Requirements:** R1, R2, R7

**Dependencies:** U1 (dueDate must exist on Task model)

**Files:**
- Create: `apps/api/src/tasks/dto/calendar-query.dto.ts` — CalendarQueryDto with date range + optional filters
- Modify: `apps/api/src/tasks/tasks.service.ts` — add `findByDateRange(userId, query)` method
- Modify: `apps/api/src/tasks/tasks.controller.ts` — add `@Get('calendar')` endpoint
- Test: `apps/api/src/tasks/tasks.service.spec.ts` (extend existing)

**Approach:**
- Create `CalendarQueryDto`:
  - `@IsISO8601({ strict: true }) startDate: string`
  - `@IsISO8601({ strict: true }) endDate: string`
  - `@IsOptional()` `@IsString({ each: true })` `boardId?: string | string[]`
  - `@IsOptional()` `@IsEnum(Priority, { each: true })` `priority?: Priority | Priority[]`
  - `@IsOptional()` `@IsEnum(TaskStatus, { each: true })` `status?: TaskStatus | TaskStatus[]`
- Add `findByDateRange(userId: string, query: CalendarQueryDto)` to TasksService:
  - Build Prisma `where` clause: `list.board.ownerId: userId` (ownership enforcement via nested relation)
  - Add `dueDate: { gte: start, lte: end }` filter
  - Conditionally add `list.board.id: { in: boardIds }` if `boardId` filter present
  - Conditionally add `priority: { in: priorities }` and `status: { in: statuses }`
  - Include `list: { select: { id, title, boardId, board: { select: { id, title } } } }` for board metadata
  - Order by `dueDate` ascending
- Add endpoint to TasksController: `@Get('calendar') findByDateRange(@Query() query: CalendarQueryDto, @Request() req)` — **must declare before `@Get(':id')`** to avoid the `:id` wildcard shadowing `/calendar` (NestJS matches routes in declaration order)
- Use `class-validator` `ValidationPipe` with `transform: true` for query string coercion
- Add `@Throttle({ default: { limit: 30, ttl: 60000 } })` — higher limit for data-fetch endpoints
- Add `@HttpCode(HttpStatus.OK)` (default, explicit for clarity)

**Patterns to follow:**
- Existing query parameter handling in NestJS (none currently — DTOs are for body. New pattern for `@Query()`)
- `BoardAccessService.assertOwnership` pattern — but here, ownership filtering is done via Prisma `where` clause rather than a separate guard call, since we're querying across boards
- Existing controller structure: `@UseGuards(JwtAuthGuard)` already on class, `req.user.id` extraction
- `findByList` endpoint pattern at line 23 of `tasks.controller.ts` — similar custom route

**Test scenarios:**
- Happy path: `GET /tasks/calendar?startDate=2026-05-01T00:00:00.000Z&endDate=2026-05-31T23:59:59.999Z` returns only tasks from user-owned boards within May 2026
- Happy path: Response includes `list.id`, `list.title`, `list.boardId`, `list.board.id`, `list.board.title` for each task
- Happy path: `GET /tasks/calendar?startDate=...&endDate=...&boardId=abc&priority=HIGH` filters correctly
- Edge case: User with zero boards → empty array `[]`, not an error
- Edge case: User with boards but zero tasks with due dates in range → empty array
- Edge case: Missing `startDate` → returns 400 validation error
- Edge case: `startDate` after `endDate` → empty array (valid query, empty range)
- Edge case: Non-ISO date string → 400 validation error
- Integration: Task owned by another user does NOT appear in results (cross-user isolation)
- Error path: Database connection failure → NestJS returns 500

**Verification:**
- `GET /tasks/calendar?startDate=...&endDate=...` returns correctly filtered tasks from Postman/curl
- Tasks from boards not owned by the user are never returned
- `pnpm run type-check` passes in `apps/api`
- `pnpm test` passes (existing tests + new calendar endpoint tests)

---

- U4. **Calendar module — presentational components**

**Goal:** Build the calendar's presentational layer — month grid, day cells, task items, skeleton, empty state, and unscheduled sidebar. All components receive data and callbacks via props only (no data fetching, no stores).

**Requirements:** R2, R6, R10

**Dependencies:** U2 (deps + theme)

**Files:**
- Create: `apps/web/src/modules/calendar/components/CalendarGrid.tsx`
- Create: `apps/web/src/modules/calendar/components/DayCell.tsx`
- Create: `apps/web/src/modules/calendar/components/TaskItem.tsx`
- Create: `apps/web/src/modules/calendar/components/CalendarSkeleton.tsx`
- Create: `apps/web/src/modules/calendar/components/UnscheduledPanel.tsx`
- Create: `apps/web/src/modules/calendar/components/CalendarEmptyState.tsx`
- Create: `apps/web/src/modules/calendar/components/CalendarErrorState.tsx`
- Create: `apps/web/src/modules/calendar/components/CalendarToolbar.tsx`

**Approach:**
- **CalendarGrid** — receives `weeks` (array of week arrays of day objects with date + tasks), `renderDayCell` callback, and view mode. Renders a 7-column CSS grid. Handles both month grid layout and week row layout via a `view` prop.
- **DayCell** — receives `date`, `tasks[]`, `isToday`, `isCurrentMonth`, `maxVisible`. Renders the day number, up to `maxVisible` task chips, and a "+N more" button when tasks exceed `maxVisible`. The "+N more" button emits an `onShowMore` callback. NOT a draggable/droppable — FullCalendar renders its own cells, or we render custom content inside FullCalendar's `dayCellContent` hook. The decision point: **FullCalendar generates the grid structure; we provide content via hooks.** `DayCell` is the content rendered inside each FullCalendar day cell via `dayCellContent` (for the header/date) and event rendering via `eventContent` (for task chips). The grid structure itself is FullCalendar's.
- **TaskItem** — receives `task` (with board color), `onClick`. Renders a compact chip with board color background, task title (truncated), and optional priority indicator. Used both in day cells (`eventContent`) and in the unscheduled sidebar. **Note:** For FullCalendar, `eventContent` receives an `EventContentArg` — we map our `Task` data to FullCalendar events with `id`, `title`, `start` (dueDate), `backgroundColor`, `extendedProps`.
- **CalendarSkeleton** — renders a 7×5 grid of `<Skeleton>` placeholders matching the month grid shape (35 cells with `h-24` each, plus a header row with 7 `h-8` cells).
- **UnscheduledPanel** — collapsible right sidebar receiving `tasks[]` (tasks with `dueDate: null`), `onDragStart`, `onTaskClick`. Each task renders as a `TaskItem`. Uses a toggle button to expand/collapse. Width: ~280px when expanded, ~40px when collapsed (icon-only).
- **CalendarEmptyState** — icon + message: "No scheduled tasks yet" + subtext: "Add due dates from your Kanban boards, or drag tasks here from the unscheduled panel."
- **CalendarErrorState** — error icon + message + retry button via `onRetry` callback.
- **CalendarToolbar** — receives current view/month, navigation callbacks, view toggle (month/week), and filter controls (board multi-select, priority multi-select, status multi-select). Renders FullCalendar's header replacement or a custom toolbar above the calendar. Uses shadcn `<Select>` components for dropdowns.

**Adaptation to FullCalendar's rendering model:**
FullCalendar v6 React rendering works via render hooks (not custom grid components):
- `eventContent` → renders each task chip (our `TaskItem`)
- `dayCellContent` → renders day number in header (can be default or custom)
- `dayHeaderContent` → renders day-of-week headers
- The month/week grid, navigation arrows, and "Today" button come from FullCalendar's built-in toolbar
- **Decision**: Use FullCalendar's toolbar (prev/next/today + view switcher) for v1. Custom `eventContent` for task chips. Custom `CalendarToolbar` lives above the calendar for filters. This minimizes custom grid code and leverages the library's built-in UX.

**Patterns to follow:**
- Existing presentational component patterns: `TaskCard.tsx` (props-only, Tailwind styling), `BoardCard.tsx`
- shadcn component usage: `Skeleton` from `@task-manager/ui`, `Sheet` for "+N more" popover
- Three-state rendering from `docs/solutions/design-patterns/ui-design-system-redesign-2026-05-03.md`, Layer 4
- `cn()` utility from `packages/ui/src/lib/utils.ts` for conditional classes

**Test scenarios:**
- Happy path: `CalendarGrid` renders 5-6 rows of 7 cells for a month with correct day numbers
- Happy path: `DayCell` with 3 tasks shows all 3; with 5 tasks shows 3 + "+2 more"
- Happy path: `TaskItem` renders title truncated with board color badge
- Happy path: `UnscheduledPanel` shows tasks in a scrollable list, collapses/expands on toggle
- Edge case: `CalendarSkeleton` renders 35 placeholder cells in a 7-column grid
- Edge case: `CalendarEmptyState` renders message with CTA
- Edge case: `CalendarErrorState` renders error message with retry button
- Edge case: `DayCell` for today's date has a ring highlight (`ring-2 ring-primary/50`)

**Verification:**
- All components render without console errors in isolation (viewed in dev server or Storybook-ad-hoc)
- `pnpm run type-check` passes
- Components accept only props — no `useQuery`, `useMutation`, or `useAuthStore` imports

---

- U5. **CalendarView container — query, FullCalendar integration, drag-to-reschedule, and state**

**Goal:** Wire the calendar components together, fetch data via TanStack Query, integrate FullCalendar with `next/dynamic`, handle drag-to-reschedule with optimistic updates, manage URL search params for calendar state and filters.

**Requirements:** R2, R4, R5, R6, R7, R8

**Dependencies:** U3 (API endpoint available), U4 (components exist)

**Files:**
- Create: `apps/web/src/modules/calendar/containers/CalendarView.tsx`
- Create: `apps/web/src/modules/calendar/hooks/useCalendarQuery.ts`
- Create: `apps/web/src/modules/calendar/hooks/useCalendarState.ts`
- Test: `apps/web/src/modules/calendar/__tests__/CalendarView.test.tsx`

**Approach:**
- **useCalendarQuery** — custom hook wrapping `useQuery`:
  - `queryKey: ['calendar', { startDate, endDate, boardId, priority, status }]`
  - `queryFn`: calls `api.get('/tasks/calendar?startDate=...&endDate=...&boardId=...&...')`
  - `enabled`: only when `startDate` and `endDate` are set
  - `staleTime: 30_000` — 30s before data considered stale
- **useCalendarState** — reads/writes URL search params for `month`, `view`, `boardId`, `priority`, `status`:
  - Uses `useSearchParams`, `useRouter`, `usePathname`
  - Derives `startDate`/`endDate` from `month` + `view` using date-utils
  - Returns parsed state + `setMonth`, `setView`, `setFilter` callbacks that update URL
- **CalendarView** container:
  - Wraps in `<AuthGuard>` context (already handled by the page wrapper — container does NOT include AuthGuard; it's on the page)
  - Uses `useCalendarState()` for URL-derived state
  - Uses `useCalendarQuery(state)` for task data
  - Uses `useAuthStore()` for access token to pass to FullCalendar's event fetching (if using `events` as a callback) or queries via TanStack directly (recommended — simpler, consistent with rest of app)
  - **FullCalendar integration strategy**: The calendar data comes from TanStack Query, NOT FullCalendar's built-in `events` callback. We transform the queried `Task[]` data into FullCalendar `EventInput[]` format and pass it via the `events` prop (as a static array that re-renders when query data changes). This keeps data fetching in the query layer, consistent with the rest of the app.
    ```tsx
    const events = useMemo(() => data?.map(taskToEvent) ?? [], [data]);
    // taskToEvent: maps Task → { id, title, start: dueDate, backgroundColor: getBoardColor(boardId), extendedProps: { task, boardId, priority, status } }
    ```
  - **FullCalendar component**: wrapped in `next/dynamic(() => import('./CalendarClient'), { ssr: false, loading: () => <CalendarSkeleton /> })`. The `CalendarClient` is a thin component file that imports and renders `<FullCalendar>` with the dynamic import.
  - **Drag-to-reschedule**: 
    - `eventDrop` callback receives `EventDropArg` with `event.id`, `event.start`
    - Compare old and new date — if same, return (no-op)
    - Optimistic: `queryClient.setQueryData(['calendar', filters], (old) => /* update task's dueDate in cache */)`
    - Mutation: `updateTaskMutation.mutate({ id, data: { dueDate: newDate.toISOString() } })`
    - `onError`: restore previous cache data + `toast.error('Failed to reschedule task')`
  - **Unscheduled → calendar drag**: FullCalendar supports external element dragging via the `@fullcalendar/interaction` plugin. Tasks in the unscheduled sidebar are marked as `data-event` draggables (FullCalendar's external drag pattern). On drop, the `eventReceive` callback fires with the new date. Mutation: `PATCH /tasks/:id { dueDate: newDate }`.
  - **Unscheduled tasks**: Fetched as part of the calendar query (if the API includes them) or via a separate query. **Decision**: The calendar API endpoint returns both scheduled and unscheduled tasks. The container separates them: `scheduledTasks = data.filter(t => t.dueDate)` and `unscheduledTasks = data.filter(t => !t.dueDate)`. The unscheduled tasks are still returned by the API even though they have no `dueDate` — the query's `dueDate: { gte, lte }` filter is applied conditionally (only when filtering for scheduled tasks). For the initial calendar load, we fetch ALL user tasks once and separate them client-side. For the board-level calendar, the board detail cache already has all tasks.
  - **Event content rendering**: `eventContent={renderTaskChip}` — maps FullCalendar event back to our `TaskItem` component, using `extendedProps` for board color, priority, etc.
  - **Day cell customization**: `dayCellContent` or `dayCellClassNames` can add today highlighting — but FullCalendar's `--fc-today-bg-color` CSS variable already handles this. Minimal custom content needed.

**Patterns to follow:**
- Existing container pattern: `BoardView.tsx` — `useQuery`, `useMutation`, DnD context, optimistic updates
- TanStack Query pattern: `useQuery` with `enabled` guard (same as BoardView's `enabled: isAuthenticated`)
- URL search params pattern: `next/navigation` `useSearchParams` + `useRouter`
- `next/dynamic` pattern: used in Next.js + FullCalendar official examples
- `toast` from `sonner` for error feedback (already in Providers)

**Test scenarios:**
- Happy path: Calendar loads month grid with tasks from April query → renders task chips on correct days
- Happy path: Clicking month navigation arrows updates URL → refetches new date range
- Happy path: Dragging a task from May 5 to May 10 → task moves visually, API call fires, on success cache stays updated
- Happy path: Dragging a task from unscheduled sidebar to May 12 → task appears on May 12, `dueDate` set
- Happy path: Applying board filter → URL updates, query refetches with boardId param
- Edge case: Dragging task to the same day it's already on → no API call, no cache change
- Edge case: Drag mutation fails → task reverts to previous day, toast error appears
- Edge case: Switching from month to week view → URL updates, date range recalculated, refetch
- Edge case: Navigating to `/calendar` with no search params → defaults to current month
- Edge case: `data` is `undefined` (loading) → renders `CalendarSkeleton`
- Edge case: `error` is truthy → renders `CalendarErrorState`
- Error path: API returns 500 → error state rendered with retry button
- Integration: Logging in → navigating to `/calendar` → calendar loads with user's tasks
- Integration: Creating a task with dueDate in Kanban → navigating to calendar → task appears

**Verification:**
- `pnpm run type-check` passes
- `pnpm run dev` → `/calendar` renders month grid with tasks (or empty state if no tasks)
- Month/week toggle works, URL params reflect state
- Drag-to-reschedule sends correct PATCH and updates UI
- Filter changes trigger API refetch with correct params

---

- U6. **Routes, navigation, and board-level toggle**

**Goal:** Add the `/calendar` page route, add a "Calendar" link to the Header nav, and implement the board-level Kanban/Calendar view toggle.

**Requirements:** R2, R3

**Dependencies:** U5 (CalendarView container exists)

**Files:**
- Create: `apps/web/src/app/calendar/page.tsx`
- Modify: `apps/web/src/modules/layout/components/Header.tsx` — add Calendar nav link
- Modify: `apps/web/src/modules/layout/containers/AppHeader.tsx` — pass nav items if needed
- Modify: `apps/web/src/app/boards/[id]/page.tsx` — add view toggle state
- Create: `apps/web/src/modules/board/containers/BoardCalendarView.tsx` (or inline toggle logic)

**Approach:**
- **`/calendar` page** — thin shell following existing page pattern:
  ```tsx
  import AuthGuard from '@/modules/auth/containers/AuthGuard';
  import AppHeader from '@/modules/layout/containers/AppHeader';
  import CalendarView from '@/modules/calendar/containers/CalendarView';
  
  export default function CalendarPage() {
    return (
      <AuthGuard>
        <div className="flex min-h-screen flex-col bg-background">
          <AppHeader />
          <CalendarView />
        </div>
      </AuthGuard>
    );
  }
  ```
- **Header nav link** — add a "Calendar" link between the app name and user section in `Header.tsx`:
  - New prop: `navLinks?: { href: string; label: string }[]` — passed from `AppHeader` container
  - Or hardcode a single `<Link href="/calendar">Calendar</Link>` for v1 simplicity
  - Styled consistently with the existing app name link
  - `AppHeader.tsx` either passes the link as a prop or just wraps Header without changes
  - **Decision**: Keep it simple for v1 — add a hardcoded `<Link href="/calendar" className="...">Calendar</Link>` in `Header.tsx` alongside the app name. No prop drilling needed for a single nav item.
- **Board-level toggle** — in `apps/web/src/app/boards/[id]/page.tsx`:
  - Read `searchParams` from the page (Next.js 15: `searchParams` is a Promise that resolves to `{ [key: string]: string | string[] | undefined }`)
  - Pass `view` to `BoardView` as a prop: `view={searchParams.view === 'calendar' ? 'calendar' : 'kanban'}`
  - `BoardView` renders either the existing Kanban content OR a `BoardCalendarView` based on the `view` prop
  - Toggle button: a segmented control or two buttons in the board toolbar (inside BoardView or a new component)
  - **BoardCalendarView approach**: Since the board detail already has all tasks (from `useQuery(['board', boardId])`), the board-level calendar can reuse this cached data directly. Create a `BoardCalendarView` container that:
    - Receives `board` data (with `lists[].tasks[]`)
    - Flattens all tasks from all lists
    - Renders the same FullCalendar component as the global calendar
    - Scoped to one board — filters and color-coding are implicit (no board filter needed)
    - Drag-to-reschedule works the same way

**Patterns to follow:**
- Existing page pattern: `apps/web/src/app/dashboard/page.tsx`
- Existing board page structure: `apps/web/src/app/boards/[id]/page.tsx`
- New Next.js 15 `searchParams` pattern: `searchParams` is a Promise in page.tsx

**Test scenarios:**
- Happy path: Navigating to `/calendar` renders the calendar page with header and month grid
- Happy path: Clicking "Calendar" in Header navigates to `/calendar`
- Happy path: Navigating to `/dashboard` from calendar via header logo works
- Happy path: Board page at `/boards/[id]` shows Kanban by default
- Happy path: Clicking Calendar toggle on board page → URL becomes `/boards/[id]?view=calendar` → calendar renders with only that board's tasks
- Happy path: Toggling back to Kanban → URL removes `?view=calendar` → Kanban renders
- Edge case: Navigating directly to `/boards/[id]?view=calendar` → calendar renders on load
- Edge case: `/boards/[id]?view=invalid` → defaults to Kanban (graceful degradation)
- Integration: Full app flow — login → dashboard → open board → toggle to calendar → navigate to global calendar → back to dashboard

**Verification:**
- `pnpm run build` succeeds — no broken routes or import errors
- Dev server: all navigation paths work, no console errors
- Board-level toggle preserves the existing Kanban functionality

---

- U7. **WebSocket real-time calendar updates**

**Goal:** When the calendar page mounts, join all user-owned board WebSocket rooms and listen for task events. Invalidate the calendar query cache on create/update/delete so the calendar stays fresh without manual refresh.

**Requirements:** R9

**Dependencies:** U5 (CalendarView exists), U6 (calendar page exists)

**Files:**
- Modify: `apps/web/src/hooks/useSocket.ts` — add room join/leave helpers (optional — could be inline)
- Modify: `apps/web/src/modules/calendar/containers/CalendarView.tsx` — add WebSocket listener effect
- Modify: `apps/web/src/modules/board/containers/BoardCalendarView.tsx` — same listener for board-level calendar
- Test: `apps/web/src/hooks/__tests__/useSocket.test.ts` (if test infra exists, otherwise manual)

**Approach:**
- On calendar mount:
  1. Fetch the user's boards (reuse `useQuery(['boards'])` — already fetched by the dashboard)
  2. For each board, join its WebSocket room: `socket.emit('join-board', boardId)` (maps to existing gateway `@SubscribeMessage('join-board')`)
  3. Listen for `TASK_CREATED`, `TASK_UPDATED`, `TASK_DELETED`, `BOARD_DELETED` events via `socket.on(event, handler)`
  4. On each event: `queryClient.invalidateQueries({ queryKey: ['calendar'] })` — invalidates all calendar query caches
  5. On unmount: leave all board rooms + remove event listeners
- Implementation in `CalendarView`:
  ```typescript
  useEffect(() => {
    const socket = getSocket();
    if (!socket?.connected) return;
    
    // Join all user board rooms
    boards?.forEach(board => socket.emit('join-board', board.id));
    
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['calendar'] });
    socket.on('task:created', invalidate);
    socket.on('task:updated', invalidate);
    socket.on('task:deleted', invalidate);
    socket.on('board:deleted', invalidate);
    
    return () => {
      boards?.forEach(board => socket.emit('leave-board', board.id));
      socket.off('task:created', invalidate);
      socket.off('task:updated', invalidate);
      socket.off('task:deleted', invalidate);
      socket.off('board:deleted', invalidate);
    };
  }, [socket, boards, queryClient]);
  ```
- For the board-level calendar (`BoardCalendarView`): since it uses the board detail query cache (`['board', boardId]`), invalidate that query instead: `queryClient.invalidateQueries({ queryKey: ['board', boardId] })`. This is simpler — the board-level calendar is already scoped to one board's room.

**Patterns to follow:**
- Existing socket connection pattern: `apps/web/src/hooks/useSocket.ts` — connects on token, auth via handshake
- Existing gateway room architecture: `apps/api/src/websocket/websocket.gateway.ts` — `emitToBoard()`
- Existing TanStack Query invalidation: `queryClient.invalidateQueries({ queryKey: [...] })`

**Test scenarios:**
- Happy path: Calendar mounts → joins all user board rooms → receives `TASK_UPDATED` event → query cache invalidated → calendar refetches
- Happy path: Creating a task in Kanban view → WS broadcast → calendar page receives event → refetches
- Happy path: Deleting a board (with tasks) in another tab → WS broadcast → calendar refetches → deleted board's tasks disappear
- Edge case: Socket disconnected → calendar still renders cached data (stale-while-revalidate via `staleTime: 30_000`)
- Edge case: Socket reconnects → re-joins board rooms (requires reconnection logic — test that `useEffect` re-runs on `socket` change)
- Edge case: Calendar unmounts → all board rooms left, listeners cleaned up — no memory leak

**Verification:**
- Open calendar page in one tab, Kanban board in another tab
- Add/update/delete a task with dueDate in Kanban → calendar page updates within seconds
- Delete a board → calendar page reflects the change
- No duplicate event listeners after multiple mounts/unmounts (check via DevTools Memory profiler or React DevTools)

---

## System-Wide Impact

- **Interaction graph:** Calendar depends on the existing TasksController (new endpoint), WebSocket gateway (room joining), auth flow (AuthGuard, JWT), and shared types package (Task interface extended). No changes to middleware pipeline or request lifecycle.
- **Error propagation:** Calendar query failures surface in the CalendarErrorState component. Drag mutation failures show a toast + revert optimistic update. WebSocket disconnection is silent (calendar shows last-cached data) — no reconnection logic added in this plan.
- **State lifecycle risks:** Optimistic cache updates on drag could leave stale state if the query cache is invalidated by a WebSocket event mid-drag. Mitigation: the `onSettled` callback invalidates the query to sync with server state; if a WS event triggers invalidation first, the optimistic update is simply overwritten by the next fetch — no data corruption.
- **API surface parity:** The new `GET /tasks/calendar` endpoint follows the same controller/service/dto pattern as existing endpoints. Auth (JwtAuthGuard), user context (`req.user.id`), and error handling (NestJS built-in) are identical. The new `dueDate` field on CreateTaskDto/UpdateTaskDto is fully backward-compatible (optional field).
- **Integration coverage:** Cross-layer scenarios requiring manual verification — creating a task with dueDate in Kanban → appears on calendar; dragging task on calendar → Kanban board shows updated dueDate (after WS event reaches the board page); deleting a board → calendar removes its tasks. These are covered by U7's test scenarios.
- **Unchanged invariants:** Kanban board functionality is completely untouched — no BoardView, TaskCard, or ListColumn changes. Auth flow is unchanged. The dashboard page and board listing are unchanged aside from the Header nav link. WebSocket gateway schema is unchanged — rooms and events remain the same.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| FullCalendar v6 Preact rendering layer may conflict with React 19 StrictMode | Use `next/dynamic({ ssr: false })` — the standard documented approach. v7 removes Preact entirely (in RC, stable expected mid-2026). |
| FullCalendar bundle size (~110KB gzipped with plugins) impacts initial page load | Lazy-loaded via `next/dynamic` — only downloaded when user navigates to `/calendar` |
| `@fullcalendar/core` ships global CSS that may conflict with Tailwind preflight | FullCalendar CSS is scoped to `.fc` classes. Tailwind preflight resets are applied globally but don't target FullCalendar's specific class names. Test visually. |
| Calendar API query performance with many boards/tasks | Keep date-range filtering server-side via Prisma. Add `staleTime: 30_000` to avoid repeated fetches. Future: add pagination if needed. |
| WebSocket room join overhead with many boards (N rooms per calendar mount) | Rooms are lightweight (in-memory Socket.IO). Typical user has <10 boards. Only the calendar page joins all rooms — board pages join one each. |

---

## Sources & References

- **Origin brainstorm:** (conversation context — no written requirements doc; scope captured in ce-plan Phase 0.7 synthesis)
- Related code: `apps/api/src/tasks/`, `apps/web/src/modules/board/`, `apps/web/src/app/dashboard/`
- Institutional learnings: `docs/solutions/design-patterns/ui-design-system-redesign-2026-05-03.md`, `docs/plans/2026-05-03-001-refactor-migrate-to-shadcn-ui-plan.md`
- External docs: FullCalendar (https://fullcalendar.io/docs/react), date-fns v4 (https://date-fns.org), Prisma filtering (https://www.prisma.io/docs/orm/prisma-client/queries/crud#filter-records)
