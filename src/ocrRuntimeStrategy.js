/**
 * OCR 執行策略 — Vercel / 手機優先本機 Tesseract，避免雲端 500 長時間空等
 */

export function shouldPreferBrowserOcr() {
  if (typeof window === 'undefined') return false;

  const flag = import.meta.env.VITE_PREFER_BROWSER_OCR?.trim();
  if (flag === 'true') return true;
  if (flag === 'false') return false;

  const host = window.location.hostname.toLowerCase();
  if (/\.vercel\.app$|\.pages\.dev$|\.netlify\.app$/i.test(host)) return true;

  const ua = navigator.userAgent ?? '';
  if (/iPhone|iPad|iPod|Android|Mobile|webOS|BlackBerry/i.test(ua)) return true;

  return false;
}

export function describeOcrEngineMode(mode) {
  if (mode === 'browser') {
    return shouldPreferBrowserOcr()
      ? '✓ 本機 OCR 已就緒（Singleton Worker · chi_tra 已快取 · 本地加速）'
      : '✓ 瀏覽器 OCR 已就緒（Singleton Worker · chi_tra 繁體中文 · 本地快取）';
  }
  if (mode === 'backend') {
    return '✓ 雲端 OCR 已就緒（失敗時自動改用本機辨識）';
  }
  return '✓ OCR 已就緒';
}
