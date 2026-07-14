# Super Admin

Organization owner: branches, admins, methodists, org dashboard

[← back to index](./README.md)

### POST `/api/super/admins`
Create an admin assigned to one of the organization's branches

Login (email) and password are set directly by the Super Admin (not auto-generated).

**Auth:** Bearer JWT required
**Role(s):** superadmin

**Request body:**
- **CreateAdminRequest**:
  - `firstName`: string **(required)**
  - `lastName`: string **(required)**
  - `email`: string (email) **(required)**
  - `password`: string **(required)**
  - `branchId`: string (uuid) **(required)**
  - `phone`: string (optional)

**Responses:**

- **201** — Admin created
  - `admin` (optional):
    - **AdminSummary**:
      - `id`: string (uuid) (optional)
      - `firstName`: string (optional)
      - `lastName`: string (optional)
      - `email`: string (email) (optional)
      - `status`: enum: `active` | `frozen` (optional)
      - `branchId`: string (uuid) (optional)

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

- **404** — Branch not found in your organization
  - **ErrorResponse**:
    - `success`: boolean **(required)** _e.g. false_
    - `message`: string **(required)**
    - `details` (optional):
      - _(free-form object)_
    - `stack`: string (optional) — Only present when NODE_ENV=development

- **409** — Email already in use
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

### GET `/api/super/admins`
List admins of the organization

**Auth:** Bearer JWT required
**Role(s):** superadmin

**Responses:**

- **200** — List of admins
  - `admins` (optional):
    - _array of:_
      - **AdminSummary**:
        - `id`: string (uuid) (optional)
        - `firstName`: string (optional)
        - `lastName`: string (optional)
        - `email`: string (email) (optional)
        - `status`: enum: `active` | `frozen` (optional)
        - `branchId`: string (uuid) (optional)
      - `branchName`: string (optional)
      - `createdAt`: string (date-time) (optional)

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

### PATCH `/api/super/admins/{id}`
Update an admin (partial — at least one field; can reassign branch)

If `branchId` is changed, the new branch must belong to the same organization.

**Auth:** Bearer JWT required
**Role(s):** superadmin

**Params:**
- `id` (path, string) **(required)**

**Request body:**
- **UpdateAdminRequest**:
  - `firstName`: string (optional)
  - `lastName`: string (optional)
  - `branchId`: string (uuid) (optional)
  - `phone`: string (optional)

**Responses:**

- **200** — Updated admin
  - `admin` (optional):
    - **AdminSummary**:
      - `id`: string (uuid) (optional)
      - `firstName`: string (optional)
      - `lastName`: string (optional)
      - `email`: string (email) (optional)
      - `status`: enum: `active` | `frozen` (optional)
      - `branchId`: string (uuid) (optional)

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

- **404** — Admin or target branch not found in your organization
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

### PATCH `/api/super/admins/{id}/freeze`
Freeze or unfreeze an admin account

**Auth:** Bearer JWT required
**Role(s):** superadmin

**Params:**
- `id` (path, string) **(required)**

**Request body:**
- `frozen`: boolean **(required)**

**Responses:**

- **200** — Updated admin status
  - `admin` (optional):
    - **AdminSummary**:
      - `id`: string (uuid) (optional)
      - `firstName`: string (optional)
      - `lastName`: string (optional)
      - `email`: string (email) (optional)
      - `status`: enum: `active` | `frozen` (optional)
      - `branchId`: string (uuid) (optional)

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

- **404** — Admin not found in your organization
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

### POST `/api/super/branches`
Create a branch in the organization

The organization's first branch is automatically flagged `isMain`.

**Auth:** Bearer JWT required
**Role(s):** superadmin

**Request body:**
- **CreateBranchRequest**:
  - `name`: string **(required)**
  - `address`: string (optional)
  - `phone`: string (optional)

**Responses:**

- **201** — Branch created
  - `branch` (optional):
    - **Branch**:
      - `id`: string (uuid) (optional)
      - `name`: string (optional)
      - `address`: string (optional)
      - `phone`: string (optional)
      - `isMain`: boolean (optional)
      - `isArchived`: boolean (optional)
      - `createdAt`: string (date-time) (optional)

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

### GET `/api/super/branches`
List branches of the organization (with admin/student counts)

**Auth:** Bearer JWT required
**Role(s):** superadmin

**Responses:**

- **200** — List of branches
  - `branches` (optional):
    - _array of:_
      - **Branch**:
        - `id`: string (uuid) (optional)
        - `name`: string (optional)
        - `address`: string (optional)
        - `phone`: string (optional)
        - `isMain`: boolean (optional)
        - `isArchived`: boolean (optional)
        - `createdAt`: string (date-time) (optional)
      - `admins`: integer (optional)
      - `students`: integer (optional)

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

### GET `/api/super/branches/{id}`
Branch detail — branch info + its admins + its groups

**Auth:** Bearer JWT required
**Role(s):** superadmin

**Params:**
- `id` (path, string) **(required)**

**Responses:**

- **200** — Branch detail
  - `branch` (optional):
    - **Branch**:
      - `id`: string (uuid) (optional)
      - `name`: string (optional)
      - `address`: string (optional)
      - `phone`: string (optional)
      - `isMain`: boolean (optional)
      - `isArchived`: boolean (optional)
      - `createdAt`: string (date-time) (optional)
    - `admins` (optional):
      - _array of:_
        - `id`: string (uuid) (optional)
        - `firstName`: string (optional)
        - `lastName`: string (optional)
        - `email`: string (email) (optional)
        - `status`: string (optional)
    - `groups` (optional):
      - _array of:_
        - `id`: string (uuid) (optional)
        - `name`: string (optional)
        - `subject`: string (optional)
        - `monthlyPrice`: number (optional)

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

- **404** — Branch not found in your organization
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

### PATCH `/api/super/branches/{id}`
Update branch fields (partial — at least one field required)

**Auth:** Bearer JWT required
**Role(s):** superadmin

**Params:**
- `id` (path, string) **(required)**

**Request body:**
- **UpdateBranchRequest**:
  - `name`: string (optional)
  - `address`: string (optional)
  - `phone`: string (optional)

**Responses:**

- **200** — Updated branch
  - `branch` (optional):
    - **Branch**:
      - `id`: string (uuid) (optional)
      - `name`: string (optional)
      - `address`: string (optional)
      - `phone`: string (optional)
      - `isMain`: boolean (optional)
      - `isArchived`: boolean (optional)
      - `createdAt`: string (date-time) (optional)

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

- **404** — Branch not found in your organization
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

### POST `/api/super/branches/{id}/archive`
Archive a branch (read-only afterwards)

**Auth:** Bearer JWT required
**Role(s):** superadmin

**Params:**
- `id` (path, string) **(required)**

**Responses:**

- **200** — Branch archived
  - `branch` (optional):
    - **Branch**:
      - `id`: string (uuid) (optional)
      - `name`: string (optional)
      - `address`: string (optional)
      - `phone`: string (optional)
      - `isMain`: boolean (optional)
      - `isArchived`: boolean (optional)
      - `createdAt`: string (date-time) (optional)

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

- **404** — Branch not found in your organization
  - **ErrorResponse**:
    - `success`: boolean **(required)** _e.g. false_
    - `message`: string **(required)**
    - `details` (optional):
      - _(free-form object)_
    - `stack`: string (optional) — Only present when NODE_ENV=development

---

### POST `/api/super/branches/{id}/unarchive`
Unarchive a branch

**Auth:** Bearer JWT required
**Role(s):** superadmin

**Params:**
- `id` (path, string) **(required)**

**Responses:**

- **200** — Branch unarchived
  - `branch` (optional):
    - **Branch**:
      - `id`: string (uuid) (optional)
      - `name`: string (optional)
      - `address`: string (optional)
      - `phone`: string (optional)
      - `isMain`: boolean (optional)
      - `isArchived`: boolean (optional)
      - `createdAt`: string (date-time) (optional)

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

- **404** — Branch not found in your organization
  - **ErrorResponse**:
    - `success`: boolean **(required)** _e.g. false_
    - `message`: string **(required)**
    - `details` (optional):
      - _(free-form object)_
    - `stack`: string (optional) — Only present when NODE_ENV=development

---

### GET `/api/super/dashboard`
Organization dashboard (revenue, debt, students, per-branch breakdown)

**Auth:** Bearer JWT required
**Role(s):** superadmin

**Responses:**

- **200** — Dashboard data
  - `totals` (optional):
    - `branches`: integer (optional)
    - `activeStudents`: integer (optional)
    - `admins`: integer (optional)
    - `revenue`: number (optional)
    - `outstandingDebt`: number (optional)
    - `currency`: string (optional) _e.g. "UZS"_
  - `branches` (optional):
    - _array of:_
      - `id`: string (uuid) (optional)
      - `name`: string (optional)
      - `isMain`: boolean (optional)
      - `isArchived`: boolean (optional)
      - `students`: integer (optional)
      - `admins`: integer (optional)
      - `revenue`: number (optional)
      - `debt`: number (optional)

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

### POST `/api/super/methodists`
Create a methodist (organization-level, not tied to a branch)

**Auth:** Bearer JWT required
**Role(s):** superadmin

**Request body:**
- **CreateMethodistRequest**:
  - `firstName`: string **(required)**
  - `lastName`: string **(required)**
  - `email`: string (email) **(required)**
  - `password`: string **(required)**
  - `phone`: string (optional)

**Responses:**

- **201** — Methodist created
  - `methodist` (optional):
    - **MethodistSummary**:
      - `id`: string (uuid) (optional)
      - `firstName`: string (optional)
      - `lastName`: string (optional)
      - `email`: string (email) (optional)
      - `status`: enum: `active` | `frozen` (optional)
      - `phone`: string (optional)

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

- **409** — Email already in use
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

### GET `/api/super/methodists`
List methodists of the organization

**Auth:** Bearer JWT required
**Role(s):** superadmin

**Responses:**

- **200** — List of methodists
  - `methodists` (optional):
    - _array of:_
      - **MethodistSummary**:
        - `id`: string (uuid) (optional)
        - `firstName`: string (optional)
        - `lastName`: string (optional)
        - `email`: string (email) (optional)
        - `status`: enum: `active` | `frozen` (optional)
        - `phone`: string (optional)
      - `createdAt`: string (date-time) (optional)

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

### PATCH `/api/super/methodists/{id}`
Update a methodist (partial — at least one field)

**Auth:** Bearer JWT required
**Role(s):** superadmin

**Params:**
- `id` (path, string) **(required)**

**Request body:**
- **UpdateMethodistRequest**:
  - `firstName`: string (optional)
  - `lastName`: string (optional)
  - `phone`: string (optional)

**Responses:**

- **200** — Updated methodist
  - `methodist` (optional):
    - **MethodistSummary**:
      - `id`: string (uuid) (optional)
      - `firstName`: string (optional)
      - `lastName`: string (optional)
      - `email`: string (email) (optional)
      - `status`: enum: `active` | `frozen` (optional)
      - `phone`: string (optional)

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

- **404** — Methodist not found in your organization
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

### PATCH `/api/super/methodists/{id}/freeze`
Freeze or unfreeze a methodist account

**Auth:** Bearer JWT required
**Role(s):** superadmin

**Params:**
- `id` (path, string) **(required)**

**Request body:**
- `frozen`: boolean **(required)**

**Responses:**

- **200** — Updated methodist status
  - `methodist` (optional):
    - **MethodistSummary**:
      - `id`: string (uuid) (optional)
      - `firstName`: string (optional)
      - `lastName`: string (optional)
      - `email`: string (email) (optional)
      - `status`: enum: `active` | `frozen` (optional)
      - `phone`: string (optional)

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

- **404** — Methodist not found in your organization
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
