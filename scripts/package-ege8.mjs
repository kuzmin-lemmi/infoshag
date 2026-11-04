import {spawnSync} from 'node:child_process';
import {mkdirSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const root=new URL('../',import.meta.url);
const build=spawnSync(process.execPath,['games-src/ege-8/build.mjs','public/games/ege-8-poshagovo.html'],{cwd:fileURLToPath(root),stdio:'inherit'});
if(build.status!==0)process.exit(build.status||1);
await sharp(readFileSync(new URL('design/site/ege-8-poshagovo.svg',root))).jpeg({quality:92,chromaSubsampling:'4:4:4'}).toFile(fileURLToPath(new URL('public/posts/ege-8-poshagovo.jpg',root)));
mkdirSync(new URL('public/downloads/',root),{recursive:true});
const zip=spawnSync(process.env.PYTHON||'python',['-c',
  'import sys,zipfile\nwith zipfile.ZipFile(sys.argv[3],"w",zipfile.ZIP_DEFLATED) as z:\n z.write(sys.argv[1],"ege-8-poshagovo.html")\n z.write(sys.argv[2],"Памятка учителю.txt")',
  fileURLToPath(new URL('public/games/ege-8-poshagovo.html',root)),
  fileURLToPath(new URL('docs/ege-8/Памятка учителю.txt',root)),
  fileURLToPath(new URL('public/downloads/ege-8-poshagovo.zip',root))],{stdio:'inherit'});
if(zip.status!==0){console.error('Не удалось создать ZIP: нужен Python 3, путь можно задать в PYTHON.',zip.error?.message||'');process.exit(zip.status||1)}
console.log('Пакет задания 8: HTML, обложка 1280×800, ZIP с памяткой.');
