import re,html,sys
i=sys.argv[1]; n=int(sys.argv[2]) if len(sys.argv)>2 else 260
t=open(f''+__import__('os').environ.get('MIGRATE_WORK','/tmp/migrate')+f'/a{i}.html',encoding='utf8',errors='replace').read()
j=t.find('<div class="article_body">'); k=t.find('</div>\n        </div>',j); body=t[j:k]
body=re.sub(r'<table.*?</table>','[[INFOTABLE]]',body,count=1,flags=re.S)
body=re.sub(r'<iframe[^>]*src="([^"]+)"[^>]*></iframe>',r'[[IFRAME \1]]',body)
body=re.sub(r'<img[^>]*src="[^"]*/([^/"]+)"[^>]*>',r'[[IMG \1]]',body)
body=re.sub(r'<hr[^>]*>','\n----HR----\n',body)
body=re.sub(r'<h3>(.*?)</h3>',r'\n### \1\n',body,flags=re.S)
body=re.sub(r'<a [^>]*href="([^"]+)"[^>]*>',r'<A \1>',body)
body=re.sub(r'</?(p|div|span|strong|em|b|i|br|a|table|tbody|tr|td|ul|li|h\d)[^>]*>','\n',body)
body=html.unescape(body)
for l in re.sub(r'\n\s*\n+','\n',body).split('\n'):
    l=l.strip()
    if l: print(l[:n])
