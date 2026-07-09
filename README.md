# LevelUp Academy — Educational CRM System

CRM для учебного центра: 5 ролей (SuperAdmin / Admin / Mentor / Parent / Student), финансы со сплит-платежами и рассрочкой (Halol Nasiya), геймификация с коинами, realtime-чаты и live-счётчики онлайна, Telegram-уведомления через очередь.

> [!NOTE]
> Проект в стадии проектирования: архитектура утверждена, код — следующий этап.

---

## 📚 Документация

| Документ | Что внутри |
|---|---|
| [Backend Architecture](docs/BACKEND-ARCHITECTURE.md) | Полная спецификация: структура проекта, PostgreSQL DDL, middlewares (RBAC, archiveGuard), Socket.io + Redis, split-payment, Nasiya, коины, BullMQ + Telegram |
| [Frontend Architecture](docs/FRONTEND-ARCHITECTURE.md) | React (JS/JSX) + Vite: роутинг по ролям, TanStack Query + Redux Toolkit, axios auto-refresh, socket-клиент, темизация CSS Variables + DaisyUI |
| [Backend Diagrams](docs/diagrams/Backend-Architecture-Diagrams.md) | Визуальные Mermaid-схемы: обзор системы, ER-модель, потоки платежей, presence, pipeline запроса |
| [Frontend Diagrams](docs/diagrams/Frontend-Architecture-Diagrams.md) | Mermaid-схемы: роутинг, слои состояния, auth-refresh, сокеты, upload, таймер экзамена |

Диаграммы рендерятся прямо на GitHub — просто открой файл.

---

## 🛠️ Стек

| Слой | Технология |
|---|---|
| Backend | Node.js + Express (JavaScript) |
| База данных | PostgreSQL |
| Кэш / очереди / presence | Redis + BullMQ |
| Realtime | Socket.io |
| Файлы | MinIO / AWS S3 (presigned URLs) |
| Уведомления | Telegram Bot (через очередь) |
| Frontend | React (JS/JSX) + Vite + Tailwind CSS + DaisyUI |

---

## 📐 Ключевые архитектурные правила

- **Multi-tenancy с первого дня** — `branch_id` во всех core-таблицах
- **Invoice ↔ Transactions** — сплит-платёж = один счёт + N транзакций с общим `split_batch_id`
- **`coin_history` append-only** — баланс и аудит меняются только в одной SQL-транзакции
- **Архив ≠ удаление** — `is_archived` = read-only (мутации → 403), `deleted_at` = soft-delete
- **Всё внешнее — через очередь** — HTTP-запрос никогда не ждёт Telegram
