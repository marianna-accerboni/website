from imp import *
def simple(i,slug,title,info,venuename=None,extra_subs=None,press_prefix=''):
    a=load(i); media=f'/media/events/{slug}/'
    names=sorted(set([a['hdr']]+[g for g,_ in a['gal']]))
    chunks,press=split_body(a['body'])
    # body images
    bodyimgs=re.findall(r'<img[^>]*src="[^"]*/file/get/Eventi/[^/]+/gallery/([^"]+)"',a['body'])
    caps={}
    for m in re.finditer(r'<img[^>]*>',a['body']):
        tag=m.group(0); src=re.search(r'src="[^"]*/([^/"]+)"',tag)
        if not src: continue
        al=re.search(r'alt="([^"]*)"',tag); ti=re.search(r'title="([^"]*)"',tag)
        v=(al.group(1) if al and al.group(1).strip() else (ti.group(1) if ti else ''))
        if v.strip(): caps[safe(html.unescape(src.group(1)))]=clean_title(v)
    gcaps={g:t for g,t in a['gal']}
    for k,v in gcaps.items(): caps[k]=v
    bodyimgs=[reg(x) for x in bodyimgs]
    download(a,set(names)|set(bodyimgs),f'public/media/events/{slug}')
    inv=re.search(r'/file/get/Eventi/[^/]+/downloads/([^"]+)"',a['t'])
    pdfs=[]
    return a,media,chunks,press,caps,names
