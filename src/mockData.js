import { buildInitialVocabByTask, cloneVocab } from './vocabService';

export const sspaPinyin = ['bìng jiān zuò zhàn', 'bù zhī bù jué', 'wéi lì shì tú', 'dà fāng dé tǐ'];

export const INITIAL_VOCAB_LIST = [
  { id: 1, tc: '安慰', sc: '安慰', py: 'ān wèi', jp: 'on1 wai3', en: 'Comfort' },
  { id: 2, tc: '價值', sc: '价值', py: 'jià zhí', jp: 'gaa3 zik6', en: 'Value' },
  { id: 3, tc: '傳授', sc: '传授', py: 'chuán shòu', jp: 'cyun4 sau6', en: 'Pass on' },
  { id: 5, tc: '啟發', sc: '启发', py: 'qǐ fā', jp: 'kai2 faat3', en: 'Inspire', radical: '戶', body: '口攵' },
  { id: 8, tc: '珍貴', sc: '珍贵', py: 'zhēn guì', jp: 'zan1 gwai3', en: 'Precious' },
];

/** 家長模擬拍照 OCR 後推送的專屬詞表 */
export const PARENT_UPLOAD_VOCAB = [
  { id: 101, tc: '安慰', sc: '安慰', py: 'ān wèi', jp: 'on1 wai3', en: 'Comfort' },
  { id: 102, tc: '傳授', sc: '传授', py: 'chuán shòu', jp: 'cyun4 sau6', en: 'Pass on' },
  { id: 103, tc: '啟發', sc: '启发', py: 'qǐ fā', jp: 'kai2 faat3', en: 'Inspire', radical: '戶', body: '口攵' },
];

export const DEFAULT_QUIZ = {
  text: '這道科學題我想了很久都不懂，直到看見哥哥的提示，我才恍然大____，原來答案這麼簡單！',
  hint: '突然徹底明白了',
  options: [
    { key: 'A', word: '物', detail: '指物品或東西。' },
    { key: 'B', word: '語', detail: '指說話或語言。' },
    { key: 'C', word: '悟', detail: '答對了！是明白、覺悟的意思。注意不要寫錯成語言的「語」。' },
    { key: 'D', word: '誤', detail: '指錯誤或耽誤。' },
  ],
  correctKey: 'C',
};

export const DEFAULT_SSPA = {
  text: '在對抗這次嚴重水災的過程中，消防員、武警部隊和志願者們________，沒日沒夜地搬運沙袋，終於保住了大堤。',
  hint: '肩膀靠著肩膀，團結一致共同戰鬥',
  hintEn: 'Shoulder to shoulder, work in unity.',
  options: ['並肩作戰', '不知不覺', '惟利是圖', '大方得體'],
  correctIndex: 0,
};

export const DEFAULT_SENTENCE = {
  words: ['老師', '啟發', '常常', '我們', '努力學習'],
};

export const DEFAULT_READING = {
  passage: [
    '第一行：古人常說，書中自有黃金屋。',
    '第二行：閱讀不僅能增長見識，更能啟發我們的思維。',
    '第三行：在面對困難與大考時，我們要沉著應對。',
    '第四行：像消防員在水災中並肩作戰一樣，團結就是力量。',
  ],
  question: 'Q1. 根據文章第二行，「閱讀」有甚麼好處？',
  options: ['增長見識，啟發思維', '賺取黃金屋', '訓練水災救援', '學習如何拼字'],
  correctIndex: 0,
};

/** 模擬從家長後台推播的初始設定 */
export function createDefaultParentConfig() {
  const vocabByTask = buildInitialVocabByTask();
  return {
    studentType: 'sen',
    activeTask: 'dictation',
    aiAnalysis: null,
    uploadVariantIndex: 0,
    uploadLabel: '校本詞表 A',
    assignedContent: {
      vocabByTask,
      vocabList: cloneVocab(vocabByTask.prestudy),
      quiz: { ...DEFAULT_QUIZ, options: DEFAULT_QUIZ.options.map((o) => ({ ...o })) },
      quizBank: [],
      sspa: { ...DEFAULT_SSPA, options: [...DEFAULT_SSPA.options] },
      sspaBank: [],
      sentenceBank: [],
      aiUploadSession: null,
      vocabUploadSession: null,
      readingUploadSession: null,
      readingBank: [],
      readingExtractedPassages: [],
      uploadImages: [],
      uploadImageCount: 0,
      sentence: { ...DEFAULT_SENTENCE, words: [...DEFAULT_SENTENCE.words], correctOrder: [...DEFAULT_SENTENCE.words] },
      reading: {
        ...DEFAULT_READING,
        passage: [...DEFAULT_READING.passage],
        options: [...DEFAULT_READING.options],
      },
    },
  };
}
