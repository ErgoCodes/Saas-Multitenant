---
title: "Next.js hydration mismatch from SSR-incompatible auth guard"
date: 2026-05-02
category: runtime-errors
module: web-frontend
problem_type: runtime_error
component: authentication
symptoms:
  - "Hydration failed because the server rendered HTML didn't match the client"
  - "Server renders null while client renders protected content div"
  - "Dashboard page shows hydration error in browser console"
root_cause: async_timing
resolution_type: code_fix
severity: medium
tags: [next-js, hydration, ssr, protected-route, zustand, local-storage]
---

# Next.js Hydration Mismatch from SSR-Incompatible Auth Guard

## Problem

The `ProtectedRoute` component renders different HTML on the server vs the client because it reads authentication state from `localStorage`, which is unavailable during SSR. This causes a React hydration mismatch where the server renders `null` (unauthenticated) but the client renders the protected page content (authenticated with stored token).

## Symptoms

- `Hydration failed because the server rendered HTML didn't match the client` error in browser console
- Server renders `null` (no localStorage available) while client renders `<div className="min-h-screen bg-gray-50">` (token exists)
- Affects all pages wrapped in `ProtectedRoute` (dashboard, boards)

## What Didn't Work

- **Checking `typeof window !== 'undefined'` in the auth store** — This prevents the store from crashing during SSR but doesn't solve the tree mismatch. The store still returns `isAuthenticated: false` on the server and `true` on the client, causing `ProtectedRoute` to render different children.

## Solution

Add a mount-gated rendering pattern to `ProtectedRoute`. Use a `useState(false)` for `mounted` that becomes `true` in a `useEffect` (which only runs on the client). Before mount, render a consistent placeholder that matches between server and client:

```tsx
// apps/web/src/components/ProtectedRoute.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/auth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
```

Key changes:
1. Added `mounted` state initialized to `false`
2. Set `mounted` to `true` in a `useEffect` with empty deps (client-only)
3. Before mount: render a consistent placeholder `<div className="min-h-screen bg-gray-50" />`
4. After mount: run the existing auth check and redirect logic
5. Redirect guard now checks `mounted && !isAuthenticated` to prevent premature navigation

## Why This Works

React hydration requires the server-rendered HTML tree to match the initial client render exactly. The `mounted` state starts as `false` on both server and client, so both render the same placeholder `<div>`. Only after the client hydrates and runs `useEffect` does `mounted` become `true`, at which point React has already completed hydration and can safely diff the tree. The placeholder uses the same background color as the protected pages to minimize visual flash.

## Prevention

- **Always gate client-only state behind `useEffect`** when the component renders during SSR. Any state that differs between server and client (localStorage, `window` dimensions, browser APIs) must be deferred until after mount.
- **Use a consistent placeholder** that matches the page layout to avoid layout shift. A `<div>` with the same background color is invisible to users.
- **Consider Next.js `dynamic()` with `ssr: false`** as an alternative for components that genuinely cannot render on the server, though mount-gating is lighter weight for simple guards.

## Related Issues

- Also fixed broken relative imports in `apps/web/src/app/boards/[id]/page.tsx` in the same session (see `docs/solutions/build-errors/`)
- ProtectedRoute was later redesigned: the placeholder `<div>` was replaced with a loading `<Spinner>` as part of the UI design system overhaul (see `docs/solutions/design-patterns/ui-design-system-redesign-2026-05-03.md`)
