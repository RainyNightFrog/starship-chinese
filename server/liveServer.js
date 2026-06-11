/**
 * Go Live 內建伺服器 — 不需 VS Code Live Server 擴充套件
 * 同時提供 dist 靜態頁面 + 語音 API + 閱讀 OCR API
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { synthesizeHandler, isAzureConfigured } from './azureTts.js';
import {
  readingOcrHealthHandler,
  readingOcrSingleHandler,
  readingOcrStitchHandler,
  logReadingOcrStatus,
} from './readingOcr.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const HOST = process.env.LIVE_HOST || '127.0.0.1';
const PORT = Number(process.env.LIVE_PORT || 5501);
const distDir = path.resolve(__dirname, '../dist');

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('[Live] ✗ 找不到 dist/index.html，請先執行 npm run build');
  process.exit(1);
}

app.use(cors({ origin: true }));
app.use(express.json({ limit: '50mb' }));

app.get('/api/speech/health', (_req, res) => {
  res.json({
    ok: isAzureConfigured(),
    provider: 'azure-neural',
    region: process.env.AZURE_SPEECH_REGION || 'eastasia',
  });
});

app.post('/api/speech/synthesize', synthesizeHandler);

app.get('/api/reading/health', readingOcrHealthHandler);
app.post('/api/reading/vision', readingOcrSingleHandler);
app.post('/api/reading/vision-stitch', readingOcrStitchHandler);

app.use(express.static(distDir, {
  setHeaders(res, filePath) {
    if (/index\.html$/.test(filePath) || /\.(js|css)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
    }
  },
}));

app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.sendFile(path.join(distDir, 'index.html'));
});

const server = app.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}`;
  console.log(`[Live] ✓ 網頁 + 語音 + OCR API：${url}`);
  console.log(`[Live] Azure ${isAzureConfigured() ? '已設定 ✓' : '未設定 — 語音將用瀏覽器備援'}`);
  logReadingOcrStatus();
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Live] ✗ 埠口 ${PORT} 已被佔用。請關閉其他終端或改用 LIVE_PORT=5502 npm run live`);
  } else {
    console.error('[Live] ✗', err.message);
  }
  process.exit(1);
});
