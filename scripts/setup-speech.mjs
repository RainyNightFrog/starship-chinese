import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env');
const examplePath = path.join(root, '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
  fs.copyFileSync(examplePath, envPath);
  console.log('✓ 已建立 .env（請填入 AZURE_SPEECH_KEY）');
}

const envContent = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '');
const hasKey = /^AZURE_SPEECH_KEY=(?!your_subscription_key_here)\S+/m.test(envContent);

console.log('\n星航中文 — Azure 語音設定檢查');
console.log('─────────────────────────────');
console.log(hasKey ? '✓ AZURE_SPEECH_KEY 已設定' : '✗ 請在 .env 填入 AZURE_SPEECH_KEY');
console.log('  路徑:', envPath);
console.log('\n下一步：');
if (!hasKey) {
  console.log('  1. 開啟 https://portal.azure.com');
  console.log('  2. 建立資源 → AI + Machine Learning → Speech');
  console.log('  3. 複製 Key 和 Region 到 .env');
  console.log('  4. 執行 npm run dev');
} else {
  console.log('  執行 npm run dev 即可使用 Azure 粵語/普通話/英文神經語音');
}
console.log('');
