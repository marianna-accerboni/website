# Marianna Accerboni

Sito di Marianna Accerboni, critica e curatrice d'arte: un archivio di eventi (mostre, inaugurazioni, presentazioni) con comunicato stampa, notizie collegate, scheda informativa e galleria. Tutto in italiano, con tema scuro e chiaro.

È un sito statico (Astro, una pagina HTML per evento), senza database e senza server. I contenuti sono file Markdown in questo repository e si modificano da un pannello di amministrazione.

- Sito: https://marianna-accerboni.github.io/website/
- Amministrazione: https://marianna-accerboni.github.io/website/admin/

## Tecnologie

| Cosa | Con cosa |
|---|---|
| Sito | Astro (generazione statica), HTML, CSS e piccoli script, nessun framework |
| Contenuti | Markdown con frontmatter in `src/content/` |
| Amministrazione | Sveltia CMS in `public/admin/` (accesso con GitHub) |
| Accesso al CMS | Piccolo servizio OAuth su Cloudflare Workers in `oauth-worker/` |
| Immagini e PDF | `public/media/`, nel repository |
| Pubblicazione | GitHub Pages, tramite GitHub Actions (`.github/workflows/deploy.yml`) a ogni push su `main` |

## Comandi

Serve Node.js 22.12 o successivo.

```sh
npm install        # installa le dipendenze
npm run dev        # sito locale su http://localhost:4321/website/
npm run build      # build di produzione in ./dist/
npm run preview    # anteprima della build
```

Il server locale ascolta solo su IPv6: per l'amministrazione in locale aprire `http://[::1]:4321/website/admin/index.html`.

## Contenuti

### Eventi — `src/content/events/*.md`

Un file per evento. Campi principali:

- `title`, `slug`, `createdAt` (data dell'articolo originale, usata per l'ordinamento quando mancano date).
- `coverImage`: immagine di copertina.
- `info`: scheda dell'evento. Data di inaugurazione, periodo, sede, orario, curatela, catalogo, info e contatti, inviti da scaricare.
- `press.pressRelease`: comunicato stampa in Markdown.
- `gallerySection.gallery`: immagini della galleria (titolo e testo alternativo opzionali).
- `subEvents`: titoli delle notizie collegate, nell'ordine in cui compaiono.
- `draft`: se vero l'evento non viene pubblicato.

L'ordine in elenco segue la data di inaugurazione, poi l'inizio del periodo, poi `createdAt`. Un evento con `createdAt` nel futuro compare nel riquadro "Prossimi eventi" della home (al massimo tre).

Le date sono scritte come ora locale e mostrate identiche su qualsiasi computer (internamente sono trattate come UTC). L'ora 00:00 significa "ora non indicata".

### Notizie collegate — `src/content/sub-events/*.md`

Aggiornamenti legati a un evento (proroghe, visite guidate, finissage). Si collegano all'evento con `parent` (lo slug dell'evento) e compaiono nella scheda "Notizie" dell'evento come linea del tempo. Campi: titolo, immagine, testo e, facoltativamente, una data (con ora) mostrata sopra il titolo; senza data si usa quella eventualmente scritta all'inizio del titolo. Le immagini di una notizia vanno nella galleria dell'evento principale.

### Sedi — `src/data/venues/*.md`

Elenco delle sedi usato solo dal menu a tendina "Sede" dell'amministrazione, per evitare doppioni. Per aggiungere una sede si crea una voce nella raccolta "Sedi".

## Testi lunghi

Nel Markdown dei testi, una riga in grassetto seguita da un elenco di voci `Etichetta: valore` diventa una scheda:

```md
**Titolo della scheda**

- Sede: Galleria X
- Orario: 10–18
- Info: 040 123456
```

Altre convenzioni: un'immagine isolata in un paragrafo diventa una figura (la didascalia è il titolo dell'immagine); due o più video di seguito si affiancano; le immagini nel testo si ingrandiscono al clic.

## Struttura

```
src/
  content/        eventi e notizie collegate
  data/venues/    sedi per il menu dell'amministrazione
  layouts/        BaseLayout (testata, ricerca, tema, piè di pagina)
  lib/            date, ordinamento, estratti e conversione del Markdown
  pages/          home (index.astro) e pagina evento (events/[slug].astro)
  styles/         variabili dei temi e stili dei testi
public/
  admin/          Sveltia CMS (index.html, config.yml, custom.js, custom.css)
  media/          immagini e PDF
oauth-worker/     servizio di accesso per il CMS
.claude/skills/   strumento per importare articoli dal vecchio sito
```

## Pubblicazione e accesso al CMS

Ogni push su `main` avvia `npm ci` e `npm run build` e pubblica la cartella `dist/` su GitHub Pages (Settings → Pages → Source: GitHub Actions).

Il CMS usa il backend GitHub e quindi ha bisogno di un endpoint OAuth: è il Worker in `oauth-worker/`, il cui indirizzo è indicato in `public/admin/config.yml` (`base_url`). Le credenziali dell'app OAuth di GitHub sono segreti del Worker e non stanno nel repository.
