/* 1390-card dataset QA patch: S-priority fixes only.
 * Loaded after data.js and before core.js so stable numeric IDs remain unchanged.
 * Four source headings that were mistakenly converted to cloze cards are excluded
 * without renumbering any surviving card IDs.
 */
(()=>{
  const fixes=new Map([
    [112,'構成失行の主な責任病巣（右頭頂葉）'],
    [242,'プロフィール5は、（むせることがしばしば）で、（全量飲むことが困難）である。'],
    [293,'K-point刺激の対象には、（嚥下反射惹起遅延）（重度嚥下障害）も含まれる。'],
    [401,'VEでは、検査食に（青色）や（緑色）などの食用着色料を添加し、（咽頭残留）や（喉頭侵入）などを評価する。'],
    [738,'レビー小体型認知症では、（認知機能の変動）（幻視）（パーキンソニズム）が特徴である。'],
    [746,'レビー小体型認知症などで視空間認知障害がある場合は、（できる動作に合わせて食器の位置を調整）する。'],
    [1042,'ACE阻害薬カプトプリルでは、（サブスタンスP増加）などを介して（嚥下反射）（咳反射）の改善がみられることがある。']
  ]);
  const excluded=new Set([231,243,400,537]);
  const answerRe=/（([^（）]+)）/g;

  for(const [id,text] of fixes){
    const card=DATA.cards.find(c=>c.id===id);
    if(!card){console.error('[QA patch] card not found:',id);continue;}
    card.text=text;
    card.answers=[...text.matchAll(answerRe)].map(m=>m[1]);
    card.qa_fixed='S';
  }

  // Remove only the four false heading cards. Since each card already owns its
  // persistent numeric ID, filtering does not renumber any surviving card.
  DATA.cards=DATA.cards.filter(c=>!excluded.has(c.id));

  // Recalculate displayed metadata from the active card set.
  for(const cat of DATA.categories){
    const cards=DATA.cards.filter(c=>c.category===cat.name);
    cat.actual=cards.length;
    cat.answer_terms=cards.reduce((n,c)=>n+(c.answers?.length||0),0);
  }
  DATA.meta.actual_cards=DATA.cards.length;
  DATA.meta.answer_terms=DATA.cards.reduce((n,c)=>n+(c.answers?.length||0),0);
  DATA.meta.data_version='2026-08-19-compact1390-v1-qaS';
  DATA.meta.source_format_warnings=0;
  DATA.meta.qa_note='S優先QA 11件修正済み。見出し誤カード4件は元IDを欠番として出題対象外。';
})();
