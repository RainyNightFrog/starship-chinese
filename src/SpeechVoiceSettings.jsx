import React, { useMemo } from 'react';
import { getSpeechLangLabel } from './useSpeech';
import { getAzureVoiceStatus } from './azureVoices';
import { useVoicePreferences } from './VoicePreferencesContext';
import VoiceLangPicker from './VoiceLangPicker';
import VoiceEngineSelect from './VoiceEngineSelect';
import { BilingualLabel } from './BilingualLabel';

const PROVIDER_LABELS = {
  cached: { zh: '💾 本地快取（零 Azure 字數）', en: 'Local cache (zero Azure usage)' },
  neural: { zh: '☁️ Azure 神經語音', en: 'Azure Neural Voice' },
  ready: { zh: '☁️ Azure 已就緒 · 按 🔊 才合成', en: 'Azure ready · tap 🔊 to synthesize' },
  fallback: { zh: '⚠️ 瀏覽器備援語音', en: 'Browser fallback voice' },
  idle: { zh: '🎧 按需播放 · 按 🔊 才請求', en: 'On-demand · tap 🔊 to request' },
};

const FIELD_LABELS = {
  word: { zh: '詞語', en: 'Word' },
  meaning: { zh: '字義', en: 'Meaning' },
};

/**
 * 語音偏好設定內容（詞語 / 字義語言與引擎）
 * 供頁內折疊面板與 Header 下拉選單共用
 */
export default function SpeechVoiceSettings({
  isSEN,
  isNight,
  disabled,
  subtitle,
  subtitleEn,
  showWord = true,
  showMeaning = true,
  speechError,
  speechProvider,
  lastFromCache,
  compact = false,
}) {
  const {
    wordVoiceLang,
    meaningVoiceLang,
    wordEngineKey,
    meaningEngineKey,
    setWordVoiceLang,
    setMeaningVoiceLang,
    setWordEngineKey,
    setMeaningEngineKey,
  } = useVoicePreferences();

  const azureOk = useMemo(
    () => ['azure-ready', 'azure-neural', 'azure-cached'].includes(speechProvider),
    [speechProvider],
  );

  const wordVoiceStatus = useMemo(
    () => getAzureVoiceStatus(wordVoiceLang, wordEngineKey),
    [wordVoiceLang, wordEngineKey],
  );
  const meaningVoiceStatus = useMemo(
    () => getAzureVoiceStatus(meaningVoiceLang, meaningEngineKey),
    [meaningVoiceLang, meaningEngineKey],
  );

  const providerLabel = (() => {
    if (speechProvider === 'azure-cached' || lastFromCache) return PROVIDER_LABELS.cached;
    if (speechProvider === 'azure-neural') return PROVIDER_LABELS.neural;
    if (speechProvider === 'azure-ready') return PROVIDER_LABELS.ready;
    if (speechProvider === 'browser-fallback') return PROVIDER_LABELS.fallback;
    return PROVIDER_LABELS.idle;
  })();

  const textXs = isSEN ? 'text-xs' : 'text-[10px]';
  const textSm = isSEN ? 'text-sm' : 'text-xs';

  return (
    <div className={`space-y-3 ${compact ? '' : 'text-center'}`}>
      {subtitle && (
        <BilingualLabel zh={subtitle} en={subtitleEn} size="sm" center className="opacity-50 font-bold" />
      )}
      <BilingualLabel
        zh={providerLabel.zh}
        en={providerLabel.en}
        size="sm"
        center
        className={`font-bold ${azureOk || speechProvider === 'idle' ? 'text-emerald-600' : 'text-amber-600'}`}
      />

      {showWord && (
        <>
          <VoiceLangPicker label={FIELD_LABELS.word.zh} labelEn={FIELD_LABELS.word.en} value={wordVoiceLang} onChange={setWordVoiceLang} isSEN={isSEN} isNight={isNight} disabled={disabled} centered />
          <VoiceEngineSelect label={FIELD_LABELS.word.zh} labelEn={FIELD_LABELS.word.en} lang={wordVoiceLang} value={wordEngineKey} onChange={setWordEngineKey} isSEN={isSEN} isNight={isNight} disabled={disabled} useAzure centered />
        </>
      )}

      {showMeaning && (
        <>
          <VoiceLangPicker label={FIELD_LABELS.meaning.zh} labelEn={FIELD_LABELS.meaning.en} value={meaningVoiceLang} onChange={setMeaningVoiceLang} isSEN={isSEN} isNight={isNight} disabled={disabled} centered />
          <VoiceEngineSelect label={FIELD_LABELS.meaning.zh} labelEn={FIELD_LABELS.meaning.en} lang={meaningVoiceLang} value={meaningEngineKey} onChange={setMeaningEngineKey} isSEN={isSEN} isNight={isNight} disabled={disabled} useAzure centered />
        </>
      )}

      {!compact && (
        <BilingualLabel
          zh="快取庫 xinghang_azure_speech · Key = 詞語 + 語音引擎"
          en="Cache: xinghang_azure_speech · key = word + voice"
          size="sm"
          center
          className="opacity-50 font-bold"
        />
      )}

      <div className={`space-y-1 ${textXs}`}>
        {showWord && (
          <p className={`font-bold ${isNight ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {FIELD_LABELS.word.zh}：{getSpeechLangLabel(wordVoiceLang)} · {wordVoiceStatus.label}
            <span className="block text-[9px] opacity-70">{FIELD_LABELS.word.en}: {wordVoiceStatus.label}</span>
          </p>
        )}
        {showMeaning && (
          <p className={`font-bold ${isNight ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {FIELD_LABELS.meaning.zh}：{getSpeechLangLabel(meaningVoiceLang)} · {meaningVoiceStatus.label}
            <span className="block text-[9px] opacity-70">{FIELD_LABELS.meaning.en}: {meaningVoiceStatus.label}</span>
          </p>
        )}
      </div>

      {speechError && !/已改用/.test(speechError) && (
        <p className={`rounded-lg border-2 font-bold p-2 ${textSm}
          ${isNight ? 'border-rose-600 bg-rose-950/40 text-rose-200' : 'border-rose-300 bg-rose-50 text-rose-700'}`}>
          ⚠️ {speechError}
        </p>
      )}

      {speechProvider === 'browser-fallback' && (
        <BilingualLabel
          zh="雲端不可用：男聲（雲龍）需 npm run dev 啟用 Azure，或安裝本機 Microsoft Danny 粵語男聲。"
          en="Cloud off: male voice (Wan Lung) needs npm run dev + Azure, or install Microsoft Danny (Cantonese male)."
          size="sm"
          center
          className={`font-bold ${isNight ? 'text-amber-300' : 'text-amber-700'}`}
        />
      )}
    </div>
  );
}
