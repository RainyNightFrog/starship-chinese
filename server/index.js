import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
const PORT = process.env.SPEECH_PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '15mb' }));

app.get('/api/speech/health', (_req, res) => {
  res.json({
    ok: isAzureConfigured(),
    provider: 'azure-neural',
    region: process.env.AZURE_SPEECH_REGION || 'eastasia',
  });
});

app.post('/api/speech/synthesize', synthesizeHandler);

/** 閱讀 OCR — 後端 Node.js Tesseract（已移除 Ollama） */
app.get('/api/reading/health', readingOcrHealthHandler);
app.post('/api/reading/vision', readingOcrSingleHandler);
app.post('/api/reading/vision-stitch', readingOcrStitchHandler);

const server = app.listen(PORT, () => {
  console.log(`[Speech API] http://localhost:${PORT}`);
  console.log(`[Speech API] Azure ${isAzureConfigured() ? '已設定 ✓' : '未設定 — 請編輯 .env 填入 AZURE_SPEECH_KEY'}`);
  logReadingOcrStatus();
});

server.on('error', (err) => {
  if (err?.code === 'EADDRINUSE') {
    console.error(`\x1b[31m[Speech API] 端口 ${PORT} 已被占用 — 請先執行 npm run dev:stop，勿重複開 dev server\x1b[0m`);
    process.exit(1);
  }
  throw err;
});
