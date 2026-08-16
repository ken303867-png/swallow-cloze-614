from pathlib import Path
import re

root=Path('.')
base=(root/'legacy-base.js').read_text(encoding='utf-8')
style=(root/'legacy-style.css').read_text(encoding='utf-8')
shell=(root/'legacy-shell.html').read_text(encoding='utf-8')
results=(root/'results-patch.js').read_text(encoding='utf-8')
compat=(root/'cloze-results-compat.js').read_text(encoding='utf-8')
memory=(root/'memory-mode.js').read_text(encoding='utf-8')

m=re.search(r'\n?const DATA=(\{.*?\});\nconst STORE_KEY',base,re.S)
if not m: raise SystemExit('DATA block not found')
data_json=m.group(1)
base=base[:m.start()]+'\nconst STORE_KEY'+base[m.end():]

m=re.search(r'const OLD_TO_NEW=(\{.*?\});\nconst CURRENT_IDS',base,re.S)
if not m: raise SystemExit('OLD_TO_NEW block not found')
map_json=m.group(1)
base=base[:m.start()]+'const CURRENT_IDS'+base[m.end():]

(root/'data.js').write_text('const DATA='+data_json+';\n',encoding='utf-8')
(root/'migration-map.js').write_text('const OLD_TO_NEW='+map_json+';\n',encoding='utf-8')
(root/'core.js').write_text(base.lstrip(),encoding='utf-8')
(root/'styles.css').write_text(style.strip()+'\n',encoding='utf-8')

# Consolidate cloze result behavior and its compatibility wrapper into one explicit module.
(root/'results.js').write_text(results.rstrip()+'\n\n'+compat.strip()+'\n',encoding='utf-8')

# Fold answer show/hide toggle directly into memory mode.
memory=memory.replace("const PATCH_VERSION='memory-round-v1';","const PATCH_VERSION='memory-round-v2-refactor';")
memory=memory.replace("showAnswerBtn.textContent=memorySession.answerShown?'答え表示中':'答えを表示';\n  showAnswerBtn.disabled=!!memorySession.answerShown;","showAnswerBtn.textContent=memorySession.answerShown?'答えを隠す':'答えを表示';\n  showAnswerBtn.disabled=false;")
memory=memory.replace("memorySession.answerShown=true;\n  renderMemoryCard();","memorySession.answerShown=!memorySession.answerShown;\n  renderMemoryCard();")
if "'答えを隠す'" not in memory or 'answerShown=!memorySession.answerShown' not in memory:
    raise SystemExit('memory toggle integration failed')
(root/'memory.js').write_text(memory,encoding='utf-8')

scripts=''.join([
  '<script src="./data.js?v=1"></script>',
  '<script src="./migration-map.js?v=1"></script>',
  '<script src="./core.js?v=1"></script>',
  '<script src="./data-transfer.js?v=2"></script>',
  '<script src="./results.js?v=1"></script>',
  '<script src="./memory.js?v=1"></script>'
])
index=shell.replace('./legacy-style.css','./styles.css?v=1')
index=index.replace('<script src="./legacy-base.js"></script>',scripts)
(root/'index.refactor.html').write_text(index,encoding='utf-8')

sw="""const CACHE_PREFIX = 'swallow-cloze-614-new-';
const CACHE = CACHE_PREFIX + 'v14-refactor';
const ASSETS = ['./','./index.html','./manifest.json','./styles.css','./data.js','./migration-map.js','./core.js','./data-transfer.js','./results.js','./memory.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== self.location.origin || !u.href.startsWith(self.registration.scope)) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          if (r && r.status === 200) {
            const copy = r.clone();
            caches.open(CACHE).then(c => c.put('./index.html', copy));
          }
          return r;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  e.respondWith(caches.match(e.request, {ignoreSearch:true}).then(cached => cached || fetch(e.request)));
});
"""
(root/'sw.refactor.js').write_text(sw,encoding='utf-8')
print('refactor build complete')
