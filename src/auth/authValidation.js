/**
 * 登入／註冊表單驗證（繁體中文錯誤訊息）
 * ─────────────────────────────────────────────────────────────
 * 僅做前端基本檢查；最終安全驗證仍由 Supabase Auth 後端負責。
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 允許的雙端身份 */
export const USER_ROLES = {
  parent: 'parent',
  student: 'student',
};

/**
 * @param {string} email
 * @returns {string | null} 錯誤訊息；通過則回傳 null
 */
export function validateEmail(email) {
  const trimmed = email.trim();
  if (!trimmed) return '請輸入電郵地址';
  if (!EMAIL_RE.test(trimmed)) return '電郵格式不正確，請檢查後再試';
  return null;
}

/**
 * @param {string} password
 * @param {{ isSignUp?: boolean }} [opts]
 * @returns {string | null}
 */
export function validatePassword(password, { isSignUp = false } = {}) {
  if (!password) return '請輸入密碼';
  if (isSignUp && password.length < 8) {
    return '密碼至少需要 8 個字元，建議混合英文與數字';
  }
  if (!isSignUp && password.length < 1) return '請輸入密碼';
  return null;
}

/**
 * @param {{ email: string, password: string, confirmPassword?: string, userRole?: string, isSignUp?: boolean }} fields
 * @returns {{ email?: string, password?: string, confirmPassword?: string, userRole?: string }}
 */
export function validateAuthForm(fields) {
  const errors = {};
  const emailErr = validateEmail(fields.email);
  if (emailErr) errors.email = emailErr;

  const passwordErr = validatePassword(fields.password, { isSignUp: fields.isSignUp });
  if (passwordErr) errors.password = passwordErr;

  if (fields.isSignUp) {
    if (fields.password !== fields.confirmPassword) {
      errors.confirmPassword = '兩次輸入的密碼不一致';
    }
    if (!fields.userRole || !Object.values(USER_ROLES).includes(fields.userRole)) {
      errors.userRole = '請選擇您的身份（家長或學生）';
    }
  }

  return errors;
}

/**
 * 將 Supabase 英文錯誤轉為學童／家長友善的繁體提示
 * @param {import('@supabase/supabase-js').AuthError | Error | null | undefined} error
 */
export function mapAuthErrorMessage(error) {
  if (!error) return '發生未知錯誤，請稍後再試';
  const msg = (error.message || '').toLowerCase();

  if (msg.includes('provider is not enabled') || msg.includes('unsupported provider')) {
    return 'Google 登入尚未啟用。請在 Supabase Dashboard → Authentication → Providers 開啟 Google，並填入 Client ID / Secret。';
  }
  if (msg.includes('redirect_uri_mismatch') || msg.includes('redirect url')) {
    return 'OAuth 回跳網址不符。請在 Supabase 的 Redirect URLs 加入本機或正式網址，並在 Google Cloud 填入 Supabase 回調 URI。';
  }
  if (msg.includes('invalid login credentials')) {
    return '電郵或密碼錯誤，請重新輸入';
  }
  if (msg.includes('email not confirmed')) {
    return '請先到電郵信箱點擊確認連結，再登入';
  }
  if (msg.includes('user already registered')) {
    return '此電郵已註冊，請直接登入或使用「忘記密碼」';
  }
  if (msg.includes('password')) {
    return '密碼不符合安全要求，請使用至少 8 個字元';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return '嘗試次數過多，請稍候數分鐘後再試';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return '網路連線不穩，請檢查網絡後再試';
  }

  return error.message || '登入失敗，請稍後再試';
}
