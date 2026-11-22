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
      if (node.tagName === 'a' && typeof node.properties?.href === 'string' && /^https?:/.test(node.properties.href)) {
        node.properties.target = '_blank';
        node.properties.rel = 'noopener';
      }
    });
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
  rehypePlugins: [rehypeRaw, rehypeBaseUrls, rehypeArt]
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
    .replace(/\n/g, '<br />');
}
