---
title: "fix: Parse boolean query parameter for includeUnscheduled"
type: fix
status: active
date: 2026-05-04
---

# fix: Parse boolean query parameter for includeUnscheduled

## Summary

Fix the `GET /tasks/calendar` endpoint so it accepts `includeUnscheduled=true` (and `false`) as query string parameters without throwing a 400 validation error. The fix adds a `@Transform()` decorator to convert string representations of booleans into actual boolean values before `@IsBoolean()` validation runs.

## Problem Frame

The calendar view sends `includeUnscheduled=true` as a URL query parameter. NestJS receives all query parameters as strings, but `CalendarQueryDto` declares `includeUnscheduled?: boolean` with `@IsBoolean()`. The `class-validator` `@IsBoolean()` rule checks the *runtime type* of the value, not its semantic truthiness, so the string `"true"` fails validation and the API returns:

```json
{ "message": ["includeUnscheduled must be a boolean value"], "error": "Bad Request", "statusCode": 400 }
```

This breaks the unscheduled-tasks sidebar feature in the calendar view.

## Requirements

- R1. `GET /tasks/calendar?includeUnscheduled=true` must succeed and include tasks without a due date
- R2. `GET /tasks/calendar?includeUnscheduled=false` must succeed and exclude tasks without a due date
- R3. Omitting `includeUnscheduled` must continue to default to `false` (exclude unscheduled tasks)
- R4. Invalid values (e.g., `includeUnscheduled=maybe`) must still return a 400 validation error

## Scope Boundaries

- No changes to frontend code — the fix is server-side only
- No changes to service logic — `TasksService.findByDateRange` already handles the boolean correctly
- No changes to the controller route or other DTO fields
- No database migrations or schema changes

## Context & Research

### Relevant Code and Patterns

- `apps/api/src/tasks/dto/calendar-query.dto.ts` — the DTO that needs the transform decorator
- `apps/api/src/main.ts` — global `ValidationPipe` already configured with `transform: true`, which means `@Transform()` will run automatically
- `apps/api/src/tasks/tasks.controller.ts` — `@Get('calendar')` endpoint that receives the DTO via `@Query()`
- `apps/api/src/tasks/tasks.service.ts` — `findByDateRange` already checks `if (!query.includeUnscheduled)` correctly
- `apps/web/src/modules/calendar/hooks/useCalendarQuery.ts` — frontend sends `includeUnscheduled` as the string `'true'` via `URLSearchParams` when the param is truthy; when `false`, the frontend omits the parameter entirely (so R2 is only reachable via direct API/curl calls given current frontend code)

### External References

- NestJS ValidationPipe with `transform: true`: https://docs.nestjs.com/techniques/validation
- `class-transformer` `@Transform()` decorator: https://github.com/typestack/class-transformer#transforming

## Key Technical Decisions

- **Use `@Transform()` from `class-transformer`** rather than a custom validator or changing the type to string. This is the idiomatic NestJS pattern for query-parameter type coercion when `ValidationPipe({ transform: true })` is already enabled. It keeps the DTO type as `boolean` (accurate for downstream service logic) while allowing string inputs from HTTP.

## Implementation Units

- U1. **Add `@Transform()` to `CalendarQueryDto.includeUnscheduled`**

**Goal:** Convert string query parameter values `"true"`, `"false"`, `"1"`, `"0"` to actual booleans before `@IsBoolean()` validation runs.

**Requirements:** R1, R2, R3, R4

**Dependencies:** None

**Files:**
- Modify: `apps/api/src/tasks/dto/calendar-query.dto.ts`

**Approach:**
- Import `Transform` from `class-transformer`
- Add `@Transform(({ value }) => { ... })` above the existing `@IsBoolean()` decorator on `includeUnscheduled` (decorator order: bottom-up execution in TypeScript, but `class-transformer` runs during the transform phase before `class-validator` runs during validation)
- The transform must **only** coerce known boolean representations. Unrecognized values are passed through unchanged so `@IsBoolean()` can reject them:
  - String `"true"` or `"1"` → `true`
  - String `"false"` or `"0"` → `false`
  - Actual boolean `true`/`false` (e.g., from test mocks) → passed through unchanged
  - Any other value (`"maybe"`, `"TRUE"`, `123`, empty string, etc.) → passed through unchanged → `@IsBoolean()` rejects with 400

**Patterns to follow:**
- NestJS documentation pattern for query parameter boolean coercion with `@Transform()`
- Existing import style in the file (named imports from `class-validator` and `class-transformer`)

**Test scenarios:**
- Happy path: `GET /tasks/calendar?startDate=...&endDate=...&includeUnscheduled=true` returns 200 with scheduled + unscheduled tasks
- Happy path: `GET /tasks/calendar?startDate=...&endDate=...&includeUnscheduled=false` returns 200 with only scheduled tasks
- Happy path: `GET /tasks/calendar?startDate=...&endDate=...` (omitted) returns 200 with only scheduled tasks (defaults to false)
- Edge case: `includeUnscheduled=1` is treated as `true`
- Edge case: `includeUnscheduled=0` is treated as `false`
- Edge case: `includeUnscheduled=TRUE` (uppercase) returns 400 (strict matching, only lowercase accepted)
- Edge case: `includeUnscheduled=` (empty string) returns 400
- Error path: `includeUnscheduled=maybe` returns 400 validation error
- Error path: `includeUnscheduled=123` returns 400 validation error

**Verification:**
- The curl request from the bug report returns 200 instead of 400
- Calendar page loads with unscheduled sidebar visible when `includeUnscheduled=true` is sent

---

- U2. **Add unit test for `CalendarQueryDto` boolean parsing**

**Goal:** Provide regression coverage so future changes to the DTO don't reintroduce the validation failure.

**Requirements:** R1, R2, R4

**Dependencies:** U1

**Files:**
- Create: `apps/api/src/tasks/dto/calendar-query.dto.spec.ts`

**Approach:**
- Create a new spec file for the DTO using `class-validator`'s `validate()` function directly
- Test that a plain object `{ includeUnscheduled: 'true', startDate: '2026-05-01T00:00:00.000Z', endDate: '2026-05-31T23:59:59.999Z' }` passes validation after being transformed (simulate what ValidationPipe does)
- Use `plainToInstance(CalendarQueryDto, plainObject)` from `class-transformer` to trigger `@Transform()`
- Test cases for true, false, 1, 0, omitted, and invalid values

**Patterns to follow:**
- NestJS testing pattern: `plainToInstance()` + `validate()` for DTO unit tests
- Existing test structure in the repo (if any tests exist — none found in tasks module, so this establishes the pattern)

**Test scenarios:**
- Happy path: `plainToInstance(CalendarQueryDto, { includeUnscheduled: 'true', ... })` → `validate()` returns no errors, `dto.includeUnscheduled === true`
- Happy path: `plainToInstance(CalendarQueryDto, { includeUnscheduled: 'false', ... })` → `validate()` returns no errors, `dto.includeUnscheduled === false`
- Happy path: `plainToInstance(CalendarQueryDto, { includeUnscheduled: '1', ... })` → `validate()` returns no errors, `dto.includeUnscheduled === true`
- Happy path: `plainToInstance(CalendarQueryDto, { includeUnscheduled: '0', ... })` → `validate()` returns no errors, `dto.includeUnscheduled === false`
- Happy path: `plainToInstance(CalendarQueryDto, { ... })` without `includeUnscheduled` → `validate()` returns no errors, `dto.includeUnscheduled === undefined`
- Edge case: `plainToInstance(CalendarQueryDto, { includeUnscheduled: 'maybe', ... })` → `validate()` returns errors containing `includeUnscheduled must be a boolean value`
- Edge case: `plainToInstance(CalendarQueryDto, { includeUnscheduled: 123, ... })` → `validate()` returns errors containing `includeUnscheduled must be a boolean value`
- Edge case: `plainToInstance(CalendarQueryDto, { includeUnscheduled: '', ... })` → `validate()` returns errors containing `includeUnscheduled must be a boolean value`
- Edge case: `plainToInstance(CalendarQueryDto, { includeUnscheduled: 'TRUE', ... })` → `validate()` returns errors containing `includeUnscheduled must be a boolean value`
- Error path: Missing `startDate` → validation errors contain `startDate` constraint
- Error path: Invalid date format for `startDate` → validation errors contain `startDate` constraint

**Verification:**
- `pnpm test calendar-query.dto.spec` passes
- All test scenarios above are covered

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `@Transform()` interacts unexpectedly with other validators on the same property | The transform runs before validators by design in `class-transformer`. Test covers the interaction. |
| Future developer removes `@Transform()` not understanding why it's needed | The spec file (U2) provides regression coverage and documents the behavior. |

## Sources & References

- Related code: `apps/api/src/tasks/dto/calendar-query.dto.ts`
- Related plan: `docs/plans/2026-05-04-001-feat-calendar-view-task-scheduling-plan.md` (U3 defines the original DTO)
- External docs: https://docs.nestjs.com/techniques/validation (query parameter coercion)
