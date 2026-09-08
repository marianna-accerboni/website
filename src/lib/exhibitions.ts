import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/ui';

export type Exhibition = CollectionEntry<'exhibitions'>;

export async function getExhibitions(locale: Locale): Promise<Exhibition[]> {
  const all = await getCollection('exhibitions', ({ data }) => !data.draft);
  return all.filter((entry) => entry.data.locale === locale);
}

export function splitByDate(exhibitions: Exhibition[], now = new Date()) {
  const upcoming = exhibitions
    .filter((e) => e.data.startDate >= now)
    .sort((a, b) => a.data.startDate.getTime() - b.data.startDate.getTime());

  const past = exhibitions
    .filter((e) => e.data.startDate < now)
    .sort((a, b) => b.data.startDate.getTime() - a.data.startDate.getTime());

  return { upcoming, past };
}

export async function findLocalizedPair(slug: string) {
  const all = await getCollection('exhibitions');
  return {
    en: all.find((e) => e.data.slug === slug && e.data.locale === 'en'),
    it: all.find((e) => e.data.slug === slug && e.data.locale === 'it')
  };
}
