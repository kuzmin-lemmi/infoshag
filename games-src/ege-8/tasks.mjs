import {productValues,permValues,py} from './engine.mjs';
import {rankWord,unrankWord,digitWord,digitValue,dynamicCount,countFormula,recursiveCount,positionalCount,labModel} from './course.mjs';

export const TASKS=[
{id:'t1',title:'1. Слова с тремя ограничениями',group:1,condition:['Из букв А, Б, В, Е составляют все слова длины 4; буквы могут повторяться.','Слово должно начинаться с Б или В, содержать ровно две гласные из набора А, Е и не содержать сочетания АА.','Найдите количество таких слов. Слово — любая последовательность букв, не обязательно осмысленная.'],notes:['Отделяем ограничения первой позиции, количества гласных и соседнего сочетания.','Сначала перебираем все 4⁴ слов. Затем покажем альтернативу: ограничиваем первую позицию сразу.']},
{id:'t2',title:'2. Перестановки повторяющихся букв',group:1,condition:['Перестановкой всех букв слова АНАНАС составляют шестибуквенные слова.','Одинаковые буквы не должны стоять рядом. Найдите число различных подходящих слов.'],notes:['А встречается три раза, Н — два раза. permutations различает позиции, поэтому понадобится set.','Проверку соседей выполняем прямо на кортеже через zip и all.']},
{id:'t3',title:'3. Первый и последний номера',group:1,condition:['Все четырёхбуквенные слова из букв А, Б, В, Г записаны в указанном алфавитном порядке и пронумерованы с 1.','Найдите первый и последний чётные номера слов, которые не начинаются с Г и содержат ровно одну А.','Номера относятся ко всему исходному списку, до отбора слов.'],notes:['enumerate оборачивает полный product. Фильтр находится внутри цикла.','Первый результат записываем только один раз; последний обновляем при каждом совпадении.']},
{id:'t4',title:'4. Слово по номеру и номер слова',group:2,condition:['Все слова длины 4 из букв К, Л, М, Н записаны в указанном алфавитном порядке и пронумерованы с 1.','Определите слово под номером 74 и номер слова НМЛК. В ответе сначала укажите слово, затем номер.'],notes:['Сопоставляем К→0, Л→1, М→2, Н→3. Основание равно 4.','Для восстановления слова обрабатываем ровно четыре разряда, сохраняя начальные К. Для номера используем схему Горнера.']},
{id:'t5',title:'5. Восьмеричные числа и чётность',group:2,condition:['Рассматриваются все четырёхзначные числа в восьмеричной системе счисления.','В записи должна быть ровно одна цифра 0, а чётные и нечётные цифры должны чередоваться.','Найдите количество таких чисел. Ведущий ноль не допускается.'],notes:['В коде цифры — целые значения от 0 до 7. Первую позицию выбираем из 1–7.','Ноль является чётной цифрой. Чередование проверяется по каждой соседней паре.']},
{id:'t6',title:'6. Большой перебор: пять способов',group:3,condition:['Из букв А, Б, В, Г составляют слова фиксированной длины. Нужно ровно две А; сочетание АА запрещено.','Сначала решите для длины 5 и сравните способы. Затем измените длину на 18, не запуская полный перебор.'],notes:['Одна задача объединяет обычный перебор, формулу, выбор позиций, отсечения и динамику.','Для длины 18 полный перебор и рекурсивное дерево не запускаются. Формула, позиции и динамика всё ещё дают точный ответ.']}
];
export function taskRows(words,check){return words.map((word,i)=>{const checks=check(word);return {word,number:i+1,checks,ok:checks.every(Boolean)}})}
export function taskModel(id,big=false){
 const q=py,t=TASKS.find(x=>x.id===id),m={id,condition:t.condition,notes:t.notes,mode:'filter',rows:[],checkLabels:[],code:'',alternative:'',answer:null,steps:[]};
 if(id==='t1'){
 const words=productValues(Array.from({length:4},()=>Array.from('АБВЕ'))).map(p=>p.join(''));
 m.checkLabels=['Первая Б или В','Ровно две гласные','Нет АА'];m.rows=taskRows(words,w=>'БВ'.includes(w[0])?[true,Array.from(w).filter(c=>'АЕ'.includes(c)).length===2,!w.includes('АА')]:[false,Array.from(w).filter(c=>'АЕ'.includes(c)).length===2,!w.includes('АА')]);m.answer=m.rows.filter(x=>x.ok).length;
 m.code='from itertools import product\n\nalphabet = "АБВЕ"\nanswer = 0\nfor p in product(alphabet, repeat=4):\n    s = "".join(p)\n    first_ok = s[0] in "БВ"\n    vowels_ok = sum(c in "АЕ" for c in s) == 2\n    pair_ok = "АА" not in s\n    if first_ok and vowels_ok and pair_ok:\n        answer += 1\nresult = answer\nprint(result)';
 m.alternative='from itertools import product\n\nresult = sum(\n    sum(c in "АЕ" for c in p) == 2 and "АА" not in "".join(p)\n    for p in product("БВ", "АБВЕ", "АБВЕ", "АБВЕ")\n)\nprint(result)';
 }else if(id==='t2'){
 const raw=permValues('АНАНАС'),words=[...new Set(raw.map(p=>p.join('')))].sort();m.checkLabels=['Нет одинаковых соседей'];m.rows=taskRows(words,w=>[Array.from(w).slice(1).every((c,i)=>c!==w[i])]);m.answer=m.rows.filter(x=>x.ok).length;
 m.code='from itertools import permutations\n\nword = "АНАНАС"\nunique = set(permutations(word))\nanswer = 0\nfor p in sorted(unique):\n    ok = all(x != y for x, y in zip(p, p[1:]))\n    if ok:\n        answer += 1\nresult = answer\nprint(result)';
 m.alternative='from itertools import permutations\n\nresult = len({\n    p for p in permutations("АНАНАС")\n    if all(x != y for x, y in zip(p, p[1:]))\n})\nprint(result)';m.extra=[['Позиционных перестановок',raw.length],['Различных слов',words.length]];
 }else if(id==='t3'){
 const words=productValues(Array.from({length:4},()=>Array.from('АБВГ'))).map(p=>p.join(''));m.checkLabels=['Чётный общий номер','Не начинается с Г','Ровно одна А'];m.rows=words.map((w,i)=>{let checks=[(i+1)%2===0,w[0]!=='Г',Array.from(w).filter(c=>c==='А').length===1];return {word:w,number:i+1,checks,ok:checks.every(Boolean)}});const match=m.rows.filter(x=>x.ok);m.answer=[match[0].number,match.at(-1).number];
 m.code='from itertools import product\n\nfirst = None\nlast = None\nfor n, p in enumerate(product("АБВГ", repeat=4), 1):\n    if n % 2 == 0 and p[0] != "Г" and p.count("А") == 1:\n        if first is None:\n            first = n\n        last = n\nresult = (first, last)\nprint(result)';
 m.alternative='from itertools import product\n\nindices = [n for n, p in enumerate(product("АБВГ", repeat=4), 1)\n           if n % 2 == 0 and p[0] != "Г" and p.count("А") == 1]\nresult = (indices[0], indices[-1])\nprint(result)';
 }else if(id==='t4'){
 let decoded=unrankWord(74,'КЛМН',4),ranked=rankWord('НМЛК','КЛМН');m.mode='actions';m.answer=[decoded.word,ranked.number];m.headers=['Действие','Вход','Результат'];m.rows=[...decoded.rows.map(x=>({word:x[4],cells:['Деление '+x[0],x[1],`частное ${x[2]}, остаток ${x[3]} → ${x[4]}`]})),...ranked.rows.map(x=>({word:x[1],cells:['Горнер '+x[0],x[3],`${x[3]} × 4 + ${x[2]} = ${x[4]}`]}))];
 m.code='alphabet = "КЛМН"\nx = 74 - 1\nletters = []\nfor _ in range(4):\n    x, digit = divmod(x, len(alphabet))\n    letters.append(alphabet[digit])\nword = "".join(reversed(letters))\n\nx = 0\nfor c in "НМЛК":\n    x = x * len(alphabet) + alphabet.index(c)\nresult = (word, x + 1)\nprint(result)';
 m.alternative='from itertools import product, islice\n\nalphabet = "КЛМН"\nword = "".join(next(islice(product(alphabet, repeat=4), 73, 74)))\nnumber = next(n for n, p in enumerate(product(alphabet, repeat=4), 1)\n              if "".join(p) == "НМЛК")\nresult = (word, number)\nprint(result)';
 }else if(id==='t5'){
 let ps=productValues(Array.from({length:4},()=>[0,1,2,3,4,5,6,7])).filter(p=>p[0]!==0);m.checkLabels=['Первая цифра не 0','Ровно один 0','Чётности чередуются'];m.rows=ps.map((p,i)=>{let checks=[p[0]!==0,p.filter(d=>d===0).length===1,p.slice(1).every((d,j)=>d%2!==p[j]%2)];return {word:digitWord(p),number:i+1,checks,ok:checks.every(Boolean)}});m.answer=m.rows.filter(x=>x.ok).length;
 m.code='from itertools import product\n\nanswer = 0\nfor first in range(1, 8):\n    for tail in product(range(8), repeat=3):\n        digits = (first,) + tail\n        zero_ok = digits.count(0) == 1\n        parity_ok = all(x % 2 != y % 2\n                        for x, y in zip(digits, digits[1:]))\n        if zero_ok and parity_ok:\n            answer += 1\nresult = answer\nprint(result)';
 m.alternative='from itertools import product\n\nresult = sum(\n    d[0] != 0 and d.count(0) == 1 and\n    all(x % 2 != y % 2 for x, y in zip(d, d[1:]))\n    for d in product(range(8), repeat=4)\n)\nprint(result)';
 }else if(id==='t6'){
 const cfg={alphabet:'АБВГ',length:big?18:5,need:2,word:'',base:8,digit:0,number:1},dp=dynamicCount(cfg.alphabet,cfg.length,2),formula=countFormula(4,cfg.length,2),positions=positionalCount(cfg.alphabet,cfg.length,2);m.mode='states';m.answer=dp.answer;m.code=labModel('dp',cfg).code;m.alternative=labModel('formula',cfg).code;m.headers=['Позиция','Уже А','Предыдущая А?','Продолжений'];m.rows=dp.rows.map(cells=>({word:'',cells}));m.extra=[['Всего слов',4**cfg.length],['Состояний DP',dp.states],['Попаданий в кеш',dp.hits]];
 m.comparison=[['Формула',formula,'Без перебора слов'],['Выбор позиций',positions.answer,positions.rows.length+' наборов'],['Динамика',dp.answer,dp.states+' состояний']];
 if(!big){const brute=taskRows(productValues(Array.from({length:5},()=>Array.from('АБВГ'))).map(p=>p.join('')),w=>[Array.from(w).filter(c=>c==='А').length===2,!w.includes('АА')]).filter(x=>x.ok).length,prune=recursiveCount('АБВГ',5,2,true);m.comparison.unshift(['Полный перебор',brute,4**5+' слов'],['Отсечения',prune.answer,prune.rows.length+' префиксов'])}else m.comparison.push(['Полный перебор',null,'Не запускаем'],['Рекурсивное дерево',null,'Не запускаем']);
 m.condition=[...t.condition,`Текущая длина: ${cfg.length}. Всего слов: ${4**cfg.length}.`];
 }
 if(id==='t4')m.steps=[
 ['Условие','Две связанные задачи решаем без создания списка всех слов.','Почему из номера 74 сначала нужно вычесть 1?',0],
 ['Перевод номера в цифры','Числовой код равен 74 − 1. divmod одновременно даёт частное и остаток.','Какой букве соответствует остаток 0?',6],
 ['Сохраняем длину слова','Делаем ровно четыре деления. Буквы получены справа налево, поэтому разворачиваем список.','Что случится с первым словом списка при цикле while x?',7],
 ['Номер другого слова','Горнер: накопленное число умножаем на основание и прибавляем цифру очередной буквы.','Почему после обработки всех букв прибавляем 1?',12],
 ['Разбор действий','Просмотри деления и шаги Горнера по одному.','Предскажи следующий промежуточный результат.',m.code.split('\n').length],
 ['Программа и проверка','Сравниваем прямой расчёт с вариантом через product и islice.','Получились ли одинаковые ответы?',m.code.split('\n').length]
 ];
 else if(id==='t6')m.steps=[
 ['Условие','На малом примере сравним способы, затем увеличим длину.','Сколько вариантов потребуется полному перебору?',0],
 ['Сравниваем способы','Все методы считают одни и те же слова: ровно две А и ни одного АА.','Почему выбор позиций позволяет не создавать каждое слово?',m.code.split('\n').length],
 ['Состояние динамики','Нужны позиция, число использованных А и признак предыдущей А. Построенное слово целиком не нужно.','Какая информация о начале слова влияет на продолжения?',9],
 ['Переходы и отсечения','Не добавляем А после А; невозможное количество А возвращает 0. Остальные продолжения суммируем.','Когда два разных префикса имеют одинаковые продолжения?',m.code.split('\n').length],
 ['Таблица состояний','Каждое состояние вычисляется один раз; повторные вызовы берут ответ из кеша.','Что означает количество продолжений в выбранной строке?',m.code.split('\n').length],
 ['Программа и ответ','Формула и динамика совпадают. На большом примере проверяем также подсчёт по позициям.','Почему полный перебор здесь не нужен?',m.code.split('\n').length]
 ];
 else {const lines=m.code.split('\n').length;m.steps=[
 ['Условие','Выдели, что перебираем, какие условия проверяем и что требуется вывести.','Какие ограничения относятся к одному символу, а какие — ко всему слову?',0],
 ['План решения',m.notes.join(' '),'Какой генератор подходит: product или permutations?',Math.min(4,lines)],
 ['Получаем варианты','Сохраняем исходный порядок. Счётчик пока не увеличиваем.','Есть ли повторяющиеся варианты и нужны ли их номера?',Math.min(6,lines)],
 ['Переводим ограничения в Python','Для каждого ограничения получаем True или False. Потребуем выполнения всех условий.','Какая проверка отсекает текущий пример?',Math.max(6,lines-3)],
 ['Собираем ответ',id==='t3'?'Первое совпадение запоминаем один раз, последнее обновляем.':'Увеличиваем счётчик ровно один раз на подходящий вариант.','Почему нельзя менять номер общего списка после фильтрации?',lines],
 ['Пошаговый перебор','Сначала обсудите вариант, затем откройте проверку. Можно перейти к следующему подходящему варианту.','Подходит ли текущий вариант?',lines],
 ['Полная программа и ответ','Ответ скрыт до нажатия. Альтернативный код решает то же условие.','Как проверить решение другим способом?',lines]
 ]}
 m.traceStep=m.steps.length-2;m.finalStep=m.steps.length-1;return m;
}
