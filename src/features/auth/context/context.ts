import { createContext } from 'react';
import type { AuthContextValue } from '../types';

// Kept in its own module (no component export) so the provider file can export
// only its component — required for React Fast Refresh.
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
