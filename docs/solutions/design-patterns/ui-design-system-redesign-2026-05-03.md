---
title: "UI Design System -- Component Library, Tokens, and Drag-and-Drop Kanban"
date: 2026-05-03
category: design-patterns
module: design-system
problem_type: design_pattern
component: frontend_stimulus
severity: high
applies_when:
  - Starting a new frontend project or redesigning an unstyled UI
  - Building a shared component library in a Turborepo monorepo
  - Implementing drag-and-drop Kanban with optimistic updates
  - Establishing design tokens and CSS variables for a Next.js + Tailwind app
tags:
  - design-system
  - ui-components
  - tailwindcss
  - component-library
  - kanban
  - drag-and-drop
  - turborepo
  - react
---

# UI Design System -- Component Library, Tokens, and Drag-and-Drop Kanban

## Context

The Task Manager app had a generic unstyled UI with no design system: default Tailwind colors everywhere, an empty `packages/ui` library (just `export {}`), plain text "Loading..." states, no empty or error states, no drag-and-drop despite `@dnd-kit` being installed, no socket connection integration, and generic layouts for landing, auth, and dashboard pages.

A comprehensive redesign needed to span four layers: design tokens, a shared component library, page-level layouts, and interactive kanban features. The monorepo structure meant the component library had to live in `packages/ui` and be importable by the Next.js app in `apps/web` through workspace references and Tailwind content paths.

## Guidance

### Layer 1: Design Foundation

Define tokens in `tailwind.config.ts` -- fonts, colors, shadows, and animations. Custom fonts via Google Fonts imported in `globals.css`:

```ts
// tailwind.config.ts
fontFamily: {
  heading: ['Outfit', 'sans-serif'],
  body: ['DM Sans', 'sans-serif'],
},
colors: {
  surface: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', /* ... */ 900: '#0f172a' },
  brand:   { 50: '#eef2ff', 100: '#e0e7ff', /* ... */ 900: '#312e81' },
  accent:  { 50: '#fffbeb', 100: '#fef3c7', /* ... */ 900: '#78350f' },
  success: { 50: '#ecfdf5', 400: '#34d399', 500: '#10b981' },
  danger:  { 50: '#fef2f2', 400: '#f87171', 500: '#ef4444' },
},
boxShadow: {
  soft:    '0 1px 3px 0 rgb(0 0 0 / 0.03), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
  card:    '0 1px 4px 0 rgb(0 0 0 / 0.04), 0 2px 8px -1px rgb(0 0 0 / 0.06)',
  elevated:'0 4px 16px -2px rgb(0 0 0 / 0.08), 0 2px 8px -1px rgb(0 0 0 / 0.04)',
  modal:   '0 20px 60px -12px rgb(0 0 0 / 0.25), 0 8px 24px -4px rgb(0 0 0 / 0.1)',
},
animation: {
  'fade-in':  'fadeIn 0.5s ease-out',
  'slide-up': 'slideUp 0.5s ease-out',
  'scale-in': 'scaleIn 0.2s ease-out',
},
```

Define utility CSS classes in `globals.css` for consistent component styles:

```css
@layer components {
  .btn-primary {
    @apply inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5
           font-medium text-white shadow-sm transition-all duration-200
           hover:bg-brand-700 hover:shadow-md active:scale-[0.97]
           disabled:pointer-events-none disabled:opacity-50;
  }
  .card {
    @apply rounded-xl bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-elevated;
  }
  .input {
    @apply w-full rounded-lg border border-surface-300 bg-white px-4 py-2.5 text-surface-900
           placeholder-surface-400 shadow-sm transition-all duration-200
           focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100;
  }
  .modal-overlay {
    @apply fixed inset-0 z-50 flex items-center justify-center
           bg-black/40 backdrop-blur-sm animate-fade-in;
  }
  .skeleton {
    @apply animate-pulse rounded-lg bg-surface-200;
  }
}
```

### Layer 2: Shared UI Components

Place reusable components in `packages/ui/src/components/`. Each component follows the same pattern:

- **'use client'** directive for interactivity
- **forwardRef** for form controls
- **Variant + size props** mapped to CSS classes
- **Loading spinner** inside buttons
- **Keyboard handling** for modals (Escape to close)
- **Type-only imports** for cleaner dependency graph

Example (Button):

```tsx
'use client';
import { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800',
  secondary: 'border border-surface-300 bg-white text-surface-700 hover:bg-surface-100',
  ghost: 'text-surface-600 hover:bg-surface-100 hover:text-surface-900',
  danger: 'bg-danger-600 text-white shadow-sm hover:bg-danger-700 active:bg-danger-800',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, children, className = '' }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-all
        duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
);
```

Example (Modal with keyboard handling):

```tsx
export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center
      bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-modal animate-scale-in"
        role="dialog" aria-modal="true" aria-label={title}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-surface-900">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="...">
              <XIcon />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
```

### Layer 3: Drag-and-Drop Kanban

Use `@dnd-kit/core` + `@dnd-kit/sortable` with `closestCorners` collision detection:

```tsx
// BoardPage -- DndContext setup
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(KeyboardSensor)
);

<DndContext
  sensors={sensors}
  collisionDetection={closestCorners}
  onDragStart={handleDragStart}
  onDragOver={handleDragOver}
  onDragEnd={handleDragEnd}
>
  {lists.map(list => <ListColumn key={list.id} list={list} />)}
  <DragOverlay>
    {activeTask && <TaskCardView task={activeTask} />}
  </DragOverlay>
</DndContext>
```

Optimistic updates via `queryClient.setQueryData` keep the UI responsive:

```tsx
function handleDragOver(event: DragOverEvent) {
  queryClient.setQueryData(['board', boardId], (old) => {
    if (!old) return old;
    return {
      ...old,
      lists: old.lists?.map((list) => {
        if (list.id === activeListId)
          return { ...list, tasks: list.tasks?.filter((t: Task) => t.id !== active.id) };
        if (list.id === overListId) {
          const movingTask = activeList.tasks?.find((t: Task) => t.id === active.id);
          if (!movingTask) return list;
          const newTasks = [...(list.tasks || [])];
          newTasks.splice(insertAt, 0, { ...movingTask, listId: list.id });
          return { ...list, tasks: newTasks };
        }
        return list;
      }),
    };
  });
}
```

Each `ListColumn` is a droppable zone with a `SortableContext`:

```tsx
const { setNodeRef, isOver } = useDroppable({ id: list.id, data: { type: 'list' } });

<div ref={setNodeRef}
  className={`min-h-[60px] rounded-lg transition-colors ${isOver ? 'bg-brand-50 ring-2 ring-brand-200' : ''}`}
>
  <SortableContext items={list.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
    {list.tasks.map(task => <TaskCard key={task.id} task={task} />)}
  </SortableContext>
</div>
```

Each `TaskCard` is sortable, acting as the drag handle:

```tsx
const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
  id: task.id,
  data: { type: 'task', task },
});

<div ref={setNodeRef}
  style={{ transform: CSS.Transform.toString(transform), transition }}
  {...attributes} {...listeners}
  className={`cursor-grab ... ${isDragging ? 'ring-2 ring-brand-400' : ''}`}
>
  <TaskCardView task={task} />
</div>
```

### Layer 4: Page-Level Patterns

All data-fetching pages follow a three-state pattern:

```tsx
{isLoading ? (
  // Skeleton grid matching the real layout
) : isError ? (
  // Error state with icon + message
) : data.length === 0 ? (
  // Empty state with CTA
) : (
  // Real content
)}
```

The `ProtectedRoute` component shows a spinner during hydration instead of a blank div:

```tsx
if (!mounted) {
  return <div className="flex min-h-screen items-center justify-center"><Spinner size="lg" /></div>;
}
```

The `Header` uses `sticky` positioning with `backdrop-blur-lg` for a frosted-glass effect and shows the user's initial as an avatar.

### Tailwind Content Path

The `tailwind.config.ts` must include `packages/ui` in its content array so Tailwind scans both the app and the shared library:

```ts
content: [
  './src/**/*.{js,ts,jsx,tsx,mdx}',
  '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
],
```

## Why This Matters

A cohesive design system eliminates visual inconsistency across pages. CSS variables and Tailwind tokens make theming and future changes straightforward. Shared components in `packages/ui` mean every page automatically gets consistent styling, focus rings, and loading states.

Optimistic updates via `queryClient.setQueryData` make drag operations feel instant -- the UI updates before the server responds, with cache invalidation as a safety net. Group-level hover (`group-hover:opacity-100`) for action buttons keeps the UI clean while revealing functionality on interaction.

## When to Apply

- Starting a new frontend project -- establish CSS variable colors and font tokens before writing components
- Adding a shared package to a Turborepo monorepo -- each `packages/ui` component should be a thin 'use client' wrapper with forwardRef for form controls
- Implementing drag-and-drop Kanban -- use `DndContext` + `closestCorners` + `DragOverlay` + optimistic `setQueryData` for smooth cross-list moves
- Building pages with data fetching -- always handle loading (skeleton), error (icon + message), and empty (CTA button) states

## Examples

Complete implementation in these files:
- **Design tokens**: `apps/web/tailwind.config.ts`
- **CSS utilities**: `apps/web/src/app/globals.css`
- **Shared components**: `packages/ui/src/components/{Button,Input,Textarea,Select,Modal,Card,Badge,Spinner}.tsx`
- **Kanban board**: `apps/web/src/app/boards/[id]/page.tsx` -- DndContext + optimistic updates
- **List column**: `apps/web/src/components/ListColumn.tsx` -- useDroppable + SortableContext
- **Task card**: `apps/web/src/components/TaskCard.tsx` -- useSortable + priority badges
- **Landing page**: `apps/web/src/app/page.tsx` -- dark gradient hero
- **Auth pages**: `apps/web/src/app/login/page.tsx`, `apps/web/src/app/register/page.tsx`
- **Dashboard**: `apps/web/src/app/dashboard/page.tsx` -- three-state pattern
- **Providers**: `apps/web/src/app/providers.tsx` -- socket integration
- **Component exports**: `packages/ui/src/index.ts`

## Related

- shadcn/ui component primitives (https://ui.shadcn.com) -- the variant/size prop pattern
- @dnd-kit documentation (https://docs.dndkit.com) -- sensor configuration, collision detection
- Tailwind CSS animation utilities (https://tailwindcss.com/docs/animation) -- keyframe config
- `docs/solutions/build-errors/nextjs-incorrect-relative-import-depth.md` -- import path fix for the same components (Header, ListColumn, ProtectedRoute) that were later redesigned
- `docs/solutions/runtime-errors/nextjs-hydration-mismatch-auth-guard.md` -- ProtectedRoute hydration fix; the redesign replaced its placeholder `<div>` with a loading `<Spinner>`
