import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import rehypeRaw from 'rehype-raw';
import { visit, SKIP } from 'unist-util-visit';

const base = import.meta.env.BASE_URL;

/** Prefix root-relative src/href with the site base URL. */
function rehypeBaseUrls() {
  return (tree: any) => {
    visit(tree, 'element', (node: any) => {
      for (const attr of ['src', 'href']) {
        const value = node.properties?.[attr];
        if (typeof value === 'string' && value.startsWith('/') && !value.startsWith(base)) {
          node.properties[attr] = base.replace(/\/$/, '') + value;
        }
      }
    });
  };
}

const text = (value: string) => ({ type: 'text', value });
const el = (tagName: string, properties: Record<string, unknown>, children: any[]) => ({
  type: 'element',
  tagName,
  properties,
  children
});

/**
 * - A paragraph that only holds an image becomes <figure> with the image title as caption.
 * - Iframes (YouTube, Facebook) get a responsive wrapper and lazy loading.
 * - External links open in a new tab.
 */
function rehypeArt() {
  return (tree: any) => {
    visit(tree, 'element', (node: any, index: number | undefined, parent: any) => {
      if (!parent || index === undefined) return;
      if (node.tagName === 'p') {
        const kids = node.children.filter((c: any) => !(c.type === 'text' && !c.value.trim()));
        if (kids.length === 1 && kids[0].type === 'element' && kids[0].tagName === 'img') {
          const img = kids[0];
          img.properties.loading = 'lazy';
          img.properties.decoding = 'async';
          const caption = String(img.properties.title || img.properties.alt || '').trim();
          delete img.properties.title;
          const children: any[] = [img];
          if (caption) children.push(el('figcaption', {}, [text(caption)]));
          parent.children[index] = el('figure', { className: ['art-figure'] }, children);
          return SKIP;
        }
        const iframe = kids.length === 1 && kids[0].type === 'element' && kids[0].tagName === 'iframe' ? kids[0] : null;
        if (iframe) {
          parent.children[index] = wrapIframe(iframe);
          return SKIP;
        }
      }
      if (node.tagName === 'iframe' && parent.tagName !== 'div') {
        parent.children[index] = wrapIframe(node);
        return SKIP;
      }
      if (node.tagName === 'a' && typeof node.properties?.href === 'string' && (/^https?:/.test(node.properties.href) || /\.pdf(\?|#|$)/i.test(node.properties.href))) {
        node.properties.target = '_blank';
        node.properties.rel = 'noopener';
      }
    });
  };
}

/** Short lines right after a video ("Video dell'inaugurazione") are styled as its caption. */
function rehypeEmbedCaptions() {
  const textOf = (n: any): string =>
    n.type === 'text' ? n.value : (n.children || []).map(textOf).join('');
  return (tree: any) => {
    const kids = tree.children || [];
    for (let i = 0; i < kids.length; i++) {
      const n = kids[i];
      if (!(n.type === 'element' && n.tagName === 'div' && (n.properties?.className || []).includes('embed'))) continue;
      let taken = 0;
      for (let j = i + 1; j < kids.length && taken < 2; j++) {
        const c = kids[j];
        if (c.type === 'text' && !c.value.trim()) continue;
        if (c.type !== 'element' || c.tagName !== 'p') break;
        const t = textOf(c).trim();
        if (!t || t.length > 90 || /[.:;]$/.test(t) && t.length > 60) break;
        c.properties = { ...(c.properties || {}), className: ['embed-caption'] };
        taken++;
      }
    }
  };
}

/**
 * "Scheda" blocks: a bold line followed by a bullet list of "Etichetta: valore" items,
 * e.g.
 *   **Biblioteca Statale S. Crise di Trieste**
 *   - Indirizzo: Largo Papa Giovanni XXIII, 6 · Trieste
 *   - Periodo: 9 luglio – 26 agosto 2015
 * renders as a small info card like the event sheet. Consecutive cards sit in a grid.
 * Authors only write plain Markdown (bold line + list) in the CMS.
 */
function rehypeSchede() {
  const isWs = (n: any) => n.type === 'text' && !n.value.trim();
  const textOf = (n: any): string => (n.type === 'text' ? n.value : (n.children || []).map(textOf).join(''));
  const isTitle = (n: any) => {
    if (n?.type !== 'element' || n.tagName !== 'p') return false;
    const kids = n.children.filter((c: any) => !isWs(c));
    return kids.length === 1 && kids[0].type === 'element' && kids[0].tagName === 'strong' && textOf(kids[0]).trim().length < 120;
  };
  const LABEL = /^\s*([^:]{2,60}?):\s*/;
  const isSchedaList = (n: any) => {
    if (n?.type !== 'element' || n.tagName !== 'ul') return false;
    const items = n.children.filter((c: any) => c.type === 'element' && c.tagName === 'li');
    if (!items.length) return false;
    const labelled = items.filter((li: any) => LABEL.test(textOf(li)));
    return labelled.length >= Math.ceil(items.length / 2);
  };
  // split an <li> into label + value nodes, removing "Label:" from the value
  const splitItem = (li: any) => {
    let kids = li.children.filter((c: any) => !isWs(c));
    if (kids.length === 1 && kids[0].type === 'element' && kids[0].tagName === 'p') kids = kids[0].children;
    const m = textOf({ children: kids }).match(LABEL);
    if (!m) return { label: '', value: kids };
    const label = m[1].replace(/[*_]/g, '').trim();
    let remove = m[0].length;
    const value: any[] = [];
    for (const k of kids) {
      if (remove <= 0) { value.push(k); continue; }
      const t = textOf(k);
      if (t.length <= remove) { remove -= t.length; continue; }
      // the label ends inside this node
      if (k.type === 'text') value.push({ ...k, value: k.value.slice(remove).replace(/^\s+/, '') });
      else value.push(k);
      remove = 0;
    }
    return { label, value };
  };
  // split a row value at contact separators into one line per contact
  const stackContacts = (nodes: any[]) => {
    const lines: any[][] = [[]];
    for (const n of nodes) {
      if (n.type !== 'text') { lines[lines.length - 1].push(n); continue; }
      const pieces = n.value.split(/\s*(?:[·•⋅|;]|\s\/\s)\s*/);
      pieces.forEach((piece: string, idx: number) => {
        if (idx > 0) lines.push([]);
        if (piece.trim()) lines[lines.length - 1].push({ type: 'text', value: piece.trim() });
      });
    }
    return lines.filter((l) => l.length).map((l) => el('span', { className: ['contact-line'] }, l));
  };
  return (tree: any) => {
    const out: any[] = [];
    const kids = tree.children || [];
    let group: any = null;
    for (let i = 0; i < kids.length; i++) {
      const n = kids[i];
      if (isWs(n)) { if (!group) out.push(n); continue; }
      let j = i + 1;
      while (j < kids.length && isWs(kids[j])) j++;
      if (isTitle(n) && isSchedaList(kids[j])) {
        const title = textOf(n).trim().replace(/:$/, '');
        const rows = kids[j].children
          .filter((c: any) => c.type === 'element' && c.tagName === 'li')
          .map((li: any) => {
            const { label, value: raw } = splitItem(li);
            const value = /info|contatt|telefon|e-?mail|\btel\b|cell/i.test(label) ? stackContacts(raw) : raw;
            return el('div', { className: label ? ['scheda__row'] : ['scheda__row', 'scheda__row--plain'] }, [
              ...(label ? [el('dt', {}, [text(label)])] : []),
              el('dd', {}, value)
            ]);
          });
        const card = el('section', { className: ['scheda'] }, [
          el('h4', { className: ['scheda__title'] }, [text(title)]),
          el('dl', { className: ['scheda__rows'] }, rows)
        ]);
        if (!group) {
          // a bold line just before the first card ("Sedi espositive") becomes the group heading
          let k = out.length - 1;
          while (k >= 0 && isWs(out[k])) k--;
          if (k >= 0 && isTitle(out[k])) out[k].properties = { ...(out[k].properties || {}), className: ['schede-heading'] };
          group = el('div', { className: ['schede'] }, []);
          out.push(group);
        }
        group.children.push(card);
        i = j;
        continue;
      }
      group = null;
      out.push(n);
    }
    tree.children = out;
  };
}

/** Two or more videos in a row (a "video gallery") sit side by side, each with its caption. */
function rehypeVideoGrid() {
  const isWs = (n: any) => n.type === 'text' && !n.value.trim();
  const isEmbed = (n: any) => n?.type === 'element' && n.tagName === 'div' && (n.properties?.className || []).includes('embed');
  const isCaption = (n: any) => n?.type === 'element' && n.tagName === 'p' && (n.properties?.className || []).includes('embed-caption');
  return (tree: any) => {
    const kids = tree.children || [];
    const out: any[] = [];
    for (let i = 0; i < kids.length; ) {
      // collect a run of [embed, caption*] units separated only by whitespace
      const units: any[][] = [];
      let j = i;
      while (j < kids.length) {
        let k = j;
        while (k < kids.length && isWs(kids[k])) k++;
        if (!isEmbed(kids[k])) break;
        const unit = [kids[k]];
        k++;
        while (true) {
          let c = k;
          while (c < kids.length && isWs(kids[c])) c++;
          if (!isCaption(kids[c])) break;
          unit.push(kids[c]);
          k = c + 1;
        }
        units.push(unit);
        j = k;
      }
      if (units.length >= 2) {
        // a bold-only line right before the videos ("VIDEO GALLERY") becomes a section heading
        let h = out.length - 1;
        while (h >= 0 && isWs(out[h])) h--;
        const prev = out[h];
        if (prev?.type === 'element' && prev.tagName === 'p') {
          const real = prev.children.filter((c: any) => !isWs(c));
          if (real.length === 1 && real[0].tagName === 'strong') {
            prev.children = [{ type: 'text', value: (real[0].children || []).map((c: any) => c.value || '').join('').replace(/:\s*$/, '') }];
            prev.properties = { ...(prev.properties || {}), className: ['schede-heading'] };
          }
        }
        out.push(el('div', { className: ['video-grid'] }, units.map((u) => el('figure', { className: ['video-grid__item'] }, u))));
        i = j;
      } else {
        out.push(kids[i]);
        i++;
      }
    }
    tree.children = out;
  };
}

function wrapIframe(iframe: any) {
  const src = String(iframe.properties.src || '');
  iframe.properties.loading = 'lazy';
  iframe.properties.allowFullScreen = true;
  delete iframe.properties.width;
  delete iframe.properties.height;
  const kind = /facebook\.com/.test(src) ? 'embed embed--social' : 'embed';
  return el('div', { className: kind.split(' ') }, [iframe]);
}

export const processor = await createMarkdownProcessor({
  rehypePlugins: [rehypeRaw, rehypeBaseUrls, rehypeArt, rehypeEmbedCaptions, rehypeVideoGrid, rehypeSchede]
});

export async function renderMarkdown(md?: string | null): Promise<string> {
  if (!md) return '';
  return (await processor.render(md)).code;
}

/** Info / contact strings: Markdown when they look like it, otherwise plain text with links. */
export async function renderInline(textValue: string): Promise<string> {
  if ((textValue.includes('[') && textValue.includes('](')) || textValue.includes('**')) {
    return (await processor.render(textValue)).code.replace(/^<p>|<\/p>\s*$/g, '');
  }
  const escaped = textValue.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped
    .replace(/([\w.+-]+@[\w-]+\.[\w.-]+)/g, '<a href="mailto:$1">$1</a>')
    .replace(/(?<![@\w])((?:https?:\/\/|www\.)[^\s<]+[^\s<.,;)])/g, (url) => {
      const target = url.startsWith('http') ? url : `https://${url}`;
      return `<a href="${target}" target="_blank" rel="noopener">${url}</a>`;
    })
    .replace(/\n/g, '<br />')
    // keep phone numbers in one piece
    .replace(/(?<![\w@/.-])(\+?\d[\d .-]{6,}\d)(?![\w@])/g, '<span class="nowrap">$1</span>');
}

/** Separators between contacts: "·", "•", "|", ";", " / " and line breaks. */
const CONTACT_SPLIT = /\s*(?:[·•⋅|;]|\s\/\s|\n)\s*/;

/** Contacts (phones, emails, websites) one per line, so a number never breaks halfway. */
export async function renderContacts(textValue: string): Promise<string> {
  const parts = textValue.split(CONTACT_SPLIT).map((p) => p.trim()).filter(Boolean);
  const lines = await Promise.all(parts.map((p) => renderInline(p)));
  return lines.map((l) => `<span class="contact-line">${l}</span>`).join('');
}
