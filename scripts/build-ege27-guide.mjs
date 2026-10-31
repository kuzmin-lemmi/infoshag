// Собирает разбор «Кластеры частиц»: в шаблон подставляются файл данных и программа решения.
// Данные: games-src/ege-27-chasticy/27.txt (генерирует generate.py), программа — solution.py.
import {readFileSync, writeFileSync} from 'node:fs';
const root = new URL('../', import.meta.url);
const src = path => readFileSync(new URL(`games-src/ege-27-chasticy/${path}`, root), 'utf8').replaceAll('\r\n', '\n');
const data = src('27.txt').trim();
// первая строка solution.py — комментарий для автора, на страницу не идёт
const solution = src('solution.py').split('\n').filter((line, i) => !(i === 0 && line.startsWith('#'))).join('\n').trim();
const html = src('template.html').replace('/*DATA*/', () => data).replace('/*SOLUTION*/', () => solution);
writeFileSync(new URL('public/games/ege-27-chasticy.html', root), html);
console.log(`Собран разбор «Кластеры частиц»: ${data.split('\n').length} строк данных.`);
