import React from 'react';

/** 攔截子樹渲染錯誤，避免整頁只剩夜間黑底 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const message = error?.message || String(error);
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: '#1c1917', color: '#f5f5f4' }}
      >
        <div className="max-w-md w-full rounded-2xl border-2 border-rose-500/50 bg-stone-900/90 p-6 space-y-4 text-center">
          <p className="text-4xl" aria-hidden>⚠️</p>
          <h1 className="text-lg font-black text-amber-100">畫面載入時發生錯誤</h1>
          <p className="text-sm text-stone-300 break-words">{message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl border-2 border-amber-500 bg-amber-600 px-5 py-2.5 text-sm font-black text-stone-900 hover:bg-amber-500"
          >
            重新整理頁面
          </button>
        </div>
      </div>
    );
  }
}
