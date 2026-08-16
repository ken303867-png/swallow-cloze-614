from pathlib import Path
import base64,gzip
root=Path('.')
parts=''.join((root/f'app.part{i:02d}').read_text(encoding='utf-8').strip() for i in range(1,11))
html=gzip.decompress(base64.b64decode(parts)).decode('utf-8')
(root/'legacy-app.html').write_text(html,encoding='utf-8')
print('extracted',len(html),'bytes')
