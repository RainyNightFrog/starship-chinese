/**
 * 星航中文 API — Express 應用（語音 TTS + 閱讀 OCR）
 * 供本機 dev (server/index.js) 與雲端部署共用
 */
import express from 'express';
import cors from 'cors';
import { synthesizeHandler, isAzureConfigured } from './azureTts.js';
import {
  readingOcrHealthHandler,
  readingOcrSingleHandler,
  readingOcrStitchHandler,
  logReadingOcrStatus,
} from './readingOcr.js';
import { readingVocabOcrHandler } from './vocabOcr.js';

function buildCorsOptions() {
  const allowed = process.env.ALLOWED_ORIGINS
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!allowed?.length) {
    return { origin: true };
  }

  return {
    origin(origin, callback) {
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked: ${origin}`));
    },
  };
}

export function createApiApp() {
  const app = express();

  app.use(cors(buildCorsOptions()));
  app.use(express.json({ limit: '50mb' }));

  app.get('/', (_req, res) => {
    res.json({
      ok: true,
      service: 'starship-chinese-api',
      endpoints: [
        'GET /api/speech/health',
        'POST /api/speech/synthesize',
        'GET /api/reading/health',
        'POST /api/reading/vision',
        'POST /api/reading/vision-stitch',
        'POST /api/reading/vocab-vision',
      ],
    });
  });

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
  app.post('/api/reading/vocab-vision', readingVocabOcrHandler);

  return app;
}

export { logReadingOcrStatus, isAzureConfigured };
