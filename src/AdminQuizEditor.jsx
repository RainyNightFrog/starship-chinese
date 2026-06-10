/**
 * AdminQuizEditor — 家長／管理員題庫自訂編輯器（獨立全螢幕頁）
 * 路由：/admin-editor
 *
 * 功能：
 *  · 樣版池管理（主旨／修辭／細節等分類列表）
 *  · 動態表單新增／編輯題型（questionText + A–D + correctAnswerIndex）
 *  · 匯入現有 mockDatabase.js 代碼字串（安全解析 + try-catch）
 *  · OCR 去噪規則即時預覽（advancedSanitizeOcrText）
 *  · 一鍵匯出 ADVANCED_QUESTION_POOL 至剪貼簿
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ADVANCED_QUESTION_POOL } from './mockDatabase.js';
import {
  referenceTemplatesToMockPool,
  SSPA_REFERENCE_TEMPLATES,
} from './sspaReferenceTemplatePool.js';
import { advancedSanitizeOcrText } from './readingAdvancedTextSanitizer.js';
import {
  buildSeedFromEngineTemplates,
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  copyTextToClipboard,
  createEmptyTemplate,
  generatePoolExportCode,
  loadTemplatesFromStorage,
  normalizeTemplate,
  parseImportedPoolCode,
  resolveInitialTemplates,
  saveTemplatesToStorage,
  templatesFromMockPool,
} from './adminQuizEditorUtils.js';

const SAMPLE_OCR = `一、閱讀理解 (30%)
閱讀下面的文字,然後回答問題。星期天是爺爺的生日。我們悄悄開了會,商量如何給爺爺一個驚喜。
媽媽說會為爺爺準備一個生日蛋糕,上面會有他愛吃的草莓。
1.根據文章內容,回答第2-9題。(48%)
2.和爺爺愛吃甚麼?爺爺愛吃草莓。
A.收到望遠鏡
B.閱讀下面的文字,然後回答問題。`;

/** 初始化題庫：mockDatabase（標準源）→ localStorage → 引擎內建樣版 */
function loadInitialTemplates() {
  const fromMock = templatesFromMockPool(ADVANCED_QUESTION_POOL);
  if (fromMock?.length) return fromMock;

  const fromStorage = loadTemplatesFromStorage();
  if (fromStorage?.length) return fromStorage;

  return resolveInitialTemplates([]);
}

function Toast({ message, tone = 'success', onClose }) {
  if (!message) return null;
  const toneClass = tone === 'error'
    ? 'border-rose-400 bg-rose-950/95 text-rose-50'
    : 'border-emerald-400 bg-emerald-950/95 text-emerald-50';
  return (
    <div
      role="status"
      className={`fixed top-6 left-1/2 z-[100] -translate-x-1/2 max-w-xl w-[92%]
        rounded-2xl border-2 ${toneClass}
        px-6 py-4 shadow-2xl animate-[fadeSlideIn_0.35s_ease-out]`}
    >
      <p className="text-sm font-bold leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="mt-2 text-xs opacity-70 hover:opacity-100 underline"
      >
        關閉
      </button>
    </div>
  );
}

/** 學生端預覽 — 嚴格以 questionText + options 渲染四個按鈕 */
function TemplateLivePreview({ template }) {
  const t = normalizeTemplate(template);
  if (!t.questionText) return null;

  return (
    <div className="rounded-2xl border border-sky-700/50 bg-sky-950/25 p-5 space-y-4">
      <h3 className="text-sm font-black text-sky-300">👁 學生端預覽（questionText + options）</h3>
      <p className="text-base font-bold leading-relaxed text-stone-100 whitespace-pre-wrap">
        {t.questionText}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {t.options.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          const isCorrect = idx === t.correctAnswerIndex;
          return (
            <button
              key={letter}
              type="button"
              disabled
              className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-bold leading-relaxed
                ${isCorrect
                  ? 'border-emerald-500/70 bg-emerald-950/40 text-emerald-100'
                  : 'border-stone-600 bg-stone-900/60 text-stone-200'
                }`}
            >
              <span className="text-xs font-mono opacity-60 block mb-1">{letter}</span>
              {opt || `（選項 ${letter} 空白）`}
            </button>
          );
        })}
      </div>
      {t.hint && (
        <p className="text-xs text-amber-200/80 font-bold">💡 {t.hint}</p>
      )}
    </div>
  );
}

/** 單一樣版編輯表單 */
function TemplateEditorForm({ template, onChange, onDelete, onDuplicate }) {
  const t = normalizeTemplate(template);

  const setField = (key, value) => onChange({ ...t, [key]: value });

  const setOption = (idx, value) => {
    const options = [...t.options];
    options[idx] = value;
    onChange({ ...t, options });
  };

  return (
    <div className="rounded-2xl border border-amber-700/40 bg-stone-900/80 p-6 space-y-5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-black text-amber-200">✏️ 編輯題型樣版</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDuplicate}
            className="rounded-lg border border-stone-600 px-3 py-1.5 text-xs font-bold text-stone-300 hover:bg-stone-800"
          >
            複製
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-rose-700/60 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-950/50"
          >
            刪除
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block space-y-1">
          <span className="text-xs font-bold text-stone-400">樣版 ID（英文底線）</span>
          <input
            value={t.id}
            onChange={(e) => setField('id', e.target.value)}
            className="w-full rounded-xl border border-stone-600 bg-stone-950 px-4 py-3 text-sm text-stone-100 focus:border-amber-500 focus:outline-none"
            placeholder="main_custom_01"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold text-stone-400">題型分類</span>
          <select
            value={t.category}
            onChange={(e) => setField('category', e.target.value)}
            className="w-full rounded-xl border border-stone-600 bg-stone-950 px-4 py-3 text-sm text-stone-100 focus:border-amber-500 focus:outline-none"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-bold text-stone-400">問題描述（questionText）</span>
        <textarea
          value={t.questionText}
          onChange={(e) => setField('questionText', e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-stone-600 bg-stone-950 px-4 py-3 text-base leading-relaxed text-stone-100 focus:border-amber-500 focus:outline-none resize-y min-h-[88px]"
          placeholder="例如：作者撰寫此文的主要意圖是？"
        />
      </label>

      <div className="grid grid-cols-1 gap-3">
        {['A', 'B', 'C', 'D'].map((letter, idx) => (
          <label key={letter} className="block space-y-1">
            <span className="text-xs font-bold text-stone-400">選項 {letter}</span>
            <input
              value={t.options[idx] ?? ''}
              onChange={(e) => setOption(idx, e.target.value)}
              className="w-full rounded-xl border border-stone-600 bg-stone-950 px-4 py-3 text-sm text-stone-100 focus:border-amber-500 focus:outline-none"
              placeholder={`選項 ${letter} 內容`}
            />
          </label>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block space-y-1">
          <span className="text-xs font-bold text-stone-400">正確答案索引（correctAnswerIndex）</span>
          <select
            value={t.correctAnswerIndex}
            onChange={(e) => setField('correctAnswerIndex', Number(e.target.value))}
            className="w-full rounded-xl border border-stone-600 bg-stone-950 px-4 py-3 text-sm text-stone-100 focus:border-amber-500 focus:outline-none"
          >
            <option value={0}>0 — 選項 A</option>
            <option value={1}>1 — 選項 B</option>
            <option value={2}>2 — 選項 C</option>
            <option value={3}>3 — 選項 D</option>
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold text-stone-400">提示（hint，選填）</span>
          <input
            value={t.hint}
            onChange={(e) => setField('hint', e.target.value)}
            className="w-full rounded-xl border border-stone-600 bg-stone-950 px-4 py-3 text-sm text-stone-100 focus:border-amber-500 focus:outline-none"
            placeholder="答題提示"
          />
        </label>
      </div>
    </div>
  );
}

export default function AdminQuizEditor() {
  const [templates, setTemplates] = useState(() => loadInitialTemplates());
  const [selectedId, setSelectedId] = useState(() => templates[0]?.id ?? null);
  const [ocrDirty, setOcrDirty] = useState(SAMPLE_OCR);
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState('');
  const [toast, setToast] = useState('');
  const [toastTone, setToastTone] = useState('success');
  const [exportPreview, setExportPreview] = useState(false);

  const selected = useMemo(
    () => templates.find((t) => t.id === selectedId) ?? templates[0] ?? null,
    [templates, selectedId],
  );

  const sanitizerResult = useMemo(() => advancedSanitizeOcrText(ocrDirty), [ocrDirty]);

  useEffect(() => {
    saveTemplatesToStorage(templates);
  }, [templates]);

  const showToast = (message, tone = 'success') => {
    setToast(message);
    setToastTone(tone);
  };

  const grouped = useMemo(() => {
    const map = {};
    templates.forEach((t) => {
      const key = t.category;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [templates]);

  const updateSelected = useCallback((next) => {
    const normalized = normalizeTemplate(next);
    setTemplates((prev) => prev.map((t) => (t.id === selectedId ? normalized : t)));
    if (normalized.id !== selectedId) setSelectedId(normalized.id);
  }, [selectedId]);

  const handleAdd = () => {
    const item = createEmptyTemplate(templates.length);
    setTemplates((prev) => [...prev, item]);
    setSelectedId(item.id);
  };

  const handleDelete = () => {
    if (!selectedId) return;
    if (!window.confirm('確定刪除此題型樣版？')) return;
    setTemplates((prev) => {
      const next = prev.filter((t) => t.id !== selectedId);
      setSelectedId(next[0]?.id ?? null);
      return next;
    });
  };

  const handleDuplicate = () => {
    if (!selected) return;
    const copy = normalizeTemplate({
      ...selected,
      id: `${selected.id}_copy_${Date.now().toString(36).slice(-4)}`,
      source: 'custom',
    });
    setTemplates((prev) => [...prev, copy]);
    setSelectedId(copy.id);
  };

  const handleResetSeed = () => {
    if (!window.confirm('將還原為預設題庫（寫作手法 + 呈分試參考樣版），目前修改會被覆蓋。確定？')) return;
    const fromMock = templatesFromMockPool(ADVANCED_QUESTION_POOL);
    const seed = fromMock?.length
      ? fromMock
      : [...buildSeedFromEngineTemplates(), ...referenceTemplatesToMockPool()];
    setTemplates(seed);
    setSelectedId(seed[0]?.id ?? null);
    setImportError('');
    showToast(`已還原預設題庫（${seed.length} 道樣版）。`);
  };

  const handleImportReferencePack = () => {
    const refs = referenceTemplatesToMockPool();
    const existing = new Set(templates.map((t) => t.id));
    const toAdd = refs.filter((r) => !existing.has(r.id));
    if (!toAdd.length) {
      showToast('參考樣版已全部存在於題庫中。');
      return;
    }
    const merged = [...templates, ...toAdd];
    setTemplates(merged);
    setSelectedId(toAdd[0]?.id ?? selectedId);
    showToast(`已匯入 ${toAdd.length} 道呈分試參考樣版（標點／語文／閱讀）。`);
  };

  const handleLoadFromMockDatabase = () => {
    const fromMock = templatesFromMockPool(ADVANCED_QUESTION_POOL);
    if (!fromMock?.length) {
      showToast('mockDatabase.js 的 ADVANCED_QUESTION_POOL 目前為空，請先匯出貼上或手動編輯。', 'error');
      return;
    }
    setTemplates(fromMock);
    setSelectedId(fromMock[0]?.id ?? null);
    showToast(`已從 mockDatabase 載入 ${fromMock.length} 道題型。`);
  };

  /** 匯入貼上的代碼字串（含 try-catch 保護） */
  const handleImportCode = () => {
    setImportError('');
    const result = parseImportedPoolCode(importCode);
    if (!result.ok) {
      setImportError(result.error ?? '解析失敗');
      showToast(result.error ?? '匯入失敗', 'error');
      return;
    }
    setTemplates(result.items);
    setSelectedId(result.items[0]?.id ?? null);
    setImportError('');
    showToast(`成功匯入 ${result.items.length} 道題型！已自動儲存至瀏覽器。`);
  };

  const handleExport = async () => {
    const code = generatePoolExportCode(templates);
    const ok = await copyTextToClipboard(code);
    if (ok) {
      showToast('代碼已複製！請直接回到 Cursor 的 mockDatabase.js 全選貼上覆蓋即可。');
      setExportPreview(true);
    } else {
      showToast('複製失敗，請手動選取下方預覽區代碼複製。', 'error');
      setExportPreview(true);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <Toast message={toast} tone={toastTone} onClose={() => setToast('')} />

      {/* 頂部工具列 */}
      <header className="sticky top-0 z-50 border-b border-amber-800/40 bg-stone-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-2xl font-black text-amber-300 tracking-tight">
              星航中文 · 題庫自訂編輯器
            </h1>
            <p className="text-sm text-stone-400 mt-0.5">
              Admin Quiz Tool · mockDatabase 已連線 · 共 {templates.length} 道樣版
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleLoadFromMockDatabase}
              className="rounded-xl border border-stone-600 px-4 py-2.5 text-sm font-bold text-stone-300 hover:bg-stone-800"
            >
              📂 讀取 mockDatabase
            </button>
            <button
              type="button"
              onClick={handleImportReferencePack}
              className="rounded-xl border border-sky-600/60 px-4 py-2.5 text-sm font-bold text-sky-200 hover:bg-sky-950/50"
              title={`匯入 ${SSPA_REFERENCE_TEMPLATES.length} 道呈分試參考樣版`}
            >
              📎 匯入參考樣版
            </button>
            <button
              type="button"
              onClick={handleResetSeed}
              className="rounded-xl border border-stone-600 px-4 py-2.5 text-sm font-bold text-stone-300 hover:bg-stone-800"
            >
              ↺ 還原內建樣版
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-2.5 text-sm font-black text-stone-950 shadow-lg hover:from-amber-400 hover:to-orange-500 active:scale-[0.98] transition-transform"
            >
              📥 產生並複製最新題庫代碼
            </button>
            <a
              href="/"
              className="rounded-xl border border-stone-600 px-4 py-2.5 text-sm font-bold text-stone-400 hover:text-amber-200"
            >
              ← 返回主應用
            </a>
          </div>
        </div>

        {/* 匯入現有代碼字串 */}
        <div className="mx-auto max-w-[1600px] px-6 pb-4">
          <div className="rounded-2xl border border-sky-800/40 bg-sky-950/20 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-black text-sky-300">📥 匯入現有代碼字串（Import Fallback）</h2>
              <button
                type="button"
                onClick={handleImportCode}
                className="rounded-lg bg-sky-700 px-4 py-2 text-xs font-black text-white hover:bg-sky-600"
              >
                解析並載入題庫
              </button>
            </div>
            <textarea
              value={importCode}
              onChange={(e) => {
                setImportCode(e.target.value);
                if (importError) setImportError('');
              }}
              rows={5}
              className="w-full rounded-xl border border-stone-600 bg-stone-950 px-4 py-3 text-xs font-mono text-stone-300 leading-relaxed focus:border-sky-500 focus:outline-none resize-y"
              placeholder={'貼上 mockDatabase.js 的 export const ADVANCED_QUESTION_POOL = [ ... ]; 或純 JSON 陣列'}
            />
            {importError ? (
              <p className="text-xs font-bold text-rose-400">⚠️ {importError}</p>
            ) : (
              <p className="text-xs text-stone-500">
                支援格式：① JSON 陣列 ② export const ADVANCED_QUESTION_POOL = [...] ③ 純 [...] 陣列（含 try-catch 防崩潰）
              </p>
            )}
          </div>
        </div>
      </header>

      {/* 雙欄主體 */}
      <main className="mx-auto grid max-w-[1600px] grid-cols-1 gap-8 px-6 py-8 xl:grid-cols-[1.15fr_0.85fr]">
        {/* 左欄：樣版池 + 編輯表單 */}
        <section className="space-y-6 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black text-amber-200">📚 樣版池管理區</h2>
            <button
              type="button"
              onClick={handleAdd}
              className="rounded-xl border-2 border-dashed border-amber-600/60 px-5 py-2.5 text-sm font-black text-amber-300 hover:bg-amber-950/40"
            >
              ➕ 新增隨機題型
            </button>
          </div>

          <div className="rounded-2xl border border-stone-700/60 bg-stone-900/50 p-4 max-h-[42vh] overflow-y-auto xh-scroll--warm space-y-5">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <p className="text-xs font-black uppercase tracking-wider text-amber-500/90 mb-2 sticky top-0 bg-stone-900/95 py-1">
                  {CATEGORY_LABELS[cat] ?? cat}
                  <span className="text-stone-500 font-normal ml-2">({items.length})</span>
                </p>
                <ul className="space-y-1.5">
                  {items.map((t) => {
                    const active = t.id === selectedId;
                    return (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(t.id)}
                          className={`w-full text-left rounded-xl px-4 py-3 text-sm transition-colors border
                            ${active
                              ? 'border-amber-500 bg-amber-950/50 text-amber-100'
                              : 'border-transparent bg-stone-800/40 text-stone-300 hover:bg-stone-800 hover:border-stone-600'
                            }`}
                        >
                          <span className="font-mono text-xs text-stone-500 block mb-0.5">{t.id}</span>
                          <span className="line-clamp-2 leading-snug whitespace-pre-wrap">
                            {normalizeTemplate(t).questionText || '（尚未填寫題幹）'}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {selected ? (
            <>
              <TemplateLivePreview template={selected} />
              <TemplateEditorForm
                template={selected}
                onChange={updateSelected}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            </>
          ) : (
            <p className="text-stone-500 text-center py-12">請從左側列表選取或新增題型</p>
          )}
        </section>

        {/* 右欄：OCR 測試 + 匯出預覽 */}
        <section className="space-y-6 min-w-0">
          <h2 className="text-xl font-black text-amber-200">🧪 文本去噪規則測試區</h2>

          <div className="rounded-2xl border border-stone-700/60 bg-stone-900/50 p-5 space-y-4">
            <label className="block space-y-2">
              <span className="text-xs font-bold text-stone-400">
                貼上 Tesseract.js 髒 OCR 全文（即時過濾）
              </span>
              <textarea
                value={ocrDirty}
                onChange={(e) => setOcrDirty(e.target.value)}
                rows={10}
                className="w-full rounded-xl border border-stone-600 bg-stone-950 px-4 py-3 text-sm leading-relaxed text-stone-200 font-mono focus:border-sky-500 focus:outline-none resize-y min-h-[200px]"
                placeholder="貼上考卷 OCR 結果…"
              />
            </label>

            <div className="flex flex-wrap gap-3 text-xs text-stone-400">
              <span>原始行數：{sanitizerResult.rawLineCount}</span>
              <span>剔除：{sanitizerResult.droppedCount} 行</span>
              <span>試題區：{sanitizerResult.hitWorksheet ? '已截斷' : '未觸發'}</span>
              <span className="text-emerald-400 font-bold">
                乾淨正文：{sanitizerResult.cleanArticleLines.length} 行
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-800/40 bg-emerald-950/20 p-5">
            <h3 className="text-sm font-black text-emerald-300 mb-3">✅ cleanArticleLines 預覽</h3>
            {sanitizerResult.cleanArticleLines.length === 0 ? (
              <p className="text-sm text-stone-500 italic">（無通過過濾的正文行）</p>
            ) : (
              <ol className="space-y-3 text-sm leading-relaxed text-emerald-50/90 list-decimal list-inside">
                {sanitizerResult.cleanArticleLines.map((line, i) => (
                  <li key={i} className="pl-1">
                    <span className="text-emerald-600/80 font-mono text-xs mr-2">第{i + 1}行</span>
                    {line}
                  </li>
                ))}
              </ol>
            )}
          </div>

          {exportPreview && (
            <div className="rounded-2xl border border-amber-700/40 bg-stone-900/80 p-5">
              <h3 className="text-sm font-black text-amber-300 mb-2">📋 匯出代碼預覽（已複製）</h3>
              <pre className="max-h-[280px] overflow-auto rounded-xl bg-stone-950 p-4 text-xs text-stone-300 font-mono leading-relaxed xh-scroll--warm whitespace-pre-wrap">
                {generatePoolExportCode(templates)}
              </pre>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
