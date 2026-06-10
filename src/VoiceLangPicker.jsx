import React from 'react';
import { VOICE_LANG_OPTIONS } from './useSpeech';
import { BilingualLabel } from './BilingualLabel';

/** 粵語 / 普通話 / 英文 語音選擇 */
export default function VoiceLangPicker({ label, labelEn, value, onChange, isSEN, disabled, isNight, centered = false }) {
  return (
    <div className={`${centered ? 'flex flex-col items-center gap-2 text-center' : 'flex flex-wrap items-center gap-2'} ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      <BilingualLabel zh={label} en={labelEn} size={isSEN ? 'md' : 'sm'} className="font-bold shrink-0" />
      <div className={`flex rounded-xl border-2 overflow-hidden ${centered ? 'justify-center' : ''}`} role="radiogroup" aria-label={label}>
        {VOICE_LANG_OPTIONS.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.id)}
              className={`font-black transition-all duration-200 border-r last:border-r-0 flex flex-col items-center
                ${isSEN ? 'px-3 py-2 text-sm' : 'px-2.5 py-1.5 text-xs'}
                ${active
                  ? (isNight
                    ? 'bg-amber-600 text-stone-900 border-amber-500'
                    : 'bg-sky-500 text-white border-sky-400')
                  : (isNight
                    ? 'bg-stone-700 text-stone-300 border-stone-600 hover:bg-stone-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')}`}
            >
              <span>{opt.icon} {opt.label}</span>
              {opt.labelEn && <span className="text-[9px] font-normal opacity-70">{opt.labelEn}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
