# Roadmap Template

Use this template when creating or updating the project roadmap in `docs/roadmap/ROADMAP.md`.

---

## Template

```markdown
# Roadmap
<Project name> - <One-line description>

## Deployment assumptions
- Branch: main
- <Any other constraints or team setup>

## Workstreams
### <Area 1> (e.g., Backend)
- <Scope summary>

### <Area 2> (e.g., Frontend)
- <Scope summary>

---

# Phase 0 - Foundations
**Goal:** <What this phase enables>
**Sprint:** <number>
**Status:** pending | in_progress | completed

## <Workstream 1>
- [ ] Task 1
- [ ] Task 2

## <Workstream 2>
- [ ] Task 1
- [ ] Task 2

## Shared / Testing
- [ ] Shared task

**Exit criteria:** <What must be true to move to Phase 1>

---

# Phase N - <Feature Area>
**Goal:** <What this phase delivers to the user>
**Sprint:** <number>
**Status:** pending | in_progress | completed

## Backend
- [ ] ...

## Frontend
- [ ] ...

## Tests
- [ ] Unit: ...
- [ ] Component: ...
- [ ] E2E: ...

**Exit criteria:** <Measurable criteria to consider phase done>

---

# Requirements Traceability Checklist
- [ ] Requirement 1 (covered by Phase X)
- [ ] Requirement 2 (covered by Phase Y)
```

## Guidelines

1. **One phase = one shippable increment.** Each phase should end with something functional and testable.
2. **Exit criteria are mandatory.** Without them, you don't know when a phase is done.
3. **Status tracking:** Update status (`pending` -> `in_progress` -> `completed`) as work progresses.
4. **Traceability:** Every requirement from the project plan must map to at least one phase.
5. **Bottom-up order within phases:** Schema -> Repository -> Service -> API -> Hook -> Component.
6. **Tests are part of the phase**, not an afterthought. List them explicitly.
7. **Keep it updated:** The Planner agent updates this at the start of each sprint.
