/**
 * Supabase 客戶端單例
 * ─────────────────────────────────────────────────────────────
 * 僅使用 VITE_ 前綴的環境變數（由 Vite 注入至前端 bundle）。
 * ANON KEY 可公開暴露於瀏覽器；請在 Supabase Dashboard 設定 RLS 保護資料。
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

/** 是否已在 .env 設定 Supabase（未設定時登入頁會顯示設定指引） */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * @type {import('@supabase/supabase-js').SupabaseClient | null}
 * 未設定環境變數時為 null，避免 createClient 拋錯導致整站白屏。
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        /** 持久化 Session 至 localStorage，刷新頁面仍保持登入 */
        persistSession: true,
        autoRefreshToken: true,
        /** Google OAuth 回跳時自動從 URL hash 解析 Session */
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null;
