import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Одна коллекция на всё: игры, курсы, программы. Новый тип = новое значение в type.
const items = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/items' }),
  schema: z.object({
    title: z.string(),
    type: z.enum(['game', 'trainer', 'course', 'app']),
    summary: z.string(),
    emoji: z.string().default('✨'),
    color: z.string().default('#5B6CFF'),
    url: z.string(),                          // 'games/xxx.html' — файл на сайте, или полный адрес https://…
    access: z.enum(['free', 'paid', 'external', 'soon']).default('free'),
    grades: z.array(z.number()).default([]),  // классы: [7], [8, 9]
    topic: z.string().optional(),             // тема школьного курса
    textbook: z.string().optional(),          // учебник и раздел
    duration: z.string().optional(),          // «5–10 минут»
    format: z.array(z.string()).default([]),  // «на доске», «за компьютерами»
    modes: z.array(z.string()).default([]),   // «тренировка», «контрольная на 10 минут»
    tags: z.array(z.string()).default([]),
    repo: z.string().optional(),
    order: z.number().default(100),
    video: z.string().optional(),             // ролик геймплея: 'posts/<slug>.mp4' (без звука, 15–30 с)
    poster: z.string().optional(),            // картинка из игры или первый кадр ролика: 'posts/<slug>.jpg'
    featured: z.boolean().default(false),     // при равных датах added — показать в блоке «Новое» первым
    added: z.coerce.date().optional(),        // дата публикации: самый свежий материал попадает в блок «Новое» на главной
    updated: z.coerce.date().optional(),
  }),
});

export const collections = { items };
