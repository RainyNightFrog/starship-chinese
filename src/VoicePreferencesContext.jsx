import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  getMeaningSpeechLang,
  getWordSpeechLang,
  loadVoiceEngine,
  loadVoiceLang,
  saveVoiceEngine,
  saveVoiceLang,
} from './useSpeech';
import { isMaleAzureVoice, normalizeEngineKey } from './azureVoices';

const VoicePreferencesContext = createContext(null);

export { VoicePreferencesContext };

/** 全站共用語音偏好（默書、預習、測驗字義提示） */
export function VoicePreferencesProvider({ studentType, language, children }) {
  const defaultWord = getWordSpeechLang({ studentType, language });
  const defaultMeaning = getMeaningSpeechLang({ studentType });

  const [wordVoiceLang, setWordVoiceLangState] = useState(() => loadVoiceLang('word', defaultWord));
  const [meaningVoiceLang, setMeaningVoiceLangState] = useState(() => loadVoiceLang('meaning', defaultMeaning));
  const [wordEngineKey, setWordEngineKeyState] = useState(() => loadVoiceEngine('word'));
  const [meaningEngineKey, setMeaningEngineKeyState] = useState(() => loadVoiceEngine('meaning'));

  const setWordVoiceLang = useCallback((lang) => {
    setWordVoiceLangState(lang);
    saveVoiceLang('word', lang);
  }, []);

  const setMeaningVoiceLang = useCallback((lang) => {
    setMeaningVoiceLangState(lang);
    saveVoiceLang('meaning', lang);
  }, []);

  const setWordEngineKey = useCallback((key) => {
    const normalized = normalizeEngineKey(key);
    setWordEngineKeyState(normalized);
    saveVoiceEngine('word', normalized);
    if (isMaleAzureVoice(normalized)) {
      setMeaningEngineKeyState(normalized);
      saveVoiceEngine('meaning', normalized);
    }
  }, []);

  const setMeaningEngineKey = useCallback((key) => {
    const normalized = normalizeEngineKey(key);
    setMeaningEngineKeyState(normalized);
    saveVoiceEngine('meaning', normalized);
  }, []);

  const value = useMemo(
    () => ({
      wordVoiceLang,
      meaningVoiceLang,
      wordEngineKey,
      meaningEngineKey,
      setWordVoiceLang,
      setMeaningVoiceLang,
      setWordEngineKey,
      setMeaningEngineKey,
    }),
    [
      wordVoiceLang,
      meaningVoiceLang,
      wordEngineKey,
      meaningEngineKey,
      setWordVoiceLang,
      setMeaningVoiceLang,
      setWordEngineKey,
      setMeaningEngineKey,
    ],
  );

  return (
    <VoicePreferencesContext.Provider value={value}>
      {children}
    </VoicePreferencesContext.Provider>
  );
}

export function useVoicePreferences() {
  const ctx = useContext(VoicePreferencesContext);
  if (!ctx) {
    throw new Error('useVoicePreferences must be used within VoicePreferencesProvider');
  }
  return ctx;
}

/** 字義提示文字依語音選擇 */
export function getHintSpeakPayload(hint, hintEn, voiceLang) {
  if (voiceLang === 'en-US') {
    return { text: hintEn || hint, lang: 'en-US' };
  }
  return { text: hint, lang: voiceLang };
}
