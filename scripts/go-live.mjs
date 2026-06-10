import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const isWin = process.platform === 'win32';
const npm = isWin ? 'npm.cmd' : 'npm';
const HOST = process.env.LIVE_HOST || '127.0.0.1';
const PORT = process.env.LIVE_PORT || '5501';
const liveUrl = `http://${HOST}:${PORT}`;

const liveEnv = {
  ...process.env,
  VITE_SPEECH_API_URL: `${liveUrl}/api/speech`,
};

function run(cmd, args, label, extraEnv = {}) {
  const child = spawn(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: isWin,
    env: { ...process.env, ...extraEnv },
  });
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[${label}] 結束，代碼 ${code}`);
    }
  });
  return child;
}

function openBrowser(url) {
  const cmd = isWin ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(cmd, (err) => {
    if (err) console.log(`[Live] 請手動開啟：${url}`);
  });
}

console.log('\n星航中文 — 一鍵預覽（無需 Go Live 擴充套件）');
console.log('══════════════════════════════════════════');
console.log('1. 正在建置 dist/ …');

const build = spawn(npm, ['run', 'build'], {
  cwd: root,
  stdio: 'inherit',
  shell: isWin,
  env: liveEnv,
});

build.on('exit', (code) => {
  if (code !== 0) {
    console.error('\n✗ 建置失敗');
    process.exit(code ?? 1);
  }

  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    console.error('\n✗ dist/index.html 不存在');
    process.exit(1);
  }

  console.log('\n✓ 建置完成');
  console.log('2. 啟動本機伺服器 + 自動重新建置…\n');

  run(npm, ['run', 'build', '--', '--watch'], 'build:watch', liveEnv);
  run('node', ['server/liveServer.js'], 'live', { LIVE_PORT: PORT, LIVE_HOST: HOST });

  setTimeout(() => openBrowser(liveUrl), 1200);

  console.log('──────────────────────────────────────────');
  console.log(`✓ 瀏覽器將自動開啟：${liveUrl}`);
  console.log('  若未自動開啟，請手動貼上以上網址');
  console.log('');
  console.log('修改程式碼後會自動重建 dist/，請重新整理瀏覽器');
  console.log('按 Ctrl+C 結束');
  console.log('──────────────────────────────────────────\n');
});
