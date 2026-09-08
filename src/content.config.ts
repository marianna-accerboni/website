import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const exhibitions = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/exhibitions'
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    artists: z.array(z.string()),
    venue: z.string(),
    city: z.string(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    coverImage: z.string().optional(),
    gallery: z.array(z.string()).default([]),
    attachments: z
      .array(z.object({ label: z.string(), file: z.string() }))
      .default([]),
    videos: z.array(z.string()).default([]),
    draft: z.boolean().default(false)
  })
});

export const collections = { exhibitions };
