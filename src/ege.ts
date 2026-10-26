import type { PlanItem, LinkedMaterial } from './lesson-plan';
interface Task { number: number; title: string; summary: string }
interface Binding { number: number; itemId: string; kind: string; reason: string; notice?: string }

export function egeRows<T extends PlanItem>(tasks: Task[], bindings: Binding[], items: T[], grade: number) {
  const [first, last] = grade === 10 ? [1, 17] : grade === 11 ? [18, 27] : [0, -1];
  const available = new Map(items.filter(item => item.data.access !== 'soon').map(item => [item.id, item]));
  return tasks.filter(task => task.number >= first && task.number <= last).map(task => {
    const primary: LinkedMaterial<T>[] = [];
    const related: LinkedMaterial<T>[] = [];
    const notices: string[] = [];
    for (const binding of bindings.filter(binding => binding.number === task.number)) {
      const item = available.get(binding.itemId);
      if (!item) continue;
      (binding.kind === 'primary' ? primary : related).push({ item, reason: binding.reason });
      if (binding.notice) notices.push(binding.notice);
    }
    return { ...task, primary, related, notices: [...new Set(notices)] };
  });
}
