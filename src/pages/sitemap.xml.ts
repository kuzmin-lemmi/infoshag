// Карта сайта для Яндекса и Google: все страницы, кроме 404 и картинок превью
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { isLocalGame } from '../lib';

export const GET: APIRoute = async ({ site }) => {
  const base = import.meta.env.BASE_URL;
  const items = await getCollection('items');
  const school = items.filter(i => i.data.type === 'game' || i.data.type === 'trainer');
  const grades = [...new Set(school.flatMap(i => i.data.grades))].sort((a, b) => a - b);
  const day = (d?: Date) => d?.toISOString().slice(0, 10);
  const urls: [string, string?][] = [
    ['', undefined],
    ['catalog/', undefined],
    ...grades.map(g => [`klass/${g}/`] as [string]),
    ...items.map(i => [`item/${i.id}/`, day(i.data.updated ?? i.data.added)] as [string, string?]),
    ...items.filter(i => isLocalGame(i.data.url)).map(i => [`igra/${i.id}/`, day(i.data.updated ?? i.data.added)] as [string, string?]),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([p, mod]) => `  <url><loc>${new URL(base + p, site)}</loc>${mod ? `<lastmod>${mod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
