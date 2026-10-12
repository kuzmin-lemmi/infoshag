// Общие настройки сайта — меняйте здесь
export const SITE = {
  name: 'Инфошаг',
  short: 'Инфошаг',
  tagline: 'Игры и тренажёры по информатике для 5–11 классов и подготовки к ОГЭ и ЕГЭ',
  sub: '5–11 классы · Подготовка к ОГЭ и ЕГЭ',
  author: 'Антон Кузьмин',
  github: 'https://github.com/kuzmin-lemmi',
  vk: '',          // ссылка на сообщество ВК, когда появится витрина
};

export const TYPES = {
  game:    { label: 'Игра',      plural: 'Игры для уроков' },
  trainer: { label: 'Тренажёр',  plural: 'Тренажёры' },
  course:  { label: 'Курс',      plural: 'Курсы' },
  app:     { label: 'Программа', plural: 'Программы и сервисы' },
} as const;

export const ACCESS = {
  free:     'Бесплатно',
  paid:     'По подписке',
  external: 'На внешней площадке',
  soon:     'Скоро',
} as const;
