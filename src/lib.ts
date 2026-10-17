// Ссылка на сам материал: файл на сайте или внешний адрес
export const openHref = (url: string) => /^https?:\/\//.test(url) ? url : import.meta.env.BASE_URL + url;
export const pageHref = (id: string) => `${import.meta.env.BASE_URL}item/${id}/`;
// Игра лежит на сайте одним HTML-файлом — такую открываем через постоянный адрес /igra/<slug>/
export const isLocalGame = (url: string) => !/^https?:\/\//.test(url) && url.endsWith('.html');
// Ссылка «Играть»: для игр на сайте — /igra/<slug>/ (не прямой файл), для внешних — их адрес
export const playHref = (item: { id: string; data: { url: string } }) =>
  isLocalGame(item.data.url) ? `${import.meta.env.BASE_URL}igra/${item.id}/` : openHref(item.data.url);
export const klassHref = (g: number) => `${import.meta.env.BASE_URL}klass/${g}/`;
export const klassName = (g: number) => g === 9 ? '9 класс · ОГЭ' : `${g} класс`;
export const gradeLabel = (g: number[]) => g.length ? g.map(x => `${x} класс`).join(', ') : '';
// Скачивание игры одним HTML-файлом — пока только для бесплатных игр, лежащих на сайте
export const downloadHref = (d: { url: string; access: string }) =>
  d.access === 'free' && isLocalGame(d.url) ? openHref(d.url) : '';
export const downloadName = (url: string) => url.split('/').pop() ?? url;
// Цвет игры → читаемые варианты (контраст ≥ 4.6:1, WCAG AA с запасом):
// --cb — для кнопок с белым текстом и текста на светлой теме (затемняем), --cd — для текста на тёмной теме (осветляем)
const channel = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const luminance = ([r, g, b]: number[]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const contrast = (a: number[], b: number[]) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const toRgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const toHex = (c: number[]) => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const shift = (hex: string, against: number[]) => {
  const from = toRgb(hex), to = against[0] > 127 ? [0, 0, 0] : [255, 255, 255];
  for (let t = 0; t <= 1; t += 0.02) {
    const c = from.map((v, i) => v + (to[i] - v) * t);
    if (contrast(c, against) >= 4.6) return toHex(c);
  }
  return toHex(to);
};
export const colorVars = (hex: string) =>
  `--c:${hex};--cb:${shift(hex, [255, 255, 255])};--cd:${shift(hex, [15, 33, 71])}`;
// Картинка превью ссылки — карточка с названием игры, собранная при сборке (src/pages/og/[id].png.ts)
export const ogImage = (item: { id: string }) => `og/${item.id}.png`;
