import React, { useCallback, useEffect, useState } from 'react';
import { COIN_REWARDS } from './coinRewards';
import CoinIcon, { CoinAmount } from './CoinIcon';
import { BilingualLabel } from './BilingualLabel';

const INSUFFICIENT_MSG = {
  zh: '能量金幣不足，多做一組重組句子練習來賺取吧！',
  en: 'Not enough coins — try a sentence unscramble set to earn more!',
};

/**
 * 🪙 努力能量金幣商店 — 中央彈窗
 */
export default function CoinRewardsPanel({
  coins,
  ownedRewards,
  onRedeem,
  onClose,
  isSEN,
  isNight,
}) {
  const [successId, setSuccessId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, isError = false) => {
    setToast({ msg, isError });
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleRedeem = (reward) => {
    if (ownedRewards.includes(reward.id)) return;

    if (coins < reward.cost) {
      showToast(INSUFFICIENT_MSG, true);
      return;
    }

    const ok = onRedeem(reward);
    if (ok === false) return;

    setSuccessId(reward.id);
    setTimeout(() => setSuccessId(null), 1800);
  };

  return (
    <>
      <button
        type="button"
        aria-label="關閉金幣商店"
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-[2px] animate-[fadeIn_0.2s_ease-out]"
      />

      <div
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] w-[min(100%-2rem,24rem)]
          rounded-2xl border-2 shadow-2xl animate-[fadeSlideIn_0.28s_ease-out]
          ${isNight ? 'bg-stone-800 border-amber-600/50 text-stone-100' : 'bg-white border-stone-200 text-stone-800'}
          ${isSEN ? 'p-6' : 'p-5'}`}
        role="dialog"
        aria-modal="true"
        aria-label="努力能量金幣商店"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="text-center flex-1 flex flex-col items-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CoinIcon size={isSEN ? 'xl' : 'lg'} glow />
              <BilingualLabel
                zh="努力能量金幣商店"
                en="Effort Coin Shop"
                size={isSEN ? 'lg' : 'md'}
                center
                className="font-black"
              />
            </div>
            <BilingualLabel
              zh={`目前持有 ${coins} 枚`}
              en={`You have ${coins} coins`}
              size={isSEN ? 'md' : 'sm'}
              center
              className="opacity-70"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="opacity-50 hover:opacity-100 font-bold text-xl leading-none shrink-0 ml-2"
            aria-label="關閉"
          >
            ×
          </button>
        </div>

        <BilingualLabel
          zh="答對題目、完成默書即可賺取 · 兌換學習輔助或親子小獎勵"
          en="Earn by answering correctly or finishing dictation · redeem study aids or rewards"
          size="sm"
          center
          className="opacity-60 font-bold mb-4"
        />

        <div className={`space-y-3 ${isSEN ? 'space-y-4' : ''}`}>
          {COIN_REWARDS.map((r) => {
            const owned = ownedRewards.includes(r.id);
            const canAfford = coins >= r.cost;
            const isSuccess = successId === r.id;
            const disabled = owned || isSuccess;
            const insufficient = !owned && !canAfford;

            return (
              <div
                key={r.id}
                className={`rounded-xl border-2 p-3 transition-all duration-300 text-center
                  ${owned
                    ? (isNight ? 'border-emerald-600/50 bg-emerald-900/20 opacity-70' : 'border-emerald-300 bg-emerald-50/80 opacity-70')
                    : insufficient
                      ? 'opacity-50 saturate-50 border-stone-300 bg-stone-100/50'
                      : isSuccess
                        ? (isNight ? 'border-emerald-500 bg-emerald-900/40 scale-[1.02]' : 'border-emerald-400 bg-emerald-50 scale-[1.02]')
                        : (isNight ? 'border-amber-600/40 bg-stone-700/50 hover:border-amber-500/60' : 'border-amber-200 bg-white hover:border-amber-300 hover:shadow-sm')}`}
              >
                <div className={`flex flex-col items-center gap-1 ${isSEN ? 'text-sm' : 'text-xs'}`}>
                  <span className="text-2xl" aria-hidden>{r.icon}</span>
                  <BilingualLabel zh={r.name} en={r.nameEn} size={isSEN ? 'md' : 'sm'} center className="font-black" />
                  <span className={`font-black tabular-nums inline-flex items-center justify-center gap-1 ${insufficient ? 'text-stone-400' : 'text-amber-600'}`}>
                    <CoinAmount amount={r.cost} size="sm" />
                  </span>
                  <BilingualLabel zh={r.desc} en={r.descEn} size="sm" center className="opacity-70 leading-snug" />
                </div>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleRedeem(r)}
                  className={`mt-3 w-full rounded-xl font-black border-2 transition-all duration-300
                    ${isSEN ? 'py-2.5 text-sm' : 'py-2 text-xs'}
                    ${owned
                      ? 'bg-stone-200 text-stone-500 border-stone-300 cursor-default'
                      : isSuccess
                        ? 'bg-emerald-500 text-white border-emerald-600'
                        : insufficient
                          ? 'bg-stone-200/80 text-stone-400 border-stone-300 cursor-pointer'
                          : (isNight
                            ? 'bg-amber-600 text-stone-900 border-amber-500 hover:bg-amber-500 active:scale-[0.98]'
                            : 'bg-amber-400 text-amber-950 border-amber-500 hover:bg-amber-300 active:scale-[0.98]')}`}
                >
                  <BilingualLabel
                    zh={owned ? '已兌換 ✓' : isSuccess ? '兌換成功！🎉' : insufficient ? '金幣不足' : '立即兌換'}
                    en={owned ? 'Redeemed ✓' : isSuccess ? 'Success! 🎉' : insufficient ? 'Not enough' : 'Redeem Now'}
                    size="sm"
                    center
                    className={!owned && !insufficient && !isSuccess ? '[&_span:last-child]:!text-amber-950/80' : ''}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {toast && (
          <div
            role="alert"
            className={`mt-4 font-bold text-center rounded-xl px-3 py-2 border animate-[fadeSlideIn_0.25s_ease-out]
              ${isSEN ? 'text-sm' : 'text-xs'}
              ${toast.isError
                ? (isNight ? 'bg-rose-900/40 text-rose-200 border-rose-700' : 'bg-rose-50 text-rose-700 border-rose-200')
                : (isNight ? 'bg-emerald-900/40 text-emerald-200 border-emerald-700' : 'bg-emerald-50 text-emerald-700 border-emerald-200')}`}
          >
            {typeof toast.msg === 'object' ? (
              <BilingualLabel zh={toast.msg.zh} en={toast.msg.en} size="sm" center />
            ) : toast.msg}
          </div>
        )}
      </div>
    </>
  );
}
