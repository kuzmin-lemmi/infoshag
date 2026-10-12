import { defineConfig } from 'astro/config';

// Адрес сайта: свой домен infoshag.ru (DNS у Beget, хостинг — GitHub Pages).
// Домен задан в репозитории: Settings → Pages → Custom domain.
export default defineConfig({
  site: process.env.SITE_URL || 'https://infoshag.ru',
  base: process.env.BASE || '/',
  trailingSlash: 'always',
});
