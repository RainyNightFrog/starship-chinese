import fs from 'fs';
import { recognizeVocabWorksheetDataUrl } from '../server/vocabOcr.js';
import { parseVocabFromOcrText } from '../src/vocabOcrParser.js';

const imgPath = 'C:/Users/Chung Wai Kin/.cursor/projects/c-Users-Chung-Wai-Kin-Desktop/assets/c__Users_Chung_Wai_Kin_AppData_Roaming_Cursor_User_workspaceStorage_d6cb6a9d5185c2b1a47e8d489804eb27_images_QQ20260611-1849262-e35e1dbc-737f-4ff6-b796-6499139184e6.png';

const buf = fs.readFileSync(imgPath);
const dataUrl = `data:image/png;base64,${buf.toString('base64')}`;
const raw = await recognizeVocabWorksheetDataUrl(dataUrl);
const words = parseVocabFromOcrText(raw, { maxWords: 48, minWords: 3 });

const expected = [
  '落後', '明確', '擅自', '氣餒', '勤奮', '濃重', '協調', '感悟',
  '安詳', '嘆息', '清理', '擦拭', '樹叢', '使勁', '故鄉', '盛開',
  '無論', '新鮮', '趕緊', '適宜', '奇異', '允許', '焦黃', '滋補',
];

const got = words.map((w) => w.word);
console.log('COUNT', got.length);
console.log('GOT', got.join(', '));
console.log('MISSING', expected.filter((w) => !got.includes(w)).join(', ') || '(none)');
console.log('GARBAGE', got.filter((w) => !expected.includes(w)).join(', ') || '(none)');
