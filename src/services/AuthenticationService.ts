/**
 * AuthenticationService
 *
 * Production-ready authentication foundation for TailorBook.
 * Architecture: Local-first. Auth is optional. Workshop always works without it.
 *
 * Supabase integration: Prepared but not yet connected.
 * To activate: install @supabase/supabase-js, fill SUPABASE_URL + SUPABASE_ANON_KEY,
 * and uncomment the implementation blocks below.
 *
 * The interface is stable — switching from mock to real Supabase requires
 * zero changes to calling code (screens, store, context).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthState,
  AuthUser,
  AuthSession,
  AuthResult,
  SignInCredentials,
  SignUpCredentials,
  AuthStatus,
} from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_KEY = '@tailorbook/auth_session';
const USER_KEY = '@tailorbook/auth_user';

// Supabase configuration (activate when ready)
// const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
// const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// ─── Auth Service Interface ───────────────────────────────────────────────────

export interface IAuthenticationService {
  initialize(): Promise<AuthState>;
  signIn(credentials: SignInCredentials): Promise<AuthResult>;
  signUp(credentials: SignUpCredentials): Promise<AuthResult>;
  signOut(): Promise<void>;
  refreshSession(): Promise<boolean>;
  getCurrentUser(): AuthUser | null;
  getCurrentSession(): AuthSession | null;
  isAuthenticated(): boolean;
  onAuthStateChange(callback: (state: AuthState) => void): () => void;
}

// ─── Authentication Service ───────────────────────────────────────────────────

class AuthenticationService implements IAuthenticationService {
  private currentUser: AuthUser | null = null;
  private currentSession: AuthSession | null = null;
  private listeners: Set<(state: AuthState) => void> = new Set();

  // ─── Initialize ──────────────────────────────────────────────────────────
  // Restores persisted session on app startup.
  // Called once from store.initialize() — never blocks the workshop from loading.

  async initialize(): Promise<AuthState> {
    try {
      const [sessionStr, userStr] = await Promise.all([
        AsyncStorage.getItem(SESSION_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      if (sessionStr && userStr) {
        const session: AuthSession = JSON.parse(sessionStr);
        const user: AuthUser = JSON.parse(userStr);

        // Check if session is still valid
        if (session.expiresAt > Date.now()) {
          this.currentSession = session;
          this.currentUser = user;
          return this.buildState('authenticated');
        }

        // Try refresh if expired
        const refreshed = await this.refreshSession();
        if (refreshed) {
          return this.buildState('authenticated');
        }
      }
    } catch {
      // Storage read failed — treat as unauthenticated
    }

    return this.buildState('unauthenticated');
  }

  // ─── Sign In ─────────────────────────────────────────────────────────────

  async signIn(credentials: SignInCredentials): Promise<AuthResult> {
    try {
      // ── Supabase implementation (activate when ready) ──────────────────
      // const { data, error } = await supabase.auth.signInWithPassword({
      //   email: credentials.email,
      //   password: credentials.password,
      // });
      // if (error) return { success: false, error: error.message };
      // const user = this.mapSupabaseUser(data.user);
      // const session = this.mapSupabaseSession(data.session);
      // await this.persistSession(user, session);
      // this.currentUser = user;
      // this.currentSession = session;
      // this.notifyListeners('authenticated');
      // return { success: true, user };

      // ── Stub: returns error until Supabase is connected ────────────────
      return {
        success: false,
        error: 'Cloud authentication is not yet connected. Your workshop works fully offline.',
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Sign in failed. Please try again.',
      };
    }
  }

  // ─── Sign Up ─────────────────────────────────────────────────────────────

  async signUp(credentials: SignUpCredentials): Promise<AuthResult> {
    try {
      // ── Supabase implementation (activate when ready) ──────────────────
      // const { data, error } = await supabase.auth.signUp({
      //   email: credentials.email,
      //   password: credentials.password,
      //   options: {
      //     data: { display_name: credentials.displayName },
      //   },
      // });
      // if (error) return { success: false, error: error.message };
      // if (!data.user) return { success: false, error: 'Account creation failed.' };
      // return { success: true, user: this.mapSupabaseUser(data.user) };

      // ── Stub ──────────────────────────────────────────────────────────
      return {
        success: false,
        error: 'Cloud registration is not yet available. Your workshop is stored safely on this device.',
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Sign up failed. Please try again.',
      };
    }
  }

  // ─── Sign Out ─────────────────────────────────────────────────────────────

  async signOut(): Promise<void> {
    try {
      // await supabase.auth.signOut();
      await this.clearPersistedSession();
      this.currentUser = null;
      this.currentSession = null;
      this.notifyListeners('unauthenticated');
    } catch {
      // Clear locally regardless
      await this.clearPersistedSession();
      this.currentUser = null;
      this.currentSession = null;
      this.notifyListeners('unauthenticated');
    }
  }

  // ─── Refresh Session ──────────────────────────────────────────────────────

  async refreshSession(): Promise<boolean> {
    if (!this.currentSession?.refreshToken) return false;

    try {
      // const { data, error } = await supabase.auth.refreshSession({
      //   refresh_token: this.currentSession.refreshToken,
      // });
      // if (error || !data.session) return false;
      // const session = this.mapSupabaseSession(data.session);
      // const user = this.mapSupabaseUser(data.user);
      // await this.persistSession(user, session);
      // this.currentSession = session;
      // this.currentUser = user;
      // return true;

      return false;
    } catch {
      return false;
    }
  }

  // ─── Getters ──────────────────────────────────────────────────────────────

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  getCurrentSession(): AuthSession | null {
    return this.currentSession;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null && this.currentSession !== null &&
      this.currentSession.expiresAt > Date.now();
  }

  // ─── Auth State Listener ──────────────────────────────────────────────────
  // Subscribe to auth state changes. Returns an unsubscribe function.

  onAuthStateChange(callback: (state: AuthState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private buildState(status: AuthStatus): AuthState {
    return {
      status,
      user: this.currentUser,
      session: this.currentSession,
      error: null,
    };
  }

  private notifyListeners(status: AuthStatus): void {
    const state = this.buildState(status);
    this.listeners.forEach((cb) => cb(state));
  }

  private async persistSession(user: AuthUser, session: AuthSession): Promise<void> {
    await Promise.all([
      AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session)),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
    ]);
  }

  private async clearPersistedSession(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(SESSION_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
  }

  // ─── Supabase User Mapper (activate with real Supabase) ──────────────────
  // private mapSupabaseUser(supabaseUser: any): AuthUser {
  //   return {
  //     id: supabaseUser.id,
  //     email: supabaseUser.email ?? '',
  //     displayName: supabaseUser.user_metadata?.display_name,
  //     avatarUrl: supabaseUser.user_metadata?.avatar_url,
  //     provider: (supabaseUser.app_metadata?.provider ?? 'email') as AuthProvider,
  //     createdAt: supabaseUser.created_at,
  //   };
  // }

  // private mapSupabaseSession(supabaseSession: any): AuthSession {
  //   return {
  //     accessToken: supabaseSession.access_token,
  //     refreshToken: supabaseSession.refresh_token,
  //     expiresAt: supabaseSession.expires_at * 1000, // convert to ms
  //     user: this.mapSupabaseUser(supabaseSession.user),
  //   };
  // }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const authService = new AuthenticationService();
