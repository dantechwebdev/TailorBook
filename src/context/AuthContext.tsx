/**
 * AuthContext
 *
 * Provides auth state and actions to the entire component tree.
 * Wraps the AuthenticationService singleton in a React context.
 *
 * Design principle: Auth is optional. The workshop works fully without it.
 * Components should degrade gracefully when auth state is 'unauthenticated'.
 *
 * Usage:
 *   const { authState, signIn, signUp, signOut } = useAuth();
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  AuthState,
  AuthUser,
  SignInCredentials,
  SignUpCredentials,
  AuthResult,
  CloudSyncState,
} from '../types';
import { authService } from '../services/AuthenticationService';
import { cloudSyncService } from '../services/CloudSyncService';

// ─── Context Types ────────────────────────────────────────────────────────────

interface AuthContextValue {
  // Auth state
  authState: AuthState;
  isAuthenticated: boolean;
  currentUser: AuthUser | null;
  isLoadingAuth: boolean;

  // Auth actions
  signIn: (credentials: SignInCredentials) => Promise<AuthResult>;
  signUp: (credentials: SignUpCredentials) => Promise<AuthResult>;
  signOut: () => Promise<void>;

  // Cloud sync state (derived from CloudSyncService)
  syncState: CloudSyncState;
  syncNow: () => Promise<void>;
}

// ─── Default Context ──────────────────────────────────────────────────────────

const DEFAULT_AUTH_STATE: AuthState = {
  status: 'loading',
  user: null,
  session: null,
  error: null,
};

const DEFAULT_SYNC_STATE: CloudSyncState = {
  status: 'idle',
  lastSyncAt: null,
  lastBackupAt: null,
  errorMessage: null,
  isEnabled: false,
  autoSync: false,
  syncMode: 'wifi_only',
  syncTime: '02:00',
};

const AuthContext = createContext<AuthContextValue>({
  authState: DEFAULT_AUTH_STATE,
  isAuthenticated: false,
  currentUser: null,
  isLoadingAuth: true,
  signIn: async () => ({ success: false, error: 'Not initialized' }),
  signUp: async () => ({ success: false, error: 'Not initialized' }),
  signOut: async () => {},
  syncState: DEFAULT_SYNC_STATE,
  syncNow: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(DEFAULT_AUTH_STATE);
  const [syncState, setSyncState] = useState<CloudSyncState>(DEFAULT_SYNC_STATE);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const mountedRef = useRef(true);

  // ── Initialize on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const initialState = await authService.initialize();
        if (mountedRef.current) {
          setAuthState(initialState);
        }
      } catch {
        if (mountedRef.current) {
          setAuthState({ ...DEFAULT_AUTH_STATE, status: 'unauthenticated' });
        }
      } finally {
        if (mountedRef.current) {
          setIsLoadingAuth(false);
        }
      }

      // Initialize sync service with current auth state
      setSyncState(cloudSyncService.getState());
    };

    init();

    // Subscribe to auth state changes
    const unsubAuth = authService.onAuthStateChange((state) => {
      if (mountedRef.current) {
        setAuthState(state);
      }
    });

    // Subscribe to sync state changes
    const unsubSync = cloudSyncService.subscribe((state) => {
      if (mountedRef.current) {
        setSyncState(state);
      }
    });

    return () => {
      mountedRef.current = false;
      unsubAuth();
      unsubSync();
    };
  }, []);

  // ── Auth Actions ─────────────────────────────────────────────────────────

  const signIn = useCallback(async (credentials: SignInCredentials): Promise<AuthResult> => {
    const result = await authService.signIn(credentials);
    return result;
  }, []);

  const signUp = useCallback(async (credentials: SignUpCredentials): Promise<AuthResult> => {
    const result = await authService.signUp(credentials);
    return result;
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await authService.signOut();
  }, []);

  // ── Sync Actions ──────────────────────────────────────────────────────────

  const syncNow = useCallback(async (): Promise<void> => {
    if (cloudSyncService.isAvailable()) {
      await cloudSyncService.syncNow();
    }
  }, []);

  const value: AuthContextValue = {
    authState,
    isAuthenticated: authState.status === 'authenticated',
    currentUser: authState.user,
    isLoadingAuth,
    signIn,
    signUp,
    signOut,
    syncState,
    syncNow,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
