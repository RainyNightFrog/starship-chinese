/**
 * Supabase Auth 核心函式
 * ─────────────────────────────────────────────────────────────
 * 封裝 signIn / signUp / OAuth / signOut，並統一解析 user_metadata。
 */
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { USER_ROLES } from './authValidation';
import { getOAuthRedirectUrl, PENDING_OAUTH_ROLE_KEY } from './oauthConfig';

/** @typedef {'parent' | 'student'} UserRole */

/**
 * 將 Supabase User 轉為前端友善的 Profile 物件
 * @param {import('@supabase/supabase-js').User | null | undefined} user
 */
export function normalizeAuthUser(user) {
  if (!user) return null;

  const meta = user.user_metadata ?? {};
  /** @type {UserRole} */
  const userRole = meta.user_role === USER_ROLES.student
    ? USER_ROLES.student
    : USER_ROLES.parent;

  return {
    id: user.id,
    email: user.email ?? '',
    /** Google OAuth 頭像位於 avatar_url / picture */
    avatarUrl: meta.avatar_url || meta.picture || null,
    /** Google 全名或自訂 display_name */
    displayName:
      meta.full_name
      || meta.name
      || meta.display_name
      || user.email?.split('@')[0]
      || '星航用戶',
    userRole,
    /** 保留原始 metadata，供後續家長／學生端分流擴展 */
    metadata: meta,
    raw: user,
  };
}

function assertSupabaseReady() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase 尚未設定。請在專案根目錄建立 .env 並填入 VITE_SUPABASE_URL 與 VITE_SUPABASE_ANON_KEY。',
    );
  }
  return supabase;
}

/**
 * 電郵密碼登入
 * @param {string} email
 * @param {string} password
 */
export async function signInWithPassword(email, password) {
  const client = assertSupabaseReady();
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return normalizeAuthUser(data.user);
}

/**
 * 新用戶註冊（寫入 user_role 至 user_metadata）
 * @param {string} email
 * @param {string} password
 * @param {UserRole} [userRole='parent']
 */
export async function signUpNewUser(email, password, userRole = USER_ROLES.parent) {
  const client = assertSupabaseReady();
  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        user_role: userRole,
        display_name: email.trim().split('@')[0],
      },
      /** OAuth 回跳與 Email 確認連結皆導回本站 */
      emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  });
  if (error) throw error;
  return {
    user: normalizeAuthUser(data.user),
    /** 若 Supabase 開啟 Email 確認，session 可能為 null */
    needsEmailConfirmation: !data.session,
  };
}

/**
 * Google OAuth 登入（彈出 Google 授權頁）
 * 注意：Google 首次登入預設 user_role 為 parent，可於後台或 onboarding 再設定。
 */
export async function signInWithGoogle(userRole = USER_ROLES.parent) {
  const client = assertSupabaseReady();
  const redirectTo = getOAuthRedirectUrl();
  if (!redirectTo) {
    throw new Error('無法取得 OAuth 回跳網址，請設定 VITE_APP_URL 或於瀏覽器環境使用。');
  }

  /** OAuth 跳轉前暫存身份，回跳後由 AuthContext 寫入新用戶 metadata */
  try {
    sessionStorage.setItem(PENDING_OAUTH_ROLE_KEY, userRole);
  } catch { /* ignore */ }

  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      scopes: 'openid email profile',
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });
  if (error) throw error;
}

/**
 * Google 首次登入後，將登入頁選擇的身份寫入 user_metadata
 * @param {import('@supabase/supabase-js').User} user
 */
export async function applyPendingOAuthRole(user) {
  if (!supabase || !user) return user;

  let pendingRole = null;
  try {
    pendingRole = sessionStorage.getItem(PENDING_OAUTH_ROLE_KEY);
    sessionStorage.removeItem(PENDING_OAUTH_ROLE_KEY);
  } catch { /* ignore */ }

  if (!pendingRole || user.user_metadata?.user_role) return user;

  const role = pendingRole === USER_ROLES.student ? USER_ROLES.student : USER_ROLES.parent;
  const { data, error } = await supabase.auth.updateUser({
    data: {
      user_role: role,
      display_name: user.user_metadata?.full_name
        || user.user_metadata?.name
        || user.email?.split('@')[0],
    },
  });
  if (error) throw error;
  return data.user ?? user;
}

/**
 * 登出並清除本地 Session
 */
export async function handleLogout() {
  const client = assertSupabaseReady();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

/**
 * 取得目前 Session 中的用戶（初始化用）
 */
export async function getCurrentAuthUser() {
  if (!supabase) return null;
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return normalizeAuthUser(session?.user ?? null);
}

/**
 * 依 user_role 決定登入後導向（預留雙端分流）
 * @param {ReturnType<typeof normalizeAuthUser>} profile
 * @returns {'dashboard' | 'student' | 'parent'}
 */
export function resolvePostLoginRoute(profile) {
  if (!profile) return 'dashboard';
  return profile.userRole === USER_ROLES.student ? 'student' : 'parent';
}
