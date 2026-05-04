---
title: "Next.js module resolution failure from incorrect relative import depth"
date: 2026-05-02
category: build-errors
module: web-frontend
problem_type: build_error
component: frontend_stimulus
symptoms:
  - "Module not found: Can't resolve '../../stores/auth'"
  - "Module not found: Can't resolve '../../lib/api'"
  - "Module not found: Can't resolve '../../components/Header'"
root_cause: scope_issue
resolution_type: code_fix
severity: high
tags: [next-js, import-paths, module-resolution, typescript]
---

# Next.js Module Resolution Failure from Incorrect Relative Import Depth

## Problem

Files in deeply nested Next.js App Router directories (e.g., `app/boards/[id]/page.tsx`) used relative import paths that were one directory level too shallow, causing the build to fail with "Module not found" errors for stores, lib, and components.

## Symptoms

- `Module not found: Can't resolve '../../stores/auth'` in `apps/web/src/app/boards/[id]/page.tsx`
- Same error for `../../lib/api`, `../../lib/socket`, `../../components/Header`, `../../components/ListColumn`, `../../components/CreateListModal`, `../../components/ProtectedRoute`
- Build fails completely — no pages can be generated

## What Didn't Work

- **Fixing only the auth store import** — The same path depth issue affected all 7 relative imports in the file. Fixing one revealed the rest sequentially during build.

## Solution

Correct all relative import paths from `../../` to `../../../` to account for the 3-level nesting depth (`app/boards/[id]/`):

```diff
- import { useAuthStore } from '../../stores/auth';
- import { api } from '../../lib/api';
- import { getSocket } from '../../lib/socket';
- import Header from '../../components/Header';
- import ListColumn from '../../components/ListColumn';
- import CreateListModal from '../../components/CreateListModal';
- import ProtectedRoute from '../../components/ProtectedRoute';
+ import { useAuthStore } from '../../../stores/auth';
+ import { api } from '../../../lib/api';
+ import { getSocket } from '../../../lib/socket';
+ import Header from '../../../components/Header';
+ import ListColumn from '../../../components/ListColumn';
+ import CreateListModal from '../../../components/CreateListModal';
+ import ProtectedRoute from '../../../components/ProtectedRoute';
```

Path resolution from `apps/web/src/app/boards/[id]/page.tsx`:
- `../` → `app/boards/`
- `../../` → `app/` (wrong — no stores/lib/components here)
- `../../../` → `src/` (correct — contains stores/, lib/, components/)

Additionally, two type-level fixes were needed in the same file:
1. Added explicit type annotation on the map callback: `(list: List & { tasks: Task[] })` to satisfy `ListColumn`'s required `tasks` prop
2. Added missing `onListReorder` prop to `ListColumn` component (required by `ListColumnProps` interface)

## Why This Works

The App Router's nested directory structure (`app/boards/[id]/`) means files are 3 levels deep from `src/`. Relative imports must go up 3 levels (`../../../`) to reach `src/`, then down into the target directory. The original `../../` paths only went up 2 levels, landing in `app/` where `stores/`, `lib/`, and `components/` don't exist.

## Prevention

- **Count directory levels** when writing relative imports in deeply nested App Router paths. From `app/[segment]/[segment]/page.tsx`, you need `../../../` to reach `src/`.
- **Consider using path aliases** (e.g., `@/stores/auth`, `@/components/Header`) configured in `tsconfig.json` to avoid manual depth counting entirely. This is the most robust solution for large Next.js projects.
- **Run the build after creating new deeply-nested pages** to catch import errors early, before they accumulate across multiple files.

## Related Issues

- Also fixed hydration mismatch in `ProtectedRoute` component in the same session (see `docs/solutions/runtime-errors/`)
- Components referenced here (Header, ListColumn, ProtectedRoute, etc.) were later redesigned with a design system and drag-and-drop support (see `docs/solutions/design-patterns/ui-design-system-redesign-2026-05-03.md`)
