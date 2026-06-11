/**
 * 驗證雲端後端 API 是否就緒
 * 用法：node scripts/verify-api-deploy.mjs https://your-api.onrender.com
 */
const base = (process.argv[2] || '').replace(/\/$/, '');

if (!base) {
  console.error('用法: node scripts/verify-api-deploy.mjs <API_BASE_URL>');
  console.error('例:   node scripts/verify-api-deploy.mjs https://starship-chinese-api.onrender.com');
  process.exit(1);
}

async function check(path) {
  const url = `${base}${path}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  return { url, ok: res.ok, status: res.status, data };
}

console.log(`\n驗證後端：${base}\n`);

try {
  const root = await check('/');
  console.log(root.ok ? '✓' : '✗', 'GET /', root.status, root.data?.service ?? '');

  const ocr = await check('/api/reading/health');
  const ocrReady = ocr.ok && ocr.data?.ok;
  console.log(ocrReady ? '✓' : '✗', 'GET /api/reading/health', ocr.status, ocr.data?.message ?? ocr.data?.error ?? '');

  const speech = await check('/api/speech/health');
  console.log(speech.ok ? '✓' : '✗', 'GET /api/speech/health', speech.status, speech.data?.ok ? 'Azure 已設定' : 'Azure 未設定（語音用瀏覽器備援）');

  if (!ocrReady) {
    console.error('\n✗ OCR 尚未就緒 — 請確認 tesseract.js 已安裝且容器記憶體 ≥ 512MB');
    process.exit(1);
  }

  console.log('\n✓ 後端就緒！請在 Vercel 設定：');
  console.log(`  VITE_SPEECH_API_URL=${base}/api/speech`);
  console.log('  然後重新部署 Vercel 前端。\n');
} catch (err) {
  console.error('\n✗ 無法連接:', err.message);
  console.error('  若使用 Render 免費方案，服務可能正在冷啟動，請等 30–60 秒後重試。\n');
  process.exit(1);
}
