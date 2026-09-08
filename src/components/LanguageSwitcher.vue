<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  currentPath: string;
  locale: 'en' | 'it';
}>();

// Astro base path (e.g. "/website" on GitHub Pages, "/" in dev)
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

const target = computed(() => {
  // Strip the base prefix from the current path first
  const path = props.currentPath.startsWith(base)
    ? props.currentPath.slice(base.length) || '/'
    : props.currentPath;

  if (props.locale === 'it') {
    // Switch to English: strip the /it prefix
    const stripped = path.replace(/^\/it(\/|$)/, '/');
    return { href: `${base}${stripped}` || '/', label: 'English' };
  }
  // Switch to Italian: add the /it prefix
  const rest = path === '/' ? '' : path;
  return { href: `${base}/it${rest}/`.replace(/\/+$/, '/'), label: 'Italiano' };
});
</script>

<template>
  <a class="language-switcher" :href="target.href" :lang="locale === 'it' ? 'en' : 'it'">
    {{ target.label }}
  </a>
</template>

<style scoped>
.language-switcher {
  color: var(--color-muted, #666);
  text-decoration: none;
  border: 1px solid currentColor;
  border-radius: 4px;
  padding: 0.15rem 0.6rem;
  font-size: 0.85rem;
}

.language-switcher:hover {
  color: var(--color-accent, #8a6d3b);
}
</style>
