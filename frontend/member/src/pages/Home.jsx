import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

const STUDENT_URL =
  (typeof import.meta !== 'undefined' && import.meta.env.VITE_STUDENT_URL) ||
  'http://localhost:5176';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'student') {
      window.location.href = STUDENT_URL;
    } else if (user?.role === 'parent') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return null;
}
