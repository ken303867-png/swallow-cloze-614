const STORE_KEY='swallow_cloze_614_independent_pwa_v1';
const DATA_MIGRATION_VERSION='compact1390-v1';
const CURRENT_IDS=new Set(DATA.cards.map(c=>String(c.id)));
let state=loadState();
let session={ids:[],pos:0,answerShown:false};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];

function defaultProgress(){return {status:null,uncertain:false,bookmarked:false,attempts:0,good:0,review:0,lastAt:null}}
function hasLegacyLearning(s){
  return !!(s&&(
    (s.progress&&Object.keys(s.progress).length) ||
    (s.memoryProgress&&Object.keys(s.memoryProgress).length) ||
    (s.lastSession&&Array.isArray(s.lastSession.ids)&&s.lastSession.ids.length) ||
    (s.memorySession&&Array.isArray(s.memorySession.ids)&&s.memorySession.ids.length)
  ));
}
function migrateState(s){
  if(!s||typeof s!=='object')s={};
  if(s.dataMigrationVersion===DATA_MIGRATION_VERSION){
    if(!s.progress||typeof s.progress!=='object')s.progress={};
    if(!s.memoryProgress||typeof s.memoryProgress!=='object')s.memoryProgress={};
    if(!Array.isArray(s.archivedDataSets))s.archivedDataSets=[];
    return s;
  }
  const archives=Array.isArray(s.archivedDataSets)?[...s.archivedDataSets]:[];
  if(hasLegacyLearning(s)){
    archives.push({
      archivedAt:new Date().toISOString(),
      fromDataMigrationVersion:s.dataMigrationVersion||'legacy-unknown',
      reason:'problem-dataset-replaced-with-compact1390',
      progress:s.progress&&typeof s.progress==='object'?s.progress:{},
      lastSession:s.lastSession||null,
      memoryProgress:s.memoryProgress&&typeof s.memoryProgress==='object'?s.memoryProgress:{},
      memorySession:s.memorySession||null
    });
  }
  return {
    progress:{},
    lastSession:null,
    memoryProgress:{},
    memorySession:null,
    archivedProgress:s.archivedProgress&&typeof s.archivedProgress==='object'?s.archivedProgress:{},
    archivedDataSets:archives,
    dataMigrationVersion:DATA_MIGRATION_VERSION
  };
}
function loadState(){try{return migrateState(JSON.parse(localStorage.getItem(STORE_KEY))||{})}catch(e){return migrateState({})}}
function saveState(){localStorage.setItem(STORE_KEY,JSON.stringify(state));refreshSummary()}
function pget(id){return state.progress[id]||defaultProgress()}
function pset(id,p){state.progress[id]=p;saveState()}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function clozeHtml(text){let out='',last=0,re=/（([^（）]+)）/g,m;while((m=re.exec(text))){out+=esc(text.slice(last,m.index)).replace(/\n/g,'<br>');let w=Math.min(18,Math.max(5,m[1].length*.9));out+=`（<span class="blank" style="min-width:${w}em">${esc(m[1])}</span>）`;last=re.lastIndex}out+=esc(text.slice(last)).replace(/\n/g,'<br>');return out}
function answerHtml(text){let out='',last=0,re=/（([^（）]+)）/g,m;while((m=re.exec(text))){out+=esc(text.slice(last,m.index)).replace(/\n/g,'<br>');out+=`（<span class="answer">${esc(m[1])}</span>）`;last=re.lastIndex}out+=esc(text.slice(last)).replace(/\n/g,'<br>');return out}

function init(){
  $('#dataNotice').innerHTML=`<b>${esc(DATA.meta.source)}</b>：全 <b>${DATA.meta.actual_cards}</b> カード ／ 穴抜き語句 <b>${DATA.meta.answer_terms}</b> 個 ／ <b>${DATA.meta.section_count}</b> 分野。<br><span class="muted">アップロードされたDOCX本文を資料順に収録しています。</span>`;
  $('#categorySel').innerHTML='<option value="all">すべての分野</option>'+DATA.categories.map(c=>`<option value="${esc(c.name)}">${esc(c.symbol+' '+c.name)} (${c.actual})</option>`).join('');
  $('#metaText').textContent=`${DATA.meta.title}。全 ${DATA.meta.actual_cards} カード、穴抜き語句 ${DATA.meta.answer_terms} 個、${DATA.meta.section_count} 分野。`;
  $('#catTable').innerHTML=DATA.categories.map(c=>`<tr><td>${esc(c.symbol+' '+c.name)}</td><td>${c.actual}</td></tr>`).join('');
  bind();refreshSummary();searchCards('');
  if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
function bind(){
  $('#startBtn').onclick=startFromFilters;$('#resumeBtn').onclick=resumeSession;$('#showAnswerBtn').onclick=showAnswer;$('#bookmarkBtn').onclick=toggleBookmark;$('#prevBtn').onclick=()=>move(-1);$('#nextBtn').onclick=()=>move(1);$('#bottomNextBtn').onclick=()=>move(1);
  $$('.rating .btn').forEach(b=>b.onclick=()=>rateCurrent(b.dataset.rate));
  $('#uncertainCheck').onchange=()=>{let c=currentCard();if(!c)return;let p=pget(c.id);p.uncertain=$('#uncertainCheck').checked;pset(c.id,p);renderCard()};
  $('#searchInp').oninput=e=>searchCards(e.target.value);$('#keywordInp').onkeydown=e=>{if(e.key==='Enter')startFromFilters()};
  $$('.tab').forEach(t=>t.onclick=()=>switchView(t.dataset.view));$('#resetBtn').onclick=resetProgress;$('#exportBtn').onclick=exportProgress;$('#importFile').onchange=importProgress;
  document.addEventListener('keydown',e=>{if($('#studyView').classList.contains('hidden')||['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName))return;if(e.code==='Space'){e.preventDefault();showAnswer()}else if(e.key==='1')rateCurrent('review');else if(e.key==='2')rateCurrent('uncertain');else if(e.key==='3')rateCurrent('good');else if(e.key==='ArrowRight')move(1);else if(e.key==='ArrowLeft')move(-1)});
}
function filteredCards(){let cat=$('#categorySel').value,src=$('#sourceSel').value,st=$('#statusSel').value,kw=$('#keywordInp').value.trim().toLowerCase();return DATA.cards.filter(c=>{if(cat!=='all'&&c.category!==cat)return false;if(src!=='all'&&!((c.sources&&c.sources.includes(src))||c.source===src))return false;if(kw&&!(`${c.text} ${c.ref} ${c.category}`.toLowerCase().includes(kw)))return false;let p=pget(c.id);if(st==='unseen'&&p.status)return false;if(st==='review'&&p.status!=='review')return false;if(st==='good'&&p.status!=='good')return false;if(st==='uncertain'&&!p.uncertain)return false;if(st==='bookmarked'&&!p.bookmarked)return false;return true})}
function startFromFilters(){let arr=filteredCards();if(!arr.length){alert('条件に一致する問題がありません。');return}if($('#orderSel').value==='random')arr=shuffle([...arr]);let lim=Number($('#limitSel').value);if(lim>0)arr=arr.slice(0,lim);session={ids:arr.map(c=>c.id),pos:0,answerShown:false};state.lastSession={ids:session.ids,pos:0};saveState();switchView('study');renderCard()}
function resumeSession(){let s=state.lastSession;if(!s||!s.ids||!s.ids.length){alert('再開できる前回セッションがありません。');return}const valid=s.ids.filter(id=>DATA.cards.some(c=>c.id===id));if(!valid.length){state.lastSession=null;saveState();alert('再開できる前回セッションがありません。');return}session={ids:valid,pos:Math.min(s.pos||0,valid.length-1),answerShown:false};switchView('study');renderCard()}
function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function currentCard(){let id=session.ids[session.pos];return DATA.cards.find(c=>c.id===id)}
function renderCard(){let c=currentCard();if(!c){switchView('home');return}let p=pget(c.id);$('#qCat').textContent=c.category_symbol+' '+c.category;$('#qRef').textContent='['+c.ref+']';$('#qCounter').textContent=`${session.pos+1} / ${session.ids.length}`;$('#qProgress').style.width=((session.pos+1)/session.ids.length*100)+'%';$('#questionText').innerHTML=clozeHtml(c.text);$('#answerText').innerHTML=answerHtml(c.text);$('#answerBox').classList.toggle('show',session.answerShown);$('#showAnswerBtn').textContent=session.answerShown?'答えを隠す':'答えを表示';$('#bookmarkBtn').textContent=p.bookmarked?'★ ブックマーク済み':'☆ ブックマーク';$('#uncertainCheck').checked=!!p.uncertain;$('#lastResult').textContent=p.status==='good'?'前回: できた':p.status==='review'?'前回: 要復習':'';$('#prevBtn').disabled=session.pos===0;$('#nextBtn').disabled=session.pos===session.ids.length-1;$('#bottomNextBtn').disabled=session.pos===session.ids.length-1;state.lastSession={ids:session.ids,pos:session.pos};saveState();window.scrollTo({top:0,behavior:'smooth'})}
function showAnswer(){session.answerShown=!session.answerShown;renderCard()}
function rateCurrent(rate){let c=currentCard();if(!c)return;let p=pget(c.id);p.attempts=(p.attempts||0)+1;p.lastAt=new Date().toISOString();if(rate==='good'){p.status='good';p.good=(p.good||0)+1}else if(rate==='review'){p.status='review';p.review=(p.review||0)+1}else if(rate==='uncertain'){p.status='review';p.uncertain=true;p.review=(p.review||0)+1}pset(c.id,p);session.answerShown=true;renderCard()}
function toggleBookmark(){let c=currentCard();if(!c)return;let p=pget(c.id);p.bookmarked=!p.bookmarked;pset(c.id,p);renderCard()}
function move(d){let n=session.pos+d;if(n<0||n>=session.ids.length)return;session.pos=n;session.answerShown=false;renderCard()}
function refreshSummary(){let vals=DATA.cards.map(c=>pget(c.id)),studied=vals.filter(p=>p.status).length,good=vals.filter(p=>p.status==='good').length,review=vals.filter(p=>p.status==='review').length,unc=vals.filter(p=>p.uncertain).length,att=vals.reduce((s,p)=>s+(p.attempts||0),0),book=vals.filter(p=>p.bookmarked).length;$('#mStudied').textContent=studied;$('#mGood').textContent=good;$('#mReview').textContent=review;$('#mUncertain').textContent=unc;$('#topstat').textContent=`学習済 ${studied}/${DATA.meta.actual_cards}`;$('#sAttempts').textContent=att;$('#sRate').textContent=studied?Math.round(good/studied*100)+'%':'-';$('#sBookmark').textContent=book;$('#sRemain').textContent=DATA.meta.actual_cards-studied;renderCatStats()}
function renderCatStats(){let h='';for(let cat of DATA.categories){let cs=DATA.cards.filter(c=>c.category===cat.name),done=cs.filter(c=>pget(c.id).status).length,good=cs.filter(c=>pget(c.id).status==='good').length,pct=cs.length?Math.round(done/cs.length*100):0;h+=`<div class="catrow"><div class="catname">${esc(cat.symbol+' '+cat.name)}<br><span class="muted">${done}/${cs.length} 学習・できた ${good}</span></div><div class="mini"><span style="width:${pct}%"></span></div><div class="catpct">${pct}%</div></div>`}$('#catStats').innerHTML=h}
function switchView(v){['home','study','stats','data'].forEach(x=>$('#'+x+'View').classList.toggle('hidden',x!==v));$$('.tab').forEach(t=>t.classList.toggle('active',t.dataset.view===(v==='study'?'home':v)));if(v==='stats')renderCatStats();if(v!=='study')window.scrollTo({top:0,behavior:'smooth'})}
function searchCards(q){q=q.trim().toLowerCase();let box=$('#searchResults');if(!q){box.innerHTML='<div class="muted" style="padding:10px">分野名・症候名・評価尺度・訓練名などで検索できます。</div>';return}let hits=DATA.cards.filter(c=>`${c.text} ${c.ref} ${c.category}`.toLowerCase().includes(q)).slice(0,50);box.innerHTML=hits.length?hits.map(c=>`<div class="search-item" data-id="${c.id}"><b>${esc(c.category_symbol+' '+c.category)} ・ [${esc(c.ref)}]</b><p>${esc(c.text.replace(/\n/g,' ')).slice(0,170)}${c.text.length>170?'…':''}</p></div>`).join(''):'<div class="muted" style="padding:10px">該当なし</div>';$$('.search-item').forEach(el=>el.onclick=()=>{session={ids:[Number(el.dataset.id)],pos:0,answerShown:false};switchView('study');renderCard()})}
function resetProgress(){if(!confirm('現在の穴抜き・暗記の学習履歴、自信なし、ブックマークを削除します。過去データのアーカイブは保持されます。よろしいですか？'))return;state={progress:{},lastSession:null,memoryProgress:{},memorySession:null,archivedProgress:state.archivedProgress||{},archivedDataSets:Array.isArray(state.archivedDataSets)?state.archivedDataSets:[],dataMigrationVersion:DATA_MIGRATION_VERSION};saveState();alert('現在の学習履歴をリセットしました。')}
function exportProgress(){let blob=new Blob([JSON.stringify({app:'swallow_cloze_trainer_v1',exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='摂食嚥下_厳選コンパクト版_学習履歴_'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(a.href)}
function importProgress(e){let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{let obj=JSON.parse(r.result),s=obj.state||obj;if(!s||typeof s!=='object')throw 0;state=migrateState(s);saveState();alert(s.dataMigrationVersion===DATA_MIGRATION_VERSION?'学習履歴を読み込みました。':'旧問題データの履歴をアーカイブしました。新1390カードには引き継いでいません。')}catch(_){alert('読み込める学習履歴JSONではありません。')}e.target.value=''};r.readAsText(f)}
init();
