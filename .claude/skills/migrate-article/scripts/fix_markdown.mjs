// Repairs Markdown emphasis markers (**, *, _) that render literally on the site (bad flanking, stray markers).
// Usage (repo root, Node 22):  node .claude/skills/migrate-article/scripts/fix_markdown.mjs [--apply] <file.md> ...
// Only paragraphs whose rendered text still contains a literal marker are touched; words are never changed.
import fs from 'node:fs';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
const proc = await createMarkdownProcessor({});
const apply = process.argv.includes('--apply');
const files = process.argv.slice(2).filter(a => !a.startsWith('--'));
const textOf = html => html.replace(/<[^>]+>/g, ' ');
const lit = async p => { const t = textOf((await proc.render(p)).code); return /\*/.test(t) || /(^|\s)_\S|\S_(\s|$)/.test(t); };
function tightenRe(p, re) {
  const parts = p.split(re); let out = '', open = null, n = 0;
  for (let i = 0; i < parts.length; i++) {
    const s = parts[i];
    if (i % 2 === 1) { n++; if (n % 2 === 1) { open = out.length; out += '\u0001'; } else {
      const inner = out.slice(open + 1); const lead = inner.match(/^\s*/)[0], trail = inner.match(/\s*$/)[0]; const core = inner.trim();
      out = /[\p{L}\p{N}]/u.test(core) ? out.slice(0, open) + lead + s + core + s + trail : out.slice(0, open) + inner;
      open = null; } }
    else out += s;
  }
  return open !== null ? out.replace('\u0001', '') : out;
}
const tighten = p => tightenRe(p.replace(/\\\*/g, '').replace(/\*{4,}/g, ''), /(\*\*)/);
let total = 0;
for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split('\n'); const out = []; let changed = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)(pressRelease|body): \|-$/); out.push(lines[i]);
    if (!m) continue;
    const ind = m[1].length + 2; let j = i + 1; const blk = [];
    while (j < lines.length && (lines[j].trim() === '' || lines[j].startsWith(' '.repeat(ind)))) { blk.push(lines[j]); j++; }
    while (blk.length && blk[blk.length - 1].trim() === '') { blk.pop(); j--; }
    const paras = blk.map(l => l.slice(ind)).join('\n').split(/\n\n/); const fixed = [];
    for (const p of paras) {
      if (/[*_\\]/.test(p) && await lit(p)) {
        let q = tighten(p);
        if (await lit(q)) q = tightenRe(q, /((?<![*\\])\*(?!\*))/);
        if (await lit(q)) q = tightenRe(q, /((?<![\w\\])_|_(?![\w]))/);
        if (await lit(q)) q = q.replace(/\*\*/g, '').replace(/(?<![\\])\*/g, '');
        if (q !== p) changed++; fixed.push(q);
      } else fixed.push(p);
    }
    for (const l of fixed.join('\n\n').split('\n')) out.push(l === '' ? '' : ' '.repeat(ind) + l);
    i = j - 1;
  }
  if (changed) { console.log(f.split('/').pop(), 'paragraphs fixed:', changed); total += changed; if (apply) fs.writeFileSync(f, out.join('\n')); }
}
console.log('total', total);
