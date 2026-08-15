(()=>{
'use strict';
const PATCH_VERSION='memory-answer-toggle-v1';
if(document.documentElement.dataset.memoryAnswerToggle===PATCH_VERSION)return;
document.documentElement.dataset.memoryAnswerToggle=PATCH_VERSION;

const btn=document.getElementById('showAnswerBtn');
const box=document.getElementById('answerBox');
if(!btn||!box)return;

const previousOnClick=btn.onclick;
btn.onclick=(event)=>{
  if(!document.body.classList.contains('memory-mode-active')){
    if(typeof previousOnClick==='function')return previousOnClick.call(btn,event);
    if(typeof showAnswer==='function')return showAnswer();
    return;
  }

  if(box.classList.contains('show')){
    box.classList.remove('show');
    btn.textContent='答えを表示';
    btn.disabled=false;
    return;
  }

  if(typeof previousOnClick==='function')previousOnClick.call(btn,event);
  else if(typeof showAnswer==='function')showAnswer();
  btn.textContent='答えを隠す';
  btn.disabled=false;
};
})();
