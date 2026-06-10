import React, { useRef, useState, useCallback } from 'react';

const OCR_EXTRACTED_VOCAB = [
  {
    tc: '恍然大悟',
    sc: '恍然大悟',
    py: 'huǎng rán dà wù',
    jp: 'fong2 jin4 daai6 ng6',
    en: 'Suddenly see the light',
    radical: '忄',
    body: '𡿺',
  },
  {
    tc: '並肩作戰',
    sc: '并肩作战',
    py: 'bìng jiān zuò zhàn',
    jp: 'bing3 gin1 zok3 zin3',
    en: 'Fight shoulder to shoulder',
    radical: '立',
    body: '並',
  },
];

const STUDENT_THEMES = {
  local: {
    zoneBorder: 'border-blue-300 hover:border-blue-400',
    zoneBg: 'bg-blue-50/40 hover:bg-blue-50/70',
    zoneActive: 'border-blue-500 bg-blue-50',
    iconBg: 'bg-blue-100 text-blue-600',
    btn: 'bg-blue-500 hover:bg-blue-600 border-blue-600',
    accentText: 'text-blue-700',
    spinner: 'border-blue-500',
    success: 'bg-green-100 border-green-400 text-green-800',
  },
  sen: {
    zoneBorder: 'border-amber-300 hover:border-amber-400',
    zoneBg: 'bg-amber-50/40 hover:bg-amber-50/70',
    zoneActive: 'border-amber-500 bg-amber-50',
    iconBg: 'bg-amber-100 text-amber-700',
    btn: 'bg-amber-500 hover:bg-amber-600 border-amber-600',
    accentText: 'text-amber-800',
    spinner: 'border-amber-500',
    success: 'bg-green-100 border-green-400 text-green-800',
  },
  mainland: {
    zoneBorder: 'border-red-300 hover:border-red-400',
    zoneBg: 'bg-red-50/40 hover:bg-red-50/70',
    zoneActive: 'border-red-500 bg-red-50',
    iconBg: 'bg-red-100 text-red-600',
    btn: 'bg-red-500 hover:bg-red-600 border-red-600',
    accentText: 'text-red-800',
    spinner: 'border-red-500',
    success: 'bg-green-100 border-green-400 text-green-800',
  },
  ncs: {
    zoneBorder: 'border-purple-300 hover:border-purple-400',
    zoneBg: 'bg-purple-50/40 hover:bg-purple-50/70',
    zoneActive: 'border-purple-500 bg-purple-50',
    iconBg: 'bg-purple-100 text-purple-600',
    btn: 'bg-purple-500 hover:bg-purple-600 border-purple-600',
    accentText: 'text-purple-800',
    spinner: 'border-purple-500',
    success: 'bg-green-100 border-green-400 text-green-800',
  },
};

export default function MaterialUploader({ studentType = 'sen', onVocabExtracted }) {
  const fileInputRef = useRef(null);
  const [phase, setPhase] = useState('idle'); // idle | loading | success
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [extractedWords, setExtractedWords] = useState([]);

  const isSEN = studentType === 'sen';
  const isNCS = studentType === 'ncs';
  const theme = STUDENT_THEMES[studentType] ?? STUDENT_THEMES.sen;

  const processFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;

    setFileName(file.name);
    setPhase('loading');
    setExtractedWords([]);

    setTimeout(() => {
      setPhase('success');
      setExtractedWords(OCR_EXTRACTED_VOCAB.map((v) => v.tc));
      onVocabExtracted?.(OCR_EXTRACTED_VOCAB);
    }, 2000);
  }, [onVocabExtracted]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleReset = () => {
    setPhase('idle');
    setFileName(null);
    setExtractedWords([]);
  };

  return (
    <div className={`space-y-6 ${isSEN ? 'space-y-8' : ''}`}>
      <div className="border-b-2 pb-4 border-amber-200">
        <h2 className={`font-black text-amber-950 ${isSEN ? 'text-2xl' : 'text-xl'}`}>
          📷 校本材料上載
        </h2>
        <p className={`mt-1 text-amber-700 font-bold ${isSEN ? 'text-base' : 'text-sm'}`}>
          上載試卷或默書單，AI 自動提取詞彙並生成練習
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
        onClick={() => phase === 'idle' && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative flex items-center gap-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer
          ${isSEN ? 'p-10 gap-8' : 'p-8 gap-6'}
          ${phase === 'loading' ? 'pointer-events-none opacity-90' : ''}
          ${isDragging ? theme.zoneActive : `${theme.zoneBorder} ${theme.zoneBg}`}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Icon */}
        <div className={`shrink-0 rounded-2xl flex items-center justify-center ${theme.iconBg} ${isSEN ? 'w-20 h-20 text-4xl' : 'w-16 h-16 text-3xl'}`}>
          📄
        </div>

        {/* Copy */}
        <div className="flex-1 min-w-0">
          <p className={`font-black text-slate-800 leading-snug ${isSEN ? 'text-xl' : 'text-base'}`}>
            上載學校試卷、默書單或範文照片，即時生成針對性練習
          </p>
          <p className={`mt-2 opacity-60 font-bold ${isSEN ? 'text-base' : 'text-sm'}`}>
            支援 JPG、PNG 格式 · 點擊或拖拽上載
          </p>
          {fileName && phase !== 'idle' && (
            <p className={`mt-2 truncate font-mono ${theme.accentText} ${isSEN ? 'text-sm' : 'text-xs'}`}>
              📎 {fileName}
            </p>
          )}
        </div>

        {/* Action button */}
        {phase === 'idle' && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className={`
              shrink-0 text-white font-black rounded-xl border-2 transition transform active:scale-95
              ${theme.btn} ${isSEN ? 'px-8 py-4 text-lg' : 'px-5 py-2.5 text-sm'}
            `}
          >
            選擇圖片
          </button>
        )}
      </div>

      {/* NCS English guidance */}
      {isNCS && (
        <p className="text-sm text-purple-700 font-bold text-center -mt-2">
          Upload school exam/dictation syllabus to generate tailored exercises.
        </p>
      )}

      {/* Loading state */}
      {phase === 'loading' && (
        <div className={`flex items-center gap-4 p-5 rounded-xl border-2 bg-white ${theme.zoneBorder}`}>
          <div className={`w-8 h-8 rounded-full border-4 border-t-transparent animate-spin ${theme.spinner}`} />
          <p className={`font-black ${theme.accentText} ${isSEN ? 'text-lg' : 'text-base'}`}>
            AI 正在分析校本詞彙與扣分陷阱...
          </p>
        </div>
      )}

      {/* Success state */}
      {phase === 'success' && (
        <div className={`p-5 rounded-xl border-2 space-y-3 ${theme.success}`}>
          <p className={`font-black flex items-center gap-2 ${isSEN ? 'text-lg' : 'text-base'}`}>
            <span>✅</span> OCR 分析完成！已成功提取 {extractedWords.length} 個校本詞彙，已同步至詞彙庫。
          </p>
          <div className={`flex flex-wrap ${isSEN ? 'gap-3' : 'gap-2'}`}>
            {extractedWords.map((word) => (
              <span
                key={word}
                className={`bg-white/80 rounded-lg font-black text-amber-950 border border-green-300 ${isSEN ? 'px-4 py-2 text-base' : 'px-3 py-1 text-sm'}`}
              >
                {word}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={handleReset}
            className={`underline font-bold opacity-70 hover:opacity-100 ${isSEN ? 'text-base' : 'text-sm'}`}
          >
            上載另一份材料
          </button>
        </div>
      )}
    </div>
  );
}
