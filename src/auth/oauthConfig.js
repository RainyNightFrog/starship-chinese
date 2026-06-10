/**
 * Google OAuth 回跳與 Supabase 授權設定
 */

export const PENDING_OAUTH_ROLE_KEY = 'xinghang_pending_oauth_role';

/** 登入成功後 Supabase 導回此網址（須在 Dashboard → Redirect URLs 白名單內） */
export function getOAuthRedirectUrl() {
  /** 優先使用目前網址 — 同時支援 Go Live (5501) 與 npm run dev (5173) */
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/`;
  }
  const explicit = import.meta.env.VITE_APP_URL?.trim();
  if (explicit) {
    return explicit.endsWith('/') ? explicit : `${explicit}/`;
  }
  return undefined;
}

/** Google Cloud Console「已授權的重新導向 URI」應填此 Supabase 回調位址 */
export function getSupabaseOAuthCallbackUrl(supabaseUrl) {
  const base = (supabaseUrl || import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  return base ? `${base}/auth/v1/callback` : '';
}
