/**
 * AiUploadModal — 通用 AI 上載模態（支援多圖累加、批量解析）
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { stopMediaStream } from './aiUploadUtils';
import { buildUploadSummaryName, MAX_UPLOAD_IMAGES } from '../uploadMetaUtils';
import { checkReadingVisionAvailable } from '../readingVisionClient';

const BASE_PARSE_MS = 2800;
const PARSE_MS_PER_IMAGE = 650;
const MAX_PARSE_MS = 14000;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function newUploadId() {
  return `up-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const FILE_INPUT_ACCEPT = 'image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.heic,.heif,application/pdf,.pdf';

function isAllowedUploadFile(file) {
  if (!file) return false;
  if (file.type.startsWith('image/') || file.type === 'application/pdf') return true;
  const name = file.name?.toLowerCase() ?? '';
  return /\.(jpe?g|png|gif|webp|bmp|heic|heif|pdf)$/.test(name);
}

function isImageUploadFile(file) {
  if (file.type.startsWith('image/')) return true;
  const name = file.name?.toLowerCase() ?? '';
  return /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/.test(name);
}

async function fileToUploadItem(file) {
  return {
    fileName: file.name,
    mimeType: file.type || (file.name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
    source: 'file',
    size: file.size,
    previewUrl: isImageUploadFile(file) ? await readFileAsDataUrl(file) : null,
  };
}

export default function AiUploadModal({ open, onClose, onComplete, config }) {
  const [phase, setPhase] = useState('pick');
  const [uploadItems, setUploadItems] = useState([]);
  const [parseStep, setParseStep] = useState(0);
  const [parseProgress, setParseProgress] = useState(0);
  /** 多頁拼讀進度：current / total（如 1/2） */
  const [stitchPage, setStitchPage] = useState({ current: 0, total: 0 });
  /** 解析進行中 — 防止重複點擊 */
  const [isParsingLocked, setIsParsingLocked] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [pastedPassageText, setPastedPassageText] = useState('');
  const [facingMode, setFacingMode] = useState('environment');
  /** 後端 OCR 引擎是否已就緒 */
  const [ocrEngineReady, setOcrEngineReady] = useState(false);
  const [ocrEngineError, setOcrEngineError] = useState(null);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const parseTimerRef = useRef(null);

  const stopCamera = useCallback(() => {
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const resetModal = useCallback(() => {
    stopCamera();
    setPhase('pick');
    setUploadItems([]);
    setParseStep(0);
    setParseProgress(0);
    setStitchPage({ current: 0, total: 0 });
    setIsParsingLocked(false);
    setCameraError(null);
    setParseError(null);
    setOcrEngineReady(false);
    setOcrEngineError(null);
    setPastedPassageText('');
    if (parseTimerRef.current) {
      clearInterval(parseTimerRef.current);
      parseTimerRef.current = null;
    }
  }, [stopCamera]);

  const handleClose = useCallback(() => {
    resetModal();
    onClose?.();
  }, [onClose, resetModal]);

  useEffect(() => {
    if (!open) {
      resetModal();
      return undefined;
    }

    /** 後端 OCR 模式：模態開啟時檢查 Speech API 上的 Tesseract 是否就緒 */
    if (config.useBackendOcr) {
      setOcrEngineError(null);
      checkReadingVisionAvailable(true)
        .then((ok) => {
          setOcrEngineReady(ok);
          if (!ok) {
            setOcrEngineError('後端 OCR 尚未就緒，請確認 npm run dev 已啟動且 tesseract.js 已安裝。');
          }
        })
        .catch(() => {
          setOcrEngineReady(false);
          setOcrEngineError('無法連接後端伺服器（:3001），請執行 npm run dev:stop 後再 npm run dev。');
        });
    }

    return () => {
      stopCamera();
      if (parseTimerRef.current) clearInterval(parseTimerRef.current);
    };
  }, [open, resetModal, stopCamera, config.useBackendOcr]);

  const addUploadItem = useCallback((item) => {
    setUploadItems((prev) => {
      if (prev.length >= MAX_UPLOAD_IMAGES) return prev;
      return [...prev, { id: newUploadId(), ...item }];
    });
  }, []);

  const removeUploadItem = useCallback((id) => {
    setUploadItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const goToGallery = useCallback(() => {
    stopCamera();
    setPhase('gallery');
  }, [stopCamera]);

  const startCamera = useCallback(async (facing = facingMode) => {
    setCameraError(null);
    stopCamera();
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('此瀏覽器不支援相機，請改用「選擇檔案」。');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase('camera');
    } catch (err) {
      setCameraError(err?.message || '無法開啟相機，請檢查權限設定。');
    }
  }, [facingMode, stopCamera]);

  const toggleFacing = useCallback(() => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  }, [facingMode, startCamera]);

  const handleFilesPicked = useCallback(async (fileList) => {
    const files = Array.from(fileList ?? []).filter(isAllowedUploadFile);
    if (!files.length) return;
    stopCamera();

    const items = await Promise.all(files.map((file) => fileToUploadItem(file)));

    setUploadItems((prev) => {
      const space = MAX_UPLOAD_IMAGES - prev.length;
      if (space <= 0) return prev;
      return [
        ...prev,
        ...items.slice(0, space).map((item) => ({ id: newUploadId(), ...item })),
      ];
    });
    setPhase('gallery');
  }, [stopCamera]);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const capturePhoto = useCallback(async () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    if (uploadItems.length >= MAX_UPLOAD_IMAGES) {
      goToGallery();
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    stopCamera();
    const previewUrl = canvas.toDataURL('image/jpeg', 0.92);
    addUploadItem({
      fileName: `${config.capturePrefix}_${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      source: 'camera',
      previewUrl,
      capturedAt: new Date().toISOString(),
    });
    goToGallery();
  }, [addUploadItem, config.capturePrefix, goToGallery, stopCamera, uploadItems.length]);

  const startParsing = useCallback(async () => {
    if (!uploadItems.length && !pastedPassageText.trim()) return;
    if (isParsingLocked) return;

    /** 後端 OCR 模式：解析前確認 API 可用 */
    if (config.useBackendOcr && !pastedPassageText.trim()) {
      setParseError(null);
      const ok = await checkReadingVisionAvailable(true);
      if (!ok) {
        const msg = '後端 OCR 尚未就緒，請確認 npm run dev 已啟動且 tesseract.js 已安裝。';
        setOcrEngineReady(false);
        setOcrEngineError(msg);
        setParseError(msg);
        return;
      }
      setOcrEngineReady(true);
      setOcrEngineError(null);
    }

    const steps = config.parseSteps ?? [];
    setIsParsingLocked(true);
    setPhase('parsing');
    setParseStep(0);
    setParseProgress(0);
    setStitchPage({ current: 0, total: uploadItems.length });
    setParseError(null);

    const finishParsing = (extraMeta = {}) => {
      setIsParsingLocked(false);
      setPhase('done');
        onComplete?.({
        seed: Date.now(),
        fileCount: uploadItems.length || (pastedPassageText.trim() ? 1 : 0),
        fileName: buildUploadSummaryName(uploadItems.length ? uploadItems : [{ fileName: '貼上文章' }]),
        files: uploadItems.length ? uploadItems : [{ fileName: '貼上文章', source: 'paste' }],
        images: uploadItems.length ? uploadItems : [{ fileName: '貼上文章', source: 'paste' }],
        source: uploadItems.length === 1 ? uploadItems[0].source : 'batch',
        mimeType: uploadItems[0]?.mimeType ?? null,
        ...extraMeta,
      });
    };

    if (typeof config.parseUploadItems === 'function') {
      config.parseUploadItems(uploadItems, {
        onProgress: (ratio, stepIndex) => {
          setParseProgress(Math.round(Math.min(1, ratio) * 100));
          if (typeof stepIndex === 'number' && steps.length) {
            setParseStep(Math.min(steps.length - 1, stepIndex));
          } else if (steps.length && ratio > 0) {
            setParseStep(Math.min(steps.length - 1, Math.floor(ratio * steps.length)));
          }
        },
        onStitchPage: (current, total) => {
          setStitchPage({ current, total });
        },
        steps,
        pastedPassageText: config.allowTextPaste ? pastedPassageText : '',
      })
        .then((result) => finishParsing(result ?? {}))
        .catch((err) => {
          setIsParsingLocked(false);
          const msg = err?.code === 'tesseract_module_not_found'
            ? (err.message || '後端找不到 tesseract.js，請在專案根目錄執行 npm install tesseract.js 後重啟 dev server。')
            : err?.code === 'backend_unavailable'
              ? (err.message || '【後端未連接】請執行 npm run dev:stop 後再 npm run dev。')
            : err?.code === 'image_too_blurry'
              ? err.message
              : err?.code === 'vocab_worksheet_misroute'
                ? err.message
              : err?.code === 'payload_too_large'
                ? err.message
              : (err?.message || '解析失敗，請重試或改用較清晰的圖片。');
          setParseError(msg);
          setPhase('gallery');
        });
      return;
    }

    const parseDuration = Math.min(
      MAX_PARSE_MS,
      BASE_PARSE_MS + uploadItems.length * PARSE_MS_PER_IMAGE,
    );
    const start = Date.now();
    parseTimerRef.current = setInterval(() => {
      const ratio = Math.min(1, (Date.now() - start) / parseDuration);
      const stepIndex = steps.length ? Math.min(steps.length - 1, Math.floor(ratio * steps.length)) : 0;
      setParseStep(stepIndex);
      setParseProgress(Math.round(ratio * 100));
      if (ratio >= 1) {
        clearInterval(parseTimerRef.current);
        parseTimerRef.current = null;
        finishParsing();
      }
    }, 120);
  }, [config.parseSteps, config.parseUploadItems, config.allowTextPaste, config.useBackendOcr, config.useOfflineOcr, isParsingLocked, onComplete, uploadItems, pastedPassageText]);

  if (!open) return null;
  const steps = config.parseSteps ?? [];
  const atImageLimit = uploadItems.length >= MAX_UPLOAD_IMAGES;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby={config.titleId}>
      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_INPUT_ACCEPT}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          handleFilesPicked(e.target.files);
          e.target.value = '';
        }}
      />
      <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="關閉" onClick={handleClose} />
      <div className={`relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto xh-scroll xh-scroll--dark bg-slate-900 border-t-4 sm:border-4 ${config.borderClass ?? 'border-amber-500/60'} rounded-t-3xl sm:rounded-2xl shadow-2xl text-slate-100`}>
        <div className="sticky top-0 z-10 flex items-center justify-center px-5 py-4 border-b border-slate-700 bg-slate-900/95 backdrop-blur relative">
          <div className="text-center pr-10">
            <h2 id={config.titleId} className="font-black text-lg text-amber-300">{config.title}</h2>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{config.subtitle}</p>
          </div>
          <button type="button" onClick={handleClose} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 font-bold text-lg" aria-label="關閉視窗">×</button>
        </div>
        <div className="p-5 space-y-4 text-center">
          {phase === 'pick' && (
            <>
              <p className="text-sm text-slate-300 font-bold leading-relaxed">{config.intro}</p>
              {config.useBackendOcr && (
                <p className={`text-xs font-bold rounded-lg px-3 py-2 ${ocrEngineError ? 'text-rose-300 bg-rose-950/40 border border-rose-700' : ocrEngineReady ? 'text-emerald-300 bg-emerald-950/30 border border-emerald-700/50' : 'text-indigo-200 bg-indigo-950/30 border border-indigo-700/50'}`}>
                  {ocrEngineError
                    ? `⚠️ ${ocrEngineError}`
                    : ocrEngineReady
                      ? '✓ 後端 Node.js OCR 已就緒（chi_tra 繁體中文）'
                      : '⏳ 正在連接後端 OCR 引擎…'}
                </p>
              )}
              {config.useOfflineOcr && !config.useBackendOcr && (
                <p className={`text-xs font-bold rounded-lg px-3 py-2 ${ocrEngineError ? 'text-rose-300 bg-rose-950/40 border border-rose-700' : ocrEngineReady ? 'text-emerald-300 bg-emerald-950/30 border border-emerald-700/50' : 'text-indigo-200 bg-indigo-950/30 border border-indigo-700/50'}`}>
                  {ocrEngineError
                    ? `⚠️ ${ocrEngineError}`
                    : ocrEngineReady
                      ? '✓ 本機 OCR 引擎已就緒（chi_tra 繁體中文）'
                      : '⏳ 正在載入本機 OCR 引擎…'}
                </p>
              )}
              <p className="text-xs text-amber-200/80 font-bold">
                可一次選多張（Ctrl+點選 / Shift+連選）· 最多 {MAX_UPLOAD_IMAGES} 張
              </p>
              <button type="button" onClick={openFilePicker} className="w-full flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-emerald-500/50 bg-emerald-950/40 hover:bg-emerald-900/50 hover:border-emerald-400 transition active:scale-[0.98] text-center">
                <span className="text-3xl shrink-0">📁</span>
                <div>
                  <p className="font-black text-emerald-300">選擇多張圖片 / PDF</p>
                  <p className="text-xs text-emerald-200/70 mt-1">Windows：按住 Ctrl 可多選 · 最多 {MAX_UPLOAD_IMAGES} 張</p>
                </div>
              </button>
              <button type="button" onClick={() => startCamera()} className="w-full flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-sky-500/50 bg-sky-950/40 hover:bg-sky-900/50 hover:border-sky-400 transition active:scale-[0.98] text-center">
                <span className="text-3xl shrink-0">📷</span>
                <div>
                  <p className="font-black text-sky-300">即時拍照</p>
                  <p className="text-xs text-sky-200/70 mt-1">可連續拍攝多張</p>
                </div>
              </button>
              {cameraError && <p className="text-xs text-rose-400 font-bold bg-rose-950/40 border border-rose-700 rounded-lg p-3 text-center">⚠️ {cameraError}</p>}
            </>
          )}

          {phase === 'camera' && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border-2 border-sky-600 bg-black aspect-[4/3]">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-amber-400/40 m-4 rounded-lg" />
              </div>
              <p className="text-xs text-slate-400 font-bold">
                已選 {uploadItems.length} / {MAX_UPLOAD_IMAGES} 張
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={toggleFacing} className="flex-1 py-2.5 rounded-xl border border-slate-600 bg-slate-800 text-sm font-bold">🔄 切換鏡頭</button>
                <button type="button" onClick={goToGallery} className="flex-1 py-2.5 rounded-xl border border-slate-600 bg-slate-800 text-sm font-bold">返回清單</button>
              </div>
              <button type="button" onClick={capturePhoto} disabled={atImageLimit} className="w-full py-4 rounded-full font-black text-lg text-white bg-rose-600 hover:bg-rose-500 border-4 border-rose-400 active:scale-95 transition disabled:opacity-50">
                📸 拍攝並加入清單
              </button>
            </div>
          )}

          {phase === 'gallery' && (
            <div className="space-y-4 text-left">
              {config.useBackendOcr && (
                <p className={`text-xs font-bold rounded-lg px-3 py-2 text-center ${ocrEngineError ? 'text-rose-300 bg-rose-950/40 border border-rose-700' : ocrEngineReady ? 'text-emerald-300 bg-emerald-950/30 border border-emerald-700/50' : 'text-indigo-200 bg-indigo-950/30 border border-indigo-700/50'}`}>
                  {ocrEngineError
                    ? `⚠️ ${ocrEngineError}`
                    : ocrEngineReady
                      ? '✓ 後端 Node.js OCR 已就緒（chi_tra 繁體中文）'
                      : '⏳ 正在連接後端 OCR 引擎…'}
                </p>
              )}
              {parseError && (
                <p className="text-sm text-rose-300 font-bold bg-rose-950/50 border-2 border-rose-600 rounded-xl p-4 text-center leading-relaxed">
                  ⚠️ {parseError}
                </p>
              )}
              <div className="text-center">
                <p className="font-black text-amber-200">
                  已選 {uploadItems.length} 張
                  {uploadItems.length > 1 ? (config.galleryMultiLabel ?? ' · 將依序拼讀成一篇完整長文') : ''}
                </p>
                <p className="text-xs text-slate-400 mt-1 font-bold">
                  {uploadItems.length > 1
                    ? (config.galleryMultiSubLabel ?? '請確認縮圖順序（1→2→…），再開始 AI 解析')
                    : (config.gallerySingleSubLabel ?? '可繼續添加，或開始 AI 解析')}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto xh-scroll xh-scroll--dark p-1">
                {uploadItems.map((item, idx) => (
                  <div key={item.id} className="relative rounded-lg border border-slate-600 bg-slate-800 overflow-hidden aspect-square">
                    {item.previewUrl ? (
                      <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center">
                        <span className="text-2xl">📄</span>
                        <span className="text-[9px] text-slate-400 font-bold line-clamp-2 mt-1">{item.fileName}</span>
                      </div>
                    )}
                    <span className="absolute top-1 left-1 text-[10px] font-black bg-black/60 text-amber-200 px-1.5 py-0.5 rounded">
                      {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeUploadItem(item.id)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-600/90 text-white text-xs font-bold hover:bg-rose-500"
                      aria-label={`移除第 ${idx + 1} 張`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {!uploadItems.length && !pastedPassageText.trim() && (
                <p className="text-center text-sm text-slate-500 font-bold py-4">{config.emptyGalleryHint ?? '尚未添加圖片，請選擇檔案、拍照，或貼上文章文字'}</p>
              )}

              {config.allowTextPaste && (
                <div className="space-y-2 rounded-xl border border-indigo-600/60 bg-indigo-950/30 p-3">
                  <p className="text-xs font-black text-indigo-200 text-center">
                    {config.pasteSuggestLabel ?? '✨ 建議：直接貼上文章文字（比拍照 OCR 更準）'}
                  </p>
                  <textarea
                    value={pastedPassageText}
                    onChange={(e) => setPastedPassageText(e.target.value)}
                    placeholder={config.pastePlaceholder ?? '每行一段落…\n\n（多頁可用 --- 分隔）'}
                    rows={5}
                    className="w-full rounded-lg border border-indigo-700 bg-slate-900 text-slate-100 text-sm p-3 font-bold leading-relaxed resize-y min-h-[100px]"
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={atImageLimit}
                  onClick={openFilePicker}
                  className="w-full py-2.5 rounded-xl border border-emerald-600 bg-emerald-950/40 text-emerald-200 font-bold text-sm disabled:opacity-50"
                >
                  ➕ 再加多張圖片 / PDF（可多選）
                </button>
                <button
                  type="button"
                  disabled={atImageLimit}
                  onClick={() => startCamera()}
                  className="w-full py-2.5 rounded-xl border border-sky-600 bg-sky-950/40 text-sky-200 font-bold text-sm disabled:opacity-50"
                >
                  📷 再拍一張
                </button>
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setUploadItems([]); setPhase('pick'); }} className="flex-1 py-3 rounded-xl border border-slate-600 font-bold text-sm">
                  清空重選
                </button>
                <button
                  type="button"
                  disabled={(!uploadItems.length && !pastedPassageText.trim()) || isParsingLocked || (config.useBackendOcr && !pastedPassageText.trim() && Boolean(ocrEngineError))}
                  onClick={startParsing}
                  className="flex-[2] py-3 rounded-xl font-black text-slate-900 bg-amber-400 hover:bg-amber-300 border-2 border-amber-500 disabled:opacity-40 text-sm"
                >
                  {isParsingLocked ? '⏳ 本機辨識中…' : `${config.parseButtonLabel ?? '🧠 開始 AI 解析'}${pastedPassageText.trim() ? '（貼上文字）' : `（${uploadItems.length} 張）`}`}
                </button>
              </div>
            </div>
          )}

          {phase === 'parsing' && (
            <div className="space-y-5 py-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-950 border-2 border-indigo-500 animate-pulse text-3xl">🧠</div>
                <p className="mt-3 font-black text-indigo-200 text-lg">
                  {config.useOfflineOcr || config.useBackendOcr || config.useLocalOllama
                    ? (config.parsingLabel ?? 'AI 正在讀取考卷文字（伺服器安全辨識中）...')
                    : stitchPage.total >= 2
                      ? `正在逐頁辨識考卷（${stitchPage.current || 1}/${stitchPage.total}）…`
                      : (config.parsingLabel ?? 'AI 解析中…')}
                </p>
                <p className="text-xs text-slate-400 mt-1 font-bold">
                  {config.useOfflineOcr || config.useBackendOcr || config.useLocalOllama
                    ? (stitchPage.total >= 2
                      ? (config.parsingSubLabelMulti ?? '伺服器正在逐頁 OCR 辨識，請勿關閉視窗…')
                      : '後端 Tesseract 辨識中，請勿重複點擊…')
                    : stitchPage.total >= 2
                      ? '跨頁文字合併中，請稍候…'
                      : `正在處理 ${uploadItems.length} 張圖片…`}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-400"><span>解析進度</span><span>{parseProgress}%</span></div>
                <div className="h-2.5 rounded-full bg-slate-700 overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-200" style={{ width: `${parseProgress}%` }} /></div>
              </div>
              <div className="min-h-[120px] space-y-2 text-center">
                {steps.slice(0, parseStep + 1).map((step, i) => (
                  <p key={step.text} className={`text-sm font-bold animate-[fadeSlideIn_0.35s_ease-out] ${i === parseStep ? 'text-amber-300' : 'text-slate-500'}`}>{i === parseStep ? '▶ ' : '✓ '}{step.text}</p>
                ))}
              </div>
              {parseError && (
                <p className="text-sm text-rose-300 font-bold bg-rose-950/50 border-2 border-rose-600 rounded-xl p-4 text-center leading-relaxed">
                  ⚠️ {parseError}
                </p>
              )}
            </div>
          )}

          {phase === 'done' && (
            <div className="text-center space-y-4 py-6">
              <span className="text-5xl">✅</span>
              <p className="font-black text-emerald-300 text-lg">{config.doneTitle}</p>
              <p className="text-sm text-amber-200 font-bold">
                {uploadItems.length > 1
                  ? (typeof config.doneMultiSummary === 'function'
                    ? config.doneMultiSummary(uploadItems.length)
                    : `已將 ${uploadItems.length} 張考卷拼讀為 1 篇閱讀文章`)
                  : (typeof config.doneSingleSummary === 'function'
                    ? config.doneSingleSummary(uploadItems.length)
                    : `共解析 ${uploadItems.length} 張圖片`)}
              </p>
              <p className="text-sm text-slate-400">{config.doneHint}</p>
              <button type="button" onClick={handleClose} className="w-full py-3 rounded-xl font-black bg-amber-500 text-slate-900 hover:bg-amber-400">完成</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
