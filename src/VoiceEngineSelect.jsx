import React from 'react';
import { listAzureVoicesForLang } from './azureVoices';
import { BilingualLabel } from './BilingualLabel';

/** Azure Neural 語音引擎手動選擇 */
export default function VoiceEngineSelect({
  label,
  labelEn,
  lang,
  value,
  onChange,
  isSEN,
  isNight,
  disabled,
  useAzure = true,
  centered = false,
}) {
  const options = listAzureVoicesForLang(lang);
  const safeValue = value === 'auto' || options.some((v) => v.id === value)
    ? (value || 'auto')
    : 'auto';

  if (!useAzure) return null;

  return (
    <div className={`${centered ? 'flex flex-col items-center gap-2 text-center' : 'flex flex-wrap items-center gap-2'} ${disabled ? 'opacity-60' : ''}`}>
      <BilingualLabel
        zh={`${label}引擎`}
        en={`${labelEn ?? label} Engine`}
        size="sm"
        className="font-bold shrink-0"
      />
      <select
        value={safeValue}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`rounded-lg border-2 font-bold max-w-full text-center
          ${isSEN ? 'text-xs px-2 py-1.5' : 'text-[10px] px-2 py-1'}
          ${isNight ? 'bg-stone-800 border-stone-500 text-stone-100' : 'bg-white border-slate-300 text-slate-700'}`}
      >
        <option value="auto">Azure 自動（{options[0]?.label ?? lang}）</option>
        {options.map((v) => (
          <option key={v.id} value={v.id}>
            {v.label}
          </option>
        ))}
      </select>
    </div>
  );
}
