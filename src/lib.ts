// Ссылка на сам материал: файл на сайте или внешний адрес
export const openHref = (url: string) => /^https?:\/\//.test(url) ? url : import.meta.env.BASE_URL + url;
export const pageHref = (id: string) => `${import.meta.env.BASE_URL}item/${id}/`;
export const klassHref = (g: number) => `${import.meta.env.BASE_URL}klass/${g}/`;
export const klassName = (g: number) => g === 9 ? '9 класс · ОГЭ' : `${g} класс`;
// «Как использовать на уроке» из текста карточки; если раздела нет — первый абзац
export const howTo = (body = '') => {
  const m = body.match(/\*\*Как использовать на уроке\.?\*\*\s*([^\n]+)/);
  const text = m ? m[1] : body.split(/\n\s*\n/)[0] ?? '';
  return text.replace(/\*\*/g, '').trim();
};
export const gradeLabel = (g: number[]) => g.length ? g.map(x => `${x} класс`).join(', ') : '';
// Скачивание игры одним HTML-файлом — пока только для бесплатных игр, лежащих на сайте
export const downloadHref = (d: { url: string; access: string }) =>
  d.access === 'free' && !/^https?:\/\//.test(d.url) && d.url.endsWith('.html') ? openHref(d.url) : '';
export const downloadName = (url: string) => url.split('/').pop() ?? url;
