# Payload Contracts

These contracts should be confirmed with Karis before his producer jobs/endpoints push events.

## `payment.due_soon`

Producer owner: Karis.

```json
{
  "studentId": "uuid",
  "amount": 150000,
  "dueDate": "2026-07-15"
}
```

Rules:

- `studentId` is the student `users.id`.
- `amount` is numeric and formatted by the notification worker.
- `dueDate` should be an ISO date string (`YYYY-MM-DD`) where possible.
- Bilol's code only delivers the message and does not write to payment tables.

## `announcement`

Producer owner: Karis.

Branch-wide:

```json
{
  "branchId": "uuid",
  "text": "Parent meeting at 18:00",
  "date": "2026-07-15"
}
```

Group-specific:

```json
{
  "groupId": "uuid",
  "text": "Lesson moved to Saturday",
  "date": "2026-07-15"
}
```

Rules:

- Exactly one of `branchId` or `groupId` should be provided.
- `text` is required and should already be admin-approved/sanitized by the admin endpoint.
- `date` is optional but recommended.
- Recipients are parent accounts resolved through `student_profiles.parent_id -> telegram_accounts`.

