// Снимает картинку-превью каждой игры из public/games/ в светлой и тёмной теме:
// public/posts/<slug>.jpg и public/posts/<slug>-dark.jpg (960×600).
// Нужен установленный Google Chrome или Microsoft Edge. Запуск: npm run posters [slug ...]
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(import.meta.dirname, '..');
const GAMES = join(ROOT, 'public/games');
const OUT = join(ROOT, 'public/posts');
const PORT = 9333;
const W = 1280, H = 800;
// сколько дать игре поработать перед снимком: пузырям в «Охоте» нужно время, чтобы всплыть
const WAIT = { 'ohota-za-rasshireniyami': 9000 };
// что сделать в игре перед снимком, чтобы на картинке был виден ход игры, а не пустое поле
const AFTER = {
  // «Снайпер»: задание формата ОГЭ и точный выстрел — видны полосы частей условия
  snaiper: `cfg.level = '3'; start(); document.getElementById('shot').value = String(S.task.answer); fire(); scrollTo(0, 0);`
};

const browsers = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const exe = browsers.find(p => existsSync(p));
if (!exe) { console.error('Не нашёл Chrome или Edge. Укажи путь в переменной CHROME.'); process.exit(1); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
const profile = join(tmpdir(), `infoshag-posters-${Date.now()}`);
const chrome = spawn(exe, [`--remote-debugging-port=${PORT}`, '--headless=new', `--window-size=${W},${H}`,
  '--hide-scrollbars', '--mute-audio', '--no-first-run', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });

async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find(t => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(200);
  }
  throw new Error('Chrome не ответил');
}

const ws = new WebSocket(await connect());
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let seq = 0;
const waiting = new Map();
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
});
const cdp = (method, params = {}) => new Promise((res, rej) => {
  const id = ++seq;
  waiting.set(id, m => m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result));
  ws.send(JSON.stringify({ id, method, params }));
});
const run = async expr => (await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.value;

await cdp('Page.enable');
await cdp('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });

// то же, что делает превью на сайте: без звука запускаем тренировку, чтобы был виден процесс, а не меню
const START = wait => `(async () => {
  window.AudioContext = window.webkitAudioContext = undefined;
  [...document.querySelectorAll('button')].find(b => b.textContent.includes('Тренировка'))?.click();
  await new Promise(r => setTimeout(r, 150));
  document.getElementById('startBtn')?.click();
  await document.fonts.ready;
  await new Promise(r => setTimeout(r, ${wait}));
  return true;
})()`;

const only = process.argv.slice(2);
const slugs = readdirSync(GAMES).filter(f => f.endsWith('.html')).map(f => f.slice(0, -5)).filter(s => !only.length || only.includes(s));
mkdirSync(OUT, { recursive: true });

try {
  for (const slug of slugs) {
    for (const scheme of ['light', 'dark']) {
      await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }, { name: 'prefers-reduced-motion', value: 'no-preference' }] });
      await cdp('Page.navigate', { url: pathToFileURL(join(GAMES, `${slug}.html`)).href });
      await sleep(400);
      await run(`new Promise(r => document.readyState === 'complete' ? r() : addEventListener('load', r))`);
      await run(START(WAIT[slug] ?? 2200));
      if (AFTER[slug]) { await run(AFTER[slug]); await sleep(900); }
      const { data } = await cdp('Page.captureScreenshot', { format: 'png' });
      const file = join(OUT, `${slug}${scheme === 'dark' ? '-dark' : ''}.jpg`);
      await sharp(Buffer.from(data, 'base64')).resize(960, 600).jpeg({ quality: 78, mozjpeg: true }).toFile(file);
      console.log('✓', file.slice(ROOT.length + 1));
    }
  }
} finally {
  ws.close();
  chrome.kill();
  await sleep(300);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
