(()=>{
'use strict';
const FORMAT='swallow-backup-v2';
const APP_ID='swallow-cloze-614';
const APP_LABEL='正文化穴抜き614版';
const KEY='swallow_cloze_614_independent_pwa_v1';
const RESTORE='__backup_restore__'+APP_ID;
const stamp=()=>new Date().toISOString().replace(/[:.]/g,'-');
function current(){return localStorage.getItem(KEY);}
function countProgress(raw){try{const x=JSON.parse(raw||'{}');return Object.keys(x.progress||{}).length;}catch(e){return 0;}}
async function saveFile(text,name){
 const blob=new Blob([text],{type:'application/json'});
 try{
  if(typeof File!=='undefined'&&navigator.share&&navigator.canShare){
   const file=new File([blob],name,{type:'application/json'});
   if(navigator.canShare({files:[file]})){await navigator.share({title:APP_LABEL+' バックアップ',files:[file]});return;}
  }
 }catch(e){if(e&&e.name==='AbortError')return;}
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
async function exportData(){
 const raw=current();
 if(!raw){alert('まだ保存されている学習履歴がありません。1問以上解答してからバックアップしてください。');return;}
 const data={format:FORMAT,appId:APP_ID,exportedAt:new Date().toISOString(),storageKey:KEY,value:raw};
 await saveFile(JSON.stringify(data,null,2),APP_ID+'-backup-'+stamp()+'.json');
 alert('バックアップを作成しました。回答履歴 '+countProgress(raw)+'問分を含みます。');
}
async function importData(file){
 try{
  const data=JSON.parse(await file.text());let raw=null;
  if(data&&data.format===FORMAT&&data.appId===APP_ID)raw=data.value;
  if(data&&data.format==='swallow-study-transfer-v1'&&data.appId===APP_ID&&Array.isArray(data.entries)){
   const hit=data.entries.find(x=>Array.isArray(x)&&x[0]===KEY);if(hit)raw=hit[1];
  }
  if(typeof raw!=='string')throw new Error('このアプリ用のバックアップではありません。');
  const before=current();sessionStorage.setItem(RESTORE,before===null?'__NONE__':before);
  if(!confirm('バックアップを読み込みます。現在の正文化穴抜き614版の学習履歴は上書きされます。'))return;
  localStorage.setItem(KEY,raw);alert('バックアップを読み込みました。アプリを再読み込みします。');location.reload();
 }catch(e){alert('読み込みに失敗しました: '+(e.message||e));}
}
function restore(){
 const raw=sessionStorage.getItem(RESTORE);if(raw===null){alert('この起動中に戻せる読み込み前データはありません。');return;}
 if(!confirm('直前の読み込み前の状態へ戻しますか？'))return;
 if(raw==='__NONE__')localStorage.removeItem(KEY);else localStorage.setItem(KEY,raw);
 sessionStorage.removeItem(RESTORE);location.reload();
}
function mount(){
 if(document.getElementById('backup-tools'))return;
 const host=document.createElement('div');host.id='backup-tools';document.body.appendChild(host);const s=host.attachShadow({mode:'open'});
 const n=countProgress(current());
 s.innerHTML=`<style>:host{all:initial}.fab{position:fixed;right:14px;bottom:max(14px,env(safe-area-inset-bottom));z-index:2147483646;border:0;border-radius:999px;background:#173b5e;color:#fff;padding:11px 15px;font:700 13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 6px 22px #0003}.bd{display:none;position:fixed;inset:0;z-index:2147483647;background:#0a192378;align-items:flex-end;justify-content:center;padding:16px}.bd.open{display:flex}.p{width:min(520px,100%);background:#fff;color:#17313f;border-radius:20px;padding:20px;font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.p h2{margin:0 0 6px;font-size:18px}.p p{margin:0 0 14px;color:#607383}.row{display:grid;gap:9px}.btn{border:1px solid #d3dfe5;border-radius:12px;background:#f7fafb;padding:11px;font-weight:700;text-align:center;color:#17313f}.primary{background:#087c78;color:#fff}.close{margin-top:10px;width:100%;border:0;background:transparent;padding:9px;color:#607383;font-weight:700}input{display:none}</style><button class="fab">バックアップ</button><div class="bd"><div class="p"><h2>${APP_LABEL}｜バックアップ</h2><p>現在の保存履歴: ${n}問</p><div class="row"><button class="btn primary ex">JSONを書き出す</button><label class="btn">JSONを読み込む<input class="fi" type="file" accept="application/json,.json"></label><button class="btn re">読み込み前に戻す</button></div><button class="close">閉じる</button></div></div>`;
 const b=s.querySelector('.bd');s.querySelector('.fab').onclick=()=>b.classList.add('open');s.querySelector('.close').onclick=()=>b.classList.remove('open');b.onclick=e=>{if(e.target===b)b.classList.remove('open')};s.querySelector('.ex').onclick=exportData;s.querySelector('.re').onclick=restore;s.querySelector('.fi').onchange=e=>{const f=e.target.files&&e.target.files[0];if(f)importData(f);e.target.value='';};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,250));else setTimeout(mount,250);
})();