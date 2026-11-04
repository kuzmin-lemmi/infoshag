export const LIMIT=30000;
export function chars(s){return Array.from(s)}
export function py(v){if(v===null)return 'None';if(typeof v==='boolean')return v?'True':'False';if(Array.isArray(v))return '['+v.map(py).join(', ')+']';if(typeof v==='string')return JSON.stringify(v);return String(v)}
export function tuple(p){return '('+p.map(py).join(', ')+(p.length===1?',':'')+')'}
export function productValues(pools){let values=[[]];for(const pool of pools){let next=[];for(const prefix of values)for(const c of pool)next.push([...prefix,c]);values=next}return values}
export function permValues(word){let out=[];function walk(prefix,remaining){if(!remaining.length){out.push(prefix);return}for(let i=0;i<remaining.length;i++)walk([...prefix,remaining[i]],[...remaining.slice(0,i),...remaining.slice(i+1)])}walk([],chars(word));return out}
export function combValues(alphabet,k){let out=[];function walk(prefix,start){if(prefix.length===k){out.push(prefix);return}for(let i=start;i<alphabet.length;i++)walk([...prefix,alphabet[i]],i+1)}walk([],0);return out}
export function frequencies(word){let f={};for(const c of word)f[c]=(f[c]||0)+1;return f}
export function sameCounts(a,b){let x=frequencies(a),y=frequencies(b);return Object.keys(x).length===Object.keys(y).length&&Object.keys(x).every(k=>x[k]===y[k])}
export function occurrences(s,p){let n=0,at=0;while(true){at=s.indexOf(p,at);if(at<0)return n;n++;at+=p.length}}
export function shortList(xs){return py(xs.slice(0,8))+(xs.length>8?' … ещё '+(xs.length-8):'')}
export function validate(lesson,c){
 const controls=lesson.controls;
 for(const key of controls){let s=c[key];if(['length','need','start','number'].includes(key)){if(!Number.isSafeInteger(s))return 'Введите целое число.';let lo=key==='need'?0:1,hi=key==='length'?6:key==='need'?12:key==='start'?10:1000000;if(s<lo||s>hi)return 'Поле «'+key+'»: допустимо от '+lo+' до '+hi+'.';continue}
 if(key==='searchStyle'){if(!['next','break'].includes(s))return 'Выберите способ поиска.';continue}
 if(key==='parity'){if(!['any','even','odd'].includes(s))return 'Выберите правило номера.';continue}
 if(typeof s!=='string'||(!s.length&&key!=='vowels'))return 'Текстовые поля не должны быть пустыми.';
 if(!/^[А-ЯЁA-Z0-9]*$/.test(s))return 'Используйте русские или латинские буквы и цифры без пробелов.';
 let max=key==='vowels'?36:key==='word'?12:8;if(chars(s).length>max)return 'В поле «'+key+'» допускается не более '+max+' символов.';
 if(['alphabet','first','last'].includes(key)&&new Set(s).size!==chars(s).length)return 'В алфавите и наборах позиций каждый символ указывается один раз.';
 if(key==='char'&&chars(s).length!==1)return 'Для подсчёта буквы введите ровно один символ.';
 }
 if(lesson.id==='positions'){if(c.length<2)return 'Для отдельных первой и последней позиций нужна длина не меньше 2.';if([...c.first,...c.last].some(x=>!c.alphabet.includes(x)))return 'Первые и последние буквы должны принадлежать алфавиту.'}
 let size=0;
 if(['permutations','unique'].includes(lesson.id)){size=1;for(let n=2;n<=c.word.length;n++)size*=n}
 else if(lesson.id==='counter')size=new Set(c.word).size**c.word.length;
 else if(lesson.id==='positions')size=c.first.length*c.alphabet.length**(c.length-2)*c.last.length;
 else if(controls.includes('alphabet')&&lesson.id!=='combinations')size=c.alphabet.length**c.length;
 if(size>LIMIT)return 'Получится '+size.toLocaleString('ru-RU')+' вариантов. Для живого показа предел — '+LIMIT.toLocaleString('ru-RU')+'. Уменьшите алфавит или длину; усечённый ответ не вычисляется.';
 return '';
}
export function compute(id,c){
 const A=chars(c.alphabet),k=c.length,q=py,variants=()=>productValues(Array.from({length:k},()=>A)),joined=ps=>ps.map(p=>p.join(''));
 const m={code:'',headers:[],rows:[],stats:[],visuals:[],proof:null};
 const base=`from itertools import product\n\nalphabet = ${q(c.alphabet)}\nlength = ${k}\n`;
 const setRows=(headers,rows,visuals)=>{m.headers=headers;m.rows=rows;m.visuals=visuals||rows.map(()=>c.word)};
 if(id==='product'||id==='join'){
 let ps=variants(),words=joined(ps);m.code=base+(id==='product'?'\nfor p in product(alphabet, repeat=length):\n    print(p)':'\nfor p in product(alphabet, repeat=length):\n    s = "".join(p)\n    print(p, s)');setRows(['№','Кортеж p','Строка s'],ps.map((p,i)=>[i+1,tuple(p),words[i]]),words);m.stats=[['Вариантов',ps.length],['Длина',k]];m.proof=id==='product'?ps:words;
 }else if(id==='permutations'||id==='unique'){
 let ps=permValues(c.word),unique=[...new Set(joined(ps))].sort(),words=id==='unique'?unique:joined(ps);m.code=`from itertools import permutations\n\nword = ${q(c.word)}\n`+(id==='unique'?'unique = set(permutations(word))\nfor p in sorted(unique):\n    print("".join(p))':'for p in permutations(word):\n    print("".join(p))');let seen=new Set();setRows(['№','Слово','Встречалось?'],words.map((w,i)=>{let old=seen.has(w);seen.add(w);return [i+1,w,old]}),words);m.stats=[['Выдано кортежей',ps.length],['Различных слов',unique.length]];m.proof=id==='unique'?unique:ps;
 }else if(id==='combinations'){
 let ps=combValues(A,k);m.code=`from itertools import combinations\n\nfor p in combinations(${q(c.alphabet)}, ${k}):\n    print(p)`;setRows(['№','Выбранные символы'],ps.map((p,i)=>[i+1,tuple(p)]),joined(ps));m.stats=[['Выборов',ps.length],['Берём символов',k]];m.proof=ps;
 }else if(id==='map'){
 let words=joined(variants());m.code=base+'\nwords = map("".join, product(alphabet, repeat=length))\nfirst = list(words)\nsecond = list(words)\nprint(first)\nprint(second)';setRows(['Действие','Результат'],[['Первый list(words)',shortList(words)],['Повторный list(words)','[]']],[words[0]||'','']);m.stats=[['В первом списке',words.length],['Во втором',0]];m.proof=[words,[]];
 }else if(['count','sum_words','sum_letters'].includes(id)){
 let words=joined(variants()),total=0,group=id==='sum_letters';m.code=base+(group?`vowels = ${q(c.vowels)}\n\nfor p in product(alphabet, repeat=length):\n    count = sum(c in vowels for c in p)\n    if count == ${c.need}:\n        print("".join(p))`:id==='sum_words'?`\nanswer = sum(\n    p.count(${q(c.char)}) == ${c.need}\n    for p in product(alphabet, repeat=length)\n)\nprint(answer)`:`\nfor p in product(alphabet, repeat=length):\n    count = p.count(${q(c.char)})\n    if count == ${c.need}:\n        print("".join(p))`);let proof=[];let rows=words.map(w=>{let n=chars(w).filter(x=>group?c.vowels.includes(x):x===c.char).length,ok=n===c.need;if(ok)total++;proof.push([w,n,ok]);return [w,n,ok,total]});setRows(['Слово',group?'Гласных':'Нужных букв','Условие','Подошло всего'],rows,words);m.stats=[['Подходит слов',total],['Проверено всего',words.length]];m.proof=proof;
 }else if(id==='membership'||id==='edges'){
 const s=c.word,p=c.pattern;let values=id==='membership'?[s.includes(p),!s.includes(p),s.indexOf(p)]:[s.startsWith(p),s.endsWith(p)];m.code=`s = ${q(s)}\npattern = ${q(p)}\n\n`+(id==='membership'?'print(pattern in s)\nprint(pattern not in s)\nprint(s.find(pattern))':'print(s.startswith(pattern))\nprint(s.endswith(pattern))');setRows(['Выражение','Результат'],(id==='membership'?['pattern in s','pattern not in s','s.find(pattern)']:['s.startswith(pattern)','s.endswith(pattern)']).map((x,i)=>[x,values[i]]));m.stats=[['Длина слова',s.length],['Длина сочетания',p.length]];m.proof=values;
 }else if(id==='positions'){
 let pools=[chars(c.first),...Array.from({length:k-2},()=>A),chars(c.last)],ps=productValues(pools),words=joined(ps);m.code=base+`first = ${q(c.first)}\nlast = ${q(c.last)}\nmiddle = [alphabet] * (length - 2)\n\nfor p in product(first, *middle, last):\n    print("".join(p))`;setRows(['№','Слово','Первая','Последняя'],words.map((w,i)=>[i+1,w,w[0],w.at(-1)]),words);m.stats=[['Создано слов',words.length],['Полный набор',A.length**k]];m.proof=ps;
 }else if(id==='any_all'){
 let words=joined(variants()),proof=words.map(w=>[w,chars(w).some(x=>c.vowels.includes(x)),chars(w).every(x=>c.vowels.includes(x))]);m.code=base+`vowels = ${q(c.vowels)}\n\nfor p in product(alphabet, repeat=length):\n    print("".join(p),\n          any(c in vowels for c in p),\n          all(c in vowels for c in p))`;setRows(['Слово','any: хоть одна','all: каждая'],proof,words);m.stats=[['any = True',proof.filter(x=>x[1]).length],['all = True',proof.filter(x=>x[2]).length]];m.proof=proof;
 }else if(id==='neighbors'){
 let words=joined(variants()),proof=words.map(w=>[w,chars(w).slice(1).every((x,i)=>x!==w[i])]);m.code=base+'\nfor p in product(alphabet, repeat=length):\n    ok = all(x != y for x, y in zip(p, p[1:]))\n    print("".join(p), ok)';setRows(['Слово','Соседние пары','Все различны?'],words.map((w,i)=>[w,chars(w).slice(1).map((x,j)=>w[j]+x).join(' · ')||'Нет пар',proof[i][1]]),words);m.stats=[['Подходит слов',proof.filter(x=>x[1]).length],['Пар в слове',Math.max(0,k-1)]];m.proof=proof;
 }else if(id==='overlap'){
 let positions=[],rows=[];for(let i=0;i<=c.word.length-c.pattern.length;i++){let ok=c.word.startsWith(c.pattern,i);if(ok)positions.push(i);rows.push([i,c.word.slice(i,i+c.pattern.length),ok])}let count=occurrences(c.word,c.pattern);m.code=`s = ${q(c.word)}\npattern = ${q(c.pattern)}\n\nprint(s.count(pattern))\nprint(sum(s.startswith(pattern, i)\n          for i in range(len(s) - len(pattern) + 1)))`;setRows(['Индекс начала','Фрагмент','Совпадает?'],rows);m.stats=[['str.count()',count],['Все позиции',positions.length]];m.proof=[positions,count];
 }else if(id==='counter'){
 let alphabet=[...new Set(chars(c.word))],ps=productValues(Array.from({length:c.word.length},()=>alphabet)),words=joined(ps),valid=words.filter(w=>sameCounts(w,c.word));m.code=`from itertools import product\nfrom collections import Counter\n\nword = ${q(c.word)}\nalphabet = "".join(dict.fromkeys(word))\nfor p in product(alphabet, repeat=len(word)):\n    s = "".join(p)\n    if Counter(s) == Counter(word):\n        print(s)`;setRows(['Слово','Количество букв','Состав совпал?'],words.map(w=>[w,Object.entries(frequencies(w)).map(([c,n])=>c+': '+n).join('; '),sameCounts(w,c.word)]),words);m.stats=[['Подходит слов',valid.length],['Проверено',words.length]];m.proof=valid;
 }else if(id==='translate'){
 let pattern=chars(c.word).map(x=>c.vowels.includes(x)?'Г':'Д').join('');m.code=`s = ${q(c.word)}\nvowels = ${q(c.vowels)}\ntable = str.maketrans({\n    c: "Г" if c in vowels else "Д"\n    for c in set(s)\n})\nprint(s.translate(table))`;setRows(['Символ','Гласная?','Замена'],chars(c.word).map((x,i)=>[x,c.vowels.includes(x),pattern[i]]));m.stats=[['Шаблон',pattern],['Есть две Г подряд',pattern.includes('ГГ')]];m.proof=pattern;
 }else if(id==='enumerate'){
 let words=joined(variants()),extra=c.parity==='even'?' and number % 2 == 0':c.parity==='odd'?' and number % 2 == 1':'',proof=words.map((w,i)=>{let n=i+c.start,ok=chars(w).filter(x=>x===c.char).length===c.need&&(c.parity==='any'||n%2===(c.parity==='even'?0:1));return [n,w,ok]});m.code=base+`\nfor number, p in enumerate(\n    product(alphabet, repeat=length), start=${c.start}\n):\n    if p.count(${q(c.char)}) == ${c.need}${extra}:\n        print(number, "".join(p))`;setRows(['Общий номер','Слово','Подходит?'],proof,words);let matches=proof.filter(x=>x[2]);m.stats=[['Подходит слов',matches.length],['Первый номер',matches[0]?.[0]??null]];m.proof=proof;
 }else if(id==='order'){
 let words=joined(variants()),sorted=joined(productValues(Array.from({length:k},()=>[...A].sort())));m.code=base+'\nfor p in product(alphabet, repeat=length):\n    print("".join(p))\n\n# Для сравнения — порядок Unicode:\nfor p in product(sorted(alphabet), repeat=length):\n    print("".join(p))';setRows(['№','Как задан алфавит','После sorted()'],words.map((w,i)=>[i+1,w,sorted[i]]),words);m.stats=[['Ваш порядок',c.alphabet],['Unicode-порядок',[...A].sort().join('')]];m.proof=[words,sorted];
 }else if(id==='first'||id==='last'){
 let words=joined(variants()),found=null,rows=[];for(let i=0;i<words.length;i++){let w=words[i],ok=chars(w).filter(x=>x===c.char).length===c.need;if(ok)found=[i+1,w];rows.push([i+1,w,ok,found===null?'None':tuple(found)]);if(ok&&id==='first')break}m.code=base+(id==='first'&&c.searchStyle==='break'?`
answer = None
for n, p in enumerate(product(alphabet, repeat=length), 1):
    if p.count(${q(c.char)}) == ${c.need}:
        answer = (n, "".join(p))
        break
print(answer)`:id==='first'?`\nanswer = next(\n    ((n, "".join(p))\n     for n, p in enumerate(product(alphabet, repeat=length), 1)\n     if p.count(${q(c.char)}) == ${c.need}),\n    None\n)\nprint(answer)\n\n# В обычном цикле после совпадения — break.`:`\nanswer = None\nfor n, p in enumerate(product(alphabet, repeat=length), 1):\n    if p.count(${q(c.char)}) == ${c.need}:\n        answer = (n, "".join(p))\nprint(answer)`);setRows(['№','Слово','Подходит?','Текущий ответ'],rows,rows.map(x=>x[1]));m.stats=[['Ответ',found===null?null:tuple(found)],['Проверено слов',rows.length]];m.proof=[found,rows.length];
 }else if(id==='islice'){
 let words=joined(variants()),word=words[c.number-1]??null;m.code=`from itertools import product, islice\n\nvariants = product(${q(c.alphabet)}, repeat=${k})\np = next(islice(variants, ${c.number-1}, ${c.number}), None)\nprint(None if p is None else "".join(p))`;setRows(['Действие','Результат'],[['Всего вариантов',words.length],['Номер с единицы',c.number],['Начальный индекс',c.number-1],['Выбранное слово',word]],[...Array(4)].map(()=>word||''));m.stats=[['Выбрано слово',word],['Пропущено элементов',Math.min(c.number-1,words.length)]];m.proof=word;
 }else throw Error('Неизвестный приём: '+id);
 return m;
}
