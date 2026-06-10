import { useEffect } from 'react';

const MOBILE_MQ = '(max-width: 1023px)';

function isMobileViewport() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MOBILE_MQ).matches;
}

/**
 * 手機版鎖定背景頁面滾動 — 家長端展開時防止 scroll chaining 穿透至主內容
 * iOS Safari 需 position:fixed + 還原 scrollY，否則僅 overflow:hidden 不足
 */
export function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked || !isMobileViewport()) return undefined;

    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;

    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPosition = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyWidth = body.style.width;

    html.style.overflow = 'hidden';
    html.dataset.parentPanelOpen = 'true';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    return () => {
      html.style.overflow = prevHtmlOverflow;
      delete html.dataset.parentPanelOpen;
      body.style.overflow = prevBodyOverflow;
      body.style.position = prevBodyPosition;
      body.style.top = prevBodyTop;
      body.style.width = prevBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}
