---
title: "refactor: Migrate UI to shadcn with module-based architecture"
type: refactor
status: active
date: 2026-05-03
---

# refactor: Migrate UI to shadcn with module-based architecture

## Summary

Replace all custom hand-rolled UI components in `packages/ui/` with shadcn equivalents, establish a new CSS-variable-based theme, and reorganize `apps/web/src/` into a module-based architecture with container/presentational separation. The migration preserves all existing behavior — same flows, same data, same pages — with a new skin and a modern component foundation.

---

## Problem Frame

The current UI layer is hand-rolled with Tailwind utility classes directly in 9 custom component exports and scattered across ~12 feature files. This creates maintenance burden (every component needs hand-coded accessibility, focus management, keyboard handling), limits component richness (no DropdownMenu, Toast, Sheet, Tooltip), and couples the visual identity to brittle color tokens defined in `tailwind.config.ts`. The module structure is flat — all 8 feature components live in `apps/web/src/components/` with no separation of concerns between data-fetching logic and presentation.

---

## Requirements

- R1. All 9 existing custom UI component exports (Button, Input, Textarea, Select, Modal, Card, Badge, Spinner, Skeleton) are replaced by shadcn equivalents in `packages/ui/` — Spinner migrated in U3, Skeleton in U4
- R2. New CSS-variable-based theme replaces the `tailwind.config.ts` token system (surface, brand, accent, success, danger) — existing pages render with equivalent visual appearance
- R3. `apps/web/src/` is reorganized into module folders (`modules/dashboard/`, `modules/board/`, `modules/auth/`, `modules/landing/`, `modules/layout/`) with `components/` (presentational) and `containers/` (data-fetching) separation
- R4. All imports use `@/` path aliases instead of relative paths
- R5. New shadcn components added and wired: Label (form labels — migrated from CSS utility class), DropdownMenu (header user menu), Sheet (task detail), Toast (action feedback), Avatar, Tooltip, Separator (dependency of Dialog/DropdownMenu)
- R6. All 5 existing routes (`/`, `/login`, `/register`, `/dashboard`, `/boards/[id]`) render identically to pre-migration state
- R7. Old custom components in `packages/ui/src/components/` and unused CSS utilities in `globals.css` are deleted post-migration

---

## Scope Boundaries

- No API, backend, database, or authentication changes
- No new page routes beyond the 5 existing routes
- No test infrastructure setup (zero tests exist pre-migration; visual verification suffices for this scope)
- No dark mode implementation (deferred — the CSS variable system makes it straightforward to add later)
- No layout redesign — same page structure, new component primitives
- New R5 components (DropdownMenu, Sheet, Toast, Avatar, Tooltip) are added as infrastructure only — no new feature flows or behaviors until wired in U6. Their wiring is limited to: DropdownMenu in Header for user menu, Toast for mutation feedback, Avatar for user display. The Sheet component is installed but deferred for a follow-up PR that defines its task-detail content and interaction flow.

### Deferred to Follow-Up Work

- Dark mode support: separate PR after migration stabilizes, leveraging the already-established CSS variable theme
- Visual regression test suite: separate PR adding Playwright smoke tests for all 5 routes
- Migrate `BoardCard.tsx` and `TaskCard.tsx` to use shadcn Card/Badge compound components: future refactor to eliminate remaining inline Tailwind in feature components

---

## Context & Research

### Relevant Code and Patterns

- `packages/ui/src/components/` — 8 files, 9 component exports (Button, Input, Textarea, Select, Modal, Card, Badge, Spinner, Skeleton — Spinner and Skeleton co-exist in Spinner.tsx) with `forwardRef`, `useEffect` for Modal, compound Tailwind classes
- `apps/web/tailwind.config.ts` — custom color tokens (surface, brand, accent, success, danger), custom shadows (soft, card, elevated, modal), custom animations (fade-in, slide-up, scale-in)
- `apps/web/src/app/globals.css` — Google Fonts import, `@layer base` (body/heading/selection styles), `@layer components` (`.btn-*`, `.card`, `.input`, `.label`, `.modal-*`, `.badge`, `.tag`, `.skeleton` — **all unused** by any consumer)
- `apps/web/next.config.ts` — `transpilePackages: ['@task-manager/ui']` (critical for shadcn + Radix deps in packages/ui)
- `apps/web/tsconfig.json` — `"paths": {"@/*": ["./src/*"]}` already configured but unused (all imports are relative)
- `apps/web/src/components/` — 8 feature components: BoardCard (inline styling), TaskCard (inline + dnd-kit), ListColumn (inline), Header (inline), CreateBoardModal (uses Button, Input, Textarea, Modal), CreateTaskModal (uses Button, Input, Textarea, Select), CreateListModal (uses Button, Input), ProtectedRoute (uses Spinner)
- Current import patterns: relative paths (`../../stores/auth`, `../lib/api`); 7 files use cross-directory relative imports that break under module restructuring
- Pre-existing bug: `TaskCard.tsx` line 13 uses `bg-orange-100 text-orange-700` for HIGH priority — `orange` is not defined in the custom palette (other priorities use `success`, `accent`, `danger` tokens); resolve by mapping to `accent` token

### Institutional Learnings

- `docs/solutions/build-errors/nextjs-incorrect-relative-import-depth.md` — Path aliases prevent import breakage during file moves. Use `@/` aliases before restructuring to decouple imports from file locations.
- `docs/solutions/runtime-errors/nextjs-hydration-mismatch-auth-guard.md` — ProtectedRoute relies on Zustand + localStorage, which is SSR-incompatible. Must preserve the `mounted` state + `useEffect` gate pattern when moving to `modules/auth/`.

### External References

- shadcn docs: https://ui.shadcn.com — component API references, theming with CSS variables, monorepo setup
- Radix UI primitives: https://www.radix-ui.com — accessibility, keyboard handling, focus management
- lucide-react: https://lucide.dev — icon library bundled with shadcn (Loader2 for spinner replacement)

---

## Key Technical Decisions

- **shadcn install location: `packages/ui/`** — Keeps components as shared primitives, consistent with the monorepo's established boundary. The existing `transpilePackages: ['@task-manager/ui']` in `next.config.ts` ensures Radix deps are transpiled. shadcn's `components.json` is configured with `aliases: { components: "./src/components", ui: "./src/components" }` to output into the existing `packages/ui/src/components/`.

- **Color token migration: CSS variable shim** — Rather than atomically replacing all ~135 `text-surface-*`/`bg-brand-*` references, a shim layer maps old token names to new CSS variables. The new theme defines shadcn's semantic variables (`--primary`, `--destructive`, `--muted`, etc.) and the shim aliases them back to the old names (`--surface-50`, `--brand-600`, etc.) so existing class references continue resolving. Each consumer is migrated to shadcn semantic tokens file-by-file; the shim is removed once all references are migrated. This is the only approach that keeps all 5 routes working throughout the migration window.

- **Spinner replacement: `Loader2` from lucide-react** — shadcn has no Spinner component. lucide-react (already a shadcn dependency) provides `Loader2` which wraps `<Loader2 className="h-4 w-4 animate-spin" />`. A thin wrapper in `packages/ui/src/components/spinner.tsx` preserves the `size` prop API (`sm`/`md`/`lg`) for backward compatibility with existing consumers like `ProtectedRoute`.

- **Button loading prop: custom extension** — shadcn's Button has no `loading` prop. The migration adds a thin wrapper in `packages/ui/src/components/button.tsx` that accepts `loading` and renders `<Loader2>` alongside children while disabling the button. This preserves the existing consumer API (used in 5 components). The `danger` variant maps to shadcn's `destructive`.

- **Modal→Dialog migration: consumer API rewrite** — The existing `<Modal open onClose title>` API is replaced by shadcn's `<Dialog><DialogContent><DialogHeader><DialogTitle>` compound pattern. `CreateBoardModal.tsx` is the sole consumer and will be rewritten inline during module restructuring. The Dialog overlay, Escape key handling, and body scroll lock come from Radix primitives — no custom code needed.

- **Select migration: native `<select>` → Radix Select** — The existing `<Select options={[...]}>` native element API is replaced by shadcn's `<Select><SelectTrigger><SelectValue><SelectContent><SelectItem>` compound pattern. `CreateTaskModal.tsx` is the sole consumer and will be rewritten. The Radix Select renders via portal by default; `position="popper"` is used to avoid z-index conflicts with dnd-kit's DragOverlay.

- **Container/presentational boundary** — A container handles: data fetching (TanStack Query hooks), mutations, state management (Zustand stores), callback wiring. A presentational component receives data and callbacks via props and renders markup — it has no knowledge of query clients, routers, or stores. Form state (`useState` for controlled inputs) lives in the presentational component, since it's intrinsic to rendering. The container owns the `useMutation` hook and passes the mutation function + loading state as props. **Two explicit exceptions:** (1) DnD kit hooks (`useSortable`, `useDroppable`) are presentation-layer behavior — they control rendering transforms, not data fetching; they belong in `components/`. (2) The `AuthGuard` component uses `useRouter` for redirect-on-unauthenticated — this is a routing concern; it belongs in `containers/`, not `components/`.

- **Module structure** — Five modules mirror the five routes: `modules/landing/`, `modules/auth/` (login + register + ProtectedRoute), `modules/dashboard/` (BoardCard + CreateBoardModal), `modules/board/` (ListColumn + TaskCard + CreateTaskModal + CreateListModal), `modules/layout/` (Header). Each module gets `components/` and `containers/` subdirectories. Module-specific hooks/types/utils live in co-located subdirectories as needed.

- **Path alias strategy** — The existing `@/* → ./src/*` alias covers all directories under `src/`, including the new `modules/` directory. No additional aliases are needed. All imports are rewritten from relative paths (`../../stores/auth`) to `@/` aliases (`@/stores/auth`) as part of the module restructuring.

---

## Open Questions

### Resolved During Planning

- Where shadcn components live: `packages/ui/src/components/` (not `apps/web/src/components/ui/`)
- Spinner replacement: `Loader2` from lucide-react with size-prop wrapper
- Color token strategy: CSS variable shim for incremental migration
- Module granularity: one module per route (5 modules)
- Path aliases: `@/*` is sufficient — no additional entries needed

### Deferred to Implementation

- Exact HSL values for the new theme palette — derive from existing hex values in `tailwind.config.ts` (e.g., brand-600 `#6366f1` → hsl `243 75% 59%`), NOT from shadcn's default theme generator, to preserve the existing indigo brand identity
- Whether `BoardCard.tsx` and `TaskCard.tsx` get refactored to use shadcn Card/Badge compound components during this migration, or deferred — at minimum, their inline Tailwind classes are updated to avoid referencing deprecated token names
- Final color of Priority.HIGH badge (currently `orange`, not in palette) — implementer chooses `accent` token as replacement
- Whether `globals.css` Google Fonts `@import` is migrated to `next/font/google` — deferred unless implementer finds it low-effort

---

## Output Structure

This is the expected file layout after migration. Created and modified files are specified per implementation unit. Deleted files are listed in U7.

```
packages/ui/
└── src/
    └── components/
        ├── button.tsx          (NEW — shadcn Button wrapper with loading prop)
        ├── input.tsx           (NEW — shadcn Input re-export)
        ├── textarea.tsx        (NEW — shadcn Textarea re-export)
        ├── select.tsx          (NEW — shadcn Select wrapper)
        ├── dialog.tsx          (NEW — shadcn Dialog re-export)
        ├── card.tsx            (NEW — shadcn Card re-export)
        ├── badge.tsx           (NEW — shadcn Badge re-export)
        ├── skeleton.tsx        (NEW — shadcn Skeleton re-export)
        ├── spinner.tsx         (NEW — Loader2 wrapper with size prop)
        ├── dropdown-menu.tsx   (NEW — shadcn DropdownMenu)
        ├── sheet.tsx           (NEW — shadcn Sheet)
        ├── toast.tsx           (NEW — shadcn Toast)
        ├── sonner.tsx          (NEW — Toast provider)
        ├── use-toast.tsx       (NEW — Toast hook)
        ├── avatar.tsx          (NEW — shadcn Avatar)
        ├── tooltip.tsx         (NEW — shadcn Tooltip)
        ├── label.tsx           (NEW — shadcn Label)
        └── separator.tsx       (NEW — shadcn Separator)
    └── index.ts                (MODIFY — new exports)

apps/web/
├── src/
│   ├── app/
│   │   └── globals.css          (MODIFY — CSS variables + merged base layer)
│   ├── modules/
│   │   ├── landing/
│   │   │   └── components/
│   │   │       └── HeroSection.tsx    (NEW — extracted from /page.tsx)
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx      (NEW — presentational)
│   │   │   │   └── RegisterForm.tsx   (NEW — presentational)
│   │   │   └── containers/
│   │   │       ├── LoginPage.tsx      (NEW — data/state, wraps LoginForm)
│   │   │       ├── RegisterPage.tsx   (NEW — data/state, wraps RegisterForm)
│   │   │       └── AuthGuard.tsx      (NEW — container, migrated ProtectedRoute with useRouter)
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   │   ├── BoardCard.tsx      (MOVED from web/src/components/)
│   │   │   │   └── DashboardHeader.tsx(NEW — title + CreateBoard button area)
│   │   │   └── containers/
│   │   │       ├── BoardGrid.tsx      (NEW — query + grid layout)
│   │   │       └── CreateBoardDialog.tsx (NEW — state + mutation, wraps shadcn Dialog)
│   │   ├── board/
│   │   │   ├── components/
│   │   │   │   ├── ListColumn.tsx     (MOVED, split into presentational)
│   │   │   │   ├── TaskCard.tsx       (MOVED, split into presentational)
│   │   │   │   └── InlineTaskForm.tsx (NEW — presentational task creation form)
│   │   │   └── containers/
│   │   │       ├── BoardView.tsx      (NEW — query + DnD context + state)
│   │   │       ├── CreateListForm.tsx (NEW — state + mutation)
│   │   │       └── CreateTaskForm.tsx (NEW — state + mutation)
│   │   └── layout/
│   │       ├── components/
│   │       │   └── Header.tsx         (MOVED, split presentational)
│   │       └── containers/
│   │           └── AppHeader.tsx      (NEW — auth-aware header container)
│   └── lib/
│       └── ...                        (UNCHANGED — api.ts, socket.ts)
│   └── stores/
│       └── auth.ts                    (UNCHANGED)
└── tailwind.config.ts                 (MODIFY — CSS variable integration)

packages/config/
└── tailwind/
    └── tailwind.config.ts             (DELETE — empty skeleton, unused)
```

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

### Color Token Shim Strategy

```
:root {
  /* shadcn semantic layer (new — destination) */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 243 75% 59%;       /* maps from brand-600 */
  --primary-foreground: 0 0% 100%;
  --secondary: 210 40% 96%;     /* maps from surface-100 */
  --secondary-foreground: 222.2 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --destructive: 0 72% 51%;     /* maps from danger-600 */
  --destructive-foreground: 0 0% 100%;
  --accent: 45 93% 47%;         /* maps from old accent-500 */
  --accent-foreground: 0 0% 0%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.5rem;
  
  /* shim layer (old tokens → new variables — transitional) */
  --surface-50: var(--background);
  --surface-100: var(--secondary);
  --surface-200: 214.3 31.8% 91.4%;
  --surface-300: 213 27% 84%;
  --surface-400: 215 16% 47%;
  --surface-500: var(--muted-foreground);
  --surface-600: 215 25% 27%;
  --surface-700: 217 33% 17%;
  --surface-800: 222 47% 11%;
  --surface-900: var(--foreground);
  --surface-950: 222.2 84% 2%;       /* landing page dark background */
  --brand-50: 238 100% 96%;
  --brand-100: 238 100% 93%;
  --brand-200: 238 95% 85%;
  --brand-400: 243 94% 70%;
  --brand-500: 243 87% 64%;
  --brand-600: var(--primary);
  --brand-700: 243 64% 51%;
  --brand-800: 244 55% 41%;
  --brand-900: 245 58% 30%;
  /* ... similar for accent, success, danger tokens */
}
```

`tailwind.config.ts` references these via `hsl(var(--token))`:
```typescript
colors: {
  surface: { 50: 'hsl(var(--surface-50))', 100: 'hsl(var(--surface-100))', /* ... */ },
  brand:   { 50: 'hsl(var(--brand-50))',   /* ... */                        600: 'hsl(var(--brand-600))' },
  // etc.
}
```

New shadcn components use `bg-primary`, `text-primary-foreground`. Old inline classes (`bg-surface-50`, `text-brand-600`) continue resolving through the shim. Each consumer file is migrated to shadcn semantic tokens over time; the shim is deleted in the final cleanup pass.

### Container/Presentational Contract

```
Container (smart)                    Presentational (dumb)
┌──────────────────────┐            ┌──────────────────────┐
│ useQuery / useMutation│            │ Receives:            │
│ useAuthStore          │──props──▶ │  data, onCallbacks,   │
│ useState (modal open) │            │  isLoading, error     │
│ useRouter             │            │                       │
│ error handling        │◀─callback─│ Renders:              │
│ query invalidation    │            │  shadcn components    │
└──────────────────────┘            │  Tailwind classes     │
                                    │  form state (useState) │
                                    └──────────────────────┘
```

---

## Implementation Units

- U1. **Clean up prerequisites: fix existing bug, delete dead CSS, enable @/ aliases**

**Goal:** Remove pre-existing issues that would surface during migration and establish a clean baseline. Fix the `bg-orange-100` bug in TaskCard, delete the unused `@layer components` block in globals.css, and rewrite all existing imports to use `@/` path aliases.

**Requirements:** R4, R7

**Dependencies:** None

**Files:**
- Modify: `apps/web/src/components/TaskCard.tsx`
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/src/app/login/page.tsx`
- Modify: `apps/web/src/app/register/page.tsx`
- Modify: `apps/web/src/app/dashboard/page.tsx`
- Modify: `apps/web/src/app/boards/[id]/page.tsx`
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/components/BoardCard.tsx`
- Modify: `apps/web/src/components/CreateBoardModal.tsx`
- Modify: `apps/web/src/components/CreateListModal.tsx`
- Modify: `apps/web/src/components/CreateTaskModal.tsx`
- Modify: `apps/web/src/components/Header.tsx`
- Modify: `apps/web/src/components/ListColumn.tsx`
- Modify: `apps/web/src/components/ProtectedRoute.tsx`
- Modify: `apps/web/src/hooks/useSocket.ts`
- Modify: `apps/web/src/app/providers.tsx`
- Modify: `packages/config/tailwind/tailwind.config.ts`
- Modify: `apps/web/tsconfig.json`

**Approach:**
- Fix `TaskCard.tsx` line 13: replace `bg-orange-100 text-orange-700` with `bg-accent-100 text-accent-700` for Priority.HIGH
- Delete the entire `@layer components` block from `globals.css` (lines 29-106 — `.btn-*`, `.card`, `.input`, `.label`, `.modal-*`, `.badge`, `.tag`, `.skeleton`). These classes are confirmed unused by any consumer.
- Verify `@/*` alias in `tsconfig.json`: `"paths": {"@/*": ["./src/*"]}` is sufficient — covers `modules/`, `components/`, `stores/`, `lib/`, `hooks/`
- Rewrite every relative import across all files to use `@/` aliases. Example: `../../stores/auth` → `@/stores/auth`, `../lib/api` → `@/lib/api`, `../../../components/Header` → `@/components/Header`. This decouples imports from file locations before restructuring in U6.
- Delete `packages/config/tailwind/tailwind.config.ts` (empty skeleton with no content, unused by any consumer)

**Patterns to follow:**
- `apps/web/tsconfig.json` — existing `@/*` path mapping

**Test scenarios:**
- Happy path: `tsc --noEmit` passes in `apps/web/` with all imports rewritten to `@/` aliases
- Edge case: No relative import paths remaining in any file under `apps/web/src/`
- Happy path: `bg-orange-100` no longer appears in the codebase
- Happy path: `@layer components` block is absent from `globals.css`
- Edge case: `globals.css` `@layer base` block (body, heading, selection) is preserved untouched

**Verification:**
- `pnpm run type-check` passes without errors in both `apps/web` and `packages/ui`
- No `orange` color reference remains in the codebase
- `globals.css` contains only `@import`, `@tailwind` directives, and `@layer base` — no `@layer components`

---

- U2. **Install shadcn and configure theme with CSS variable shim**

**Goal:** Set up shadcn in `packages/ui/`, establish the new CSS variable theme, and create the token shim so both old and new class names resolve during migration.

**Requirements:** R1, R2

**Dependencies:** U1

**Files:**
- Create: `packages/ui/tsconfig.json` (pre-init — minimal config with `@/*` → `./src/*` alias)
- Create: `packages/ui/src/globals.css` (pre-init — `@tailwind` directives for shadcn CLI)
- Create: `packages/ui/components.json`
- Create: `packages/ui/src/components/ui/` (shadcn component target directory, via CLI)
- Create: `packages/ui/src/components/` (R5 component files — `npx shadcn add` generates button.tsx, input.tsx, textarea.tsx, label.tsx, dialog.tsx, select.tsx, card.tsx, badge.tsx, skeleton.tsx, dropdown-menu.tsx, sheet.tsx, avatar.tsx, tooltip.tsx, separator.tsx, sonner.tsx)
- Modify: `packages/ui/package.json`
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/tailwind.config.ts`
- Modify: `apps/web/package.json`
- Modify: `apps/web/src/app/layout.tsx` (mount `<Toaster />` from sonner)

**Approach:**
- **Pre-init setup:** `packages/ui/` needs a minimal `tsconfig.json` and a CSS file for shadcn CLI to work. Create `packages/ui/tsconfig.json` with `{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }` and `packages/ui/src/globals.css` containing `@tailwind base; @tailwind components; @tailwind utilities;`. Point `components.json` `aliases.ui` to `./src/components` (not `./src/components/ui`) to output into the existing directory flat.
- Run `npx shadcn@latest init` in `packages/ui/` with configuration: TypeScript, Tailwind CSS v3, base color Slate, CSS variables enabled, CSS file `src/globals.css`, output directory `./src/components`
- After `shadcn init` succeeds, run `npx shadcn@latest add` for each required component in `packages/ui/`: `button`, `input`, `textarea`, `label`, `dialog`, `select`, `card`, `badge`, `skeleton`, `dropdown-menu`, `sheet`, `avatar`, `tooltip`, `separator`. Also run `npx shadcn@latest add sonner` for Toast infrastructure. These generate the component files referenced in the Output Structure.
- Install required deps in `packages/ui/`: `@radix-ui/react-dialog`, `@radix-ui/react-select`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-slot`, `@radix-ui/react-avatar`, `@radix-ui/react-tooltip`, `@radix-ui/react-separator`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `sonner`
- Install matching deps in `apps/web/package.json` (same Radix/lucide/tailwind-merge packages) — required because apps/web bundles the transpiled output from packages/ui
- Add `tailwindcss-animate` plugin to both `apps/web/package.json` devDeps and `apps/web/tailwind.config.ts` plugins
- Define CSS variables in `apps/web/src/app/globals.css` (not `packages/ui/src/globals.css` — that file only exists for CLI bootstrapping; the actual CSS cascade runs through apps/web): shadcn semantic layer + shim layer. **Preserve the Google Fonts `@import` line at the top of the file** — do not delete it during CSS variable additions.
- Merge shadcn's `@layer base` into the existing `globals.css` `@layer base` (add `* { border-color: hsl(var(--border)) }`, update `body` to use `bg-background text-foreground font-body antialiased`)
- Add `@layer base { :root { ... } }` with all CSS variable definitions above the existing `@layer base` body/heading rules
- Mount `<Toaster />` from `sonner` in `apps/web/src/app/layout.tsx` (inside `<body>` after `<Providers>`) so Toast infrastructure works when wired later in U6
- **Screenshot verification:** before proceeding to U3, capture screenshots of all 5 routes via dev server and compare pixel-by-pixel against pre-U2 screenshots to confirm the shim preserves visual equivalence

**Patterns to follow:**
- shadcn init config: https://ui.shadcn.com/docs/installation/next
- shadcn theming: https://ui.shadcn.com/docs/theming

**Test scenarios:**
- Happy path: `npx shadcn@latest init` completes without errors in `packages/ui/`
- Happy path: `pnpm run build` succeeds after shadcn + Radix deps installed
- Happy path: Loading `/dashboard` renders with colors equivalent to pre-migration (shim resolves old `bg-surface-50`, `text-brand-600` correctly)
- Edge case: `pnpm run type-check` passes — no type errors from new dependencies
- Integration: shadcn components imported from `@task-manager/ui` resolve correctly in apps/web (confirmed by importing a test component)

**Verification:**
- `components.json` exists in `packages/ui/` with correct configuration
- `globals.css` has `:root { --background: ...; --primary: ...; }` block with both shadcn and shim variables
- `tailwind.config.ts` `theme.extend.colors` uses `hsl(var(--...))` references
- Dev server starts and renders `/dashboard` with correct colors

---

- U3. **Migrate low-risk components: Button, Input, Textarea, Spinner→Loader2, add new Label**

**Goal:** Replace 4 existing custom components (Button, Input, Textarea, Spinner) with shadcn equivalents, and add the new shadcn Label component. Button gets a loading-prop wrapper. Input and Textarea drop the label/error props (consumers will add shadcn Label separately). Spinner becomes a Loader2 wrapper preserving the size prop API.

**Requirements:** R1

**Dependencies:** U2

**Files:**
- Create: `packages/ui/src/components/button.tsx` (NEW — shadcn Button wrapper)
- Create: `packages/ui/src/components/input.tsx` (NEW — shadcn Input re-export)
- Create: `packages/ui/src/components/textarea.tsx` (NEW — shadcn Textarea re-export)
- Create: `packages/ui/src/components/label.tsx` (NEW — shadcn Label re-export)
- Create: `packages/ui/src/components/spinner.tsx` (NEW — Loader2 wrapper)
- Modify: `packages/ui/src/index.ts`
- Delete: `packages/ui/src/components/Button.tsx`
- Delete: `packages/ui/src/components/Input.tsx`
- Delete: `packages/ui/src/components/Textarea.tsx`
- Delete: `packages/ui/src/components/Spinner.tsx`
- Modify: `apps/web/src/components/CreateBoardModal.tsx`
- Modify: `apps/web/src/components/CreateListModal.tsx`
- Modify: `apps/web/src/components/CreateTaskModal.tsx`
- Modify: `apps/web/src/components/ProtectedRoute.tsx`
- Modify: `apps/web/src/app/login/page.tsx`
- Modify: `apps/web/src/app/register/page.tsx`
- Modify: `apps/web/src/app/dashboard/page.tsx`
- Modify: `apps/web/src/app/boards/[id]/page.tsx`

**Approach:**
- `button.tsx`: Thin wrapper around shadcn Button that maps `variant` (primary→default, secondary→outline, ghost→ghost, danger→destructive), preserves `size` (sm/md/lg), and adds `loading` prop that renders `<Loader2 className="animate-spin" />` and disables the button
- `input.tsx`: Re-export shadcn Input directly. The old `label` and `error` props are removed — consumers must add `<Label>` and error message elements explicitly. Add a `cn()` utility class merger
- `textarea.tsx`: Same approach as Input — re-export, no label/error built-in
- `label.tsx`: Re-export shadcn Label (peer-disabled styling comes from shadcn)
- `spinner.tsx`: Wrapper using `Loader2` from lucide-react. Preserves `size` prop API (`sm`→`h-4 w-4`, `md`→`h-6 w-6`, `lg`→`h-8 w-8`), `className` override, and applies `animate-spin`. **Set default color to `text-brand-600`** (maps via shim to `text-primary`) so consumers without explicit className (like `ProtectedRoute`) render with brand color, matching pre-migration behavior
- Update all consumers that use `label` prop on Input/Textarea to render `<Label htmlFor>` above the input. Update error display from `Input error="msg"` to manual `<p className="text-destructive text-xs">` rendering
- Replace all `<Spinner size="lg" />` with equivalent `<Spinner size="lg" />` (same import path, new implementation)
- Create `packages/ui/src/lib/utils.ts` with `cn()` helper (from `clsx` + `tailwind-merge`)
- Update `packages/ui/src/index.ts` with new export paths

**Patterns to follow:**
- Existing Button component in `packages/ui/src/components/Button.tsx` — preserve `variant`, `size`, `loading` prop interfaces
- shadcn button.variants: https://ui.shadcn.com/docs/components/button

**Test scenarios:**
- Happy path: `<Button variant="primary" size="md">Click</Button>` renders a styled button
- Happy path: `<Button loading={true}>Submit</Button>` renders Loader2 icon + disabled state
- Happy path: `<Button variant="danger">Delete</Button>` maps to shadcn destructive variant
- Happy path: `<Input />` renders a styled input (no label/error wrapper)
- Happy path: `<Input />` receives focus with ring styling
- Edge case: `<Input disabled />` renders with muted styling
- Happy path: `<Label htmlFor="email">Email</Label>` renders an accessible label
- Happy path: `<Spinner size="sm" />` renders a small animated Loader2
- Edge case: `<Spinner size="lg" className="text-red-500" />` applies custom class alongside size
- Integration: `CreateBoardModal` renders form with Label + Input + error message without visual regression

**Verification:**
- `pnpm run type-check` passes across all packages
- Every consumer that previously imported `Button`, `Input`, `Textarea`, `Spinner`, `Skeleton` from `@task-manager/ui` compiles and renders
- Dev server: login page renders with labeled email/password inputs and a submit button with loading state

---

- U4. **Migrate compound components: Card, Badge, Skeleton**

**Goal:** Replace Card, Badge, and Skeleton with shadcn equivalents. These have zero downstream consumers in apps/web (all feature components use inline Tailwind), so there is no consumer breakage to handle.

**Requirements:** R1

**Dependencies:** U3 (U3 deletes `Spinner.tsx` which co-exports `Skeleton`; U4 must follow U3 so `Skeleton` replacement is available before old barrel export breaks)

**Files:**
- Create: `packages/ui/src/components/card.tsx` (NEW — shadcn Card re-export)
- Create: `packages/ui/src/components/badge.tsx` (NEW — shadcn Badge wrapper)
- Create: `packages/ui/src/components/skeleton.tsx` (NEW — shadcn Skeleton re-export)
- Modify: `packages/ui/src/index.ts`
- Delete: `packages/ui/src/components/Card.tsx`
- Delete: `packages/ui/src/components/Badge.tsx`
- Modify: `apps/web/src/app/dashboard/page.tsx` (update Skeleton import path — currently imports from `@task-manager/ui` Spinner file)
- Modify: `apps/web/src/app/boards/[id]/page.tsx` (same Skeleton import update)

**Approach:**
- `card.tsx`: Re-export shadcn Card compound set (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- `badge.tsx`: Thin wrapper mapping old variants (default→secondary, success→outline with green, warning→outline with yellow, danger→destructive, info→outline with blue). Note: old Badge used filled backgrounds; shadcn outline variant renders transparent background with colored border — a visual change accepted since Badge has zero consumers in apps/web. Future consumers (deferred BoardCard/TaskCard refactor) will adopt the shadcn outline style.
- `skeleton.tsx`: Re-export shadcn Skeleton directly (API-compatible — both accept `className`)
- Update `dashboard/page.tsx` and `boards/[id]/page.tsx` to import Skeleton from the new export path (previously co-exported from Spinner.tsx)
- No consumer API changes needed — Card and Badge had zero imports in apps/web

**Patterns to follow:**
- shadcn card: https://ui.shadcn.com/docs/components/card
- shadcn badge: https://ui.shadcn.com/docs/components/badge

**Test scenarios:**
- Happy path: `<Card><CardHeader><CardTitle>T</CardTitle></CardHeader><CardContent>Body</CardContent></Card>` renders styled card
- Happy path: `<Badge variant="default">Label</Badge>` renders a styled badge
- Happy path: `<Badge variant="success">Done</Badge>` renders green outline badge
- Happy path: `<Skeleton className="h-4 w-full" />` renders animated placeholder
- Integration: Dashboard loading skeleton grid renders identically (4 skeletons with same dimensions)

**Verification:**
- `pnpm run type-check` passes
- Dev server: `/dashboard` loading state (skeleton grid) renders with shadcn Skeleton
- Dev server: `/dashboard` error state (exclamation icon circle) renders without change

---

- U5. **Migrate Modal→Dialog and Select→Radix Select + rewrite consumers**

**Goal:** Replace the two most API-incompatible components: Modal becomes shadcn Dialog, native Select becomes Radix-based shadcn Select. Rewrite the two consumer components (`CreateBoardModal` and `CreateTaskModal`).

**Requirements:** R1, R6

**Dependencies:** U3 (Button, Input, Textarea must be migrated first since these consumers use them)

**Files:**
- Create: `packages/ui/src/components/dialog.tsx` (NEW — shadcn Dialog re-export)
- Create: `packages/ui/src/components/select.tsx` (NEW — shadcn Select re-export)
- Modify: `packages/ui/src/index.ts`
- Delete: `packages/ui/src/components/Modal.tsx`
- Delete: `packages/ui/src/components/Select.tsx`
- Modify: `apps/web/src/components/CreateBoardModal.tsx` (rewrite to use Dialog)
- Modify: `apps/web/src/components/CreateTaskModal.tsx` (rewrite to use shadcn Select)

**Approach:**
- `dialog.tsx`: Re-export shadcn Dialog compound set (Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose)
- `select.tsx`: Re-export shadcn Select compound set (Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem, SelectSeparator)
- Rewrite `CreateBoardModal.tsx`: Replace `<Modal open onClose title>` with `<Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>`. The button is split: trigger button stays outside (opens dialog), cancel/submit buttons go inside `<DialogFooter>`. Keep all mutation logic, form state, and query invalidation unchanged — only the component wrapping changes.
- Rewrite `CreateTaskModal.tsx`: Replace native `<select>` with shadcn Select compound pattern. The `options` prop pattern becomes `<SelectItem value={p}>{label}</SelectItem>` mapping. Keep inline form behavior (expandable within list column) — note: this component already conditionally renders as a button (collapsed) or form (expanded), not a modal.
- Both rewrites use shadcn Button (migrated in U3) and shadcn Input/Textarea (migrated in U3)
- The shadcn Dialog handles Escape key, backdrop click, body scroll lock, and focus trapping through Radix primitives — no custom `useEffect` code needed
- For `CreateTaskModal`'s Select, use `position="popper"` to handle potential overflow within the list column card boundary. **Test with horizontal board scroll** — the board page (`boards/[id]/page.tsx`) uses `overflow-x-auto`. Radix Select's portal + Floating UI position calculation may detach the dropdown from the trigger after scrolling. If scroll causes detachment, set the portal container to the scrollable parent element rather than `document.body`.
- During U6 (module restructuring), update the `DragOverlay` in `BoardView.tsx` to render `<TaskCardView>` instead of `<TaskCard>` — `TaskCardView` omits the `useSortable` hook, avoiding a render of `useSortable` outside a `SortableContext` inside the drag portal

**Patterns to follow:**
- shadcn dialog: https://ui.shadcn.com/docs/components/dialog
- shadcn select: https://ui.shadcn.com/docs/components/select
- Existing CreateBoardModal: `apps/web/src/components/CreateBoardModal.tsx` — preserve mutation flow
- Existing CreateTaskModal: `apps/web/src/components/CreateTaskModal.tsx` — preserve inline expand/collapse UX

**Test scenarios:**
- Happy path: Clicking "New Board" button opens Dialog with title "Create Board", form fields, and Cancel/Create buttons
- Happy path: Clicking backdrop or pressing Escape closes the Dialog
- Happy path: Submitting form with valid title calls `api.post('/boards', ...)`, closes dialog on success
- Happy path: Clicking "Add Task" in list column expands inline form with Select showing priority options
- Happy path: Changing Select priority updates the displayed value
- Happy path: Submitting task form calls `api.post('/tasks', ...)`, collapses form on success
- Edge case: Dialog open → submit with empty title → validation prevents submission (HTML required attribute on Input)
- Edge case: Select renders within list column card without clipping (z-index + portal positioning)
- Integration: Creating a board via Dialog → dashboard list updates with new board (TanStack Query invalidate)

**Verification:**
- `pnpm run type-check` passes — no remaining `Modal` or old `Select` imports
- Dev server: `/dashboard` "New Board" button opens shadcn Dialog, form submits, board appears in grid
- Dev server: `/boards/[id]` "Add Task" expands form with shadcn Select, priority changes, form submits, task appears in column
- Keyboard: Escape closes Dialog, Tab navigates through form fields in correct order

---

- U6. **Reorganize apps/web into module-based architecture**

**Goal:** Restructure `apps/web/src/` into modules with container/presentational separation. All imports already use `@/` aliases (from U1), so files can be moved without breaking the import graph.

**Requirements:** R3, R4 (already satisfied by U1 for aliases)

**Dependencies:** U5 (all component migrations complete before restructuring so modules build with final component APIs)

**Files:**
- Create: `apps/web/src/modules/landing/components/HeroSection.tsx`
- Create: `apps/web/src/modules/auth/components/LoginForm.tsx`
- Create: `apps/web/src/modules/auth/components/RegisterForm.tsx`
- Create: `apps/web/src/modules/auth/containers/AuthGuard.tsx`
- Create: `apps/web/src/modules/auth/containers/LoginPage.tsx`
- Create: `apps/web/src/modules/auth/containers/RegisterPage.tsx`
- Create: `apps/web/src/modules/dashboard/components/BoardCard.tsx`
- Create: `apps/web/src/modules/dashboard/components/DashboardHeader.tsx`
- Create: `apps/web/src/modules/dashboard/containers/BoardGrid.tsx`
- Create: `apps/web/src/modules/dashboard/containers/CreateBoardDialog.tsx`
- Create: `apps/web/src/modules/board/components/ListColumn.tsx`
- Create: `apps/web/src/modules/board/components/TaskCard.tsx`
- Create: `apps/web/src/modules/board/components/InlineTaskForm.tsx`
- Create: `apps/web/src/modules/board/containers/BoardView.tsx`
- Create: `apps/web/src/modules/board/containers/CreateListForm.tsx`
- Create: `apps/web/src/modules/board/containers/CreateTaskForm.tsx`
- Create: `apps/web/src/modules/layout/components/Header.tsx`
- Create: `apps/web/src/modules/layout/containers/AppHeader.tsx`
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/login/page.tsx`
- Modify: `apps/web/src/app/register/page.tsx`
- Modify: `apps/web/src/app/dashboard/page.tsx`
- Modify: `apps/web/src/app/boards/[id]/page.tsx`
- Delete: `apps/web/src/components/BoardCard.tsx`
- Delete: `apps/web/src/components/CreateBoardModal.tsx`
- Delete: `apps/web/src/components/CreateListModal.tsx`
- Delete: `apps/web/src/components/CreateTaskModal.tsx`
- Delete: `apps/web/src/components/Header.tsx`
- Delete: `apps/web/src/components/ListColumn.tsx`
- Delete: `apps/web/src/components/TaskCard.tsx`
- Delete: `apps/web/src/components/ProtectedRoute.tsx`

**Approach:**
- **Container/presentational contract:** A container owns data fetching (TanStack Query `useQuery`/`useMutation`), state management (Zustand `useAuthStore`), routing (`useRouter`), and callback wiring. A presentational component receives all data and callbacks via props and renders markup with shadcn components. Form state (`useState` for controlled inputs) lives in presentational components since it's intrinsic to rendering behavior.
- **Split existing components** along the container/presentational boundary:
  - `Header.tsx` → `modules/layout/components/Header.tsx` (presentational — receives user, onLogout) + `modules/layout/containers/AppHeader.tsx` (reads auth store, provides callbacks)
  - `ProtectedRoute.tsx` → `modules/auth/containers/AuthGuard.tsx` (container — uses `useRouter` for redirect-on-unauthenticated per container/presentational boundary exception) — preserves the `mounted` gate pattern from the hydration-mismatch learning. Receives children as props.
  - `CreateBoardModal.tsx` → `modules/dashboard/containers/CreateBoardDialog.tsx` (mutation, query invalidation, dialog open state) + uses shadcn Dialog + Input/Textarea/Button directly
  - `CreateTaskModal.tsx` → `modules/board/containers/CreateTaskForm.tsx` (mutation, invalidation) + `modules/board/components/InlineTaskForm.tsx` (form fields, select, buttons)
  - `CreateListModal.tsx` → `modules/board/containers/CreateListForm.tsx` (mutation, invalidation)
  - `BoardCard.tsx` → `modules/dashboard/components/BoardCard.tsx` (already presentational — receives board, onDelete)
  - `ListColumn.tsx` + `TaskCard.tsx` → preserve as components in `modules/board/components/` (presentational with dnd-kit hooks)
  - `dashboard/page.tsx` body → `modules/dashboard/containers/BoardGrid.tsx` (query + grid layout)
  - `boards/[id]/page.tsx` body → `modules/board/containers/BoardView.tsx` (query + DnD context + state)
- Pages become thin shells: `<AuthGuard><AppHeader /><BoardGrid /></AuthGuard>` — no data fetching or business logic in page files
- Move `Header.tsx` to `modules/layout/components/` and create `AppHeader.tsx` container that reads auth store and passes user + logout as props
- Move `AuthGuard.tsx` to `modules/auth/containers/`, preserve `mounted` state gate + `useEffect` auth check, replace `Spinner` import with `@task-manager/ui` (already migrated in U3)

**Patterns to follow:**
- Existing auth guard hydration pattern from `ProtectedRoute.tsx` (`mounted` state, `useEffect`, matching-background placeholder div)
- Container/presentational contract defined in Key Technical Decisions

**Test scenarios:**
- Happy path: `pnpm run type-check` passes with all files in new locations
- Happy path: All 5 routes render identically to pre-restructuring state
- Edge case: No circular imports between modules (modules only import from `@task-manager/ui`, `@/stores/*`, `@/lib/*`, `@/hooks/*`, never from other modules)
- Edge case: AuthGuard still renders Spinner during mount check, then children once mounted and authenticated
- Edge case: AuthGuard redirects to `/login` when not authenticated (preserving existing behavior)
- Integration: /login → successful login → redirects to /dashboard → AuthGuard mounts → Header shows user avatar → BoardGrid loads boards

**Verification:**
- `pnpm run type-check` passes across all packages
- `apps/web/src/components/` directory is empty of .tsx files (all feature components moved)
- Dev server: full flow through all 5 routes — landing → register → login → dashboard → board detail

---

- U7. **Migrate inline classes to semantic tokens, then remove shim and finalize**

**Goal:** Migrate all remaining inline Tailwind classes in feature files from old token names to shadcn semantic tokens, then remove the CSS variable shim layer and old tailwind.config.ts token entries. This is the critical step that makes R6 (visual parity) permanent — without it, the app renders as bare HTML when the shim is removed.

**Requirements:** R2, R6, R7

**Dependencies:** U6

**Files:**
- Modify: `apps/web/src/modules/landing/components/HeroSection.tsx` (migrate `bg-surface-950`, `from-brand-900/40`, `from-accent-500/[0.08]`, `text-brand-400`, `text-surface-300`, `bg-brand-600`, `border-surface-700/50`, `bg-surface-800/50`, `text-surface-400`, `bg-success-400`, `text-surface-500` → semantic tokens)
- Modify: `apps/web/src/modules/dashboard/components/BoardCard.tsx` (migrate `bg-brand-100`, `text-brand-600`, `bg-danger-50`, `text-danger-600`, `shadow-card`, `hover:shadow-elevated`, `text-surface-900`, `text-surface-500`, `text-surface-400` → semantic tokens)
- Modify: `apps/web/src/modules/dashboard/components/DashboardHeader.tsx` (inline classes)
- Modify: `apps/web/src/modules/dashboard/containers/BoardGrid.tsx` (migrate `bg-surface-50`, `bg-danger-100`, `text-danger-600`, `text-surface-900`, `text-surface-500`, `bg-brand-100`, `text-brand-600`)
- Modify: `apps/web/src/modules/dashboard/containers/CreateBoardDialog.tsx` (inline classes)
- Modify: `apps/web/src/modules/board/components/ListColumn.tsx` (migrate `bg-surface-100`, `text-surface-800`, `bg-surface-300`, `text-surface-600`, `bg-brand-50`, `ring-brand-200`, `text-surface-400`)
- Modify: `apps/web/src/modules/board/components/TaskCard.tsx` (migrate `bg-success-100`, `text-success-700`, `bg-accent-100`, `text-accent-700`, `bg-danger-100`, `text-danger-700`, `text-surface-900`, `text-surface-500`, `bg-surface-100`, `shadow-card`, `hover:shadow-elevated`, `ring-brand-400`)
- Modify: `apps/web/src/modules/board/components/InlineTaskForm.tsx` (inline classes)
- Modify: `apps/web/src/modules/board/containers/BoardView.tsx` (migrate `bg-surface-50`, `bg-surface-200`, `text-surface-400`, `text-surface-900`, `text-surface-500`)
- Modify: `apps/web/src/modules/board/containers/CreateListForm.tsx` (inline classes)
- Modify: `apps/web/src/modules/board/containers/CreateTaskForm.tsx` (inline classes)
- Modify: `apps/web/src/modules/layout/components/Header.tsx` (migrate `border-surface-200`, `text-surface-900`, `text-brand-600`, `text-surface-500`, `bg-brand-100`, `text-brand-700`)
- Modify: `apps/web/src/modules/layout/containers/AppHeader.tsx` (inline classes)
- Modify: `apps/web/src/modules/auth/components/LoginForm.tsx` (migrate `text-surface-900`, `text-brand-600`, `text-surface-500`, `text-brand-600`, `border-danger-200`, `bg-danger-50`, `text-danger-700`, `from-brand-900`, `via-brand-800`, `to-surface-900`)
- Modify: `apps/web/src/modules/auth/components/RegisterForm.tsx` (same pattern as login)
- Modify: `apps/web/src/modules/auth/containers/LoginPage.tsx` (inline classes)
- Modify: `apps/web/src/modules/auth/containers/RegisterPage.tsx` (inline classes)
- Modify: `apps/web/src/modules/auth/containers/AuthGuard.tsx` (migrate `bg-surface-50`)
- Modify: `apps/web/src/app/layout.tsx` (migrate body `className` from `bg-surface-50 font-body text-surface-700 antialiased` to `bg-background font-body text-foreground antialiased` — these classes now reference shadcn variables via globals.css `@layer base` after U2)
- Modify: `apps/web/src/app/globals.css` (remove shim layer + **preserve Google Fonts `@import` line**)
- Modify: `apps/web/tailwind.config.ts` (remove old color token entries)
- Modify: `packages/ui/src/index.ts` (finalize exports)

**Approach:**
- **Step 1: Migrate inline classes.** Go through each file listed above and replace old token class references with shadcn semantic equivalents. Mapping: `bg-surface-50` → `bg-background`, `text-surface-900` → `text-foreground`, `bg-brand-100` → `bg-primary/10`, `text-brand-600` → `text-primary`, `text-surface-500` → `text-muted-foreground`, `border-surface-200` → `border-border`, `bg-danger-50` → `bg-destructive/10`, `text-danger-600` → `text-destructive`, `bg-surface-100` → `bg-secondary`, `text-surface-800` → `text-secondary-foreground`, `bg-surface-200` → `bg-muted`, `text-surface-400` → `text-muted-foreground/80`, `ring-brand-400` → `ring-ring`, `ring-brand-200` → `ring-ring/50`, `bg-success-100` → `bg-primary/10` (or keep as green via explicit color), `text-success-700` → `text-primary`, `bg-accent-100` → `bg-accent/10`, `text-accent-700` → `text-accent-foreground`. For custom shadows: `shadow-card` → `shadow-sm`, `hover:shadow-elevated` → `hover:shadow-md`, `shadow-modal` → `shadow-lg`. For gradients: `from-brand-900/40 via-surface-950 to-surface-950` → use shadcn semantic equivalents or hardcode the dark color. **For the landing page dark background**, use `bg-foreground` or a direct HSL value since no exact shadcn equivalent exists for `--surface-950`. Verify visual parity after each file.
- **Step 2: Remove shim.** After verifying `pnpm run type-check` passes and all routes render correctly, delete the `--surface-*`, `--brand-*`, `--accent-*`, `--success-*`, `--danger-*` variable definitions from `globals.css` — only shadcn's semantic variables remain. **Preserve the Google Fonts `@import` at the top of the file.**
- **Step 3: Remove old config entries.** Delete `surface`, `brand`, `accent`, `success`, `danger` entries from `tailwind.config.ts` `theme.extend.colors`. Keep shadcn semantic color references.
- **Step 4: Finalize exports.** Ensure all shadcn component exports in `packages/ui/src/index.ts` are present and correctly named. Group: form components, layout components, feedback components, overlay components.
- Run `pnpm run type-check` and `pnpm run build` to confirm zero errors. Manual visual verification of all 5 routes in dev server.

**Patterns to follow:**
- Existing export pattern in `packages/ui/src/index.ts`

**Test scenarios:**
- Happy path: `pnpm run build` succeeds with no errors
- Happy path: No `surface-*`, `brand-*`, `accent-*`, `danger-*`, `success-*` classes remain in any `.tsx` file
- Happy path: No old component files exist in `packages/ui/src/components/`
- Happy path: All 5 routes render with correct styling using only shadcn semantic tokens
- Edge case: Landing page dark background still renders correctly (verify after `bg-surface-950` → semantic equivalent migration)
- Edge case: Google Fonts `@import` still present at top of `globals.css` after shim removal — fonts render correctly
- Edge case: Error states (login error alert, board not found) render with consistent destructive/muted tokens
- Edge case: `layout.tsx` body renders with `bg-background text-foreground font-body antialiased` — no old token references

**Verification:**
- `pnpm run build` passes clean
- Dev server: visual parity check across all 5 routes — landing, login, register, dashboard, board detail
- Audit: `rg "surface-\d|brand-\d|accent-\d|danger-\d|success-\d" apps/web/src/` returns zero results
- `rg "@import.*fonts\.googleapis" apps/web/src/app/globals.css` returns a match (fonts preserved)

---

## System-Wide Impact

- **Interaction graph:** Every page and feature component imports from `@task-manager/ui`. The barrel export (`packages/ui/src/index.ts`) is the single chokepoint — errors here cascade to all consumers.
- **Error propagation:** Form validation errors (previously passed as `error` prop to Input/Textarea) now require explicit `<p className="text-destructive">` rendering by each consumer. Any consumer that previously relied on the built-in error display will silently lose error messages if not updated.
- **State lifecycle risks:** The `AuthGuard` (ex-ProtectedRoute) preserves its Zustand + localStorage auth check. The `mounted` state gate must carry forward to avoid hydration mismatches. No new state management patterns are introduced.
- **API surface parity:** `packages/ui/src/index.ts` must export all components under their original names (`Button`, `Input`, etc.) for backward compatibility, even though the underlying implementation has changed. New components (Spinner, Label, Dialog, DropdownMenu, Sheet, etc.) are additive.
- **Integration coverage:** The shadcn Dialog + Select + Button combination in CreateBoardModal and CreateTaskModal is the highest-risk integration surface. These flows involve mutation state, query invalidation, form submission, and overlay dismissal — all crossing the container/presentational boundary.
- **Unchanged invariants:** `apps/web/src/lib/api.ts` (REST fetch), `apps/web/src/lib/socket.ts` (Socket.IO singleton), `apps/web/src/stores/auth.ts` (Zustand auth), `apps/web/src/app/providers.tsx` (QueryClient + Socket), `next.config.ts` (transpilePackages), `turbo.json` (pipeline), `pnpm-workspace.yaml` (workspace). The `apps/api/` and `packages/types/` packages are untouched.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Token shim silently maps old colors to wrong new colors (e.g., surface-500 → wrong HSL) | Provide explicit mapping table in the CSS variables block; verify with dev server before proceeding past U2; screenshot all 5 routes pre-U2 and compare pixel-by-pixel post-U2 |
| Feature-file inline classes (~135 references across 10+ files) are not migrated before shim removal in U7 → app renders bare HTML | U7 explicitly lists every feature file and provides a token-to-semantic mapping table. Step 1 (migrate inline classes) must complete and pass visual verification before Step 2 (remove shim). The audit `rg` check at U7 verification catches any missed references |
| Radix Dialog portal conflicts with dnd-kit DragOverlay (both use portals with fixed positioning) | Dialog uses `z-50`; DragOverlay uses `z-50`. Test board detail page specifically for z-index conflicts between dialog overlays and drag overlays |
| Radix Select popper detaches from trigger when board is scrolled horizontally | Test select in `CreateTaskModal` with horizontal board scroll. If dropdown detaches, set portal container to scrollable parent |
| Consumer rewrites in U5 introduce mutation bugs (form submit no longer works) | Each consumer rewrite preserves the same `useMutation` + `queryClient.invalidateQueries` pattern; the mutation logic is not refactored, only the component wrapping changes |
| Module restructuring in U6 creates circular dependencies between modules | Modules only import from shared sources (`@task-manager/ui`, `@/stores/*`, `@/lib/*`, `@/hooks/*`). No module-to-module imports are allowed |
| `lucide-react` icons or Radix primitives increase bundle size noticeably | Most Radix primitives are tree-shaken. lucide-react imports are per-icon. Acceptable increase for a productivity app |
| Zero test coverage means regressions are discovered manually | Each unit's verification step specifies a manual dev-server check. The deferred follow-up PR adds Playwright smoke tests |
| Google Fonts `@import` line accidentally deleted during globals.css modifications | U2 and U7 approaches both explicitly instruct to preserve the `@import` line. U7 verification includes an `rg` check for the fonts URL |

---

## Sources & References

- **Prior dialogue:** ce-brainstorm session from 2026-05-03 — confirmed full replacement, new theme, module architecture, container/presentational pattern
- **Institutional learning:** `docs/solutions/build-errors/nextjs-incorrect-relative-import-depth.md` — path alias import pattern
- **Institutional learning:** `docs/solutions/runtime-errors/nextjs-hydration-mismatch-auth-guard.md` — AuthGuard hydration gate pattern
- **Related code:** `packages/ui/src/components/` — current hand-rolled components
- **Related code:** `apps/web/src/components/` — current feature components
- **Related code:** `apps/web/tailwind.config.ts` — current color token definitions
- **Related code:** `apps/web/src/app/globals.css` — current CSS layers
- **External docs:** shadcn UI — https://ui.shadcn.com
- **External docs:** Radix UI primitives — https://www.radix-ui.com
- **External docs:** lucide-react icons — https://lucide.dev
