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
// Картинка превью ссылки: своя картинка из игры (poster) или карточка, собранная при сборке
export const ogImage = (item: { id: string; data: { poster?: string } }) => item.data.poster ?? `og/${item.id}.png`;
