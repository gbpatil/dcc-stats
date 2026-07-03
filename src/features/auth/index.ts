// Auth feature — public API.
export { AuthProvider } from './context/AuthProvider';
export { useAuth } from './hooks/useAuth';
export { ProtectedRoute } from './components/ProtectedRoute';
export { SuperAdminRoute } from './components/SuperAdminRoute';
export { AuthMenu } from './components/AuthMenu';
export { LoginPage } from './pages/LoginPage';
export { SignupPage } from './pages/SignupPage';
export { ConfirmPage } from './pages/ConfirmPage';
export type { Profile, ProfileStatus, UserRole, AuthContextValue, SignUpInput } from './types';
