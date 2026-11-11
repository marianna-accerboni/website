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
| Dove | `info.venue`, must be a name from the venue bank `src/data/venues/*.md`; if new, **add a venue file** |
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
- Admin: Sveltia CMS 0.210.3 is pinned in `public/admin/index.html`; its `sortable_fields` must use the `{fields, default}` object form.
