<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  currentPath: string;
  locale: 'en' | 'it';
}>();

const target = computed(() => {
  if (props.locale === 'it') {
    // Switch to English: strip the /it prefix
    const stripped = props.currentPath.replace(/^\/it(\/|$)/, '/');
    return { href: stripped || '/', label: 'English' };
  }
  // Switch to Italian: add the /it prefix
  const path = props.currentPath === '/' ? '' : props.currentPath;
  return { href: `/it${path}/`.replace(/\/+$/, '/'), label: 'Italiano' };
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
