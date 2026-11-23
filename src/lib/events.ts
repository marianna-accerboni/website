import { getCollection, type CollectionEntry } from 'astro:content';

export type EventEntry = CollectionEntry<'events'>;
export type SubEventEntry = CollectionEntry<'subEvents'>;

const MONTHS = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'
];
const MONTHS_SHORT = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

/** Dates are wall-clock values stored in UTC (see content.config.ts); 00:00 means "no time given". */
const isDateOnly = (d: Date) => d.getUTCHours() === 0 && d.getUTCMinutes() === 0;

function parts(d: Date) {
  const dateOnly = isDateOnly(d);
  return {
    day: d.getUTCDate(),
    month: d.getUTCMonth(),
    year: d.getUTCFullYear(),
    hours: dateOnly ? null : d.getUTCHours(),
    minutes: dateOnly ? null : d.getUTCMinutes()
  };
}

/** Calendar year of a date, consistent with the formatting helpers. */
export const yearOf = (d: Date) => parts(d).year;

/** "14 maggio 2011" */
export function formatDate(d?: Date | null, withYear = true): string {
  if (!d) return '';
  const p = parts(d);
  return `${p.day} ${MONTHS[p.month]}${withYear ? ` ${p.year}` : ''}`;
}

/** "14 mag 2011" */
export function formatDateShort(d?: Date | null): string {
  if (!d) return '';
  const p = parts(d);
  return `${p.day} ${MONTHS_SHORT[p.month]} ${p.year}`;
}

/** "ore 18.30", or '' for date-only values */
export function formatTime(d?: Date | null): string {
  if (!d) return '';
  const p = parts(d);
  if (p.hours === null) return '';
  return `ore ${p.hours}.${String(p.minutes).padStart(2, '0')}`;
}

export function dateTile(d: Date) {
  const p = parts(d);
  return { day: String(p.day), month: MONTHS_SHORT[p.month], year: String(p.year) };
}

/** "14 maggio – 1 giugno 2011", dropping the repeated year (and month) when possible. */
export function formatRange(start?: Date | null, end?: Date | null): string {
  if (start && end) {
    const a = parts(start);
    const b = parts(end);
    if (a.year === b.year && a.month === b.month && a.day === b.day) return formatDate(start);
    if (a.year === b.year && a.month === b.month) return `${a.day} – ${b.day} ${MONTHS[b.month]} ${b.year}`;
    if (a.year === b.year) return `${a.day} ${MONTHS[a.month]} – ${b.day} ${MONTHS[b.month]} ${b.year}`;
    return `${formatDate(start)} – ${formatDate(end)}`;
  }
  return formatDate(start || end);
}

/** First segment of a venue string: "Galleria One San Nicolò · via S. Nicolò 1 · Trieste" -> "Galleria One San Nicolò". */
export function venueShort(venue?: string | null): string {
  if (!venue) return '';
  return venue.split(/\s+[·•⋅–]\s+|\s+-\s+/)[0].replace(/\s*\(.*?\)\s*$/, '').trim();
}

/** The city is normally the last segment of the venue string. */
export function venueCity(venue?: string | null): string {
  if (!venue) return '';
  const segs = venue.split(/\s+[·•⋅]\s+/);
  if (segs.length < 2) return '';
  return segs[segs.length - 1].replace(/^\d{5}\s+/, '').replace(/\s*\(.*\)$/, '').trim();
}

/** Date used to order events: opening, then period start, then the creation date of the original article. */
export function sortDate(e: EventEntry): Date {
  const i = e.data.info;
  if (i?.openingDate) return i.openingDate;
  if (i?.periodStart) return i.periodStart;
  if (e.data.createdAt) return e.data.createdAt;
  const y = e.data.slug.match(/(19|20)\d{2}(?!.*\d{4})/);
  return y ? new Date(Date.UTC(Number(y[0]), 0, 1)) : new Date(0);
}

/** End of the event's life, used to decide whether it is still coming or ongoing. */
export function endDate(e: EventEntry): Date | null {
  const i = e.data.info;
  const d = i?.periodEnd ?? i?.openingDate ?? i?.periodStart ?? null;
  if (!d) return null;
  // a date-only end means "until the end of that day"
  return isDateOnly(d) ? new Date(d.getTime() + 24 * 3600 * 1000 - 1) : new Date(d.getTime() + 3 * 3600 * 1000);
}

/** Plain-text excerpt from the press release, skipping short lines, captions and embeds. */
export function excerpt(md?: string | null, max = 190): string {
  if (!md) return '';
  const paras = md
    .split(/\n\s*\n/)
    .map((p) =>
      p
        .replace(/<[^>]+>/g, ' ')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[*_`#>]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter((p) => p.length > 60 && !/^(video|introduzione critica|2° inaugurazione|2ª sede)/i.test(p));
  const text = paras[0] ?? '';
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.\-–]$/, '') + '…';
}

/** Lower-case, accent-free text for client-side search. */
export function searchable(...chunks: (string | undefined | null)[]): string {
  return chunks
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[*_`#>\[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/** Published events, newest first, each with its catalogue number (oldest = 1). */
export async function getEvents() {
  const events = await getCollection('events', ({ data }) => !data.draft);
  const sorted = events.sort((a, b) => sortDate(b).getTime() - sortDate(a).getTime());
  return sorted.map((e, i) => ({ entry: e, number: sorted.length - i }));
}

/** Sub-events of an event, in the order the event lists them (newest first, as on the old site). */
export async function getSubEvents(event: EventEntry) {
  const all = await getCollection(
    'subEvents',
    ({ data }) => !data.draft && (data.parent === event.data.slug || data.parent === event.data.title)
  );
  const order = (event.data.subEvents ?? []) as string[];
  return all.sort((a, b) => {
    const ia = order.indexOf(a.data.title);
    const ib = order.indexOf(b.data.title);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
}

const WEEKDAYS = '(?:lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica)';
const MONTH_RE = MONTHS.join('|');

/** A date label for a news item, only when its title starts with a date ("Domenica 11 agosto ..."). */
export function newsDateLabel(title: string, fallbackYear?: number): string {
  const m = title.match(new RegExp(`^(?:${WEEKDAYS}\\s+)?(\\d{1,2})\\s+(${MONTH_RE})(?:\\s+(\\d{4}))?`, 'i'));
  if (!m) return '';
  const year = m[3] ?? (fallbackYear ? String(fallbackYear) : '');
  return `${m[1]} ${m[2].toLowerCase()}${year ? ` ${year}` : ''}`;
}
