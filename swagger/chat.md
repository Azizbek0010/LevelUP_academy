# Chat

Realtime chat REST history (sending is via Socket.io, not REST)

[← back to index](./README.md)

### GET `/api/chat/{roomKey}/messages`
Cursor-paginated message history for a chat room

Room access rules (`requireRoomAccess`): `global` — everyone except students; `parent:<uuid>` — that parent themself or any staff role; `group:<uuid>` — main_admin/superadmin/admin unconditionally, or the group's own mentor/enrolled students. `limit` is clamped server-side to [1, 100] (non-numeric defaults to 50); `cursor` must be a valid ISO timestamp (checked before hitting the DB — otherwise Postgres would 500 on a bad `::timestamptz` cast). This is REST read-only history; sending messages happens over the Socket.io chat namespace, not via this REST API.


**Auth:** Bearer JWT required
**Role(s):** any authenticated role (scoped to own chats)

**Params:**
- `roomKey` (path, string) **(required)**
- `limit` (query, integer) (optional)
- `cursor` (query, string) (optional) — ISO timestamp — returns messages older than this

**Responses:**

- **200** — Message history (newest first)
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - `messages` (optional):
      - _array of:_
        - **ChatMessage**:
          - `id`: string (uuid) (optional)
          - `chat_type`: string (optional)
          - `room_key`: string (optional)
          - `sender_id`: string (uuid) (optional)
          - `body`: string (optional)
          - `attachment_key`: string (optional)
          - `created_at`: string (date-time) (optional)
          - `sender_first_name`: string (optional)
          - `sender_last_name`: string (optional)
          - `sender_role`: string (optional)
    - `nextCursor`: string (date-time) (optional)

- **400** — cursor must be a valid ISO timestamp, or invalid/unknown room key
  - **ErrorResponse**:
    - `success`: boolean **(required)** _e.g. false_
    - `message`: string **(required)**
    - `details` (optional):
      - _(free-form object)_
    - `stack`: string (optional) — Only present when NODE_ENV=development

- **401** — Missing/invalid/expired bearer token
  - **ErrorResponse**:
    - `success`: boolean **(required)** _e.g. false_
    - `message`: string **(required)**
    - `details` (optional):
      - _(free-form object)_
    - `stack`: string (optional) — Only present when NODE_ENV=development

- **403** — No access to this room
  - **ErrorResponse**:
    - `success`: boolean **(required)** _e.g. false_
    - `message`: string **(required)**
    - `details` (optional):
      - _(free-form object)_
    - `stack`: string (optional) — Only present when NODE_ENV=development

---
