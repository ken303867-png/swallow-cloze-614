(()=>{
'use strict';
const STORE_KEY='swallow_cloze_614_independent_pwa_v1';
const REVISION='source-revision-20260826-1';
const RESET_IDS=new Set([115,116,123,127,141,144,146,148,153,158,167,168,170,171,185,202,203,214,227,228,229,235,242,253,264]);
const REMOVED_IDS=new Set([119,140,142,149,150,156,159,160,230,263]);
try{
  const state=JSON.parse(localStorage.getItem(STORE_KEY)||'{}');
  if(state.sourceRevisionMigrationVersion===REVISION)return;
  if(!Array.isArray(state.archivedCardRevisions))state.archivedCardRevisions=[];
  const archived={revision:REVISION,archivedAt:new Date().toISOString(),reset:{},removed:{},memoryReset:{},memoryRemoved:{}};
  if(state.progress&&typeof state.progress==='object'){
    for(const id of RESET_IDS){
      const key=String(id),p=state.progress[key];
      if(p){archived.reset[key]=p;state.progress[key]={status:null,uncertain:false,bookmarked:!!p.bookmarked,attempts:0,good:0,review:0,lastAt:null};}
    }
    for(const id of REMOVED_IDS){const key=String(id),p=state.progress[key];if(p){archived.removed[key]=p;delete state.progress[key];}}
  }
  if(state.memoryProgress&&typeof state.memoryProgress==='object'){
    for(const id of RESET_IDS){const key=String(id),p=state.memoryProgress[key];if(p){archived.memoryReset[key]=p;delete state.memoryProgress[key];}}
    for(const id of REMOVED_IDS){const key=String(id),p=state.memoryProgress[key];if(p){archived.memoryRemoved[key]=p;delete state.memoryProgress[key];}}
  }
  const drop=new Set([...RESET_IDS,...REMOVED_IDS]);
  if(state.lastSession&&Array.isArray(state.lastSession.ids)){
    state.lastSession.ids=state.lastSession.ids.filter(id=>!drop.has(Number(id)));
    if(!state.lastSession.ids.length)state.lastSession=null;else state.lastSession.pos=Math.min(Number(state.lastSession.pos)||0,state.lastSession.ids.length-1);
  }
  if(state.memorySession){
    for(const key of ['initialIds','ids','nextIds']){if(Array.isArray(state.memorySession[key]))state.memorySession[key]=state.memorySession[key].filter(id=>!drop.has(Number(id)));}
    if(!Array.isArray(state.memorySession.ids)||!state.memorySession.ids.length)state.memorySession=null;else state.memorySession.pos=Math.min(Number(state.memorySession.pos)||0,state.memorySession.ids.length-1);
  }
  if(Object.keys(archived.reset).length||Object.keys(archived.removed).length||Object.keys(archived.memoryReset).length||Object.keys(archived.memoryRemoved).length)state.archivedCardRevisions.push(archived);
  state.sourceRevisionMigrationVersion=REVISION;
  localStorage.setItem(STORE_KEY,JSON.stringify(state));
}catch(e){console.error('[source-revision-migration]',e);}
})();
