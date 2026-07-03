import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import '@/styles/global.css';
import { AuthProvider } from '@/features/auth';
import { AppRouter } from './AppRouter';

// HashRouter keeps deep links (email confirmation, /admin/review/:id) working on
// GitHub Pages with no server-side routing config.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
);
