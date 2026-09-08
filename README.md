# Marianna Accerboni — Art Exhibitions Website

Bilingual (English default, Italian at `/it/`) art-exhibitions website built with
**Astro** (SSG) + **Vue** components, **Sveltia CMS** for content administration,
and **GitHub Pages** for hosting. No database, no server — content lives as
Markdown in this repository.

## Stack

| Concern | Technology |
|---|---|
| Front-end | Astro (static site generation) + Vue islands |
| Admin / CMS | Sveltia CMS at `/admin/` (GitHub backend) |
| Content | Markdown files in `src/content/exhibitions/{en,it}/` |
| Media | `public/media/` (committed to the repo) |
| Hosting | GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`) |
| i18n | English at `/`, Italian at `/it/` |

## Commands

Requires Node.js ≥ 22.12.

```sh
npm install        # install dependencies
npm run dev        # local dev server at localhost:4321
npm run build      # production build to ./dist/
npm run preview    # preview the production build
```

## Content model

Each exhibition is one Markdown file per locale with frontmatter:

```yaml
---
title: "Exhibition title"
slug: "unique-slug"          # same slug in EN and IT files
locale: "en"                  # or "it"
artists: ["Artist Name"]
venue: "Gallery name"
city: "City"
startDate: 2026-11-15         # drives the "Coming exhibitions" section
endDate: 2027-01-10           # optional
coverImage: "/media/..."      # optional
gallery: ["/media/..."]       # optional
attachments:                  # optional PDFs etc.
  - { label: "Press release", file: "/media/press.pdf" }
videos: ["https://www.youtube.com/embed/..."]  # optional embeds
draft: false
---

Body text in Markdown.
```

## Setup steps still required (not done yet)

1. **Create the GitHub repository** and push this project.
2. **Enable GitHub Pages**: repo Settings → Pages → Source: "GitHub Actions".
3. **OAuth gateway for the CMS**: Sveltia CMS with the GitHub backend needs a
   small OAuth endpoint. Deploy a free serverless gateway (e.g.
   [`decap-cms-github-oauth`](https://github.com/ukutaht/decap-cms-github-oauth)
   or equivalent on Vercel/Cloudflare Workers free tier), then update
   `public/admin/config.yml`:
   - `backend.repo`: `YOUR_GITHUB_USERNAME/YOUR_REPO`
   - `backend.base_url`: your OAuth gateway URL
4. **Register a GitHub OAuth App** (Settings → Developer settings → OAuth Apps)
   with the gateway's callback URL, and configure the gateway with the
   client ID/secret.

## Notes

- Publishing a change through the CMS commits to the repo, which triggers a
  rebuild (~1–2 min before the change is live).
- Prefer YouTube/Vimeo embeds for videos instead of uploading video files
  (GitHub Pages has a 1 GB site size limit).
- The CMS admin UI is set to Italian (`locale: it` in
  `public/admin/config.yml`).
