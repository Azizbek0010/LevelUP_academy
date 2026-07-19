import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@fontsource-variable/manrope';
import { AuthProvider } from './auth.jsx';
import App from './App.jsx';
import './index.css';

// Тёмная тема удалена. У тех, кто успел её включить, в localStorage лежит
// `lu-theme: dark`, а на <html> мог остаться класс `dark` из прошлой сессии —
// CSS под него больше нет, так что чистим оба следа один раз при старте.
document.documentElement.classList.remove('dark', 'light');
try { localStorage.removeItem('lu-theme'); } catch { /* приватный режим */ }

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
