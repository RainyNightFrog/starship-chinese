import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { VoicePreferencesContext } from './VoicePreferencesContext';
import { resolveAzureVoice } from './azureVoices';
import {
  checkAzureSpeechHealth,
  clearInflightSpeechRequests,
  fetchAzureSpeechBlob,
  playAudioBlob,
} from './azureSpeech';
import { warmSpeechCache } from './speechCache';
import { getBrowserVoices, resolveVoice, waitForVoices } from './voicePicker';
import { getBrowserSpeechRate } from './speechRate';
import { convertToSimplified, getDisplayText, isSimplifiedScript as checkSimplifiedScript } from './chineseScript';
import { sanitizeDictationHint } from './dictationHintUtils';

export { getDisplayText, makeDisplayText } from './chineseScript';

export const VOICE_LANG_OPTIONS = [
  { id: 'zh-HK', label: '粵語', labelEn: 'Cantonese', icon: '🇭🇰' },
  { id: 'zh-CN', label: '普通話', labelEn: 'Mandarin', icon: '🇨🇳' },
  { id: 'en-US', label: '英文', labelEn: 'English', icon: '🇬🇧' },
];

const VOICE_STORAGE = { word: 'xinghang_voice_word', meaning: 'xinghang_voice_meaning' };
const ENGINE_STORAGE = { word: 'xinghang_engine_word', meaning: 'xinghang_engine_meaning' };

export function getWordSpeechLang({ studentType, language }) {
  if (studentType === 'mainland' || language === 'zh-CN') return 'zh-CN';
  return 'zh-HK';
}

export function getMeaningSpeechLang({ studentType }) {
  if (studentType === 'mainland') return 'zh-CN';
  return 'zh-HK';
}

export function loadVoiceLang(kind, fallback) {
  try {
    const v = localStorage.getItem(VOICE_STORAGE[kind]);
    if (v && VOICE_LANG_OPTIONS.some((o) => o.id === v)) return v;
  } catch { /* ignore */ }
  return fallback;
}

export function saveVoiceLang(kind, lang) {
  try { localStorage.setItem(VOICE_STORAGE[kind], lang); } catch { /* ignore */ }
}

export function loadVoiceEngine(kind) {
  try { return localStorage.getItem(ENGINE_STORAGE[kind]) || 'auto'; } catch { return 'auto'; }
}

export function saveVoiceEngine(kind, key) {
  try { localStorage.setItem(ENGINE_STORAGE[kind], key || 'auto'); } catch { /* ignore */ }
}

export function isSimplifiedScript(language, studentType) {
  return checkSimplifiedScript(language, studentType);
}

export function getVocabChar(vocab, { language, studentType }) {
  if (!vocab) return '';
  if (isSimplifiedScript(language, studentType)) {
    return vocab.sc || convertToSimplified(vocab.tc);
  }
  return vocab.tc;
}

export function getVocabRomanization(vocab, { language, studentType }) {
  return isSimplifiedScript(language, studentType) ? vocab.py : vocab.jp;
}

export function getWordSpeakText(vocab, voiceLang) {
  if (voiceLang === 'en-US') return vocab.en || vocab.tc;
  if (voiceLang === 'zh-CN') return vocab.sc || vocab.tc;
  return vocab.tc;
}

export function getSpeakText(vocab, isMainland) {
  return isMainland ? (vocab.sc || vocab.tc) : vocab.tc;
}

export function getVocabMeaning(vocab, { voiceLang, studentType, language = 'zh-HK', forDictation = false } = {}) {
  const lang = voiceLang ?? getMeaningSpeechLang({ studentType });
  const displaySc = isSimplifiedScript(language, studentType);

  if (lang === 'en-US') {
    const en = vocab.en || vocab.tc;
    return { text: en, lang: 'en-US', label: `英文：${en}` };
  }

  const scChar = vocab.sc || convertToSimplified(vocab.tc);
  const rawHintTc = vocab.hintTc;
  const rawHintSc = vocab.hintSc;

  const resolveHint = (raw, displaySimplified) => {
    if (raw) {
      return forDictation
        ? sanitizeDictationHint(raw, vocab, { displaySc: displaySimplified })
        : raw;
    }
    if (forDictation) {
      return sanitizeDictationHint('', vocab, { displaySc: displaySimplified });
    }
    const fallbackWord = displaySimplified ? scChar : vocab.tc;
    return `意思是${fallbackWord}`;
  };

  const speechText = lang === 'zh-CN'
    ? resolveHint(rawHintSc, true)
    : resolveHint(rawHintTc, false);

  const displayLabel = displaySc
    ? resolveHint(rawHintSc, true)
    : resolveHint(rawHintTc, false);

  return {
    text: speechText,
    lang: lang === 'zh-CN' ? 'zh-CN' : 'zh-HK',
    label: displayLabel,
  };
}

export function getSpeechLangLabel(lang) {
  const map = { 'zh-HK': '粵語', 'zh-CN': '普通話', 'en-US': '英文' };
  return map[lang] ?? lang;
}

/**
 * 語音播放 Hook — 按需觸發（On-Demand）+ IndexedDB 快取優先
 *
 * 原則：
 * - 初始化／載入詞表時 **絕不** 呼叫 Azure TTS synthesize
 * - 僅在 speak() / speakSequence() 被按鈕觸發時才查快取或請求雲端
 * - 首次播放才檢查 Azure 健康狀態（/health，非 synthesize）
 */
export function useSpeech(studentType, isSEN, language = 'zh-HK') {
  const voicePrefs = useContext(VoicePreferencesContext);

  const [speaking, setSpeaking] = useState(false);
  const [speakingKind, setSpeakingKind] = useState(null);
  /** 正在從 IndexedDB / Azure 讀取音檔（尚未開始播放） */
  const [loadingKind, setLoadingKind] = useState(null);
  const [speechError, setSpeechError] = useState(null);
  const [speechProvider, setSpeechProvider] = useState('idle');
  const [lastFromCache, setLastFromCache] = useState(null);
  const [voicesReady, setVoicesReady] = useState(false);

  const queueRef = useRef([]);
  const processingRef = useRef(false);
  const voicesRef = useRef([]);
  const audioCtrlRef = useRef(null);
  const useAzureRef = useRef(false);
  const azureHealthCheckedRef = useRef(false);
  const abortRef = useRef(null);
  const mountedRef = useRef(true);

  const wordLang = getWordSpeechLang({ studentType, language });
  const meaningLang = getMeaningSpeechLang({ studentType });

  const refreshVoices = useCallback(() => {
    voicesRef.current = getBrowserVoices();
    if (voicesRef.current.length) setVoicesReady(true);
  }, []);

  /** 首次點擊 🔊 時才：開 IndexedDB + 檢查 Azure 後端（不合成語音） */
  const ensureSpeechReady = useCallback(async () => {
    await warmSpeechCache();

    const speechApiUrl = (import.meta.env.VITE_SPEECH_API_URL || '').trim();
    const isDev = import.meta.env.DEV;
    /** Vercel 靜態站未部署後端時，略過 Azure（避免 /api/speech 回傳 HTML 或 localhost 卡死） */
    const azureConfigured = Boolean(
      speechApiUrl
      && (isDev || !/localhost|127\.0\.0\.1/i.test(speechApiUrl)),
    );

    if (!azureConfigured) {
      azureHealthCheckedRef.current = true;
      useAzureRef.current = false;
      if (mountedRef.current) setSpeechProvider('browser-fallback');
      return false;
    }

    if (!azureHealthCheckedRef.current) {
      const ok = await checkAzureSpeechHealth();
      azureHealthCheckedRef.current = true;
      useAzureRef.current = ok;
      if (mountedRef.current) {
        setSpeechProvider(ok ? 'azure-ready' : 'browser-fallback');
      }
      return ok;
    }
    return useAzureRef.current;
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // 僅預載瀏覽器語音列表（本地，零 Azure 費用）
    waitForVoices(3000).then((list) => {
      if (!mountedRef.current) return;
      voicesRef.current = list.length ? list : getBrowserVoices();
      setVoicesReady(voicesRef.current.length > 0);
    });

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = refreshVoices;
    }

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      abortRef.current = null;
      audioCtrlRef.current?.stop();
      audioCtrlRef.current = null;
      clearInflightSpeechRequests();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
      }
    };
  }, [refreshVoices]);

  const clearBusy = useCallback(() => {
    setSpeaking(false);
    setSpeakingKind(null);
    setLoadingKind(null);
  }, []);

  const clearSpeechError = useCallback(() => {
    setSpeechError(null);
  }, []);

  const cancel = useCallback(() => {
    queueRef.current = [];
    processingRef.current = false;
    setSpeechError(null);
    abortRef.current?.abort();
    abortRef.current = null;
    audioCtrlRef.current?.stop();
    audioCtrlRef.current = null;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    clearBusy();
  }, [clearBusy]);

  const getEngineKey = useCallback((kind) => {
    if (!voicePrefs) return 'auto';
    return kind === 'word' ? voicePrefs.wordEngineKey : voicePrefs.meaningEngineKey;
  }, [voicePrefs]);

  const finishSegment = useCallback((onEnd) => {
    processingRef.current = false;
    setLoadingKind(null);
    onEnd?.();
    runNextInQueueRef.current?.();
  }, []);

  const playWithBrowser = useCallback(async (text, lang, kind, engineKey, onEnd) => {
    let voices = getBrowserVoices();
    if (voices.length < 2) {
      voices = await waitForVoices(2500);
    }
    if (voices.length) voicesRef.current = voices;

    let matchedVoice = resolveVoice(lang, voicesRef.current, engineKey);
    if (!matchedVoice && (lang === 'zh-HK' || lang === 'zh-CN')) {
      matchedVoice = voicesRef.current.find((v) => v.lang?.startsWith('zh')) ?? null;
    }
    if (!matchedVoice && lang === 'en-US') {
      matchedVoice = voicesRef.current.find((v) => v.lang?.startsWith('en')) ?? null;
    }

    if (!matchedVoice) {
      processingRef.current = false;
      setLoadingKind(null);
      setSpeechError(
        lang === 'zh-HK'
          ? '找不到粵語語音。請用 Safari 並在「設定→輔助使用→語音內容」下載中文語音，或本地 npm run dev 使用 Azure 神經語音。'
          : `找不到本機${getSpeechLangLabel(lang)}語音，請在系統設定中下載語音包。`,
      );
      runNextInQueueRef.current?.();
      return;
    }

    setSpeechError(null);
    setSpeechProvider('browser-fallback');

    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = matchedVoice;
    utter.lang = matchedVoice.lang || lang;
    utter.rate = getBrowserSpeechRate(lang, isSEN, matchedVoice?.name || engineKey);

    let loadingCleared = false;
    const clearLoadingOnce = () => {
      if (loadingCleared || !mountedRef.current) return;
      loadingCleared = true;
      setLoadingKind(null);
      setSpeaking(true);
      setSpeakingKind(kind);
    };

    /** iOS Safari 有時不觸發 onstart — 逾時仍顯示播放中並稍後結束 */
    const loadingTimer = setTimeout(clearLoadingOnce, 450);

    utter.onstart = () => {
      clearTimeout(loadingTimer);
      clearLoadingOnce();
    };
    utter.onend = () => {
      clearTimeout(loadingTimer);
      if (!mountedRef.current) return;
      setSpeaking(false);
      setSpeakingKind(null);
      finishSegment(onEnd);
    };
    utter.onerror = () => {
      clearTimeout(loadingTimer);
      if (!mountedRef.current) return;
      setSpeechError('語音播放失敗，請稍後再試');
      finishSegment(onEnd);
    };

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      /** iOS 需在 cancel 後延遲 speak */
      window.setTimeout(() => {
        if (!mountedRef.current) return;
        window.speechSynthesis.speak(utter);
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      }, 50);
    }
  }, [finishSegment, isSEN]);

  const runNextInQueueRef = useRef(null);

  const runNextInQueue = useCallback(async () => {
    if (processingRef.current || queueRef.current.length === 0) {
      if (queueRef.current.length === 0) clearBusy();
      return;
    }

    processingRef.current = true;
    const { text, lang, kind, onEnd } = queueRef.current.shift();
    const engineKey = getEngineKey(kind);

    setLoadingKind(kind);
    setSpeechError(null);

    const azureOk = await ensureSpeechReady();

    if (azureOk) {
      let azureWatchdog;
      try {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        azureWatchdog = window.setTimeout(() => {
          controller.abort();
          useAzureRef.current = false;
        }, 12000);

        const { blob, fromCache } = await fetchAzureSpeechBlob({
          text,
          lang,
          isSEN,
          engineKey,
          voice: resolveAzureVoice(lang, engineKey),
          signal: controller.signal,
        });

        window.clearTimeout(azureWatchdog);

        if (!mountedRef.current) return;

        setLastFromCache(fromCache);
        setSpeechProvider(fromCache ? 'azure-cached' : 'azure-neural');

        audioCtrlRef.current = playAudioBlob(blob, {
          onStart: () => {
            if (!mountedRef.current) return;
            setLoadingKind(null);
            setSpeaking(true);
            setSpeakingKind(kind);
          },
          onEnd: () => {
            if (!mountedRef.current) return;
            audioCtrlRef.current = null;
            setSpeaking(false);
            setSpeakingKind(null);
            finishSegment(onEnd);
          },
          onError: (err) => {
            if (!mountedRef.current) return;
            audioCtrlRef.current = null;
            setSpeechError(err.message || '音檔播放失敗');
            finishSegment(onEnd);
          },
        });
        return;
      } catch (err) {
        window.clearTimeout(azureWatchdog);
        if (err?.name === 'AbortError') {
          processingRef.current = false;
          setLoadingKind(null);
          if (mountedRef.current) {
            setSpeechError('雲端語音逾時，已改用瀏覽器語音');
          }
          await playWithBrowser(text, lang, kind, engineKey, onEnd);
          return;
        }
        useAzureRef.current = false;
        if (mountedRef.current) {
          const msg = err.message?.includes('503') || err.message?.includes('429')
            ? '雲端語音額度或連線暫不可用，已改用瀏覽器語音'
            : '雲端語音失敗，已改用瀏覽器語音';
          setSpeechError(msg);
        }
        console.warn('[Speech] Azure 失敗，降級瀏覽器語音:', err.message);
      }
    }

    await playWithBrowser(text, lang, kind, engineKey, onEnd);
  }, [clearBusy, ensureSpeechReady, finishSegment, getEngineKey, isSEN, playWithBrowser]);

  runNextInQueueRef.current = runNextInQueue;

  const enqueue = useCallback((items) => {
    if (!items?.length) return;
    queueRef.current = items;
    runNextInQueue();
  }, [runNextInQueue]);

  const speak = useCallback((text, { lang = wordLang, kind = 'word', onEnd } = {}) => {
    if (!text) return;
    cancel();
    enqueue([{ text, lang, kind, onEnd }]);
  }, [cancel, enqueue, wordLang]);

  const speakSequence = useCallback((segments) => {
    if (!segments?.length) return;
    cancel();
    enqueue(segments.map((s) => ({
      text: s.text,
      lang: s.lang,
      kind: s.kind ?? 'word',
      onEnd: s.onEnd,
    })));
  }, [cancel, enqueue]);

  useEffect(() => () => cancel(), [cancel]);

  const speechBusy = speaking || Boolean(loadingKind);

  return {
    speak,
    speakSequence,
    cancel,
    speaking,
    speakingKind,
    loadingKind,
    speechBusy,
    speechError,
    clearSpeechError,
    speechProvider,
    lastFromCache,
    wordLang,
    meaningLang,
    lang: wordLang,
    voicesReady,
  };
}
