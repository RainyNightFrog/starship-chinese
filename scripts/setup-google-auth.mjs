import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env');
const examplePath = path.join(root, '.env.example');

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const out = {};
  for (const line of lines) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
  fs.copyFileSync(examplePath, envPath);
  console.log('✓ 已從 .env.example 建立 .env');
}

const env = readEnvFile(envPath);
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const anonKey = env.VITE_SUPABASE_ANON_KEY || '';
const appUrl = env.VITE_APP_URL || 'http://127.0.0.1:5501';
const devUrl = 'http://localhost:5173';

const hasUrl = Boolean(supabaseUrl && !supabaseUrl.includes('your-project-id'));
const hasKey = Boolean(anonKey && !anonKey.includes('your_anon'));
const callbackUrl = supabaseUrl ? `${supabaseUrl.replace(/\/$/, '')}/auth/v1/callback` : '(請先設定 VITE_SUPABASE_URL)';

console.log('\n星航中文 — Google 登入設定檢查');
console.log('══════════════════════════════════════════════════');
console.log(hasUrl ? '✓ VITE_SUPABASE_URL 已設定' : '✗ 請在 .env 填入 VITE_SUPABASE_URL');
console.log(hasKey ? '✓ VITE_SUPABASE_ANON_KEY 已設定' : '✗ 請在 .env 填入 VITE_SUPABASE_ANON_KEY');
console.log(`  Go Live URL：${appUrl}`);
console.log(`  npm run dev：${devUrl}`);
console.log(`  Supabase OAuth 回調：${callbackUrl}`);

console.log('\n【一】Supabase Dashboard（Authentication）');
console.log('──────────────────────────────────────────');
console.log('1. https://supabase.com/dashboard → 你的專案');
console.log('2. Authentication → Providers → Google → Enable');
console.log('3. 填入 Google Cloud 的 Client ID 與 Client Secret');
console.log('4. Authentication → URL Configuration：');
console.log(`   Site URL：${appUrl}`);
console.log(`   Redirect URLs 加入：`);
console.log(`     ${appUrl}`);
console.log(`     ${appUrl}/`);
console.log(`     ${devUrl}`);
console.log(`     ${devUrl}/`);

console.log('\n【二】Google Cloud Console（OAuth 2.0）');
console.log('──────────────────────────────────────────');
console.log('1. https://console.cloud.google.com/apis/credentials');
console.log('2. 建立 OAuth 2.0 用戶端 ID → 類型：網頁應用程式');
console.log('3. 已授權的 JavaScript 來源：');
console.log(`   ${appUrl}`);
console.log(`   ${devUrl}`);
console.log('4. 已授權的重新導向 URI（重要！填 Supabase 回調，不是本機）：');
console.log(`   ${callbackUrl}`);

console.log('\n【三】驗證');
console.log('──────────────────────────────────────────');
console.log('1. npm run dev');
console.log('2. 開啟登入頁 → 點「使用 Google 帳戶登入」');
console.log('3. 授權後應自動回到儀表板');

if (!hasUrl || !hasKey) {
  console.log('\n⚠️  請先完成 .env 的 Supabase 設定，再進行 Google Provider 配置。');
}
console.log('');
