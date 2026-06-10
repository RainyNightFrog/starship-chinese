/**
 * 全局 Auth 狀態（React Context + useAuth Hook）
 * ─────────────────────────────────────────────────────────────
 * - 監聽 Supabase onAuthStateChange
 * - 未登入時由 App.jsx AuthGuard 攔截並顯示 LoginPanel
 * - 登入成功後 profile 含 email、頭像、user_role
 *
 * 注意：onAuthStateChange 回調內不可 await 其他 auth API（會與 getSession 死鎖）。
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useColorMode, SURFACE_BG } from '../colorMode';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  signInWithPassword,
  signUpNewUser,
  signInWithGoogle,
  handleLogout,
  normalizeAuthUser,
  resolvePostLoginRoute,
  applyPendingOAuthRole,
} from './authService';
import { mapAuthErrorMessage } from './authValidation';

/** @typedef {import('./authService').normalizeAuthUser extends (...args: any) => infer R ? R : never} AuthProfile */

const INIT_TIMEOUT_MS = 10000;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(/** @type {AuthProfile | null} */ (null));
  const [initializing, setInitializing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [lastError, setLastError] = useState(/** @type {string | null} */ (null));
  const [postLoginRoute, setPostLoginRoute] = useState(/** @type {'dashboard' | 'student' | 'parent'} */ ('dashboard'));
  const initDoneRef = useRef(false);

  const applyProfile = useCallback((user) => {
    const next = normalizeAuthUser(user);
    setProfile(next);
    setPostLoginRoute(resolvePostLoginRoute(next));
    return next;
  }, []);

  /** 將 OAuth metadata 更新延後，避免 Supabase auth 死鎖 */
  const deferOAuthRoleSync = useCallback((user) => {
    if (!user) return;
    setTimeout(() => {
      applyPendingOAuthRole(user)
        .then((updated) => {
          const next = normalizeAuthUser(updated);
          if (next) applyProfile(updated);
        })
        .catch(() => { /* 非致命 */ });
    }, 0);
  }, [applyProfile]);

  /** 首次載入 + OAuth 回跳：讀取現有 Session */
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setInitializing(false);
      return undefined;
    }

    let mounted = true;

    const finishInit = () => {
      if (!mounted || initDoneRef.current) return;
      initDoneRef.current = true;
      setInitializing(false);
    };

    /** 逾時保護 — 避免永遠卡在「正在驗證登入狀態」 */
    const timeoutId = setTimeout(() => {
      if (!mounted || initDoneRef.current) return;
      setLastError('登入驗證逾時，請重新整理或改用 Email 登入。');
      finishInit();
    }, INIT_TIMEOUT_MS);

    /** OAuth 回跳錯誤 */
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const oauthError = params.get('error_description')
      || params.get('error')
      || hashParams.get('error_description')
      || hashParams.get('error');
    if (oauthError) {
      setLastError(decodeURIComponent(oauthError.replace(/\+/g, ' ')));
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return;
        if (error) throw error;
        applyProfile(session?.user ?? null);
        if (session?.user) deferOAuthRoleSync(session.user);
      })
      .catch((err) => {
        if (mounted) setLastError(mapAuthErrorMessage(err));
      })
      .finally(() => {
        clearTimeout(timeoutId);
        finishInit();
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      applyProfile(session?.user ?? null);
      if (session?.user) setLastError(null);

      if (event === 'SIGNED_IN' && session?.user) {
        deferOAuthRoleSync(session.user);
      }

      if (event === 'SIGNED_OUT') {
        setPostLoginRoute('dashboard');
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [applyProfile, deferOAuthRoleSync]);

  const wrapAsync = useCallback(async (fn) => {
    setBusy(true);
    setLastError(null);
    try {
      return await fn();
    } catch (err) {
      const message = mapAuthErrorMessage(err);
      setLastError(message);
      throw err;
    } finally {
      setBusy(false);
    }
  }, []);

  const login = useCallback(
    (email, password) => wrapAsync(async () => {
      const user = await signInWithPassword(email, password);
      setProfile(user);
      setPostLoginRoute(resolvePostLoginRoute(user));
      return user;
    }),
    [wrapAsync],
  );

  const register = useCallback(
    (email, password, userRole) => wrapAsync(async () => {
      const result = await signUpNewUser(email, password, userRole);
      if (result.user && !result.needsEmailConfirmation) {
        setProfile(result.user);
        setPostLoginRoute(resolvePostLoginRoute(result.user));
      }
      return result;
    }),
    [wrapAsync],
  );

  const loginWithGoogle = useCallback(
    (userRole) => wrapAsync(async () => {
      await signInWithGoogle(userRole);
    }),
    [wrapAsync],
  );

  const logout = useCallback(
    () => wrapAsync(async () => {
      await handleLogout();
      setProfile(null);
      setPostLoginRoute('dashboard');
    }),
    [wrapAsync],
  );

  const clearError = useCallback(() => setLastError(null), []);

  const value = useMemo(() => ({
    profile,
    user: profile,
    isAuthenticated: Boolean(profile),
    initializing,
    busy,
    lastError,
    postLoginRoute,
    isSupabaseConfigured,
    login,
    register,
    loginWithGoogle,
    logout,
    clearError,
  }), [
    profile,
    initializing,
    busy,
    lastError,
    postLoginRoute,
    login,
    register,
    loginWithGoogle,
    logout,
    clearError,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/** @returns {NonNullable<React.ContextType<typeof AuthContext>>} */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth 必須在 <AuthProvider> 內使用');
  }
  return ctx;
}

/**
 * Auth 路由守衛：未登入則只渲染 fallback（LoginPanel），已登入才渲染子組件
 */
export function AuthGuard({ children, fallback }) {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return (
      <AuthLoadingScreen />
    );
  }

  if (!isAuthenticated) {
    return fallback;
  }

  return children;
}

function AuthLoadingScreen() {
  const { isNight } = useColorMode();
  return (
    <div
      className={`min-h-screen flex items-center justify-center ${isNight ? 'bg-[#1c1917] text-amber-100' : 'bg-[#F5F0E6] text-stone-700'}`}
      style={{ backgroundColor: isNight ? '#1c1917' : SURFACE_BG.day.shell }}
    >
      <div className="text-center space-y-3 animate-[gentlePulse_2s_ease-in-out_infinite]">
        <p className="text-3xl" aria-hidden>✨</p>
        <p className="text-lg font-bold">正在驗證登入狀態…</p>
        <p className="text-sm text-stone-400 font-bold">若超過 10 秒仍未進入，請重新整理頁面</p>
      </div>
    </div>
  );
}
