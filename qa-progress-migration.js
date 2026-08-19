/* Preserve study history when true duplicate cards are consolidated.
 * Runs after core.js has loaded state, before result/memory extensions initialize.
 */
(()=>{
  const map=globalThis.DATA_QA_PROGRESS_MERGE_MAP||{};
  if(!map||!Object.keys(map).length||typeof state!=='object')return;
  const active=new Set(DATA.cards.map(c=>Number(c.id)));

  const later=(a,b)=>{
    if(!a)return b||null;
    if(!b)return a||null;
    return String(a)>=String(b)?a:b;
  };
  const mergeNormal=(a={},b={})=>({
    status:(a.status==='review'||b.status==='review')?'review':
           (a.status==='good'||b.status==='good')?'good':null,
    uncertain:!!(a.uncertain||b.uncertain),
    bookmarked:!!(a.bookmarked||b.bookmarked),
    attempts:(a.attempts||0)+(b.attempts||0),
    good:(a.good||0)+(b.good||0),
    review:(a.review||0)+(b.review||0),
    lastAt:later(a.lastAt,b.lastAt)
  });
  const mergeMemory=(a={},b={})=>({
    status:(a.status==='learning'||b.status==='learning')?'learning':
           (a.status==='memorized'||b.status==='memorized')?'memorized':null,
    attempts:(a.attempts||0)+(b.attempts||0),
    remembered:(a.remembered||0)+(b.remembered||0),
    again:(a.again||0)+(b.again||0),
    lastAt:later(a.lastAt,b.lastAt)
  });
  const mappedId=id=>{
    const n=Number(id);
    return Number(map[n]??map[String(n)]??n);
  };
  const remapList=arr=>{
    if(!Array.isArray(arr))return [];
    const out=[];
    const seen=new Set();
    for(const raw of arr){
      const id=mappedId(raw);
      if(!active.has(id)||seen.has(id))continue;
      seen.add(id);out.push(id);
    }
    return out;
  };

  if(!state.progress||typeof state.progress!=='object')state.progress={};
  if(!state.memoryProgress||typeof state.memoryProgress!=='object')state.memoryProgress={};

  for(const [fromRaw,toRaw] of Object.entries(map)){
    const from=String(Number(fromRaw));
    const to=String(Number(toRaw));
    if(state.progress[from]){
      state.progress[to]=mergeNormal(state.progress[to],state.progress[from]);
      delete state.progress[from];
    }
    if(state.memoryProgress[from]){
      state.memoryProgress[to]=mergeMemory(state.memoryProgress[to],state.memoryProgress[from]);
      delete state.memoryProgress[from];
    }
  }

  if(state.lastSession&&Array.isArray(state.lastSession.ids)){
    const oldCurrent=state.lastSession.ids[Math.max(0,state.lastSession.pos||0)];
    const current=mappedId(oldCurrent);
    state.lastSession.ids=remapList(state.lastSession.ids);
    const idx=state.lastSession.ids.indexOf(current);
    state.lastSession.pos=idx>=0?idx:Math.min(Math.max(0,state.lastSession.pos||0),Math.max(0,state.lastSession.ids.length-1));
    if(!state.lastSession.ids.length)state.lastSession=null;
  }

  if(state.memorySession&&typeof state.memorySession==='object'){
    const s=state.memorySession;
    const oldCurrent=Array.isArray(s.ids)?s.ids[Math.max(0,s.pos||0)]:null;
    const current=mappedId(oldCurrent);
    s.initialIds=remapList(s.initialIds||s.ids||[]);
    s.ids=remapList(s.ids||[]);
    s.nextIds=remapList(s.nextIds||[]);
    const idx=s.ids.indexOf(current);
    s.pos=idx>=0?idx:Math.min(Math.max(0,s.pos||0),Math.max(0,s.ids.length-1));
    if(!s.ids.length)state.memorySession=null;
  }

  state.qaDataMergeVersion='compact1390-qaSA-v1';
  try{localStorage.setItem(STORE_KEY,JSON.stringify(state));}catch(_){ }
  try{refreshSummary();}catch(_){ }
})();
