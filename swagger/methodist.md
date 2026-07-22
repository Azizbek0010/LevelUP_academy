# Methodist

Organization-wide content authoring (training types/topics/lessons/questions) + analytics

[← back to index](./README.md)

### GET `/api/methodist/difficulty`
Difficulty analytics report — test and homework score stats across the organization

**Auth:** Bearer JWT required
**Role(s):** methodist (org-wide content)

**Responses:**

- **200** — Difficulty report
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - `tests` (optional):
      - _array of:_
        - _(free-form object)_
    - `homework` (optional):
      - _array of:_
        - _(free-form object)_

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

### GET `/api/methodist/groups`
List all groups in the organization (all branches)

**Auth:** Bearer JWT required
**Role(s):** methodist (org-wide content)

**Responses:**

- **200** — List of groups
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - _array of:_
      - _(free-form object)_

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

### POST `/api/methodist/lessons`
Create a lesson (test or practical) inside a topic

**Auth:** Bearer JWT required
**Role(s):** methodist (org-wide content)

**Request body:**
- **CreateLessonRequest**:
  - `topicId`: string (uuid) **(required)**
  - `title`: string **(required)**
  - `lessonType`: enum: `test` | `practical` **(required)**
  - `description`: string (optional)
  - `instruction`: string (optional)
  - `coinReward`: integer (optional)

**Responses:**

- **201** — Lesson created
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - **Lesson**:
      - `id`: string (uuid) (optional)
      - `title`: string (optional)
      - `lesson_type`: enum: `test` | `practical` (optional)
      - `description`: string (optional)
      - `instruction`: string (optional)
      - `coin_reward`: integer (optional)
      - `sort_order`: integer (optional)
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

- **404** — Topic not found in your organization
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

### GET `/api/methodist/lessons/{id}`
Get a lesson with its full question list

**Auth:** Bearer JWT required
**Role(s):** methodist (org-wide content)

**Params:**
- `id` (path, string) **(required)**

**Responses:**

- **200** — Lesson with questions
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - **LessonWithQuestions**:
      - **Lesson**:
        - `id`: string (uuid) (optional)
        - `title`: string (optional)
        - `lesson_type`: enum: `test` | `practical` (optional)
        - `description`: string (optional)
        - `instruction`: string (optional)
        - `coin_reward`: integer (optional)
        - `sort_order`: integer (optional)
        - `created_at`: string (date-time) (optional)
      - `questions` (optional):
        - _array of:_
          - **Question**:
            - `id`: string (uuid) (optional)
            - `questionText`: string (optional)
            - `optionA`: string (optional)
            - `optionB`: string (optional)
            - `optionC`: string (optional)
            - `optionD`: string (optional)
            - `correctAnswer`: enum: `A` | `B` | `C` | `D` (optional)
            - `sortOrder`: integer (optional)

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

- **404** — Lesson not found
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

### PATCH `/api/methodist/lessons/{id}`
Update a lesson (partial)

**Auth:** Bearer JWT required
**Role(s):** methodist (org-wide content)

**Params:**
- `id` (path, string) **(required)**

**Request body:**
- **UpdateLessonRequest**:
  - `title`: string (optional)
  - `description`: string (optional)
  - `instruction`: string (optional)
  - `coinReward`: integer (optional)

**Responses:**

- **200** — Updated lesson
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - **Lesson**:
      - `id`: string (uuid) (optional)
      - `title`: string (optional)
      - `lesson_type`: enum: `test` | `practical` (optional)
      - `description`: string (optional)
      - `instruction`: string (optional)
      - `coin_reward`: integer (optional)
      - `sort_order`: integer (optional)
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

- **404** — Lesson not found
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

### POST `/api/methodist/lessons/{id}/archive`
Archive a lesson

**Auth:** Bearer JWT required
**Role(s):** methodist (org-wide content)

**Params:**
- `id` (path, string) **(required)**

**Responses:**

- **200** — Archived (no data payload)
  - `success`: boolean (optional) _e.g. true_

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

### POST `/api/methodist/lessons/{id}/copy`
Copy a lesson (and all its questions) into another topic

New lesson's title is suffixed with " (копия)". Target topic must belong to the same organization.

**Auth:** Bearer JWT required
**Role(s):** methodist (org-wide content)

**Params:**
- `id` (path, string) **(required)**

**Request body:**
- `targetTopicId`: string (uuid) **(required)**

**Responses:**

- **201** — New lesson with copied questions
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - **LessonWithQuestions**:
      - **Lesson**:
        - `id`: string (uuid) (optional)
        - `title`: string (optional)
        - `lesson_type`: enum: `test` | `practical` (optional)
        - `description`: string (optional)
        - `instruction`: string (optional)
        - `coin_reward`: integer (optional)
        - `sort_order`: integer (optional)
        - `created_at`: string (date-time) (optional)
      - `questions` (optional):
        - _array of:_
          - **Question**:
            - `id`: string (uuid) (optional)
            - `questionText`: string (optional)
            - `optionA`: string (optional)
            - `optionB`: string (optional)
            - `optionC`: string (optional)
            - `optionD`: string (optional)
            - `correctAnswer`: enum: `A` | `B` | `C` | `D` (optional)
            - `sortOrder`: integer (optional)

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

- **404** — Lesson or target topic not found
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

### GET `/api/methodist/lessons/{id}/upload-url`
Presigned S3 upload url for a lesson's practical-task attachment

Возвращает presigned PUT url + fileKey. Клиент грузит файл на uploadUrl, затем сохраняет ключ через PATCH /lessons/{id} { fileKey }.


**Auth:** Bearer JWT required
**Role(s):** methodist (org-wide content)

**Params:**
- `id` (path, string) **(required)**
- `filename` (query, string) **(required)**
- `contentType` (query, string) (optional)

**Responses:**

- **200** — Presigned upload url
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - **LessonUploadUrl**:
      - `uploadUrl`: string (optional) — Presigned S3 PUT url (клиент грузит файл сюда)
      - `fileKey`: string (optional) — Ключ объекта; сохранить в урок через PATCH /lessons/:id { fileKey }

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

### GET `/api/methodist/lessons/{lessonId}/questions`
List questions of a lesson

**Auth:** Bearer JWT required
**Role(s):** methodist (org-wide content)

**Params:**
- `lessonId` (path, string) **(required)**

**Responses:**

- **200** — List of questions
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - _array of:_
      - **Question**:
        - `id`: string (uuid) (optional)
        - `questionText`: string (optional)
        - `optionA`: string (optional)
        - `optionB`: string (optional)
        - `optionC`: string (optional)
        - `optionD`: string (optional)
        - `correctAnswer`: enum: `A` | `B` | `C` | `D` (optional)
        - `sortOrder`: integer (optional)

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

### POST `/api/methodist/questions`
Create a single A/B/C/D question for a lesson

Note: unlike most other content-mutation endpoints in this module, this one does not verify the lesson belongs to the caller's organization before inserting (no findLessonInOrg check in the service).


**Auth:** Bearer JWT required
**Role(s):** methodist (org-wide content)

**Request body:**
- **CreateQuestionRequest**:
  - `lessonId`: string (uuid) **(required)**
  - `questionText`: string **(required)**
  - `optionA`: string **(required)**
  - `optionB`: string **(required)**
  - `optionC`: string **(required)**
  - `optionD`: string **(required)**
  - `correctAnswer`: enum: `A` | `B` | `C` | `D` **(required)**

**Responses:**

- **201** — Question created
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - **Question**:
      - `id`: string (uuid) (optional)
      - `questionText`: string (optional)
      - `optionA`: string (optional)
      - `optionB`: string (optional)
      - `optionC`: string (optional)
      - `optionD`: string (optional)
      - `correctAnswer`: enum: `A` | `B` | `C` | `D` (optional)
      - `sortOrder`: integer (optional)

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

### PATCH `/api/methodist/questions/{id}`
Update a question (partial)

**Auth:** Bearer JWT required
**Role(s):** methodist (org-wide content)

**Params:**
- `id` (path, string) **(required)**

**Request body:**
- **UpdateQuestionRequest**:
  - `questionText`: string (optional)
  - `optionA`: string (optional)
  - `optionB`: string (optional)
  - `optionC`: string (optional)
  - `optionD`: string (optional)
  - `correctAnswer`: enum: `A` | `B` | `C` | `D` (optional)

**Responses:**

- **200** — Updated question
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - **Question**:
      - `id`: string (uuid) (optional)
      - `questionText`: string (optional)
      - `optionA`: string (optional)
      - `optionB`: string (optional)
      - `optionC`: string (optional)
      - `optionD`: string (optional)
      - `correctAnswer`: enum: `A` | `B` | `C` | `D` (optional)
      - `sortOrder`: integer (optional)

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

- **404** — Question not found
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

### DELETE `/api/methodist/questions/{id}`
Delete a question (hard delete)

**Auth:** Bearer JWT required
**Role(s):** methodist (org-wide content)

**Params:**
- `id` (path, string) **(required)**

**Responses:**

- **204** — Question deleted

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

### POST `/api/methodist/questions/batch`
Create multiple A/B/C/D questions for one or more lessons in a single insert

**Auth:** Bearer JWT required
**Role(s):** methodist (org-wide content)

**Request body:**
- `questions` **(required)**:
  - _array of:_
    - **CreateQuestionRequest**:
      - `lessonId`: string (uuid) **(required)**
      - `questionText`: string **(required)**
      - `optionA`: string **(required)**
      - `optionB`: string **(required)**
      - `optionC`: string **(required)**
      - `optionD`: string **(required)**
      - `correctAnswer`: enum: `A` | `B` | `C` | `D` **(required)**

**Responses:**

- **201** — Questions created
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - _array of:_
      - **Question**:
        - `id`: string (uuid) (optional)
        - `questionText`: string (optional)
        - `optionA`: string (optional)
        - `optionB`: string (optional)
        - `optionC`: string (optional)
        - `optionD`: string (optional)
        - `correctAnswer`: enum: `A` | `B` | `C` | `D` (optional)
        - `sortOrder`: integer (optional)

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

### GET `/api/methodist/students`
List all students in the organization with their groups (no financial data)

**Auth:** Bearer JWT required
**Role(s):** methodist (org-wide content)

**Responses:**

- **200** — List of students
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - _array of:_
      - _(free-form object)_

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

### POST `/api/methodist/topics`
Create a topic inside a training type

**Auth:** Bearer JWT required
**Role(s):** methodist (org-wide content)

**Request body:**
- **CreateTopicRequest**:
  - `trainingTypeId`: string (uuid) **(required)**
  - `name`: string **(required)**
  - `description`: string (optional)
  - `videoUrl`: string (optional)

**Responses:**

- **201** — Topic created
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - **Topic**:
      - `id`: string (uuid) (optional)
      - `name`: string (optional)
      - `description`: string (optional)
      - `video_url`: string (optional)
      - `sort_order`: integer (optional)
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

- **404** — Training type not found
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

### PATCH `/api/methodist/topics/{id}`
Update a topic (partial)

**Auth:** Bearer JWT required
**Role(s):** methodist (org-wide content)

**Params:**
- `id` (path, string) **(required)**

**Request body:**
- **UpdateTopicRequest**:
  - `name`: string (optional)
  - `description`: string (optional)
  - `videoUrl`: string (optional)

**Responses:**

- **200** — Updated topic
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - **Topic**:
      - `id`: string (uuid) (optional)
      - `name`: string (optional)
      - `description`: string (optional)
      - `video_url`: string (optional)
      - `sort_order`: integer (optional)
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

- **404** — Topic not found
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

### POST `/api/methodist/topics/{id}/archive`
Archive a topic

**Auth:** Bearer JWT required
**Role(s):** methodist (org-wide content)

**Params:**
- `id` (path, string) **(required)**

**Responses:**

- **200** — Archived (no data payload)
  - `success`: boolean (optional) _e.g. true_

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

### GET `/api/methodist/topics/{id}/lessons`
List lessons of a topic (with question counts)

Path parameter is named `id` in the route but read as `topicId` by the controller.

**Auth:** Bearer JWT required
**Role(s):** methodist (org-wide content)

**Params:**
- `id` (path, string) **(required)**

**Responses:**

- **200** — List of lessons
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - _array of:_
      - **Lesson**:
        - `id`: string (uuid) (optional)
        - `title`: string (optional)
        - `lesson_type`: enum: `test` | `practical` (optional)
        - `description`: string (optional)
        - `instruction`: string (optional)
        - `coin_reward`: integer (optional)
        - `sort_order`: integer (optional)
        - `created_at`: string (date-time) (optional)
      - `questions_count`: integer (optional)

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

- **404** — Topic not found
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

### POST `/api/methodist/training-types`
Create a training type (organization-level content root)

**Auth:** Bearer JWT required
**Role(s):** methodist (org-wide content)

**Request body:**
- **CreateTrainingTypeRequest**:
  - `name`: string **(required)**
  - `description`: string (optional)
  - `icon`: string (optional)

**Responses:**

- **201** — Training type created
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - **TrainingType**:
      - `id`: string (uuid) (optional)
      - `name`: string (optional)
      - `description`: string (optional)
      - `icon`: string (optional)
      - `sort_order`: integer (optional)
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

### GET `/api/methodist/training-types`
List training types of the organization (with topic counts)

**Auth:** Bearer JWT required
**Role(s):** methodist (org-wide content)

**Responses:**

- **200** — List of training types
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - _array of:_
      - **TrainingType**:
        - `id`: string (uuid) (optional)
        - `name`: string (optional)
        - `description`: string (optional)
        - `icon`: string (optional)
        - `sort_order`: integer (optional)
        - `created_at`: string (date-time) (optional)
      - `topics_count`: integer (optional)

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

### PATCH `/api/methodist/training-types/{id}`
Update a training type (partial)

**Auth:** Bearer JWT required
**Role(s):** methodist (org-wide content)

**Params:**
- `id` (path, string) **(required)**

**Request body:**
- **UpdateTrainingTypeRequest**:
  - `name`: string (optional)
  - `description`: string (optional)
  - `icon`: string (optional)

**Responses:**

- **200** — Updated training type
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - **TrainingType**:
      - `id`: string (uuid) (optional)
      - `name`: string (optional)
      - `description`: string (optional)
      - `icon`: string (optional)
      - `sort_order`: integer (optional)
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

- **404** — Training type not found
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

### POST `/api/methodist/training-types/{id}/archive`
Archive a training type

**Auth:** Bearer JWT required
**Role(s):** methodist (org-wide content)

**Params:**
- `id` (path, string) **(required)**

**Responses:**

- **200** — Archived (no data payload)
  - `success`: boolean (optional) _e.g. true_

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

### GET `/api/methodist/training-types/{id}/topics`
List topics of a training type (with lesson counts)

Path parameter is named `id` in the route but read as `trainingTypeId` by the controller.

**Auth:** Bearer JWT required
**Role(s):** methodist (org-wide content)

**Params:**
- `id` (path, string) **(required)**

**Responses:**

- **200** — List of topics
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - _array of:_
      - **Topic**:
        - `id`: string (uuid) (optional)
        - `name`: string (optional)
        - `description`: string (optional)
        - `video_url`: string (optional)
        - `sort_order`: integer (optional)
        - `created_at`: string (date-time) (optional)
      - `lessons_count`: integer (optional)

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

- **404** — Training type not found
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
