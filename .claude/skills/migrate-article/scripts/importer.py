from run_simple import *
def title_case_fix(x): return x
def do2(i,slug,title,info,subs,vname=None,chunk_fix=None,press_extra_chunk=None,invs=('invito.pdf',),dlkind='downloads',press_prefix=None,press_suffix=None,manual_subs=()):
    a,media,chunks,press,caps,names=simple(i,slug,title,info)
    if chunk_fix: chunks=chunk_fix(chunks)
    folder=a['folder']; dest=f'public/media/events/{slug}'
    pre=None
    if press_extra_chunk is not None:
        pre=convert(chunks[press_extra_chunk],media,caps); chunks=[c for n,c in enumerate(chunks) if n!=press_extra_chunk]
    assert len(subs)==len(chunks),(i,len(chunks),len(subs))
    download(a,list(invs),dest,dlkind)
    subtitles=[]
    for (sslug,stitle,drop),ch in zip(subs,chunks):
        t,b=sub_md(ch,media,caps,stitle,drop)
        t=t.rstrip(':')
        b=b.replace(f'/file/get/Eventi/{folder}/downloads/',media)
        subtitles.append(t); write_sub(sslug,t,slug,b); print('  sub',sslug,'|',t[:90])
    info=[(k,(resolve_venue(v) if k=='venue' else v)) for k,v in info]
    pmd=convert(press,media,caps)
    if pre: pmd=pre+'\n\n'+pmd
    if press_prefix: pmd=press_prefix+'\n\n'+pmd
    if press_suffix: pmd=pmd+'\n\n'+press_suffix.replace('{M}',media)
    for (ms,mt,mb) in manual_subs:
        mb=mb.replace('{M}',media); subtitles.append(mt); write_sub(ms,mt,slug,mb); print('  sub',ms,'|',mt[:80])
    write_event(slug,title,a['hdr'],info+([('invitations',f'\n    - {media}{invs[0]}')] if invs else []),subtitles,pmd,a['gal'],media)
    if vname: venue(vname)
    print(i,'written',slug,'gallery',len(a['gal']))
    return a


def do_free(i,slug,title,info,invs=(),dlkind='downloads',strip_table=True,drop=None,subs=()):
    """Article without a COMUNICATO STAMPA heading: the whole body (minus the info table) is the press release."""
    a=load(i); body=a['body']
    if strip_table: body=re.sub(r'<table.*?</table>','',body,count=1,flags=re.S)
    body=re.sub(r"<h3>(?:(?!</h3>).)*?(?:NEWS RELATIVE ALL'EVENTO|INFORMAZIONI UTILI)(?:(?!</h3>).)*?</h3>",'',body,flags=re.S)
    media=f'/media/events/{slug}/'
    caps={}
    for m in re.finditer(r'<img[^>]*>',body):
        tag=m.group(0); src=re.search(r'src="[^"]*/([^/"]+)"',tag)
        al=re.search(r'alt="([^"]*)"',tag); ti=re.search(r'title="([^"]*)"',tag)
        v=(al.group(1) if al and al.group(1).strip() else (ti.group(1) if ti else ''))
        if src and v.strip(): caps[safe(html.unescape(src.group(1)))]=clean_title(v)
    for k,v in a['gal']: caps[k]=v
    bodyimgs=[reg(x) for x in re.findall(r'<img[^>]*src="[^"]*/file/get/Eventi/[^/]+/gallery/([^"]+)"',body)]
    dest=f'public/media/events/{slug}'
    download(a,set([a['hdr']]+[g for g,_ in a['gal']]+bodyimgs),dest)
    if invs: download(a,list(invs),dest,dlkind)
    press=convert(body,media,caps).replace(f'/file/get/Eventi/{a["folder"]}/downloads/',media)
    if drop: press=re.sub(drop,'',press)
    info=[(k,(resolve_venue(v) if k=='venue' else v)) for k,v in info]
    write_event(slug,title,a['hdr'],info+([('invitations',f'\n    - {media}{invs[0]}')] if invs else []),[],press,a['gal'],media)
    print(i,'written',slug,'gallery',len(a['gal']))
