import React, { useState } from 'react';
import { getSpeechLangLabel } from './useSpeech';
import { useVoicePreferences } from './VoicePreferencesContext';
import SpeechVoiceSettings from './SpeechVoiceSettings';

/**
 * 語音選擇面板 — 頁內折疊版（課文預習 / 測驗等）
 * 所有模式已統一移至 Header 右上角（SpeechVoiceHeaderMenu）
 */
export default function SpeechVoicePanel({
  theme,
  isSEN,
  isNight,
  disabled,
  title = '🔊 語音選擇',
  subtitle,
  showWord = true,
  showMeaning = true,
  speechError,
  speechProvider,
  lastFromCache,
  defaultOpen = false,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { wordVoiceLang, meaningVoiceLang } = useVoicePreferences();

  const summaryParts = [];
  if (showWord) summaryParts.push(`詞語 ${getSpeechLangLabel(wordVoiceLang)}`);
  if (showMeaning) summaryParts.push(`字義 ${getSpeechLangLabel(meaningVoiceLang)}`);
  const summaryText = summaryParts.join(' · ');

  return (
    <div className={`rounded-xl border-2 overflow-hidden ${theme.hint}`}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        className={`w-full text-center px-4 py-3 transition-colors hover:opacity-90
          ${isSEN ? 'py-3.5' : 'py-3'}`}
      >
        <div className={`font-black opacity-80 ${isSEN ? 'text-sm' : 'text-xs'}`}>
          {title}
          <span className="ml-2 opacity-60">{isOpen ? '▼' : '▶'}</span>
        </div>
        {!isOpen && summaryText && (
          <p className={`mt-1 font-bold opacity-60 ${isSEN ? 'text-xs' : 'text-[10px]'}`}>
            {summaryText}
          </p>
        )}
        {!isOpen && speechError && (
          <p className={`mt-1 font-bold ${isNight ? 'text-rose-400' : 'text-rose-600'} ${isSEN ? 'text-xs' : 'text-[10px]'}`}>
            ⚠️ 語音異常，點擊展開
          </p>
        )}
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out text-center
          ${isOpen ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-black/5">
          <SpeechVoiceSettings
            isSEN={isSEN}
            isNight={isNight}
            disabled={disabled}
            subtitle={subtitle}
            showWord={showWord}
            showMeaning={showMeaning}
            speechError={speechError}
            speechProvider={speechProvider}
            lastFromCache={lastFromCache}
          />
        </div>
      </div>
    </div>
  );
}
