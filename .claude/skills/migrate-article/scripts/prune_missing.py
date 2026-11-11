"""Remove references to media files that do not exist (e.g. images the old site cannot serve: HTTP 500).

Usage (from the repo root):
  python3 .claude/skills/migrate-article/scripts/prune_missing.py <file.md> [...]          # report only
  python3 .claude/skills/migrate-article/scripts/prune_missing.py --apply <file.md> [...]  # rewrite files

Removes gallery items and Markdown image lines whose /media/... file is missing.
Warns when coverImage or invitations point to a missing file (not removed).
"""
import re, sys, os

ROOT = os.getcwd()
apply = '--apply' in sys.argv
files = [a for a in sys.argv[1:] if not a.startswith('--')]


def exists(p):
    return os.path.exists(os.path.join(ROOT, 'public', p.lstrip('/')))


for f in files:
    s = open(f).read()
    out = []
    lines = s.split('\n')
    i = 0
    removed = []
    while i < len(lines):
        l = lines[i]
        m = re.match(r'^    - image: (/media/\S.*)$', l)
        if m and not exists(m.group(1).strip()):
            removed.append(m.group(1).split('/')[-1])
            i += 1
            while i < len(lines) and re.match(r'^      (alt|title): ', lines[i]):
                i += 1
            continue
        m = re.match(r'^\s+!\[.*?\]\((/media/[^\s")]+)', l)
        if m and not exists(m.group(1)):
            removed.append(m.group(1).split('/')[-1])
            i += 1
            if i < len(lines) and lines[i].strip() == '' and out and out[-1].strip() == '':
                i += 1
            continue
        out.append(l)
        i += 1
    new = '\n'.join(out)
    new = re.sub(r'\n{3,}', '\n\n', new)
    # gallery that became empty -> null
    new = re.sub(r'gallerySection:\n  gallery:\n(?=draft:)', 'gallerySection: null\n', new)
    for key in ('coverImage',):
        m = re.search(r'^%s: (/media/\S+)$' % key, new, re.M)
        if m and not exists(m.group(1)):
            print('WARNING missing', key, m.group(1), 'in', f)
    if removed:
        print(os.path.basename(f), 'removed', len(removed))
        if apply:
            open(f, 'w').write(new)
