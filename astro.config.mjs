import { defineConfig } from 'astro/config';

// Адрес сайта. Для GitHub Pages: https://<логин>.github.io и base '/<имя-репозитория>'.
// Когда появится свой домен — SITE_URL='https://ваш-домен.ru', BASE='/'.
export default defineConfig({
  site: process.env.SITE_URL || 'https://kuzmin-lemmi.github.io',
  base: process.env.BASE || '/personal_ebsite',
  trailingSlash: 'always',
});
