# Discipline

Дисциплина сотрудников: штрафы (shtraf) + увольнение (qora) + устав организации

[← back to index](./README.md)

### GET `/api/admin/charter`
View organization charter (read-only for Admin)

**Auth:** Bearer JWT required
**Role(s):** authenticated

**Responses:**

- **200** — Charter
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - **Charter**:
      - `organization_id`: string (uuid) (optional)
      - `title`: string (optional)
      - `content`: string (optional)
      - `updated_by`: string (uuid) (optional)
      - `updated_at`: string (date-time) (optional)

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

### GET `/api/admin/penalties`
List penalties issued by this admin

**Auth:** Bearer JWT required
**Role(s):** authenticated

**Params:**
- `targetUserId` (query, string) (optional)
- `type` (query, string) (optional)

**Responses:**

- **200** — Penalty list
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - _array of:_
      - **Penalty**:
        - `id`: string (uuid) (optional)
        - `type`: enum: `shtraf` | `qora` (optional)
        - `amount`: number (optional) — null для qora
        - `reason`: string (optional)
        - `created_at`: string (date-time) (optional)
        - `target_user_id`: string (uuid) (optional)
        - `target_role`: enum: `admin` | `mentor` | `methodist` (optional)
        - `target_name`: string (optional)
        - `issued_by`: string (uuid) (optional)
        - `issuer_role`: enum: `superadmin` | `admin` (optional)
        - `issued_by_name`: string (optional)

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

### POST `/api/admin/penalties`
Issue penalty — Admin → mentor/methodist (shtraf), mentor (qora)

Ментор только своего филиала. Права проверяются в discipline.service.

**Auth:** Bearer JWT required
**Role(s):** authenticated

**Request body:**
- **IssuePenaltyRequest**:
  - `targetUserId`: string (uuid) **(required)** — Сотрудник: admin / mentor / methodist
  - `type`: enum: `shtraf` | `qora` **(required)** — shtraf = штраф; qora = увольнение
  - `amount`: number (optional) — Сумма в сумах — обязательна для shtraf, не задаётся для qora (без автосписания)
  - `reason`: string **(required)**

**Responses:**

- **201** — Penalty created
  - **IssuePenaltyResponse**:
    - `success`: boolean (optional) _e.g. true_
    - `data` (optional):
      - `penalty` (optional):
        - **Penalty**:
          - `id`: string (uuid) (optional)
          - `type`: enum: `shtraf` | `qora` (optional)
          - `amount`: number (optional) — null для qora
          - `reason`: string (optional)
          - `created_at`: string (date-time) (optional)
          - `target_user_id`: string (uuid) (optional)
          - `target_role`: enum: `admin` | `mentor` | `methodist` (optional)
          - `target_name`: string (optional)
          - `issued_by`: string (uuid) (optional)
          - `issuer_role`: enum: `superadmin` | `admin` (optional)
          - `issued_by_name`: string (optional)
      - `fired`: boolean (optional) — true если это qora (сотрудник уволен, status=fired)

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

- **404** — Resource not found (or not in caller's organization/scope)
  - **ErrorResponse**:
    - `success`: boolean **(required)** _e.g. false_
    - `message`: string **(required)**
    - `details` (optional):
      - _(free-form object)_
    - `stack`: string (optional) — Only present when NODE_ENV=development

- **409** — Conflict with current state (e.g. already fired / not fired)
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

### GET `/api/super/charter`
Get organization charter (устав)

Если устав ещё не создан — возвращается пустой шаблон.

**Auth:** Bearer JWT required
**Role(s):** authenticated

**Responses:**

- **200** — Charter
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - **Charter**:
      - `organization_id`: string (uuid) (optional)
      - `title`: string (optional)
      - `content`: string (optional)
      - `updated_by`: string (uuid) (optional)
      - `updated_at`: string (date-time) (optional)

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

### PUT `/api/super/charter`
Create/update organization charter (Super Admin only)

**Auth:** Bearer JWT required
**Role(s):** authenticated

**Request body:**
- **UpsertCharterRequest**:
  - `title`: string (optional)
  - `content`: string **(required)**

**Responses:**

- **200** — Saved charter
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - **Charter**:
      - `organization_id`: string (uuid) (optional)
      - `title`: string (optional)
      - `content`: string (optional)
      - `updated_by`: string (uuid) (optional)
      - `updated_at`: string (date-time) (optional)

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

### GET `/api/super/penalties`
List penalties in the organization

**Auth:** Bearer JWT required
**Role(s):** authenticated

**Params:**
- `targetUserId` (query, string) (optional)
- `type` (query, string) (optional)

**Responses:**

- **200** — Penalty list
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - _array of:_
      - **Penalty**:
        - `id`: string (uuid) (optional)
        - `type`: enum: `shtraf` | `qora` (optional)
        - `amount`: number (optional) — null для qora
        - `reason`: string (optional)
        - `created_at`: string (date-time) (optional)
        - `target_user_id`: string (uuid) (optional)
        - `target_role`: enum: `admin` | `mentor` | `methodist` (optional)
        - `target_name`: string (optional)
        - `issued_by`: string (uuid) (optional)
        - `issuer_role`: enum: `superadmin` | `admin` (optional)
        - `issued_by_name`: string (optional)

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

### POST `/api/super/penalties`
Issue a penalty (shtraf) or fire (qora) a staff member

Super Admin → admin / mentor / methodist (и shtraf, и qora). qora ставит целевому status=fired (атомарно).


**Auth:** Bearer JWT required
**Role(s):** authenticated

**Request body:**
- **IssuePenaltyRequest**:
  - `targetUserId`: string (uuid) **(required)** — Сотрудник: admin / mentor / methodist
  - `type`: enum: `shtraf` | `qora` **(required)** — shtraf = штраф; qora = увольнение
  - `amount`: number (optional) — Сумма в сумах — обязательна для shtraf, не задаётся для qora (без автосписания)
  - `reason`: string **(required)**

**Responses:**

- **201** — Penalty created
  - **IssuePenaltyResponse**:
    - `success`: boolean (optional) _e.g. true_
    - `data` (optional):
      - `penalty` (optional):
        - **Penalty**:
          - `id`: string (uuid) (optional)
          - `type`: enum: `shtraf` | `qora` (optional)
          - `amount`: number (optional) — null для qora
          - `reason`: string (optional)
          - `created_at`: string (date-time) (optional)
          - `target_user_id`: string (uuid) (optional)
          - `target_role`: enum: `admin` | `mentor` | `methodist` (optional)
          - `target_name`: string (optional)
          - `issued_by`: string (uuid) (optional)
          - `issuer_role`: enum: `superadmin` | `admin` (optional)
          - `issued_by_name`: string (optional)
      - `fired`: boolean (optional) — true если это qora (сотрудник уволен, status=fired)

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

- **404** — Resource not found (or not in caller's organization/scope)
  - **ErrorResponse**:
    - `success`: boolean **(required)** _e.g. false_
    - `message`: string **(required)**
    - `details` (optional):
      - _(free-form object)_
    - `stack`: string (optional) — Only present when NODE_ENV=development

- **409** — Conflict with current state (e.g. already fired / not fired)
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

### POST `/api/super/staff/{id}/reactivate`
Reactivate a fired staff member (qora → active)

**Auth:** Bearer JWT required
**Role(s):** authenticated

**Params:**
- `id` (path, string) **(required)**

**Responses:**

- **200** — Reactivated
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - `id`: string (uuid) (optional)
    - `status`: string (optional) _e.g. "active"_

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

- **404** — Resource not found (or not in caller's organization/scope)
  - **ErrorResponse**:
    - `success`: boolean **(required)** _e.g. false_
    - `message`: string **(required)**
    - `details` (optional):
      - _(free-form object)_
    - `stack`: string (optional) — Only present when NODE_ENV=development

- **409** — Conflict with current state (e.g. already fired / not fired)
  - **ErrorResponse**:
    - `success`: boolean **(required)** _e.g. false_
    - `message`: string **(required)**
    - `details` (optional):
      - _(free-form object)_
    - `stack`: string (optional) — Only present when NODE_ENV=development

---

### GET `/api/users/me/charter`
Own organization charter (staff self-view)

**Auth:** Bearer JWT required
**Role(s):** authenticated

**Responses:**

- **200** — Charter
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - **Charter**:
      - `organization_id`: string (uuid) (optional)
      - `title`: string (optional)
      - `content`: string (optional)
      - `updated_by`: string (uuid) (optional)
      - `updated_at`: string (date-time) (optional)

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

### GET `/api/users/me/penalties`
Own penalties (admin / mentor / methodist self-view)

**Auth:** Bearer JWT required
**Role(s):** authenticated

**Responses:**

- **200** — Own penalty list
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - _array of:_
      - `id`: string (uuid) (optional)
      - `type`: enum: `shtraf` | `qora` (optional)
      - `amount`: number (optional)
      - `reason`: string (optional)
      - `issuer_role`: string (optional)
      - `created_at`: string (date-time) (optional)

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
