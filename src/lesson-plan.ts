export interface Plan {
  grade: number;
  quarterEnds: number[];
  lessons: string[];
}
interface Reference { grade: number; lessons: number[]; reason: string }
interface Binding { itemId: string; primary: Reference[]; related: Reference[]; quarters?: { grade: number; quarters: number[]; reason: string }[]; note?: string }
export interface Topic { title: string; number: number; annualNumbers: number[] }
export interface PlanItem { id: string; data: { access: string } }
export interface LinkedMaterial<T = PlanItem> { item: T; reason: string; note?: string }

export function quarterTopics(plan: Plan, quarter: number): Topic[] {
  const start = plan.quarterEnds[quarter - 2] ?? 0;
  const topics = new Map<string, Topic>();
  plan.lessons.slice(start, plan.quarterEnds[quarter - 1]).forEach((title, index) => {
    const key = title.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru');
    const found = topics.get(key);
    if (found) found.annualNumbers.push(start + index + 1);
    else topics.set(key, { title, number: topics.size + 1, annualNumbers: [start + index + 1] });
  });
  return [...topics.values()];
}

export function lessonRanges(numbers: number[]) {
  const sorted = [...new Set(numbers)].sort((a, b) => a - b);
  const ranges: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const first = sorted[i];
    while (i + 1 < sorted.length && sorted[i + 1] === sorted[i] + 1) i++;
    ranges.push(first === sorted[i] ? String(first) : `${first}–${sorted[i]}`);
  }
  return ranges.join(', ');
}

// Классы каталога не ограничивают привязки: материал может подходить другому классу.
export function topicMaterials<T extends PlanItem>(topics: Topic[], items: T[], bindings: Binding[], grade: number) {
  const shown = new Set<string>();
  const byId = new Map(bindings.map(binding => [binding.itemId, binding]));
  return topics.map(topic => {
    const primary: LinkedMaterial<T>[] = [];
    const related: LinkedMaterial<T>[] = [];
    for (const item of items) {
      const binding = byId.get(item.id);
      if (!binding || item.data.access === 'soon') continue;
      const matches = (refs: Reference[]) => refs.filter(ref => ref.grade === grade && ref.lessons.some(n => topic.annualNumbers.includes(n)));
      const main = matches(binding.primary);
      const extra = matches(binding.related);
      if (!main.length && !extra.length) continue;
      const material = { item, reason: [...new Set([...main, ...extra].map(r => r.reason))].join(' '), note: binding.note };
      if (main.length && !shown.has(item.id)) {
        primary.push(material);
        shown.add(item.id);
      } else related.push(material);
    }
    return { ...topic, primary, related };
  });
}

// Дополнения к четверти задаются явно: отсутствие урока не означает принадлежность любой четверти.
export function quarterMaterials<T extends PlanItem>(items: T[], bindings: Binding[], grade: number, quarter: number): LinkedMaterial<T>[] {
  return items.flatMap(item => {
    if (item.data.access === 'soon') return [];
    const binding = bindings.find(b => b.itemId === item.id);
    const refs = binding?.quarters?.filter(ref => ref.grade === grade && ref.quarters.includes(quarter)) ?? [];
    return refs.length ? [{ item, reason: [...new Set(refs.map(ref => ref.reason))].join(' '), note: binding?.note }] : [];
  });
}
