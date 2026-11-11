import re,sys,json,datetime,os,html,subprocess,urllib.request
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from mdconv import convert,cap,P,emit
HERE=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(HERE,'..','..','..','..'))
WORK=os.environ.get('MIGRATE_WORK','/tmp/migrate')  # where a<ID>.html files are saved
BASE='http://www.mariannaaccerboni.com'
NOW=datetime.datetime.now().astimezone().strftime('%Y-%m-%dT%H:%M:00')
q=lambda s: json.dumps(s,ensure_ascii=False)
ind=lambda x,n=4: '\n'.join((' '*n+l if l else '') for l in x.split('\n'))
def clean_title(t):
    t=html.unescape(t).replace('’',"'"); t=re.sub(r'-_[a-z_0-9]+$','',t.strip()); t=re.sub(r'(?i)\.(jpe?g|png)$','',t); return re.sub(r'\s+',' ',t).strip()
def load(i):
    t=open(f'{WORK}/a{i}.html',encoding='utf8',errors='replace').read()
    j=t.find('<div class="article_body">')+len('<div class="article_body">'); k=t.find('</div>\n        </div>',j); body=t[j:k]
    hdr=re.search(r'href="([^"]+)"[^>]*\s+title=""\s+class="lightbox"\s+rel="lightbox-gallery-header"',t,re.S).group(1)
    folder=re.search(r'/Eventi/([^/]+)/',hdr).group(1)
    anchors=re.findall(r'<a[^>]*lightbox-gallery-body[^>]*>',t,re.S)
    gal=[]
    for a in anchors:
        h=html.unescape(re.search(r'href="([^"]+)"',a).group(1)).strip().split('/')[-1].strip()
        ti=re.search(r'title="([^"]*)"',a); gal.append((h,clean_title(ti.group(1)) if ti and ti.group(1).strip() else cap(h)))
    return dict(t=t,body=body,hdr=html.unescape(hdr).strip().split('/')[-1].strip(),folder=folder,gal=gal)
def split_body(body):
    body=re.sub(r'<table.*?</table>','',body,count=1,flags=re.S)
    k=body.index('COMUNICATO STAMPA:</h3>')
    pre=body[:k]; press=body[k+len('COMUNICATO STAMPA:</h3>'):]
    pre=re.sub(r"<h3>\s*(NEWS RELATIVE ALL'EVENTO|INFORMAZIONI UTILI):?\s*</h3>",'',pre)
    chunks=[c for c in re.split(r'<hr[^>]*>',pre) if re.sub(r'<[^>]+>|&nbsp;|\s','',c)]
    return chunks,press
def download(art,names,dest,kind='gallery'):
    os.makedirs(f'{ROOT}/{dest}',exist_ok=True)
    for n in names:
        p=f'{ROOT}/{dest}/{n}'
        if os.path.exists(p) and os.path.getsize(p)>0: continue
        u=f'{BASE}/file/get/Eventi/{art["folder"]}/{kind}/{n}'
        r=subprocess.run(['curl','-s','-f','-L','-o',p,u]); 
        if r.returncode: print('DOWNLOAD FAIL',u); 
def sub_md(chunk,media,captions=None,title=None,drop_first=False):
    md=convert(chunk,media,captions)
    blocks=md.split('\n\n')
    # strip emphasis for title
    def plain(x): return re.sub(r'[*_]+','',x).strip()
    idx=next((n for n,b in enumerate(blocks) if not b.startswith('<iframe') and not b.startswith('![')),0)
    if title is None: title=plain(blocks[idx]); drop=True
    else: drop=drop_first
    if drop: blocks.pop(idx)
    return title,'\n\n'.join(blocks)
def write_sub(slug,title,parent,body):
    s=f"""---
title: {q(title)}
slug: {slug}
createdAt: {NOW}
parent: {parent}
info: null
bodySection:
  body: |-
{ind(body)}
draft: false
---
"""
    open(f'{ROOT}/src/content/sub-events/{slug}.md','w').write(s)
def yv(v):
    v=str(v)
    if v.startswith(chr(10)) or v.startswith('|-'): return v
    if re.search(r': | #|^[\[\]{}&*!|>\'"%@`-]|:$',v): return q(v)
    return v
def write_event(slug,title,cover,info,subtitles,press,gallery,media):
    inf=('info: null\n' if not info else 'info:\n'+''.join(f'  {k}: {yv(v)}\n' for k,v in info))
    gy=''.join(f"    - image: {media}{g}\n      alt: {q(t)}\n      title: {q(t)}\n" for g,t in gallery)
    subs=''.join(f'  - - {q(x)}\n' for x in subtitles)
    s=f"""---
title: {q(title)}
slug: {slug}
createdAt: {NOW}
coverImage: {media}{cover}
{inf.replace('invitations: ','invitations:')}{'subEvents:'+chr(10)+subs if subtitles else ''}press:
  pressRelease: |-
{ind(press)}
{'gallerySection:'+chr(10)+'  gallery:'+chr(10)+gy if gallery else 'gallerySection: null'+chr(10)}draft: false
---
"""
    open(f'{ROOT}/src/content/events/{slug}.md','w').write(s)
def venue(name):
    import re as _r
    slug=_r.sub(r'[^a-z0-9]+','-',name.lower().replace("'",'').replace('’','')).strip('-')[:80]
    p=f'{ROOT}/src/data/venues/{slug}.md'
    if not os.path.exists(p):
        open(p,'w').write(f'---\nname: {name}\n---\n'); print('new venue',name)
