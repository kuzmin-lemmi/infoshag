// Встраивает картинки контрольной 5 класса в сам HTML-файл (data-URI), чтобы она работала без интернета и с флешки.
// Исходники — games-src/kontrolnaya-5/img/*.webp (1672×941). Запуск: node games-src/kontrolnaya-5/embed-images.mjs
// Координаты зон в игре заданы в пикселях исходника, поэтому новую картинку делай того же размера.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const DIR = resolve(import.meta.dirname, 'img');
const HTML = resolve(import.meta.dirname, '../../public/games/kontrolnaya-5-klass-1-chetvert.html');

const img = {};
for (const f of readdirSync(DIR).filter(f => f.endsWith('.webp')).sort()) {
  const buf = await sharp(join(DIR, f)).resize({ width: 1280 }).webp({ quality: 74 }).toBuffer();
  img[f.slice(0, -5)] = 'data:image/webp;base64,' + buf.toString('base64');
  console.log(`${f}: ${Math.round(buf.length / 1024)} КБ`);
}

const html = readFileSync(HTML, 'utf8');
const re = /<script id="img-data">[\s\S]*?<\/script>/;
if (!re.test(html)) throw new Error('В HTML нет блока <script id="img-data">');
const block = `<script id="img-data">\n// картинки собраны скриптом games-src/kontrolnaya-5/embed-images.mjs — не правь вручную\nconst IMG = ${JSON.stringify(img, null, 1)};\n</script>`;
writeFileSync(HTML, html.replace(re, () => block));
console.log(`Готово: ${Math.round(readFileSync(HTML).length / 1024)} КБ`);
