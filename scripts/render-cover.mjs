// Рисует обложку из HTML через Chrome без окна: node scripts/render-cover.mjs <html> <png> <ширина> <высота> [параметры адреса]
// Пример: node scripts/render-cover.mjs design/site/ege-27-chasticy-cover.html design/vk/ege-27-chasticy.png 1200 1200 f=square
import { spawn } from 'node:child_process';
import { existsSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [html, out, w, h, query = ''] = process.argv.slice(2);
if (!html || !out || !w || !h) { console.error('Нужно: <html> <png> <ширина> <высота> [параметры]'); process.exit(1); }
const W = +w, H = +h, PORT = 9334;
const exe = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean).find(p => existsSync(p));
if (!exe) { console.error('Не нашёл Chrome или Edge. Укажи путь в переменной CHROME.'); process.exit(1); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
const profile = join(tmpdir(), `infoshag-cover-${Date.now()}`);
const chrome = spawn(exe, [`--remote-debugging-port=${PORT}`, '--headless=new', '--hide-scrollbars', '--no-first-run',
  `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
let url;
for (let i = 0; i < 50 && !url; i++) {
  try { url = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page')?.webSocketDebuggerUrl; } catch {}
  await sleep(200);
}
const ws = new WebSocket(url);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let seq = 0;
const waiting = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m.result); waiting.delete(m.id); } });
const cdp = (method, params = {}) => new Promise(r => { const id = ++seq; waiting.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const run = e => cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true });

try {
  await cdp('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.navigate', { url: pathToFileURL(resolve(html)).href + (query ? `?${query}` : '') });
  await sleep(500);
  await run(`document.fonts.ready.then(() => new Promise(r => { const t = () => document.body.dataset.ready ? r(true) : setTimeout(t, 50); t(); }))`);
  await sleep(300);
  const { data } = await cdp('Page.captureScreenshot', { format: 'png' });
  writeFileSync(out, Buffer.from(data, 'base64'));
  console.log('✓', out);
} finally {
  ws.close(); chrome.kill(); await sleep(300);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
