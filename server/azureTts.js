import sdk from 'microsoft-cognitiveservices-speech-sdk';

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function isAzureConfigured() {
  const key = process.env.AZURE_SPEECH_KEY?.trim();
  return Boolean(key && key !== 'your_subscription_key_here');
}

export function buildSSML(text, voiceName, rate = 1.0) {
  const lang = voiceName.split('-').slice(0, 2).join('-');
  const ratePct = Math.round(Math.min(1.2, Math.max(0.5, rate)) * 100);
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}">
  <voice name="${voiceName}">
    <prosody rate="${ratePct}%">${escapeXml(text)}</prosody>
  </voice>
</speak>`;
}

export function synthesizeToBuffer(text, voiceName, rate, subscriptionKey, region) {
  return new Promise((resolve, reject) => {
    const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, region);
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);
    const ssml = buildSSML(text, voiceName, rate);

    synthesizer.speakSsmlAsync(
      ssml,
      (result) => {
        synthesizer.close();
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          resolve(Buffer.from(result.audioData));
        } else {
          reject(new Error(result.errorDetails || '語音合成失敗'));
        }
      },
      (err) => {
        synthesizer.close();
        reject(err);
      },
    );
  });
}

export async function synthesizeHandler(req, res) {
  const { text, voice, rate = 1.0 } = req.body ?? {};

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: '缺少 text 參數' });
  }
  if (!voice || typeof voice !== 'string') {
    return res.status(400).json({ error: '缺少 voice 參數' });
  }
  if (text.length > 500) {
    return res.status(400).json({ error: 'text 不可超過 500 字' });
  }

  if (!isAzureConfigured()) {
    return res.status(503).json({
      error: 'Azure Speech 未設定。請在 .env 填入有效的 AZURE_SPEECH_KEY',
    });
  }

  const key = process.env.AZURE_SPEECH_KEY.trim();
  const region = process.env.AZURE_SPEECH_REGION || 'eastasia';

  try {
    const audioBuffer = await synthesizeToBuffer(text.trim(), voice, rate, key, region);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=86400',
    });
    res.send(audioBuffer);
  } catch (err) {
    console.error('[Azure TTS]', err.message);
    res.status(500).json({ error: err.message || '語音合成失敗' });
  }
}
