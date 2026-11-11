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
    pmd=convert(press,media,caps)
    if pre: pmd=pre+'\n\n'+pmd
    if press_prefix: pmd=press_prefix+'\n\n'+pmd
    if press_suffix: pmd=pmd+'\n\n'+press_suffix.replace('{M}',media)
    for (ms,mt,mb) in manual_subs:
        mb=mb.replace('{M}',media); subtitles.append(mt); write_sub(ms,mt,slug,mb); print('  sub',ms,'|',mt[:80])
    write_event(slug,title,a['hdr'],info+[('invitations',f'\n    - {media}{invs[0]}')],subtitles,pmd,a['gal'],media)
    if vname: venue(vname)
    print(i,'written',slug,'gallery',len(a['gal']))
    return a
