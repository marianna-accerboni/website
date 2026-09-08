// @ts-check
import { defineConfig } from 'astro/config';

import vue from '@astrojs/vue';
import rehypeRaw from 'rehype-raw';
import { visit } from 'unist-util-visit';

const base = '/website/';

/** Prefix root-relative src/href in raw HTML nodes with the Astro base URL. */
function rehypeBaseUrls() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      for (const attr of ['src', 'href']) {
        const value = node.properties?.[attr];
        if (typeof value === 'string' && value.startsWith('/') && !value.startsWith(base)) {
          node.properties[attr] = base.replace(/\/$/, '') + value;
        }
      }
    });
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://marianna-accerboni.github.io',
  base,
  integrations: [vue()],
  markdown: {
    // rehype-raw lets raw HTML in Markdown (e.g. CMS-inserted images) render,
    // so rehypeBaseUrls can rewrite their URLs with the site base path.
    rehypePlugins: [rehypeRaw, rehypeBaseUrls]
  },
  redirects: {
    '/admin': '/admin/index.html'
  }
});