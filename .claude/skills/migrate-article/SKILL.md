---
name: migrate-article
description: Migrate articles ("Eventi") from the old site www.mariannaaccerboni.com into this Astro/Sveltia project as events and sub-events, following the owner's rules. Use whenever the user gives an old-site link such as /events/detail/id/NNN or a listing page /events/N and asks to import, migrate, add or enter articles.
---

# Migrating articles from the old site

The old site (`http://www.mariannaaccerboni.com`, Italian) calls an article an **Evento**.
Each one becomes one **event** (`src/content/events/<slug>.md`) plus zero or more
**sub-events** (`src/content/sub-events/<slug>.md`), the "news" attached to it.
Everything is committed straight to `main` (the owner works alone and the site is not public yet): no branches or PRs needed.

## 0. Inputs and fetching

- Listing page: `/events/N` shows 10 articles. Detail page: `/events/detail/id/NNN`.
- Fetch raw HTML with `curl -sL`, save as `$MIGRATE_WORK/a<ID>.html` (default `/tmp/migrate`).
  Do not use a summarising fetch tool, the exact HTML is needed.
- Before importing, grep `src/content` to make sure the article is not already there (the owner sometimes re-sends one).
  If it already exists, say so and do not import again.
- Downloading the article's images and PDFs from the old site is expected (the owner asked for it).

## 1. Anatomy of an old article

1. Header: cover thumbnail (`lightbox-gallery-header`), title (`<h2>`), date (ignore, not stored).
2. "INFORMAZIONI UTILI" table: Inaugurazione/Presentazione, Dove, Quando, Orario, A cura di, Catalogo, Info e contatti, Downloads.
3. One or more "NEWS RELATIVE ALL'EVENTO" blocks, separated by `<hr>`: these are the **sub-events**.
4. "COMUNICATO STAMPA": the body of the article (press release) with photos placed inside the text.
   Some pages end with sections such as BIOGRAFIA, APPUNTAMENTI COLLATERALI, VIDEOGRAFIA: keep them as bold headings in the press release.
5. Gallery thumbnails (`lightbox-gallery-body`): the **gallery**, in page order. The header image is normally also gallery item 1.

## 2. Field mapping (event)

Schema: `src/content.config.ts`. CMS config: `public/admin/config.yml`.

| Old page | Field |
|---|---|
| Title | `title`, written in **sentence case** (old titles are often ALL CAPS), proper nouns capitalised, typos fixed |
| (chosen) | `slug`: short, lowercase, no accents, e.g. `fabio-colussi-orizzonti-di-luce`, add the year when useful (`...-2019`). The file name equals the slug |
| Header image | `coverImage` |
| Inaugurazione / Presentazione | `info.openingDate` as `YYYY-MM-DD HH:mm` (always include a time) |
| Dove | `info.venue`, must be a name from the venue bank `src/data/venues/*.md`. **Reuse an existing venue whenever it is the same place**, even if the old page spells it a little differently (extra hall name, comma, address detail). Only a genuinely new place gets a new venue file (see "Venues" below) |
| Quando | `info.periodStart` / `info.periodEnd` (`YYYY-MM-DD`). **Only when the old page has a period.** One-off events (book/catalog presentations, concerts) get no period |
| Orario | `info.time`, copied as written |
| A cura di | `info.curator`. If the line is missing, leave it out |
| Catalogo | `info.hasCatalog` (Sì = true, No or missing = false) |
| Info e contatti | `info.infoContacts`, one line separated by ` · `, multi-line as a `|-` block |
| Downloads "Scarica l'invito" | `info.invitations` (PDF copied locally) |
| Comunicato stampa | `press.pressRelease` (Markdown) |
| Gallery | `gallerySection.gallery` (empty gallery: `gallerySection: null`) |

Special cases:
- **Two openings / two venues** (e.g. article 310): put the **first** one in the info block and the second one as a short paragraph at the very top of the press release ("2° inaugurazione: ...").
  (Article 326 was imported earlier with both merged into the info block; it can be redone like 310.)
- **Container event** with no event info, only sub-events (e.g. article 303): `info: null`; the press release is the programme text.
- Info "Dove" with an extra address that looks pasted from another article: use the real venue only and flag it.

### Venues (no duplicates)

- Before creating a venue, read the bank (`grep '^name:' src/data/venues/*.md`) and decide whether the place already exists. Same building = same venue: "Sala Xenia", "Sede della Comunità Greco-Orientale" and "Sala del Giubileo" are one venue; "Museo Revoltella" and "Auditorium Museo Revoltella" are one venue; "Circolo della Stampa" and "Sala Paolo Alessi del Circolo della Stampa" are one venue.
- The importer does this check for you: `importer.do2` passes every `info.venue` through `imp.resolve_venue()`, which reuses a near-identical existing name (prints `REUSE venue`) and only creates a file when nothing matches. Read the `REUSE` and `CHECK similar venue` lines of the output; if a `CHECK` line is the same place, merge it by hand (point the event to the existing name and delete the new file).
- A different gallery that happens to share an address (Melori & Rosenberg vs Ghetto Et Cetera, Campo del Ghetto Novo 2919) stays separate. An itinerary with two places in one event may be one combined venue.
- Venue names are written once and reused exactly: no stray punctuation, one canonical spelling.

## 3. Sub-events

- Each "news" block is one sub-event: `title` = the block's headline (sentence case), `parent` = the **event slug**, `bodySection.body` = the Markdown of the block **without the headline**.
- `info: null`. Dates are written in the text, not in fields.
- **No cover image** on a sub-event, unless the news block has its own photo, which then stays inside its body. Never copy the main event's picture.
- Videos (YouTube/Facebook `<iframe>`) stay in the body in their original position: text, video, text, video.
- PDF "news" listed only in the Downloads cell (e.g. press-office PDFs): one sub-event per PDF whose body is a link to the PDF; read the PDF to write the title.
- Sub-event files are linked to the event by `parent` (slug) and the event lists the sub-event titles under `subEvents` (nested list `- - "title"`, the format the CMS writes).

## 4. Images and captions

- Original files are downloaded from `/file/get/Eventi/<folder>/gallery/<name>` (full size, not the `/file/image/...` thumbnails) and from `.../downloads/<name>` for PDFs.
  One article uses `download/` (singular) and some hrefs contain `&#10;`: unescape and strip them.
  Files whose names contain spaces, commas or parentheses: download with the URL-encoded name and save under a safe name (underscores, no punctuation), then use that name everywhere.
- Store them in `public/media/events/<event-slug>/` (PDFs too). Reference as `/media/events/<event-slug>/<file>`. Keep original file names.
- Every image gets alt text **and** title = the caption of the old page, otherwise the file name with underscores turned into spaces.
- **Do not repeat the caption as text** below an image in the press release (the image already carries it). Remove it, including multi-line captions. `scripts/dedupe2.py` finds leftovers.
- Cover image = the header image, also first gallery item.

## 5. Markdown conventions (match what Sveltia CMS writes, otherwise Save is active on first open)

- Keep bold and italic from the old HTML: bold `**text**`, italic `_text_` (underscore!), bold+italic `**_text_**`. A bold link is `[**text**](url)`.
- Leading punctuation moves outside the emphasis (`FVG, **il patrocinio**`).
- Straight apostrophes (`’` becomes `'`), keep curly double quotes “ ”.
- Lists as `- item`; `<br>` becomes a paragraph break; drop empty paragraphs and `&nbsp;`.
- Raw `<iframe ...></iframe>` lines are allowed (rehype-raw).
- Front matter: `createdAt` in local time without zone or seconds (`2026-11-11T11:44:00`); related events as `subEvents:\n  - - "title"`; `gallerySection: null` when no gallery; `info: null` when no info.
- Old-site links in the text are kept as they are.

## 6. Procedure

1. Fetch the article(s); read the structure with `python3 scripts/view_article.py <ID> 200` (set `MIGRATE_WORK`).
2. Decide title, slug, info values, sub-event titles and slugs.
3. Write a config like `scripts/example_import_page8.py` (uses `importer.do2`, which downloads media, converts HTML to Markdown, writes event, sub-events and new venues).
4. Run `python3 scripts/dedupe2.py --all` from the repo root and check nothing new is reported.
5. `npx astro build` (Node 22: `nvm use 22`), check every `/media/...` reference exists, open the pages in the dev server (`http://localhost:4321/website/events/<slug>/`), check images load, videos and PDFs work, no stray `*` or `_`.
6. Commit to `main` (do not push without being asked).
7. Tell the owner what was decided on their behalf (titles written for sub-events, merged venues, typos fixed, anything dubious on the old page).

## 7. Known pending items

- 7 images referenced by the older Leonor Fini sub-events (`/media/events/leonor-fini-memorie-triestine/...`) do not exist.
- Older imports (before this skill) may still contain a caption repeated under an image (Leonor Fini segreta, Luisia Comelli, Mauro Martoriati) and sub-events that carry the event photo as cover.
- Some old articles keep images and PDFs in **nested folders** (e.g. `/Eventi/dominioni_2016/gallery/incontro_gualtieri/gallery/<file>`, invitation at `.../gallery/finissage/downloads/<pdf>`). Keep the sub-path when downloading (`reg()` in `mdconv.py` does this) and pass `dlkind='gallery/<sub>/downloads'` for such PDFs. A burst of HTTP 500 on image downloads almost always means a wrong path, not a broken old site: look at the real `href` before giving up.
- If an image is truly unavailable, run `python3 .claude/skills/migrate-article/scripts/prune_missing.py --apply <files>`, tell the owner, and remove `coverImage` if the cover is missing.
- Some old titles carry wrong years (title says 2017, table says 2016): the table wins, fix the title and flag it. Old titles with admin-style prefixes ("Gorizia inaugurazione - ...") are kept.
- Admin: Sveltia CMS 0.210.3 is pinned in `public/admin/index.html`; its `sortable_fields` must use the `{fields, default}` object form.
