---
title: FullCalendar v6 Integration Issues in Next.js 15 Calendar View
date: 2026-05-04
category: integration-issues
module: calendar
problem_type: integration_issue
component: frontend_stimulus
severity: high
symptoms:
  - FullCalendar crashes during Next.js SSR or shows hydration mismatch
  - External drag-and-drop from sidebar silently fails with no console errors
  - Real-time task updates never appear in calendar after socket reconnect
  - Board Kanban shows stale data after drag-to-reschedule until manual refresh
  - TypeScript build fails with TS18048 on optional nested arrays
root_cause: incomplete_setup
resolution_type: code_fix
tags:
  - fullcalendar
  - nextjs
  - react-query
  - websocket
  - drag-and-drop
  - typescript
  - nestjs
---

# FullCalendar v6 Integration Issues in Next.js 15 Calendar View

## Problem

While building a calendar view feature for a Next.js 15 + NestJS task manager using FullCalendar v6, multiple integration failures surfaced across the frontend rendering layer, drag-and-drop system, real-time sync, and API resilience. Each issue was individually small but together broke core UX: the calendar either crashed on load, refused external drags, ignored real-time updates, or left data stale across views.

## Symptoms

- FullCalendar crashes during Next.js SSR or shows a hydration mismatch error on page reload.
- Sidebar tasks appear draggable (cursor changes) but dropping them onto calendar cells has no effect — no events fire, no console errors.
- After a page refresh, real-time task updates via WebSocket never appear in the calendar even though the socket connects successfully.
- Dragging a task to a new date in the board-level calendar updates the server, but the Kanban board still shows the old date until a manual refresh.
- `tsc --noEmit` exits with `TS18048: 'l.tasks' is possibly 'undefined'` in the board calendar container.

## What Didn't Work

- **Assuming `droppable: true` was sufficient.** Setting the FullCalendar prop and adding `data-event` attributes to external items did not enable dragging. FullCalendar requires an explicit `Draggable` instance from `@fullcalendar/interaction`.
- **Conditional listener registration.** Guarding `socket.on(...)` with `if (!socket.connected)` prevented listeners from ever attaching on initial loads where the socket connected asynchronously after mount.
- **Bare promises for mutations.** Calling `api.patch()` without React Query meant no automatic cache sync, no optimistic UI, and no error recovery — if the server errored, the task visually disappeared.
- **Using `window.open` for internal navigation.** This forced a full page reload, destroying React state, QueryClient caches, and the WebSocket connection.

## Solution

### 1. Exclude FullCalendar from SSR

FullCalendar v6 uses an internal Preact rendering layer incompatible with React 19 Server Components. Wrap it in `next/dynamic` with `ssr: false`.

```tsx
// CalendarClient.tsx
import dynamic from 'next/dynamic';
import CalendarSkeleton from './CalendarSkeleton';

const FullCalendar = dynamic(
  () => import('@fullcalendar/react'),
  { ssr: false, loading: () => <CalendarSkeleton /> }
);
```

### 2. Initialize Draggable on External Items

The sidebar container must imperatively instantiate `Draggable` after its DOM nodes exist.

```tsx
// UnscheduledSidebar.tsx
import { useEffect, useRef } from 'react';
import { Draggable } from '@fullcalendar/interaction';

export function UnscheduledSidebar({ tasks }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || tasks.length === 0) return;
    const draggable = new Draggable(containerRef.current, {
      itemSelector: '[data-event]',
    });
    return () => { /* FC v6 cleans up on unmount */ };
  }, [tasks.length]);

  return (
    <div ref={containerRef}>
      {tasks.map((t) => (
        <div key={t.id} data-event={JSON.stringify({ id: t.id, title: t.title, extendedProps: { taskId: t.id } })}>
          {t.title}
        </div>
      ))}
    </div>
  );
}
```

### 3. Unconditional WebSocket Listener Registration

Remove the `connected` guard and re-attach on the `connect` event to survive reconnections.

```tsx
// CalendarView.tsx
useEffect(() => {
  const socket = getSocket();
  if (!socket) return;

  const attachListeners = () => {
    socket.on(WsEvent.TASK_CREATED, invalidate);
    socket.on(WsEvent.TASK_UPDATED, invalidate);
    socket.on(WsEvent.TASK_DELETED, invalidate);
    socket.on(WsEvent.BOARD_DELETED, invalidate);
  };

  if (socket.connected) attachListeners();
  socket.on('connect', attachListeners);

  return () => {
    socket.off('connect', attachListeners);
    socket.off(WsEvent.TASK_CREATED, invalidate);
    // ... other offs
  };
}, [queryClient]);
```

### 4. Structured Mutations with Optimistic UI

Replace bare `api.patch()` with `useMutation`, optimistic updates, and cross-cache invalidation.

```tsx
// BoardCalendarView.tsx
const updateTaskMutation = useMutation({
  mutationFn: ({ id, data }) => api.patch(`/tasks/${id}`, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
  },
});

function handleEventDrop(taskId: string, newDate: string) {
  queryClient.setQueryData(
    ['board', boardId],
    (old) => {
      if (!old) return old;
      return {
        ...old,
        lists: old.lists.map((list) => ({
          ...list,
          tasks: (list.tasks ?? []).map((t) =>
            t.id === taskId ? { ...t, dueDate: newDate } : t
          ),
        })),
      };
    }
  );

  updateTaskMutation.mutate(
    { id: taskId, data: { dueDate: newDate } },
    {
      onError: () => {
        queryClient.invalidateQueries({ queryKey: ['board', boardId] });
        toast.error('Failed to reschedule task');
      },
    }
  );
}
```

### 5. TypeScript Strict Null Checks

Coalesce optional nested arrays before chaining array methods.

```tsx
// Before — TS18048
const task = board.lists.flatMap((l) => l.tasks).find((t) => t.id === id);

// After
const task = board.lists
  .flatMap((l) => l.tasks ?? [])
  .find((t) => t!.id === taskId);
```

### 6. Idiomatic Navigation

Use `useRouter().push()` instead of `window.open` for internal routes.

```tsx
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push(`/boards/${task.list.boardId}`);
```

### 7. NestJS Rate Limiting

Apply `@Throttle` to new data-fetching endpoints.

```ts
// tasks.controller.ts
import { Throttle } from '@nestjs/throttler';

@Get('calendar')
@Throttle({ default: { limit: 30, ttl: 60_000 } })
findByDateRange(@Query() query: CalendarQueryDto, @Request() req) {
  return this.tasksService.findByDateRange(req.user.id, query);
}
```

### 8. Bounded Date Range Validation

Add a custom class-validator constraint to prevent unbounded queries.

```ts
// calendar-query.dto.ts
@ValidatorConstraint({ async: false })
class MaxDateSpanConstraint implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments) {
    const obj = args.object as CalendarQueryDto;
    const start = new Date(obj.startDate);
    const end = new Date(endDate);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 372;
  }
  defaultMessage() {
    return 'Date range must be between 0 and 372 days';
  }
}

export class CalendarQueryDto {
  @IsISO8601({ strict: true }) startDate: string;
  @IsISO8601({ strict: true })
  @Validate(MaxDateSpanConstraint)
  endDate: string;
  // ... other fields
}
```

## Why This Works

- **SSR exclusion** bypasses FullCalendar's Preact layer, which cannot hydrate against React 19's server-rendered markup. The dynamic import defers rendering to the client where the Preact shim runs safely.
- **Explicit `Draggable` instantiation** bridges the gap between FullCalendar's internal drag registry and external DOM nodes. Without it, the calendar's drop zone has no source elements to recognize.
- **Unconditional listener registration** respects Socket.io's async connection lifecycle. Listeners attach to the socket instance immediately; if the connection drops and reconnects, the `connect` handler re-attaches them so events never go unhandled.
- **Optimistic mutations** update the local cache before the server responds, eliminating perceptible lag. Cross-cache invalidation (`['board', boardId]` + `['calendar']`) ensures both the Kanban and calendar views show consistent state.
- **Null coalescing** satisfies TypeScript's `strictNullChecks` by proving to the compiler that the array operation is safe, preventing runtime `undefined` exceptions.

## Prevention

- **Library Integration Checklist:** When adding a non-React-native library to Next.js, verify SSR compatibility first. If it uses its own VDOM (Preact, Vue, etc.), wrap it in `next/dynamic({ ssr: false })`.
- **Read FullCalendar's "External Dragging" guide:** The `Draggable` requirement is documented but easy to miss when scanning API props. Bookmark the relevant section for the team.
- **Socket Lifecycle Standard:** Ban `if (!socket.connected) return;` in listener setup code. Standardize that all Socket.io listeners must register unconditionally inside `useEffect`, with re-attachment on `connect`.
- **Mutation Standard:** Ban bare `api.patch` / `fetch` promises in React components. All server mutations must use `useMutation` with at minimum an `onError` toast and a cache invalidation strategy.
- **Navigation Audit:** Lint against `window.open` and `window.location.href` for internal routes. Enforce `useRouter` via ESLint rules or code review.
- **New Endpoint Checklist:** Every new controller method requires a security review — `@Throttle`, `@UseGuards`, and input DTO validation bounds — before merging.
- **DTO Boundary Validation:** Any endpoint accepting date ranges, numeric offsets, or page sizes must have custom validators enforcing maximums.

## Related Issues

- [UI Design System — Component Library, Tokens, and Drag-and-Drop Kanban](../design-patterns/ui-design-system-redesign-2026-05-03.md) — shares patterns for optimistic updates with TanStack Query and WebSocket provider setup in the same Next.js app.
