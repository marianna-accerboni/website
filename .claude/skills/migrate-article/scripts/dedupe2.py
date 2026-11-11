import re,glob,sys
apply='--apply' in sys.argv; allfiles='--all' in sys.argv
norm=lambda s: re.sub(r'[^a-z0-9]+',' ',re.sub(r'\*+','',s).lower()).strip()
mine={'il-segno-rivelatore-di-gillo-2019','bellezza-per-la-bonta-2019','loredana-riavini-controluce-2019','incontro-multimediale-umberto-saba-2019','olivia-siauss-colori-e-luci-del-mio-bosco-2019','fabio-colussi-draga-di-moschiena-cattaro-2019','anna-zennaro-vita-vista-mare-2019','concorso-mulitsch-gorizia-2019','gillo-dorfles-catalogo-live-2020','fabio-colussi-il-pittore-dell-adriatico-2019'}
def overlap(c,alt):
    ct=norm(c).split(); at=set(norm(alt).split())
    return sum(t in at for t in ct)/len(ct) if ct else 0
for f in sorted(glob.glob('src/content/*/*.md')):
    name=f.split('/')[-1][:-3]
    if not allfiles and name not in mine: continue
    lines=open(f).read().split('\n'); out=[]; i=0; dropped=[]
    while i<len(lines):
        l=lines[i]; out.append(l); m=re.match(r'^(\s+)!\[(.*?)\]\(.*?\)\s*$',l); i+=1
        if not m: continue
        ind,alt=m.group(1),m.group(2)
        while True:
            j=i
            while j<len(lines) and lines[j].strip()=='': j+=1
            if j<len(lines) and lines[j].startswith(ind) and not lines[j].strip().startswith(('![','<iframe','- ','**BIO','**APP')) and len(lines[j].strip())<300 and overlap(lines[j],alt)>=0.7:
                dropped.append(lines[j].strip()[:90]); out.extend(lines[i:j]) if False else None; i=j+1
                # keep one blank separation handled by existing blank lines: remove blanks consumed
                continue
            break
    if dropped:
        print(name[:48],len(dropped)); [print('    -',d) for d in dropped]
        if apply: open(f,'w').write('\n'.join(out))
