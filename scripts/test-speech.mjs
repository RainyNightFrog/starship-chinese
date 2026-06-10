/**
 * 快速驗證 Azure 粵語男聲（雲龍）— 需先啟動語音 API（npm run dev 或 npm run live）
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env') });

const port = process.env.SPEECH_PORT || 3001;
const livePort = process.env.LIVE_PORT || 5501;
const bases = [
  `http://127.0.0.1:${port}/api/speech`,
  `http://127.0.0.1:${livePort}/api/speech`,
];

const voice = 'zh-HK-WanLungNeural';
const text = '安慰';

async function tryBase(base) {
  const health = await fetch(`${base}/health`, { signal: AbortSignal.timeout(4000) });
  if (!health.ok) return { base, ok: false, step: 'health', status: health.status };
  const healthJson = await health.json();
  if (!healthJson.ok) return { base, ok: false, step: 'health-json', detail: healthJson };

  const res = await fetch(`${base}/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, rate: 1.18 }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { base, ok: false, step: 'synthesize', status: res.status, detail: err };
  }
  const blob = await res.blob();
  return { base, ok: true, bytes: blob.size, voice };
}

console.log('\n星航中文 — Azure 雲龍男聲測試');
console.log('─────────────────────────────');

let success = null;
for (const base of bases) {
  try {
    const result = await tryBase(base);
    if (result.ok) {
      success = result;
      console.log(`✓ ${base}`);
      console.log(`  詞語「${text}」· ${voice} · ${result.bytes} bytes`);
      break;
    }
    console.log(`✗ ${base} (${result.step})`);
  } catch (err) {
    console.log(`✗ ${base} (${err?.message ?? '連線失敗'})`);
  }
}

if (!success) {
  console.log('\n請先執行：npm run dev  或  npm run live');
  process.exit(1);
}

console.log('\n✓ 男聲 API 正常，請在瀏覽器選「雲龍」後按 🔊 試聽。\n');
