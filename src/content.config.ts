import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Dates are stored as "wall-clock" time in UTC: "2012-06-09 18:00" becomes 18:00 UTC,
 * "2012-06-09" becomes 00:00 UTC. This keeps the printed day and hour identical on any
 * machine (the dev laptop, the GitHub build), whatever its time zone.
 */
const optionalDate = z.preprocess((v) => {
  if (v === '' || v == null) return undefined;
  if (v instanceof Date) return v;
  const m = String(v).match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 0, m[5] ? +m[5] : 0));
  return new Date(String(v));
}, z.date().optional());

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
    createdAt: optionalDate,
    coverImage: z.string().optional(),
    info: infoSection.nullable().optional(),
    press: pressSection.optional(),
    gallerySection: gallerySection.optional(),
    subEvents: z
      .preprocess(
        (v) => (Array.isArray(v) ? v.flat(Infinity).filter((x) => typeof x === 'string') : v),
        z.array(z.string())
      )
      .default([])
      .optional(),
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
