(()=>{
'use strict';
const KEY='swallow_cloze_614_independent_pwa_v1';
const TARGET='canonical1380-v1';
const EXPECTED_FROM='compact1390-v1';
const INVALIDATE=new Set([153,167,168,170,171,227,228,229,242,321,401,403,407,409,423,424,425,426,427,438,439,545,675,687,711,713,822,848,850,854,872,920,931,949,954,974,1080,1082,1088,1091,1229,1234,1262].map(String));
const REMOVED=new Set([231,243,400,537,849,944,961,967,981,1292].map(String));
try{
  const raw=localStorage.getItem(KEY);
  if(!raw)return;
  const state=JSON.parse(raw);
  if(!state||typeof state!=='object'||state.dataMigrationVersion===TARGET)return;
  if(state.dataMigrationVersion!==EXPECTED_FROM)return;
  const archivedProgress={},archivedMemoryProgress={};
  for(const id of new Set([...INVALIDATE,...REMOVED])){
    if(state.progress&&Object.prototype.hasOwnProperty.call(state.progress,id)){
      archivedProgress[id]=state.progress[id]; delete state.progress[id];
    }
    if(state.memoryProgress&&Object.prototype.hasOwnProperty.call(state.memoryProgress,id)){
      archivedMemoryProgress[id]=state.memoryProgress[id]; delete state.memoryProgress[id];
    }
  }
  if(state.lastSession&&Array.isArray(state.lastSession.ids)){
    state.lastSession.ids=state.lastSession.ids.filter(id=>!REMOVED.has(String(id)));
    state.lastSession=state.lastSession.ids.length?{...state.lastSession,pos:Math.min(state.lastSession.pos||0,state.lastSession.ids.length-1)}:null;
  }
  if(state.memorySession&&Array.isArray(state.memorySession.ids)){
    state.memorySession.ids=state.memorySession.ids.filter(id=>!REMOVED.has(String(id)));
    state.memorySession=state.memorySession.ids.length?{...state.memorySession,pos:Math.min(state.memorySession.pos||0,state.memorySession.ids.length-1)}:null;
  }
  if(!Array.isArray(state.archivedDataSets))state.archivedDataSets=[];
  if(Object.keys(archivedProgress).length||Object.keys(archivedMemoryProgress).length){
    state.archivedDataSets.push({
      archivedAt:new Date().toISOString(),
      fromDataMigrationVersion:EXPECTED_FROM,
      toDataMigrationVersion:TARGET,
      reason:'canonical1380-answer-change-or-removal',
      invalidatedIds:[...INVALIDATE].map(Number),
      removedIds:[...REMOVED].map(Number),
      progress:archivedProgress,
      memoryProgress:archivedMemoryProgress
    });
  }
  state.dataMigrationVersion=TARGET;
  localStorage.setItem(KEY,JSON.stringify(state));
}catch(e){console.warn('canonical1380 selective migration skipped',e);}
})();
