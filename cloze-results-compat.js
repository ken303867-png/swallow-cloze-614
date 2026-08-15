(()=>{
'use strict';
const PATCH_VERSION='cloze-results-compat-v1';
if(document.documentElement.dataset.clozeResultsCompat===PATCH_VERSION)return;
document.documentElement.dataset.clozeResultsCompat=PATCH_VERSION;

const baseStartFromFilters=startFromFilters;
const baseResumeSession=resumeSession;

startFromFilters=function(){
  baseStartFromFilters();
  const study=document.getElementById('studyView');
  if(!study||study.classList.contains('hidden'))return;
  if(!session.ratings||typeof session.ratings!=='object')session.ratings={};
  state.lastSession={ids:[...session.ids],pos:session.pos,ratings:{...session.ratings}};
  try{localStorage.setItem(STORE_KEY,JSON.stringify(state));}catch(_){}
  renderCard();
};

resumeSession=function(){
  const savedRatings=state.lastSession&&state.lastSession.ratings?{...state.lastSession.ratings}:{};
  baseResumeSession();
  const study=document.getElementById('studyView');
  if(!study||study.classList.contains('hidden'))return;
  session.ratings=savedRatings;
  state.lastSession={ids:[...session.ids],pos:session.pos,ratings:{...session.ratings}};
  try{localStorage.setItem(STORE_KEY,JSON.stringify(state));}catch(_){}
  renderCard();
};
})();
