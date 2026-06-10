/**
 * 全局語音狀態 — 供 Header 語音選單與各科目共用同一 useSpeech 實例
 */
import React, { createContext, useContext } from 'react';
import { useSpeech } from './useSpeech';

const SpeechContext = createContext(null);

export function SpeechProvider({ studentType, isSEN, language, children }) {
  const speech = useSpeech(studentType, isSEN, language);
  return (
    <SpeechContext.Provider value={speech}>
      {children}
    </SpeechContext.Provider>
  );
}

/** @returns {ReturnType<typeof useSpeech>} */
export function useSpeechContext() {
  const ctx = useContext(SpeechContext);
  if (!ctx) {
    throw new Error('useSpeechContext 必須在 <SpeechProvider> 內使用');
  }
  return ctx;
}
