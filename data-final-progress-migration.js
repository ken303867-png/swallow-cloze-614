(()=>{
'use strict';
const KEY='swallow_cloze_614_independent_pwa_v1';
const PATCH_VERSION='canonical-sec16-17-v2';
try{
  const raw=localStorage.getItem(KEY);
  if(!raw)return;
  const state=JSON.parse(raw);
  if(!state||typeof state!=='object'||state.canonicalPatchVersion===PATCH_VERSION)return;
  if(state.dataMigrationVersion!=='canonical1380-v1')return;
  const id='1322';
  const archivedProgress={},archivedMemoryProgress={};
  if(state.progress&&Object.prototype.hasOwnProperty.call(state.progress,id)){
    archivedProgress[id]=state.progress[id]; delete state.progress[id];
  }
  if(state.memoryProgress&&Object.prototype.hasOwnProperty.call(state.memoryProgress,id)){
    archivedMemoryProgress[id]=state.memoryProgress[id]; delete state.memoryProgress[id];
  }
  if(!Array.isArray(state.archivedDataSets))state.archivedDataSets=[];
  if(Object.keys(archivedProgress).length||Object.keys(archivedMemoryProgress).length){
    state.archivedDataSets.push({
      archivedAt:new Date().toISOString(),
      fromDataMigrationVersion:'canonical1380-v1',
      patchVersion:PATCH_VERSION,
      reason:'final-anatomy-audit-answer-change',
      invalidatedIds:[1322],
      progress:archivedProgress,
      memoryProgress:archivedMemoryProgress
    });
  }
  state.canonicalPatchVersion=PATCH_VERSION;
  localStorage.setItem(KEY,JSON.stringify(state));
}catch(e){console.warn('final canonical patch migration skipped',e);}
})();

(()=>{
'use strict';
const KEY='swallow_cloze_614_independent_pwa_v1';
const TARGET='compact1384-rev1';
const INVALIDATE=new Set([115,116,123,127,141,144,146,148,153,158,167,168,170,171,185,202,203,214,227,228,229,235,242,253,264].map(String));
const REMOVED=new Set([119,140,142,149,150,156,159,160,230,263].map(String));
try{
  const raw=localStorage.getItem(KEY);
  if(!raw)return;
  const state=JSON.parse(raw);
  if(!state||typeof state!=='object'||state.sourceRevisionMigrationVersion===TARGET)return;

  const archivedProgress={}, archivedMemoryProgress={};
  for(const id of new Set([...INVALIDATE,...REMOVED])){
    if(state.progress&&Object.prototype.hasOwnProperty.call(state.progress,id)){
      archivedProgress[id]=state.progress[id];
      delete state.progress[id];
    }
    if(state.memoryProgress&&Object.prototype.hasOwnProperty.call(state.memoryProgress,id)){
      archivedMemoryProgress[id]=state.memoryProgress[id];
      delete state.memoryProgress[id];
    }
  }

  const touchesChanged=session=>session&&Array.isArray(session.ids)&&session.ids.some(id=>INVALIDATE.has(String(id))||REMOVED.has(String(id)));
  if(touchesChanged(state.lastSession))state.lastSession=null;
  if(touchesChanged(state.memorySession))state.memorySession=null;

  if(!Array.isArray(state.archivedDataSets))state.archivedDataSets=[];
  if(Object.keys(archivedProgress).length||Object.keys(archivedMemoryProgress).length){
    state.archivedDataSets.push({
      archivedAt:new Date().toISOString(),
      revisionVersion:TARGET,
      reason:'uploaded-revised-docx-answer-change-or-removal',
      invalidatedIds:[...INVALIDATE].map(Number),
      removedIds:[...REMOVED].map(Number),
      progress:archivedProgress,
      memoryProgress:archivedMemoryProgress
    });
  }
  state.sourceRevisionMigrationVersion=TARGET;
  localStorage.setItem(KEY,JSON.stringify(state));
}catch(e){
  console.warn('source revision progress migration skipped',e);
}
})();
