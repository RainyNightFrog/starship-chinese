import { useEffect } from 'react';

const MOBILE_MQ = '(max-width: 1023px)';

function isMobileViewport() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MOBILE_MQ).matches;
}

/**
 * 鎖定背景頁面滾動 — 模態／底部面板開啟時防止 scroll chaining
 * @param {boolean} locked
 * @param {{ allViewports?: boolean }} [options] — 預設僅手機；模態框可設 allViewports: true
 */
export function useBodyScrollLock(locked, options = {}) {
  const { allViewports = false } = options;

  useEffect(() => {
    if (!locked || (!allViewports && !isMobileViewport())) return undefined;

    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;

    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPosition = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyWidth = body.style.width;

    html.style.overflow = 'hidden';
    html.dataset.scrollLock = 'true';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    return () => {
      html.style.overflow = prevHtmlOverflow;
      delete html.dataset.scrollLock;
      body.style.overflow = prevBodyOverflow;
      body.style.position = prevBodyPosition;
      body.style.top = prevBodyTop;
      body.style.width = prevBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [locked, allViewports]);
}
