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
