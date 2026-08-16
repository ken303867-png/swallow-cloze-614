(()=>{
'use strict';
const PATCH_VERSION='memory-round-v2-refactor';
if(document.documentElement.dataset.memoryMode===PATCH_VERSION)return;
document.documentElement.dataset.memoryMode=PATCH_VERSION;

const baseRenderCard=renderCard;
const baseShowAnswer=showAnswer;
const baseRateCurrent=rateCurrent;
const baseMove=move;
const baseStartFromFilters=startFromFilters;
const baseResumeSession=resumeSession;
const baseSwitchView=switchView;

let memoryActive=false;
let memorySession=null;

const studyPanel=document.querySelector('#studyView .panel');
const answerHeading=document.querySelector('#answerBox h3');
const rating=document.querySelector('#answerBox .rating');
const ratingButtons=[...document.querySelectorAll('#answerBox .rating .btn')];
const reviewBtn=ratingButtons.find(b=>b.dataset.rate==='review');
const uncertainBtn=ratingButtons.find(b=>b.dataset.rate==='uncertain');
const goodBtn=ratingButtons.find(b=>b.dataset.rate==='good');
const uncertainRow=document.querySelector('#answerBox .uncertain-row');
const studyNav=document.querySelector('#studyView .study-nav');
const footerNote=document.querySelector('#studyView .footer-note');
const bottomNext=document.getElementById('bottomNextBtn');
const bookmarkBtn=document.getElementById('bookmarkBtn');
const showAnswerBtn=document.getElementById('showAnswerBtn');

const originals={
  answerHeading:answerHeading?.textContent||'',
  reviewText:reviewBtn?.textContent||'',
  uncertainText:uncertainBtn?.textContent||'',
  goodText:goodBtn?.textContent||'',
  reviewClass:reviewBtn?.className||'',
  uncertainClass:uncertainBtn?.className||'',
  goodClass:goodBtn?.className||''
};

function ensureMemoryState(){
  if(!state.memoryProgress||typeof state.memoryProgress!=='object')state.memoryProgress={};
  if(!('memorySession' in state))state.memorySession=null;
}
function memoryGet(id){
  ensureMemoryState();
  return state.memoryProgress[id]||{status:null,attempts:0,remembered:0,again:0,lastAt:null};
}
function persistMemory(){
  try{localStorage.setItem(STORE_KEY,JSON.stringify(state));}catch(_){ }
  try{refreshSummary();}catch(_){ }
  updateMemorySummary();
}
function serializeMemorySession(){
  if(!memorySession)return null;
  return {
    version:PATCH_VERSION,
    initialIds:[...memorySession.initialIds],
    ids:[...memorySession.ids],
    pos:memorySession.pos,
    nextIds:[...memorySession.nextIds],
    round:memorySession.round,
    random:!!memorySession.random,
    startedAt:memorySession.startedAt||new Date().toISOString()
  };
}
function saveMemorySession(){
  ensureMemoryState();
  state.memorySession=serializeMemorySession();
  persistMemory();
}
function clearMemorySession(){
  ensureMemoryState();
  state.memorySession=null;
  persistMemory();
}
function memoryCard(){
  if(!memorySession)return null;
  const id=memorySession.ids[memorySession.pos];
  return DATA.cards.find(c=>c.id===id)||null;
}
function selectedMemoryCards(){
  let arr=filteredCards();
  if(!arr.length)return [];
  const random=document.getElementById('orderSel').value==='random';
  if(random)arr=shuffle([...arr]);
  const lim=Number(document.getElementById('limitSel').value);
  if(lim>0)arr=arr.slice(0,lim);
  return arr;
}
function injectHomeUI(){
  if(document.getElementById('modeSel'))return;
  const grid=document.querySelector('#homeView .grid');
  if(grid){
    const field=document.createElement('div');
    field.className='field';
    field.innerHTML='<label>学習モード</label><select id="modeSel"><option value="cloze">穴抜きモード</option><option value="memory">暗記モード</option></select>';
    grid.insertBefore(field,grid.firstChild);
  }
  const actions=document.querySelector('#homeView .actions');
  if(actions){
    const resume=document.createElement('button');
    resume.className='btn secondary';
    resume.id='memoryResumeBtn';
    resume.textContent='暗記モードの続き';
    resume.style.display='none';
    actions.appendChild(resume);
    resume.onclick=resumeMemoryMode;
  }
  const notice=document.createElement('div');
  notice.id='memorySummary';
  notice.className='notice';
  notice.style.marginTop='10px';
  document.getElementById('dataNotice')?.insertAdjacentElement('afterend',notice);
  updateMemorySummary();
}
function updateMemorySummary(){
  ensureMemoryState();
  const el=document.getElementById('memorySummary');
  if(el){
    let memorized=0,learning=0;
    for(const c of DATA.cards){
      const p=state.memoryProgress[c.id];
      if(p?.status==='memorized')memorized++;
      else if(p?.status==='learning')learning++;
    }
    el.innerHTML=`<b>暗記モード</b>：暗記済 <b>${memorized}</b> / ${DATA.meta.actual_cards} ・ まだ <b>${learning}</b><br><span class="muted">選んだ範囲を、全カードが「覚えた」になるまで自動で周回します。</span>`;
  }
  const rb=document.getElementById('memoryResumeBtn');
  if(rb)rb.style.display=state.memorySession&&state.memorySession.ids?.length?'':'none';
}
function applyMemoryUI(){
  document.body.classList.add('memory-mode-active');
  if(answerHeading)answerHeading.textContent='答え';
  if(reviewBtn){reviewBtn.textContent='↻ まだ';reviewBtn.className='btn bad';reviewBtn.style.display='';}
  if(uncertainBtn)uncertainBtn.style.display='none';
  if(goodBtn){goodBtn.textContent='✓ 覚えた';goodBtn.className='btn good';goodBtn.style.display='';}
  if(rating){rating.style.gridTemplateColumns='1fr 1fr';rating.style.display='grid';}
  if(uncertainRow)uncertainRow.style.display='none';
  if(studyNav)studyNav.style.display='none';
  if(footerNote)footerNote.style.display='none';
  if(bottomNext)bottomNext.style.display='none';
  document.getElementById('memoryComplete')?.remove();
}
function restoreStudyUI(){
  document.body.classList.remove('memory-mode-active');
  if(answerHeading)answerHeading.textContent=originals.answerHeading;
  if(reviewBtn){reviewBtn.textContent=originals.reviewText;reviewBtn.className=originals.reviewClass;reviewBtn.style.display='';}
  if(uncertainBtn){uncertainBtn.textContent=originals.uncertainText;uncertainBtn.className=originals.uncertainClass;uncertainBtn.style.display='';}
  if(goodBtn){goodBtn.textContent=originals.goodText;goodBtn.className=originals.goodClass;goodBtn.style.display='';}
  if(rating){rating.style.gridTemplateColumns='';rating.style.display='';}
  if(uncertainRow)uncertainRow.style.display='';
  if(studyNav)studyNav.style.display='';
  if(footerNote)footerNote.style.display='';
  if(bottomNext)bottomNext.style.display='';
  if(showAnswerBtn){showAnswerBtn.style.display='';showAnswerBtn.disabled=false;}
  if(bookmarkBtn)bookmarkBtn.style.display='';
  document.getElementById('memoryComplete')?.remove();
}
function beginMemory(ids,random){
  memoryActive=true;
  memorySession={
    initialIds:[...ids],ids:[...ids],pos:0,nextIds:[],round:1,
    random:!!random,startedAt:new Date().toISOString(),answerShown:false
  };
  applyMemoryUI();
  saveMemorySession();
  baseSwitchView('study');
  renderMemoryCard();
}
function startMemoryMode(){
  const arr=selectedMemoryCards();
  if(!arr.length){alert('条件に一致する問題がありません。');return;}
  beginMemory(arr.map(c=>c.id),document.getElementById('orderSel').value==='random');
}
function resumeMemoryMode(){
  ensureMemoryState();
  const s=state.memorySession;
  if(!s||!Array.isArray(s.ids)||!s.ids.length){alert('再開できる暗記セッションがありません。');updateMemorySummary();return;}
  const valid=new Set(DATA.cards.map(c=>c.id));
  const ids=s.ids.filter(id=>valid.has(id));
  const initialIds=(s.initialIds||ids).filter(id=>valid.has(id));
  const nextIds=(s.nextIds||[]).filter(id=>valid.has(id));
  if(!ids.length){state.memorySession=null;persistMemory();alert('再開できる暗記セッションがありません。');return;}
  memoryActive=true;
  memorySession={
    initialIds,ids,pos:Math.min(Math.max(0,s.pos||0),ids.length-1),nextIds,
    round:Math.max(1,s.round||1),random:!!s.random,startedAt:s.startedAt||new Date().toISOString(),answerShown:false
  };
  applyMemoryUI();
  baseSwitchView('study');
  renderMemoryCard();
}
function renderMemoryCard(){
  if(!memoryActive||!memorySession)return baseRenderCard();
  const c=memoryCard();
  if(!c){finishMemoryMode();return;}
  const p=memoryGet(c.id);
  document.getElementById('qCat').textContent='暗記 '+c.category_symbol+' '+c.category;
  document.getElementById('qRef').textContent='['+c.ref+']';
  document.getElementById('qCounter').textContent=`${memorySession.round}周目 ${memorySession.pos+1} / ${memorySession.ids.length}`;
  document.getElementById('qProgress').style.width=((memorySession.pos+1)/memorySession.ids.length*100)+'%';
  document.getElementById('questionText').innerHTML=clozeHtml(c.text);
  document.getElementById('answerText').innerHTML=answerHtml(c.text);
  document.getElementById('answerBox').classList.toggle('show',!!memorySession.answerShown);
  showAnswerBtn.textContent=memorySession.answerShown?'答えを隠す':'答えを表示';
  showAnswerBtn.disabled=false;
  bookmarkBtn.textContent=pget(c.id).bookmarked?'★ ブックマーク済み':'☆ ブックマーク';
  const last=document.getElementById('lastResult');
  if(last)last.textContent=p.status==='memorized'?'暗記履歴: 覚えた':p.status==='learning'?'暗記履歴: まだ':'';
  saveMemorySession();
  window.scrollTo({top:0,behavior:'smooth'});
}
function memoryShowAnswer(){
  if(!memoryActive)return baseShowAnswer();
  if(!memorySession)return;
  memorySession.answerShown=!memorySession.answerShown;
  renderMemoryCard();
}
function memoryRate(remembered){
  if(!memoryActive)return;
  if(!memorySession?.answerShown){memoryShowAnswer();return;}
  const c=memoryCard();
  if(!c)return;
  const p=memoryGet(c.id);
  p.attempts=(p.attempts||0)+1;
  p.lastAt=new Date().toISOString();
  if(remembered){p.status='memorized';p.remembered=(p.remembered||0)+1;}
  else{p.status='learning';p.again=(p.again||0)+1;memorySession.nextIds.push(c.id);}
  state.memoryProgress[c.id]=p;

  if(memorySession.pos<memorySession.ids.length-1){
    memorySession.pos++;
    memorySession.answerShown=false;
    saveMemorySession();
    renderMemoryCard();
    return;
  }
  if(memorySession.nextIds.length){
    const remaining=[...memorySession.nextIds];
    memorySession.round++;
    memorySession.ids=memorySession.random?shuffle(remaining):remaining;
    memorySession.pos=0;
    memorySession.nextIds=[];
    memorySession.answerShown=false;
    saveMemorySession();
    renderMemoryCard();
    return;
  }
  finishMemoryMode();
}
function finishMemoryMode(){
  if(!memorySession)return;
  const total=memorySession.initialIds.length;
  const rounds=memorySession.round;
  clearMemorySession();
  document.getElementById('qCat').textContent='暗記モード 完了';
  document.getElementById('qRef').textContent='';
  document.getElementById('qCounter').textContent=`${rounds}周で完了`;
  document.getElementById('qProgress').style.width='100%';
  document.getElementById('questionText').innerHTML=`<div style="text-align:center;padding:26px 8px"><div style="font-size:38px;margin-bottom:10px">✓</div><b style="font-size:22px">全${total}カードを覚えました</b><p class="muted">「まだ」のカードだけを繰り返し、${rounds}周ですべて「覚えた」になりました。</p></div>`;
  document.getElementById('answerBox').classList.remove('show');
  showAnswerBtn.style.display='none';
  bookmarkBtn.style.display='none';
  if(studyNav)studyNav.style.display='none';
  if(footerNote)footerNote.style.display='none';
  let done=document.getElementById('memoryComplete');
  if(!done){
    done=document.createElement('div');
    done.id='memoryComplete';
    done.className='actions';
    done.innerHTML='<button class="btn primary" id="memoryAgainBtn">同じ範囲をもう一度</button><button class="btn secondary" id="memoryHomeBtn">学習条件へ戻る</button>';
    studyPanel.appendChild(done);
  }
  done.style.display='flex';
  document.getElementById('memoryAgainBtn').onclick=()=>{
    const ids=[...memorySession.initialIds];
    const random=memorySession.random;
    restoreStudyUI();
    beginMemory(random?shuffle(ids):ids,random);
  };
  document.getElementById('memoryHomeBtn').onclick=()=>{
    memoryActive=false;
    restoreStudyUI();
    baseSwitchView('home');
    updateMemorySummary();
  };
  updateMemorySummary();
}

renderCard=function(){return memoryActive?renderMemoryCard():baseRenderCard();};
showAnswer=function(){return memoryActive?memoryShowAnswer():baseShowAnswer();};
rateCurrent=function(rate){
  if(!memoryActive)return baseRateCurrent(rate);
  if(rate==='good')return memoryRate(true);
  if(rate==='review'||rate==='uncertain')return memoryRate(false);
};
move=function(d){return memoryActive?undefined:baseMove(d);};
switchView=function(v){
  if(memoryActive&&v!=='study'){
    memoryActive=false;
    if(memorySession)saveMemorySession();
    restoreStudyUI();
  }
  return baseSwitchView(v);
};

injectHomeUI();
ensureMemoryState();

const startButton=document.getElementById('startBtn');
startButton.onclick=()=>{
  const mode=document.getElementById('modeSel')?.value||'cloze';
  if(mode==='memory')startMemoryMode();
  else{
    memoryActive=false;
    restoreStudyUI();
    baseStartFromFilters();
  }
};
document.getElementById('resumeBtn').onclick=()=>{
  memoryActive=false;
  restoreStudyUI();
  baseResumeSession();
};
showAnswerBtn.onclick=()=>showAnswer();
if(reviewBtn)reviewBtn.onclick=()=>rateCurrent('review');
if(uncertainBtn)uncertainBtn.onclick=()=>rateCurrent('uncertain');
if(goodBtn)goodBtn.onclick=()=>rateCurrent('good');
if(document.getElementById('prevBtn'))document.getElementById('prevBtn').onclick=()=>move(-1);
if(document.getElementById('nextBtn'))document.getElementById('nextBtn').onclick=()=>move(1);
if(bottomNext)bottomNext.onclick=()=>move(1);
document.getElementById('resetBtn')?.addEventListener('click',()=>setTimeout(updateMemorySummary,100));

updateMemorySummary();
})();