from pathlib import Path
import base64,gzip,re
root=Path('.')
parts=''.join((root/f'app.part{i:02d}').read_text(encoding='utf-8').strip() for i in range(1,11))
html=gzip.decompress(base64.b64decode(parts)).decode('utf-8')
(root/'legacy-app.html').write_text(html,encoding='utf-8')
styles=re.findall(r'<style[^>]*>(.*?)</style>',html,re.S|re.I)
scripts=re.findall(r'<script[^>]*>(.*?)</script>',html,re.S|re.I)
(root/'legacy-style.css').write_text('\n\n'.join(styles),encoding='utf-8')
(root/'legacy-base.js').write_text('\n\n'.join(scripts),encoding='utf-8')
shell=re.sub(r'<style[^>]*>.*?</style>','<link rel="stylesheet" href="./legacy-style.css">',html,flags=re.S|re.I)
shell=re.sub(r'<script[^>]*>.*?</script>','<script src="./legacy-base.js"></script>',shell,flags=re.S|re.I)
(root/'legacy-shell.html').write_text(shell,encoding='utf-8')
print('html_bytes=',len(html),'styles=',len(styles),'scripts=',len(scripts),'js_bytes=',sum(map(len,scripts)))
joined='\n'.join(scripts)
for token in ['const DATA','function filteredCards','function renderCard','function rateCurrent','function startFromFilters','function resumeSession','const STORE_KEY']:
    print(token, token in joined)
