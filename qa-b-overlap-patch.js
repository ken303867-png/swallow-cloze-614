/* B-priority overlap fixes: cards already touched by S/A that also had B cloze-design flags. */
(()=>{
  const fixes=new Map([
    [259,'フードテストの評価基準3点は、（嚥下あり・呼吸良好）であるが、（むせる・湿性嗄声）のいずれか、または（口腔内残留中等度）がみられる。'],
    [746,'レビー小体型認知症などで視空間認知障害がある場合は、できる動作に合わせて（食器の位置）を調整する。'],
    [970,'重症筋無力症では、症状として（眼瞼下垂・複視）（四肢筋力低下）（開鼻声・摂食嚥下障害）などを認める。']
  ]);
  const answerRe=/（([^（）]+)）/g;
  for(const [id,text] of fixes){
    const card=DATA.cards.find(c=>c.id===id);
    if(!card){console.error('[B overlap QA patch] card not found:',id);continue;}
    card.text=text;
    card.answers=[...text.matchAll(answerRe)].map(m=>m[1]);
    card.qa_fixed=card.qa_fixed?`${card.qa_fixed}+B2`:'B2';
  }
  for(const cat of DATA.categories){
    const cards=DATA.cards.filter(c=>c.category===cat.name);
    cat.actual=cards.length;
    cat.answer_terms=cards.reduce((n,c)=>n+(c.answers?.length||0),0);
  }
  DATA.meta.actual_cards=DATA.cards.length;
  DATA.meta.answer_terms=DATA.cards.reduce((n,c)=>n+(c.answers?.length||0),0);
  DATA.meta.data_version='2026-08-19-compact1390-v1-qaSAB2-overlap';
  DATA.meta.qa_note='S・A・B優先QA完了。優先度重複カード3件のB設計課題も追加修正済み。';
})();
