import { quarterTopics } from './lesson-plan.ts';
import type { Plan } from './lesson-plan.ts';

export interface SearchEntry {
  id: string; kind: string; title: string; description: string; meta: string;
  href: string; grades: number[]; keywords: string;
}
interface Item { id: string; data: { title: string; summary: string; grades: number[]; topic?: string; tags: string[]; access: string } }
interface LessonBinding { itemId: string; primary: {grade: number; lessons: number[]}[]; related: {grade: number; lessons: number[]}[]; quarters?: {grade: number; quarters: number[]; reason: string}[] }
interface EgeBinding { itemId: string; number: number }
interface ExamTask { number: number; title: string; summary: string }

export function buildSearchIndex(plans: Plan[], tasks: ExamTask[], items: Item[], bindings: LessonBinding[], egeBindings: EgeBinding[], base: string): SearchEntry[] {
  const index: SearchEntry[] = [];
  const available = new Map(items.filter(i => i.data.access !== 'soon').map(i => [i.id, i]));
  for (const plan of plans) {
    for (const quarter of [1, 2, 3, 4]) {
      for (const topic of quarterTopics(plan, quarter)) {
        const names = bindings.filter(b => [...b.primary, ...b.related].some(ref => ref.grade === plan.grade && ref.lessons.some(n => topic.annualNumbers.includes(n))))
          .flatMap(b => available.has(b.itemId) ? [available.get(b.itemId)!.data.title] : []);
        index.push({ id: `topic-${plan.grade}-${topic.annualNumbers[0]}`, kind: 'Тема урока', title: topic.title,
          description: names.length ? `Материалы: ${names.join(' · ')}` : 'Материалы к теме пока не добавлены.',
          meta: `${plan.grade} класс · ${quarter} четверть · ${topic.annualNumbers.length > 1 ? 'уроки' : 'урок'} ${topic.annualNumbers.join(', ')}`,
          href: `${base}klass/${plan.grade}/?quarter=${quarter}#lesson-${topic.annualNumbers[0]}`, grades: [plan.grade], keywords: names.join(' ') });
      }
    }
  }
  for (const task of tasks) {
    const grade = task.number <= 17 ? 10 : 11;
    index.push({ id: `ege-${task.number}`, kind: 'Задание ЕГЭ', title: `ЕГЭ № ${task.number} · ${task.title}`,
      description: task.summary, meta: `${grade} класс · подготовка к ЕГЭ`, href: `${base}klass/${grade}/#ege-${task.number}`,
      grades: [grade], keywords: `задание ${task.number}` });
  }
  for (const item of available.values()) {
    const binding = bindings.find(b => b.itemId === item.id);
    const refs = [...(binding?.primary ?? []), ...(binding?.related ?? []), ...(binding?.quarters ?? [])];
    const egeNumbers = egeBindings.filter(b => b.itemId === item.id).map(b => b.number);
    const grades = [...new Set([...item.data.grades, ...refs.map(r => r.grade), ...egeNumbers.map(n => n <= 17 ? 10 : 11)])].sort((a,b) => a-b);
    index.push({ id: `item-${item.id}`, kind: 'Материал', title: item.data.title, description: item.data.summary,
      meta: grades.length ? grades.map(g => `${g} класс`).join(' · ') : 'Курсы и сервисы', href: `${base}item/${item.id}/`, grades,
      keywords: [item.data.topic ?? '', ...item.data.tags, ...egeNumbers.map(n => `ЕГЭ задание ${n}`)].join(' ') });
    for (const ref of binding?.quarters ?? []) for (const quarter of ref.quarters) {
      index.push({ id: `extra-${item.id}-${ref.grade}-${quarter}`, kind: 'Материал четверти', title: item.data.title,
        description: ref.reason, meta: `${ref.grade} класс · ${quarter} четверть · дополнительные материалы`,
        href: `${base}klass/${ref.grade}/?quarter=${quarter}#quarter-additional-${quarter}`, grades: [ref.grade], keywords: 'контрольная повторение' });
    }
  }
  return index;
}

function words(value: string) {
  return value.replace(/№/g, ' ').normalize('NFKC').toLocaleLowerCase('ru').replace(/ё/g, 'е')
    .replace(/([\p{L}])(\d)/gu, '$1 $2').replace(/(\d)([\p{L}])/gu, '$1 $2')
    .match(/[\p{L}\p{N}]+/gu) ?? [];
}

function stem(word: string) {
  if (/^(логик|логичес)/.test(word)) return 'логик';
  if (['python', 'питон', 'пайтон'].includes(word)) return 'python';
  return /^[а-я]{5,}$/.test(word) ? word.replace(/(иями|ями|ами|ого|ему|ому|ыми|ими|ий|ый|ой|ая|яя|ое|ее|ые|ие|ов|ев|ам|ям|ах|ях|ом|ем|ы|и|а|я|у|ю|е)$/u, '') : word;
}

export function searchEntries(index: SearchEntry[], query: string, grade = '') {
  const tokens = words(query).map(stem);
  if (!tokens.length) return [];
  return index.filter(entry => {
    if (grade && !entry.grades.includes(Number(grade))) return false;
    const haystack = words([entry.title, entry.description, entry.meta, entry.keywords].join(' ')).map(stem);
    return tokens.every(token => /^\d+$/.test(token) ? haystack.includes(token) : haystack.some(word => word.startsWith(token)));
  }).sort((a,b) => {
    const exact = (entry: SearchEntry) => entry.title.toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru')) ? 0 : 1;
    return exact(a)-exact(b) || Number(a.kind === 'Материал')-Number(b.kind === 'Материал') || (a.grades[0] ?? 99)-(b.grades[0] ?? 99);
  });
}
