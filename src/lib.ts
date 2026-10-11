// Ссылка на сам материал: файл на сайте или внешний адрес
export const openHref = (url: string) => /^https?:\/\//.test(url) ? url : import.meta.env.BASE_URL + url;
export const pageHref = (id: string) => `${import.meta.env.BASE_URL}item/${id}/`;
export const gradeLabel = (g: number[]) => g.length ? g.map(x => `${x} класс`).join(', ') : '';
