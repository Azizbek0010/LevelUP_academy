import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from '../shared/api/queryClient';
import { Toaster } from '../shared/ui/Toast';
import { AuthBoot } from './AuthBoot';
import { ThemeProvider } from './ThemeProvider';
import { router } from './router';

export default function App(): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthBoot>
          <RouterProvider router={router} />
          <Toaster />
        </AuthBoot>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
