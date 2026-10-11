// Общие настройки сайта — меняйте здесь
export const SITE = {
  name: 'Мастерская Антона Кузьмина',
  short: 'Мастерская',
  tagline: 'Игры для уроков информатики, курсы и программы — всё, что я делаю, в одном месте',
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
