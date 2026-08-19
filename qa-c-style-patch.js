/* C-priority QA: notation and punctuation normalization only. No card removal or ID changes. */
(()=>{
  const fixes=new Map([
    // Missing sentence-final punctuation.
    [107,'食事に集中していると、他の重要な刺激に対応できない場合は、（転導性注意）の障害を考える。'],
    [542,'送り込まれた食塊の咽頭、喉頭蓋谷での集積が（Bolus aggregation）と呼ばれる。'],
    [781,'前頭側頭葉変性症は、（前頭葉）と（側頭葉前方部）を主病変とする。'],
    [1010,'ピンプリットテストでは動脈の閉塞は（蒼白）、静脈の閉塞は（赤色）に変化する。'],
    [1147,'梨状窩吸引プログラムによる肺炎発症への効果は、肺炎高リスク者では有意な（差はなかった）。'],

    // English process-model terms: adopt the hyphenated notation already used by the source in other cards.
    [483,'Stage I transportでは、食物を臼歯部へ運ぶ（pull-back motion）がみられる。'],
    [484,'Stage II transportでは、咀嚼された食物を舌と口蓋で後方へ絞り込む（squeeze-back motion）がみられる。'],

    // Dementia terminology: Japanese disease/pathology notation throughout this study dataset.
    [769,'レビー小体型認知症は（中年期）以降に発症し、（認知症）と（パーキンソニズム）を特徴とする神経変性疾患である。'],
    [770,'レビー小体型認知症ではPDと同様に（レビー小体）がみられ、（大脳皮質）を含む広い範囲に分布する。'],
    [771,'レビー小体型認知症ではADと比較して（海馬）の萎縮は軽度であり、脳幹の（萎縮）は認められない。'],
    [772,'レビー小体型認知症では脳血流SPECTで（後頭葉）の血流低下を認める。'],
    [773,'レビー小体型認知症の認知症症状には、塩酸（ドネペジル）や（抑肝散）が有効な場合がある。'],
    [774,'レビー小体型認知症では、食事中に突然（覚醒レベル）が低下し、食事を続けられなくなることがある。'],
    [775,'レビー小体型認知症では、食事に影響する精神症状として（幻視）や（被毒妄想）がみられることがある。'],
    [776,'レビー小体型認知症では（口腔期）と（咽頭期）の両方に異常が認められる。'],
    [777,'レビー小体型認知症では、口腔期の動きは（認知機能）と相関するが、咽頭期の異常は認知機能と（相関しない）。'],
    [778,'レビー小体型認知症では（不顕性誤嚥）が多い。'],
    [779,'レビー小体型認知症では口腔内での（液体保持）が悪く、液体が不用意に咽頭へ流入して誤嚥することがある。'],
    [780,'レビー小体型認知症で液体保持が不良な場合には、液体に（とろみ）を付けて対応することがある。']
  ]);
  const answerRe=/（([^（）]+)）/g;
  for(const [id,text] of fixes){
    const card=DATA.cards.find(c=>c.id===id);
    if(!card){console.error('[C QA patch] card not found:',id);continue;}
    card.text=text;
    card.answers=[...text.matchAll(answerRe)].map(m=>m[1]);
    card.qa_fixed=card.qa_fixed?`${card.qa_fixed}+C`:'C';
  }

  // Normalize only the established disease-label spelling, never arbitrary occurrences of 癌.
  for(const card of DATA.cards){
    if(card.text.includes('頭頸部癌')){
      card.text=card.text.replaceAll('頭頸部癌','頭頸部がん');
      card.answers=[...card.text.matchAll(answerRe)].map(m=>m[1]);
      card.qa_fixed=card.qa_fixed?`${card.qa_fixed}+C`:'C';
    }
  }

  // These C flags were reviewed and already use the adopted form after earlier S/B fixes.
  globalThis.DATA_QA_C_REVIEWED_NOCHANGE_IDS=[248,250,257,259,476,480,509,510,737,739,740,741,742,743,746,747,1003,1038,1150,1289];

  for(const cat of DATA.categories){
    const cards=DATA.cards.filter(c=>c.category===cat.name);
    cat.actual=cards.length;
    cat.answer_terms=cards.reduce((n,c)=>n+(c.answers?.length||0),0);
  }
  DATA.meta.actual_cards=DATA.cards.length;
  DATA.meta.answer_terms=DATA.cards.reduce((n,c)=>n+(c.answers?.length||0),0);
  DATA.meta.data_version='2026-08-19-compact1390-v1-finalQA';
  DATA.meta.qa_note='S・A・B・C優先QA反映済み。表記・句点まで統一し、最終全カードQA対象。';
})();
