import { getCollection, type CollectionEntry } from 'astro:content';

export type Exhibition = CollectionEntry<'exhibitions'>;

export async function getExhibitions(): Promise<Exhibition[]> {
  return getCollection('exhibitions', ({ data }) => !data.draft);
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
