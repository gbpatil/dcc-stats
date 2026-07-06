import { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import App from './App';
import { InstallPrompt } from '@/components';
import { isAuthRedirect } from '@/lib/supabaseClient';
import { ConfirmPage, LoginPage, ProtectedRoute, SignupPage, SuperAdminRoute } from '@/features/auth';
import {
  AdminHome,
  AdminLayout,
  AnalyticsPage,
  DataManagementPage,
  PlayerManagementPage,
  ReviewSignupsPage,
  SelectionPage,
} from '@/features/admin';

/**
 * After a Supabase auth redirect lands on the app root (the auth `code` arrives
 * in the query string, clear of HashRouter's `#`), forward the user to the
 * confirmation screen. The client exchanges the code automatically.
 */
function AuthRedirectGate() {
  const navigate = useNavigate();
  useEffect(() => {
    if (isAuthRedirect) navigate('/confirm', { replace: true });
  }, [navigate]);
  return null;
}

export function AppRouter() {
  return (
    <>
      <AuthRedirectGate />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/confirm" element={<ConfirmPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminHome />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="players" element={<PlayerManagementPage />} />
          <Route path="selection" element={<SelectionPage />} />
          <Route path="data" element={<DataManagementPage />} />
          <Route
            path="review"
            element={
              <SuperAdminRoute>
                <ReviewSignupsPage />
              </SuperAdminRoute>
            }
          />
          <Route
            path="review/:id"
            element={
              <SuperAdminRoute>
                <ReviewSignupsPage />
              </SuperAdminRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Home-screen install prompt (Android button / iOS Share-sheet hint). */}
      <InstallPrompt />
    </>
  );
}
