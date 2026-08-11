import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ErrorScene from '../components/ErrorScene.jsx';

export default function NotFound() {
  return (
    <ErrorScene
      variant="404"
      title="Такой страницы нет"
      text="Волк искал её до последнего и в сердцах смахнул ноутбук со стола. Похоже, ссылка устарела."
      action={
        <Link to="/student" className="err-cta">
          <ArrowLeft size={16} strokeWidth={2.5} />
          На главную
        </Link>
      }
    />
  );
}
