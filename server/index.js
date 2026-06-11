import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApiApp, logReadingOcrStatus, isAzureConfigured } from './createApp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = createApiApp();
const PORT = Number(process.env.PORT || process.env.SPEECH_PORT || 3001);
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : undefined);
const isProd = process.env.NODE_ENV === 'production';

const server = app.listen(PORT, HOST, () => {
  const hostLabel = HOST ?? 'localhost';
  console.log(`[Speech API] http://${hostLabel}:${PORT}`);
  console.log(`[Speech API] Azure ${isAzureConfigured() ? '已設定 ✓' : '未設定 — 請編輯 .env 填入 AZURE_SPEECH_KEY'}`);
  if (isProd) {
    console.log('[Speech API] 生產模式 — 請在 Vercel 設定 VITE_SPEECH_API_URL=<此服務網址>/api/speech');
  }
  logReadingOcrStatus();
});

server.on('error', (err) => {
  if (err?.code === 'EADDRINUSE') {
    console.error(`\x1b[31m[Speech API] 端口 ${PORT} 已被占用 — 請先執行 npm run dev:stop，勿重複開 dev server\x1b[0m`);
    process.exit(1);
  }
  throw err;
});
