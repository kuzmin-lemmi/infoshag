// Сборка разбора в один самодостаточный HTML: python-подобные модули инлайнятся.
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const dir = new URL('./', import.meta.url);
const read = name => readFileSync(new URL(name, dir), 'utf8');
const inline = name => read(name).replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, '');
const engine = inline('engine.mjs');
const ui = read('ui.js');
const html = read('template.html')
  .replace('/*__ENGINE__*/', "(()=>{'use strict';\n" + engine)
  .replace('/*__UI__*/', ui + '\n})();');
const output = process.argv[2] ? resolve(process.argv[2]) : new URL('../../public/games/ege-2-poshagovo.html', dir);
writeFileSync(output, html);
console.log('Готово: ' + output.pathname.replace(/^\/([A-Za-z]:)/, '$1'));