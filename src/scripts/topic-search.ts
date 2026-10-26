import { searchEntries } from '../search';
import type { SearchEntry } from '../search';

export function initTopicSearch(root: HTMLElement) {
  const doc = root.ownerDocument;
  const win = doc.defaultView!;
  const index: SearchEntry[] = JSON.parse(root.querySelector('#topic-search-index')!.textContent!);
  const form = root.querySelector<HTMLFormElement>('form')!;
  const query = root.querySelector<HTMLInputElement>('[name="q"]')!;
  const grade = root.querySelector<HTMLSelectElement>('[data-search-grade]')!;
  const list = root.querySelector<HTMLElement>('[data-search-results]')!;
  const status = root.querySelector<HTMLElement>('[data-search-status]')!;
  function render(writeURL = false) {
    const text = query.value.trim();
    const results = searchEntries(index, text, grade.value);
    list.replaceChildren();
    const fragment = doc.createDocumentFragment();
    for (const result of results) {
      const row = doc.createElement('li');
      const meta = doc.createElement('p'); meta.className = 'result-meta'; meta.textContent = `${result.kind} · ${result.meta}`;
      const title = doc.createElement('h2');
      const link = doc.createElement('a'); link.href = result.href; link.textContent = result.title; title.append(link);
      const description = doc.createElement('p'); description.className = 'result-description'; description.textContent = result.description;
      const open = doc.createElement('a'); open.href = result.href; open.className = 'result-open'; open.textContent = result.kind === 'Тема урока' ? 'Перейти к теме →' : result.kind === 'Задание ЕГЭ' ? 'Перейти к заданию →' : result.kind === 'Материал четверти' ? 'Материалы четверти →' : 'Открыть материал →';
      row.append(meta, title, description, open); fragment.append(row);
    }
    list.append(fragment);
    status.textContent = !text ? 'Введите тему или название материала.' : results.length ? `Найдено: ${results.length}.` : 'Ничего не найдено. Попробуйте другое слово или выберите все классы.';
    if (writeURL) {
      const url = new URL(win.location.href);
      if (text) url.searchParams.set('q', text); else url.searchParams.delete('q');
      if (grade.value) url.searchParams.set('grade', grade.value); else url.searchParams.delete('grade');
      win.history.replaceState(null, '', url);
    }
  }
  function readURL() {
    const params = new URL(win.location.href).searchParams;
    query.value = (params.get('q') ?? '').slice(0,200);
    grade.value = [...grade.options].some(option => option.value === params.get('grade')) ? params.get('grade')! : '';
    render();
  }
  form.addEventListener('submit', event => { event.preventDefault(); render(true); });
  query.addEventListener('input', () => render(true));
  grade.addEventListener('change', () => render(true));
  win.addEventListener('popstate', readURL);
  readURL();
}
