import StaffChat from '../../components/StaffChat.jsx';

/**
 * Чат ментора — переписка с учениками своих групп и их родителями.
 *
 * Сама реализация переехала в `components/StaffChat.jsx` и общая с админской
 * панелью: клиентской разницы между ролями нет, охват собеседников считает
 * бэкенд (`listStaffContacts`).
 */
export default function MentorChat() {
  return <StaffChat variant="mentor" />;
}
