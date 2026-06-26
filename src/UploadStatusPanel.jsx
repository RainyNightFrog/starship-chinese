import React from 'react';
import { BilingualLabel } from './BilingualLabel';

/** 家長後台 — 檢視已上載圖片與 AI 生成內容是否就緒 */
export default function UploadStatusPanel({
  parentConfig,
  onRemoveImage,
  onClearAllUploads,
}) {
  const ac = parentConfig.assignedContent ?? {};
  const images = ac.uploadImages ?? [];
  const imageCount = ac.uploadImageCount ?? images.length;

  const hasVocab = Boolean(ac.vocabUploadSession);
  const hasExam = Boolean(ac.aiUploadSession);
  const hasReading = Boolean(ac.readingUploadSession);

  const dictCount = ac.vocabByTask?.dictation?.length ?? 0;
  const preCount = ac.vocabByTask?.prestudy?.length ?? 0;
  const quizCount = ac.quizBank?.length ?? 0;
  const sspaCount = ac.sspaBank?.length ?? 0;
  const sentenceCount = ac.sentenceBank?.length ?? (ac.sentence?.isAiGenerated ? 1 : 0);
  const readingCount = ac.readingBank?.length ?? 0;

  const hasAnyUpload = hasVocab || hasExam || hasReading;
  const hasGenerated = (hasVocab && (dictCount > 0 || preCount > 0))
    || (hasExam && (quizCount > 0 || sspaCount > 0 || sentenceCount > 0))
    || (hasReading && readingCount > 0);

  if (!hasAnyUpload && !images.length) {
    return (
      <div className="p-5 rounded-xl bg-slate-800/80 border border-dashed border-slate-600 text-center space-y-2">
        <p className="text-slate-300 text-base font-bold">尚未上載圖片</p>
        <p className="text-slate-500 text-sm leading-relaxed">完成上載並按「開始 AI 解析」後，這裡會顯示縮圖與生成題數</p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl bg-slate-800 border border-slate-600 space-y-4 text-left">
      <BilingualLabel
        zh="📂 上載紀錄"
        en="Upload Record"
        size="lg"
        hideEnOnMobile
        className="border-b border-slate-700 pb-3 block"
      />

      <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
        <span className={`px-3 py-1.5 rounded-full ${hasGenerated ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700' : 'bg-amber-900/40 text-amber-300 border border-amber-700'}`}>
          {hasGenerated ? '✅ 已生成學習內容' : '⏳ 等待解析'}
        </span>
        {imageCount > 0 && (
          <span className="px-3 py-1.5 rounded-full bg-slate-700 text-slate-200">
            {imageCount} 張圖
          </span>
        )}
      </div>

      {parentConfig.uploadLabel && (
        <p className="text-sm text-slate-400 font-bold truncate" title={parentConfig.uploadLabel}>
          方案：{parentConfig.uploadLabel}
        </p>
      )}

      {images.length > 0 && (
        <div>
          <p className="text-sm text-slate-400 font-bold mb-2">已存圖片 · 點 × 可移除</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto xh-scroll xh-scroll--dark">
            {images.map((img, idx) => (
              <div
                key={img.id ?? idx}
                className="relative aspect-square rounded-lg border border-slate-600 bg-slate-900 overflow-hidden group"
                title={img.fileName}
              >
                {img.previewUrl ? (
                  <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">📄</div>
                )}
                <span className="absolute bottom-0 inset-x-0 bg-black/70 text-xs text-center text-slate-300 py-0.5">
                  {idx + 1}
                </span>
                {onRemoveImage && img.id && (
                  <button
                    type="button"
                    onClick={() => onRemoveImage(img.id)}
                    className="absolute top-1 right-1 w-7 h-7 rounded-full bg-rose-600/95 text-white text-base font-bold leading-none shadow hover:bg-rose-500 active:scale-95"
                    aria-label={`移除第 ${idx + 1} 張圖片`}
                    title="移除此圖"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 text-sm font-bold">
        {hasVocab && (
          <p className="rounded-xl bg-emerald-950/40 border border-emerald-800 px-3 py-2.5 text-emerald-200 leading-relaxed">
            📷 詞表 → 默書 {dictCount} 詞 · 預習 {preCount} 詞
            {dictCount + preCount > 0 ? ' ✅' : ' ⚠️ 尚未提取詞彙'}
          </p>
        )}
        {hasExam && (
          <p className="rounded-xl bg-rose-950/40 border border-rose-800 px-3 py-2.5 text-rose-200 leading-relaxed">
            📋 試卷 → 測驗 {quizCount} · 呈分試 {sspaCount} · 句子 {sentenceCount}
            {quizCount + sspaCount + sentenceCount > 0 ? ' ✅' : ' ⚠️ 尚未生成'}
          </p>
        )}
        {hasReading && (
          <p className="rounded-xl bg-indigo-950/40 border border-indigo-800 px-3 py-2.5 text-indigo-200 leading-relaxed">
            📖 閱讀 → 理解題 {readingCount} 題
            {readingCount > 0 ? ' ✅' : ' ⚠️ 尚未生成'}
          </p>
        )}
      </div>

      {onClearAllUploads && images.length > 0 && (
        <button
          type="button"
          onClick={onClearAllUploads}
          className="w-full py-3 rounded-xl border-2 border-rose-700/80 bg-rose-950/50 text-rose-200 text-sm font-black hover:bg-rose-900/60 active:scale-[0.99] transition"
        >
          🗑️ 清除全部上載
        </button>
      )}
    </div>
  );
}
