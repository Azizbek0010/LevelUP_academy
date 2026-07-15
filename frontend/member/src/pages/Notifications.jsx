import PageHeader from '../components/PageHeader.jsx';
import { EmptyState } from '../components/ui.jsx';

export default function Notifications() {
  return (
    <>
      <PageHeader title="Уведомления" subtitle="Важные события и оповещения" />
      <EmptyState
        icon="🔔"
        title="Скоро появится"
        message="Здесь будут отображаться уведомления о занятиях, оценках и платежах"
      />
    </>
  );
}
