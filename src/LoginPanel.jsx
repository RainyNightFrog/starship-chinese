/**
 * 登入／註冊面板
 * ─────────────────────────────────────────────────────────────
 * - Email + 密碼登入／註冊（Supabase Auth）
 * - Google OAuth 快捷登入
 * - SEN 輔助模式：放大字體 + 高對比邊框
 * - 暗色護眼視覺（對標星航中文夜間主題）
 */
import React, { useCallback, useId, useState } from 'react';
import { useColorMode, SURFACE_BG } from './colorMode';
import GoogleIcon from './components/GoogleIcon';
import { useAuth } from './auth/AuthContext';
import { validateAuthForm, USER_ROLES } from './auth/authValidation';

const SEN_STORAGE_KEY = 'xinghang_login_sen_mode';

function loadSenMode() {
  try {
    return localStorage.getItem(SEN_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function saveSenMode(on) {
  try {
    localStorage.setItem(SEN_STORAGE_KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export default function LoginPanel() {
  const {
    login,
    register,
    loginWithGoogle,
    busy,
    lastError,
    clearError,
    isSupabaseConfigured,
  } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [isSEN, setIsSEN] = useState(loadSenMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userRole, setUserRole] = useState(USER_ROLES.parent);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successHint, setSuccessHint] = useState(null);

  const formId = useId();
  const emailId = `${formId}-email`;
  const passwordId = `${formId}-password`;
  const confirmId = `${formId}-confirm`;

  const toggleSen = () => {
    setIsSEN((v) => {
      const next = !v;
      saveSenMode(next);
      return next;
    });
  };

  const switchMode = (next) => {
    setMode(next);
    setFieldErrors({});
    setSuccessHint(null);
    clearError();
  };

  const { isNight } = useColorMode();

  /** 共用輸入框樣式 — SEN 模式加粗邊框與大字 */
  const inputClass = [
    'w-full rounded-xl transition-all duration-300 outline-none',
    isNight
      ? 'bg-stone-900/80 text-stone-100 placeholder:text-stone-500'
      : 'bg-white text-stone-800 placeholder:text-stone-400 border-orange-200',
    isSEN
      ? 'text-lg px-5 py-4 border-[3px] border-amber-400 focus:border-amber-300 focus:ring-4 focus:ring-amber-400/30'
      : `text-base px-4 py-3 border-2 ${isNight ? 'border-stone-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25' : 'focus:border-orange-400 focus:ring-2 focus:ring-orange-300/30'}`,
  ].join(' ');

  const labelClass = `block font-bold mb-2 ${isSEN ? 'text-base' : 'text-sm'} ${isNight ? (isSEN ? 'text-amber-100' : 'text-stone-300') : 'text-stone-700'}`;
  const errorClass = `mt-1.5 font-medium text-red-400 ${isSEN ? 'text-sm' : 'text-xs'}`;

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setSuccessHint(null);
    clearError();

    const errors = validateAuthForm({
      email,
      password,
      confirmPassword,
      userRole,
      isSignUp: mode === 'signup',
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        const result = await register(email, password, userRole);
        if (result.needsEmailConfirmation) {
          setSuccessHint('註冊成功！請到電郵信箱點擊確認連結後再登入。');
        }
      }
    } catch {
      /* lastError 已由 AuthContext 設定 */
    }
  }, [email, password, confirmPassword, userRole, mode, login, register, clearError]);

  const handleGoogle = useCallback(async () => {
    setSuccessHint(null);
    clearError();
    try {
      await loginWithGoogle(userRole);
    } catch {
      /* lastError 已設定 */
    }
  }, [loginWithGoogle, userRole, clearError]);

  const brandClass = isNight ? 'text-amber-400' : 'text-amber-700';
  const titleClass = isNight ? 'text-stone-200' : 'text-stone-800';
  const subtitleClass = isNight ? 'text-stone-400' : 'text-stone-500';

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 py-10
        ${isNight
          ? 'bg-gradient-to-br from-[#1c1917] via-[#292524] to-[#1c1917] text-stone-100'
          : 'bg-[#F5F0E6] text-stone-700'}`}
      style={{ backgroundColor: isNight ? undefined : SURFACE_BG.day.shell }}
    >
      {isNight && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-amber-600/5 blur-3xl" />
        </div>
      )}

      <div
        className={`relative w-full max-w-md rounded-2xl border animate-[fadeSlideIn_0.45s_ease-out]
          ${isSEN ? 'p-8 sm:p-10' : 'p-6 sm:p-8'}
          ${isNight
            ? 'shadow-2xl shadow-black/40 border-amber-500/60 bg-[#292524]/95 backdrop-blur-sm'
            : 'shadow-lg border-orange-200/80 bg-[#FFFCF7]'}`}
        style={isNight ? undefined : { backgroundColor: SURFACE_BG.day.card }}
        role="main"
        aria-labelledby="login-title"
      >
        {/* 品牌標題 */}
        <div className="text-center mb-8">
          <p className={`font-black tracking-wider ${brandClass} ${isSEN ? 'text-3xl' : 'text-2xl'}`}>
            星航中文
          </p>
          <h1
            id="login-title"
            className={`mt-2 font-bold ${titleClass} ${isSEN ? 'text-xl' : 'text-lg'}`}
          >
            {mode === 'login' ? '歡迎回來，請登入' : '建立新帳戶'}
          </h1>
          <p className={`mt-1 ${subtitleClass} ${isSEN ? 'text-base' : 'text-sm'}`}>
            安全登入後即可進入學習儀表板
          </p>
        </div>

        {/* SEN 無障礙切換 */}
        <div className="flex justify-center mb-6">
          <button
            type="button"
            onClick={toggleSen}
            className={`rounded-full font-bold border-2 transition-all duration-300
              ${isSEN
                ? (isNight ? 'bg-amber-500/20 border-amber-400 text-amber-200' : 'bg-orange-100 border-orange-300 text-orange-900') + ' px-5 py-2.5 text-base'
                : (isNight ? 'bg-stone-800 border-stone-600 text-stone-400 hover:border-amber-600/50' : 'bg-stone-100 border-stone-300 text-stone-600 hover:border-orange-300') + ' px-4 py-2 text-sm'}
            `}
            aria-pressed={isSEN}
          >
            {isSEN ? '♿ SEN 輔助模式：已開啟' : '♿ 開啟 SEN 大字高對比模式'}
          </button>
        </div>

        {/* Supabase 未設定提示 */}
        {!isSupabaseConfigured && (
          <div
            className={`mb-6 rounded-xl border-2 border-amber-600/50 bg-amber-950/40 text-amber-100
              ${isSEN ? 'p-5 text-base' : 'p-4 text-sm'}`}
            role="alert"
          >
            <p className="font-bold mb-2">⚙️ Supabase 尚未設定</p>
            <p className="text-amber-200/90 leading-relaxed">
              請在專案根目錄建立 <code className="text-amber-300">.env</code>，填入
              {' '}
              <code className="text-amber-300">VITE_SUPABASE_URL</code>
              {' '}
              與
              {' '}
              <code className="text-amber-300">VITE_SUPABASE_ANON_KEY</code>
              {' '}
              後重新啟動 <code className="text-amber-300">npm run dev</code>。
            </p>
          </div>
        )}

        {/* 全局錯誤／成功提示 */}
        {lastError && (
          <div
            className={`mb-5 rounded-xl border-2 border-red-500/50 bg-red-950/40 text-red-200
              ${isSEN ? 'p-4 text-base' : 'p-3 text-sm'}`}
            role="alert"
          >
            {lastError}
          </div>
        )}
        {successHint && (
          <div
            className={`mb-5 rounded-xl border-2 border-emerald-500/50 bg-emerald-950/30 text-emerald-200
              ${isSEN ? 'p-4 text-base' : 'p-3 text-sm'}`}
            role="status"
          >
            {successHint}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Email */}
          <div>
            <label htmlFor={emailId} className={labelClass}>
              電郵地址
            </label>
            <input
              id={emailId}
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy || !isSupabaseConfigured}
              placeholder="example@email.com"
              className={inputClass}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? `${emailId}-err` : undefined}
            />
            {fieldErrors.email && (
              <p id={`${emailId}-err`} className={errorClass}>{fieldErrors.email}</p>
            )}
          </div>

          {/* 密碼 */}
          <div>
            <label htmlFor={passwordId} className={labelClass}>
              密碼
            </label>
            <input
              id={passwordId}
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy || !isSupabaseConfigured}
              placeholder={mode === 'signup' ? '至少 8 個字元' : '請輸入密碼'}
              className={inputClass}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? `${passwordId}-err` : undefined}
            />
            {fieldErrors.password && (
              <p id={`${passwordId}-err`} className={errorClass}>{fieldErrors.password}</p>
            )}
          </div>

          {/* 註冊：確認密碼 + 身份選擇 */}
          {mode === 'signup' && (
            <>
              <div>
                <label htmlFor={confirmId} className={labelClass}>
                  確認密碼
                </label>
                <input
                  id={confirmId}
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={busy || !isSupabaseConfigured}
                  placeholder="再次輸入密碼"
                  className={inputClass}
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                />
                {fieldErrors.confirmPassword && (
                  <p className={errorClass}>{fieldErrors.confirmPassword}</p>
                )}
              </div>

              <fieldset className="space-y-2">
                <legend className={labelClass}>我是…（登入後自動導向對應端）</legend>
                <div className={`flex gap-3 ${isSEN ? 'flex-col' : 'flex-row'}`}>
                  {[
                    { value: USER_ROLES.parent, label: '👨‍👩‍👧 家長', desc: '管理端' },
                    { value: USER_ROLES.student, label: '🎒 學生', desc: '沉浸學習端' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex-1 cursor-pointer rounded-xl border-2 transition-all duration-200
                        ${userRole === opt.value
                          ? (isNight ? 'border-amber-400 bg-amber-500/15 text-amber-100' : 'border-orange-400 bg-orange-50 text-orange-900')
                          : (isNight ? 'border-stone-600 bg-stone-900/50 text-stone-400 hover:border-stone-500' : 'border-stone-300 bg-white text-stone-600 hover:border-orange-300')}
                        ${isSEN ? 'p-4 text-base' : 'p-3 text-sm'}
                      `}
                    >
                      <input
                        type="radio"
                        name="user_role"
                        value={opt.value}
                        checked={userRole === opt.value}
                        onChange={() => setUserRole(opt.value)}
                        className="sr-only"
                        disabled={busy}
                      />
                      <span className="font-bold block">{opt.label}</span>
                      <span className="text-xs opacity-70">{opt.desc}</span>
                    </label>
                  ))}
                </div>
                {fieldErrors.userRole && (
                  <p className={errorClass}>{fieldErrors.userRole}</p>
                )}
              </fieldset>
            </>
          )}

          {/* 登入按鈕 */}
          <button
            type="submit"
            disabled={busy || !isSupabaseConfigured}
            className={`w-full rounded-xl font-black text-stone-900 transition-all duration-300
              bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-amber-400
              ${isSEN ? 'py-4 text-lg border-[3px] border-amber-300' : 'py-3.5 text-base border-2 border-amber-400'}
              ${busy ? 'animate-[gentlePulse_1.5s_ease-in-out_infinite]' : 'shadow-lg shadow-amber-900/30'}
            `}
          >
            {busy ? '⏳ 處理中，請稍候…' : (mode === 'login' ? '登入' : '註冊新帳戶')}
          </button>
        </form>

        {/* 分隔線 */}
        <div className="flex items-center gap-4 my-7">
          <div className="flex-1 h-px bg-stone-600" />
          <span className={`text-stone-500 font-medium ${isSEN ? 'text-sm' : 'text-xs'}`}>或</span>
          <div className="flex-1 h-px bg-stone-600" />
        </div>

        {/* Google 登入 */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy || !isSupabaseConfigured}
          className={`w-full flex items-center justify-center gap-3 rounded-xl font-bold
            bg-white text-stone-800 hover:bg-stone-100 transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isSEN ? 'py-4 text-lg border-[3px] border-stone-300' : 'py-3.5 text-base border-2 border-stone-200'}
            shadow-md
          `}
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm">
            <GoogleIcon className="w-5 h-5" />
          </span>
          使用 Google 帳戶登入
        </button>

        {/* 切換登入／註冊 */}
        <p className={`text-center mt-8 text-stone-400 ${isSEN ? 'text-base' : 'text-sm'}`}>
          {mode === 'login' ? (
            <>
              還沒有帳戶？
              {' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="font-bold text-amber-400 hover:text-amber-300 underline-offset-2 hover:underline"
              >
                立即註冊
              </button>
            </>
          ) : (
            <>
              已有帳戶？
              {' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="font-bold text-amber-400 hover:text-amber-300 underline-offset-2 hover:underline"
              >
                返回登入
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
