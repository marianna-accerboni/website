import re,unicodedata
from html.parser import HTMLParser
ORIG={}
def safe(n):
    n=n.strip()
    if re.fullmatch(r'[A-Za-z0-9._-]+',n): return n
    s=unicodedata.normalize('NFKD',n).encode('ascii','ignore').decode()
    s=re.sub(r'[^A-Za-z0-9._-]+','_',s); s=re.sub(r'_+','_',s).strip('_')
    ORIG[s]=n; return s
def cap(fn):
    s=re.sub(r'\.[^.]+$','',fn)
    s=s.replace('_',' ') if '_' in s else s.replace('-',' ')
    return re.sub(r'\s+',' ',s).strip()
class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.blocks=[]; s.cur=[]; s.b=0; s.i=0; s.link=None; s.skipcap=False; s.li=False
    def flush(s):
        if s.cur: s.blocks.append(('li' if s.li else 'p',s.cur)); s.cur=[]
    def handle_starttag(s,t,a):
        a=dict(a)
        if t in('p','div','ul','ol'): s.flush()
        elif t=='li': s.flush(); s.li=True
        elif t in('strong','b'): s.b+=1
        elif t in('em','i'): s.i+=1
        elif t=='a': s.link=a.get('href')
        elif t=='img':
            s.flush(); fn=safe(a['src'].split('/')[-1])
            s.blocks.append(('img',fn,(a.get('title') or '').strip())); s.skipcap=[x.strip() for x in (a.get('title') or '',a.get('alt') or '') if x.strip()]
        elif t=='br': s.flush()
        elif t=='iframe':
            s.flush(); at=' '.join(f'{k}="{v}"' if v is not None else k for k,v in a.items() if k in ('src','width','height','allowfullscreen'))
            s.blocks.append(('raw',f'<iframe {at}></iframe>'))
        elif t in('h3','h4'): s.flush(); s.b+=1
    def handle_endtag(s,t):
        if t in('p','div','ul','ol'): s.flush()
        elif t=='li': s.flush(); s.li=False
        elif t in('h3','h4'): s.flush(); s.b-=1
        elif t in('strong','b'): s.b-=1
        elif t in('em','i'): s.i-=1
        elif t=='a': s.link=None
    def handle_data(s,d):
        d=d.replace('\xa0',' ')
        if s.skipcap and re.sub(r'\s+',' ',d).strip() in [re.sub(r'\s+',' ',x) for x in s.skipcap]: s.skipcap=False; return
        if not d.strip() and not s.cur: return
        s.cur.append((d,1 if s.b>0 else 0,1 if s.i>0 else 0,s.link))
def emit(runs):
    runs=[(d.replace('’',"'").replace('‘',"'"),b,i,l) for d,b,i,l in runs]
    runs=list(runs)
    for n in range(1,len(runs)-1):
        d,b,i,l=runs[n]
        if not d.strip() and not l and runs[n-1][1] and runs[n+1][1] and not runs[n-1][3] and not runs[n+1][3]:
            runs[n]=(d,1,runs[n-1][2] if runs[n-1][2]==runs[n+1][2] else 0,l)
    mr=[]
    for r in runs:
        if mr and mr[-1][1:]==r[1:]: mr[-1]=(mr[-1][0]+r[0],)+r[1:]
        else: mr.append(r)
    runs=mr
    def wrap(txt,m):
        lead=len(txt)-len(txt.lstrip()); trail=len(txt)-len(txt.rstrip()); core=txt.strip()
        tail=txt[len(txt)-trail:] if trail else ''
        if True:
            pre=re.match(r'^[,.;:]+',core)
            if pre:
                rest=core[len(pre.group(0)):]
                return txt[:lead]+pre.group(0)+(' ' if rest[:1]==' ' else '')+wrap(rest.lstrip(),m)+tail
        return txt[:lead]+(m+core+m if core else '')+tail
    out='';k=0
    def fmt(txt,b,i):
        # apply marks to a text run (leading/trailing spaces outside)
        if not (b or i): return txt
        lead=len(txt)-len(txt.lstrip()); trail=len(txt)-len(txt.rstrip()); core=txt.strip()
        if not core: return txt
        m=('**' if b else '')+('_' if i else '')
        e=('_' if i else '')+('**' if b else '')
        return txt[:lead]+m+core+e+(txt[len(txt)-trail:] if trail else '')
    # split into link runs and plain runs
    segs=[]; cur=[]
    for r in runs:
        if r[3]:
            if cur: segs.append(('t',cur)); cur=[]
            segs.append(('l',r))
        else: cur.append(r)
    if cur: segs.append(('t',cur))
    for kind,v in segs:
        if kind=='l':
            d,b_,i_,l=v; lead=len(d)-len(d.lstrip()); core=d.strip(); trail=len(d)-len(d.rstrip())
            out+=d[:lead]+'['+fmt(core,b_,i_)+']('+l+')'+(d[len(d)-trail:] if trail else '')
            continue
        runs2=v; k=0
        while k<len(runs2):
            b=runs2[k][1]; j=k
            while j<len(runs2) and runs2[j][1]==b: j+=1
            grp=runs2[k:j]; inner=''; m=0
            while m<len(grp):
                i=grp[m][2]; n=m
                while n<len(grp) and grp[n][2]==i: n+=1
                txt=''.join(d for d,_,_,l in grp[m:n])
                inner+=wrap(txt,'_') if i else txt
                m=n
            out+=wrap(inner,'**') if b else inner
            k=j
    return re.sub(r'[ \t]+',' ',out).strip()
def convert(fragment, media, captions=None):
    p=P(); p.feed(fragment); p.flush(); md=[]; md_li=False
    for blk in p.blocks:
        if blk[0]=='img':
            fn=blk[1]; c=(captions or {}).get(fn) or cap(fn)
            md.append(f'![{c}]({media}{fn} "{c}")')
        elif blk[0]=='raw': md.append(blk[1])
        elif blk[0]=='li':
            t=emit(blk[1])
            if t:
                if md and md[-1].startswith('- ') and md_li: md[-1]+='\n- '+t
                else: md.append('- '+t)
                md_li=True; continue
        else:
            t=emit(blk[1])
            if t: md.append(t)
        md_li=False
    out='\n\n'.join(md)
    return re.sub(r'\[ +','[',re.sub(r' +\]\(',' ](',out)).replace(' ](',']( ').replace(']( ','](') if False else re.sub(r'\[\s+([^\]]*?)\s+\]\(',r'[\1](',out)

def _norm(x): return re.sub(r'[^a-z0-9]+',' ',re.sub(r'\*+','',x).lower()).strip()
def _overlap(c,alt):
    ct=_norm(c).split(); at=set(_norm(alt).split())
    return sum(t in at for t in ct)/len(ct) if ct else 0
def drop_captions(md):
    lines=md.split('\n'); out=[]; i=0
    while i<len(lines):
        l=lines[i]; out.append(l); i+=1
        m=re.match(r'^!\[(.*?)\]\(.*?\)$',l)
        if not m: continue
        while True:
            j=i
            while j<len(lines) and lines[j].strip()=='': j+=1
            if j<len(lines) and not lines[j].startswith(('![','<iframe','- ','**BIO','**APP')) and len(lines[j])<300 and _overlap(lines[j],m.group(1))>=0.7: i=j+1; continue
            break
    return re.sub(r'\n{3,}','\n\n','\n'.join(out))
_convert=convert
def convert(fragment, media, captions=None):
    return drop_captions(_convert(fragment,media,captions))
