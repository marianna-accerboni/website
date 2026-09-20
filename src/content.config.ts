import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const optionalDate = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.coerce.date().optional()
);

const infoSection = z.object({
  openingDate: optionalDate,
  venue: z.string().optional(),
  periodStart: optionalDate,
  periodEnd: optionalDate,
  time: z.string().optional(),
  curator: z.string().optional(),
  hasCatalog: z.boolean().default(false),
  infoContacts: z.string().optional(),
  invitations: z.array(z.string()).default([])
});

const pressSection = z.object({
  pressRelease: z.string().optional()
});

const gallerySection = z.object({
  gallery: z
    .array(
      z.object({
        image: z.string(),
        alt: z.string().optional(),
        title: z.string().optional()
      })
    )
    .default([])
}).nullable();

const events = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/events'
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    coverImage: z.string().optional(),
    info: infoSection.nullable().optional(),
    press: pressSection.optional(),
    gallerySection: gallerySection.optional(),
    subEvents: z.array(z.string()).default([]).optional(),
    draft: z.boolean().default(false)
  })
});

const subEvents = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/sub-events'
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    parent: z.string(),
    coverImage: z.string().optional(),
    info: z
      .object({
        date: optionalDate,
        venue: z.string().optional(),
        time: z.string().optional(),
        infoContacts: z.string().optional(),
        invitations: z.array(z.string()).default([])
      })
      .nullable().optional(),
    bodySection: z.object({ body: z.string().optional() }).nullable().optional(),
    gallerySection: gallerySection.optional(),
    draft: z.boolean().default(false)
  })
});

// Option banks feeding the Sede / Curatela dropdowns
const optionBankSchema = z.object({
  name: z.string()
});

const venues = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/venues' }),
  schema: optionBankSchema
});

export const collections = { events, subEvents, venues };
