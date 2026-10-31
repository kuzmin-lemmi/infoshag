// Шаблон содержит полный материал, включая обновлённые автором блоки Python.
import {readFileSync, writeFileSync} from 'node:fs';
const root = new URL('../', import.meta.url);
const html = readFileSync(new URL('games-src/ege-5/template.html', root), 'utf8').replaceAll('\r\n', '\n');
writeFileSync(new URL('public/games/ege-5-poshagovo.html', root), html);
console.log('Собран HTML-разбор: 16 блоков Python, решение в одном цикле, 6 вопросов и 3 тренировки.');
