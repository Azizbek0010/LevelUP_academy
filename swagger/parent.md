# Parent

Parent's read-only view of their children

[← back to index](./README.md)

### GET `/api/parent/children`
List the current parent's children (short cards for a picker screen)

**Auth:** Bearer JWT required
**Role(s):** parent (own children only)

**Responses:**

- **200** — List of children
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - _array of:_
      - **ChildCard**:
        - `id`: string (uuid) (optional)
        - `firstName`: string (optional)
        - `lastName`: string (optional)
        - `avatarKey`: string (optional)
        - `branchId`: string (uuid) (optional)
        - `coins`: integer (optional)
        - `totalDebt`: number (optional)
        - `frozen`: boolean (optional)

- **401** — Missing/invalid/expired bearer token
  - **ErrorResponse**:
    - `success`: boolean **(required)** _e.g. false_
    - `message`: string **(required)**
    - `details` (optional):
      - _(free-form object)_
    - `stack`: string (optional) — Only present when NODE_ENV=development

- **403** — Authenticated but role not allowed on this endpoint
  - **ErrorResponse**:
    - `success`: boolean **(required)** _e.g. false_
    - `message`: string **(required)**
    - `details` (optional):
      - _(free-form object)_
    - `stack`: string (optional) — Only present when NODE_ENV=development

---

### GET `/api/parent/children/{childId}/overview`
Full overview of one child (coins, debt, rank, groups, attendance, grades)

The child must be linked to this parent (`student_profiles.parent_id`) — a child belonging to another parent returns 403, not 404 (existence is not disclosed either way; the service treats "not found" as "not yours"). Attendance summary/recent cover the last 30 days; grades show the last 5 graded homework and the last 5 completed tests.


**Auth:** Bearer JWT required
**Role(s):** parent (own children only)

**Params:**
- `childId` (path, string) **(required)**

**Responses:**

- **200** — Child overview
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - **ChildOverview**:
      - `child` (optional):
        - `id`: string (uuid) (optional)
        - `firstName`: string (optional)
        - `lastName`: string (optional)
        - `avatarKey`: string (optional)
        - `frozen`: boolean (optional)
      - `coins`: integer (optional)
      - `totalDebt`: number (optional)
      - `rank` (optional):
        - `rank`: integer (optional)
        - `coins`: integer (optional)
      - `groups` (optional):
        - _array of:_
          - `id`: string (uuid) (optional)
          - `name`: string (optional)
          - `subject`: string (optional)
          - `mentorName`: string (optional)
      - `attendance` (optional):
        - `windowDays`: integer (optional) _e.g. 30_
        - `summary` (optional):
          - `present`: integer (optional)
          - `absent`: integer (optional)
          - `late`: integer (optional)
          - `excused`: integer (optional)
          - `total`: integer (optional)
        - `recent` (optional):
          - _array of:_
            - `lessonDate`: string (date) (optional)
            - `status`: string (optional)
            - `comment`: string (optional)
            - `groupName`: string (optional)
      - `grades` (optional):
        - `homework` (optional):
          - _array of:_
            - `title`: string (optional)
            - `score`: integer (optional)
            - `maxScore`: integer (optional)
            - `gradedAt`: string (date-time) (optional)
        - `tests` (optional):
          - _array of:_
            - `title`: string (optional)
            - `score`: integer (optional)
            - `maxScore`: integer (optional)
            - `finishedAt`: string (date-time) (optional)

- **401** — Missing/invalid/expired bearer token
  - **ErrorResponse**:
    - `success`: boolean **(required)** _e.g. false_
    - `message`: string **(required)**
    - `details` (optional):
      - _(free-form object)_
    - `stack`: string (optional) — Only present when NODE_ENV=development

- **403** — Child does not belong to this parent
  - **ErrorResponse**:
    - `success`: boolean **(required)** _e.g. false_
    - `message`: string **(required)**
    - `details` (optional):
      - _(free-form object)_
    - `stack`: string (optional) — Only present when NODE_ENV=development

- **422** — zod validation failed (body/params/query)
  - **ValidationErrorResponse**:
    - **ErrorResponse**:
      - `success`: boolean **(required)** _e.g. false_
      - `message`: string **(required)**
      - `details` (optional):
        - _(free-form object)_
      - `stack`: string (optional) — Only present when NODE_ENV=development
    - `message`: string (optional) _e.g. "Validation failed"_
    - `details` (optional):
      - _(free-form object)_

---
