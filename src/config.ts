// Общие настройки сайта — меняйте здесь
export const SITE = {
  name: 'Инфошаг',
  short: 'Инфошаг',
  tagline: 'Игры и тренажёры по информатике для 5–11 классов и подготовки к ОГЭ и ЕГЭ',
  sub: '5–11 классы · Подготовка к ОГЭ и ЕГЭ',
  author: 'Антон Кузьмин',
  github: 'https://github.com/kuzmin-lemmi',
  // классы сайта: страницы и пункты меню есть у всех, даже если материалов пока нет
  grades: [5, 6, 7, 8, 9, 10, 11],
  vk: 'https://vk.ru/infoshag',
};

export const TYPES = {
  game:    { label: 'Игра',      plural: 'Игры для уроков' },
  trainer: { label: 'Тренажёр',  plural: 'Тренажёры' },
  guide:   { label: 'Разбор',    plural: 'Разборы заданий' },
  course:  { label: 'Курс',      plural: 'Курсы' },
  app:     { label: 'Программа', plural: 'Программы и сервисы' },
} as const;

// Материалы для школьных уроков: попадают на полки классов, в журнал класса и в карту сайта
export const SCHOOL_TYPES: readonly string[] = ['game', 'trainer', 'guide'];

export const ACCESS = {
  free:     'Бесплатно',
  paid:     'По подписке',
  external: 'На внешней площадке',
  soon:     'Скоро',
} as const;
