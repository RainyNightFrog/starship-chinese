/** Azure Neural TTS 語音節點對應 */
export const AZURE_VOICES = {
  'zh-HK': [
    { id: 'zh-HK-HiuGaaiNeural', label: '曉佳 (粵語女聲)', gender: 'F' },
    { id: 'zh-HK-WanLungNeural', label: '雲龍 (粵語男聲)', gender: 'M' },
  ],
  'zh-CN': [
    { id: 'zh-CN-XiaoxiaoNeural', label: '曉曉 (普通話女聲)', gender: 'F' },
  ],
  'en-US': [
    { id: 'en-US-AriaNeural', label: 'Aria (美式英文)', gender: 'F' },
    { id: 'en-GB-SoniaNeural', label: 'Sonia (英式英文)', gender: 'F' },
  ],
};

export function getDefaultAzureVoice(lang) {
  return AZURE_VOICES[lang]?.[0]?.id ?? 'zh-HK-HiuGaaiNeural';
}

export function listAzureVoicesForLang(lang) {
  return AZURE_VOICES[lang] ?? [];
}

/** 校正 localStorage 舊值／無效 id，避免默默退回女聲 */
export function normalizeEngineKey(engineKey) {
  if (!engineKey || engineKey === 'auto') return 'auto';
  const key = String(engineKey).trim();

  for (const list of Object.values(AZURE_VOICES)) {
    const exact = list.find((v) => v.id === key);
    if (exact) return exact.id;
  }

  const lower = key.toLowerCase();
  if (/雲龍|wanlung|wan.?lung/.test(lower)) return 'zh-HK-WanLungNeural';
  if (/曉佳|hiugaai|tracy/.test(lower)) return 'zh-HK-HiuGaaiNeural';
  if (/曉曉|xiaoxiao/.test(lower)) return 'zh-CN-XiaoxiaoNeural';

  return 'auto';
}

export function isValidAzureEngineId(engineKey) {
  return normalizeEngineKey(engineKey) !== 'auto' || engineKey === 'auto';
}

export function resolveAzureVoice(lang, engineKey) {
  const list = listAzureVoicesForLang(lang);
  const normalized = normalizeEngineKey(engineKey);
  if (normalized !== 'auto') {
    const found = list.find((v) => v.id === normalized);
    if (found) return found.id;
  }
  return getDefaultAzureVoice(lang);
}

export function getAzureVoiceLabel(voiceId) {
  for (const list of Object.values(AZURE_VOICES)) {
    const hit = list.find((v) => v.id === voiceId);
    if (hit) return hit.label;
  }
  return voiceId;
}

export function isMaleAzureVoice(voiceId) {
  if (!voiceId) return false;
  for (const list of Object.values(AZURE_VOICES)) {
    const hit = list.find((v) => v.id === voiceId);
    if (hit) return hit.gender === 'M';
  }
  return false;
}

export function getAzureVoiceStatus(lang, engineKey) {
  const voiceId = resolveAzureVoice(lang, engineKey);
  return {
    ok: true,
    voiceId,
    label: `Azure · ${getAzureVoiceLabel(voiceId)}`,
    provider: 'azure-neural',
  };
}
