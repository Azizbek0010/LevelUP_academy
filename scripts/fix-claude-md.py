#!/usr/bin/env python3
"""Merge two overlapping LevelUp sections in CLAUDE.md into one."""
import sys
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

CLAUDE = r"C:\Users\user\.claude\CLAUDE.md"
lines = open(CLAUDE, "r", encoding="utf-8").readlines()

# Find the two LevelUp sections
start1 = None
start2 = None
for i, l in enumerate(lines):
    if "LevelUp Academy" in l and start1 is None:
        start1 = i
    elif "LevelUp Academy" in l and start1 is not None and start2 is None:
        start2 = i

if start1 is None or start2 is None:
    print(f"Sections not found: start1={start1}, start2={start2}")
    sys.exit(1)

# Find end of second section
end2 = len(lines)
for i in range(start2 + 1, len(lines)):
    if lines[i].startswith("## ") and i > start2:
        end2 = i
        break

merged = """## LevelUp Academy — Workflow va Save Zone (ОБЯЗАТЕЛЬНО)

### 1. Avtomatika: TASK.md → done.md

| Fayl | vazifa |
|---|---|
| `TASK.md` | Barcha vazifalar ro'yxati (backend + frontend). Qo'lda tahrirlanadi. |
| `done.md` | Avtomatik generatsiya qilinadi. `[x]` vazifalarni ko'rsatadi. |
| `scripts/update-done.py` | TASK.md ni parse qilib, done.md yozadi. |

### 2. Save Zone — Git Branch Struktura

| Branch | Kim ishlaydi | vazifa |
|---|---|---|
| `main` | Azizbek (siz) | Yakuniy kod. Faqat siz merge qilasiz. |
| `save-zone` | Azizbek (siz) | Integratsiya branchi. Jamoa ishlarini merge qilasiz. |
| `feature/<ism>` | Jamoa a'zolari | Har biri o'z branchida ishlaydi. |

### 3. Workflow qadamlari:

```
Jamoa a'zosi          Azizbek (siz)
     |                     |
     |-- push feature/X -->|
     |                     |-- pull feature/X -->
     |                     |-- review + test
     |                     |-- merge feature/X --> save-zone
     |                     |-- test in save-zone
     |                     |-- merge save-zone --> main
```

**Qoidalari:**
- `main` ga faqat siz merge qilasiz
- Feature branchlarni `git branch -d` bilan o'chiring, merge qilgandan keyin
- Commitlar ingliz tilida: `feat:`, `fix:`, `chore:`, `merge:`
- Branch nomi: `feature/<ism>-<qisqacha>`

### 4. Hooklar:

- **SessionStart**: `git pull` + `python scripts/update-done.py`
- **PostToolUse**: `tg-push-notify.py` (Telegram xabar push dan keyin)
- **done.md** avtomatik generatsiya qilinadi, qo'lda tahrirlamang
"""

lines2 = lines[:start1] + [merged] + lines[end2:]
open(CLAUDE, "w", encoding="utf-8").writelines(lines2)
print(f"Merged: removed lines {start1+1}-{end2}, inserted merged section")
