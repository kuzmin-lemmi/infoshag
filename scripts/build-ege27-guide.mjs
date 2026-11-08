// Собирает урок «Кластеры частиц» (задание 27): в шаблон подставляются два файла данных.
// 27.txt — по мотивам демоверсии 2027 (generate.py), 27_2.txt — по мотивам СтатГрада (generate_statgrad.py).
// Программы для слайдов страница собирает сама; solution.py и solution_statgrad.py — те же программы для проверки.
import {readFileSync, writeFileSync} from 'node:fs';
const root = new URL('../', import.meta.url);
const src = path => readFileSync(new URL(`games-src/ege-27-chasticy/${path}`, root), 'utf8').replaceAll('\r\n', '\n');
const demo = src('27.txt').trim(), stat = src('27_2.txt').trim();
const html = src('template.html').replace('/*DATA_DEMO*/', () => demo).replace('/*DATA_STAT*/', () => stat);
writeFileSync(new URL('public/games/ege-27-chasticy.html', root), html);
console.log(`Собран урок «Кластеры частиц»: ${demo.split('\n').length} + ${stat.split('\n').length} строк данных.`);
