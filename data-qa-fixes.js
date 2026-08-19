(() => {
'use strict';

// 2026-08-19 QA fixes for the compact dataset.
// All original IDs/refs are constructed first and remain stable. Cards judged
// to be headings or exact later duplicates are filtered only afterwards, so
// no surviving card is renumbered and existing learning history cannot shift.

const TEXT_FIXES = new Map([
  // S: bracket / wording fixes
  [112, '構成失行の主な責任病巣（右頭頂葉）'],
  [242, 'プロフィール5は、（むせることがしばしば）で、（全量飲むことが困難）である。'],
  [293, 'K-point刺激の対象には、（嚥下反射惹起遅延）（重度嚥下障害）も含まれる。'],
  [401, 'VEでは、検査食に（青色・緑色などの食用着色料）を添加し、（咽頭残留・喉頭侵入）などを評価する。'],
  [738, 'レビー小体型認知症では、（認知機能の変動）（幻視）（パーキンソニズム）が特徴である。'],
  [746, 'レビー小体型認知症などで視空間認知障害がある場合は、（できる動作に合わせて食器の位置を調整）する。'],
  [1042, 'ACE阻害薬カプトプリルでは、（サブスタンスP増加）などを介して（嚥下反射）（咳反射）の改善がみられることがある。'],

  // A: restore MWST context
  [245, 'MWSTでは、嚥下後に（反復嚥下）を（2回）行わせる。'],
  [246, 'MWSTでは、評価基準が（4点以上）なら、最大（2施行）繰り返す。'],
  [247, 'MWSTでは、複数回施行した場合は（最低点）を評点とする。'],
  [248, 'MWSTの評価基準1点は、（嚥下なし）、（むせる）and/or（呼吸切迫）がみられる。'],
  [249, 'MWSTの評価基準2点は、（嚥下あり）、（呼吸切迫）があり、（不顕性誤嚥）が疑われる。'],
  [250, 'MWSTの評価基準3点は、（嚥下あり）、（呼吸良好）であるが、（むせる）and/or（湿性嗄声）がみられる。'],
  [251, 'MWSTの評価基準4点は、（嚥下あり）、（呼吸良好）で、（むせない）。'],
  [252, 'MWSTの評価基準5点は、評価基準（4点）に加え、（反復嚥下）が（30秒以内に2回）可能である。'],

  // A: restore food-test context
  [254, 'フードテストでは、嚥下後に（反復嚥下）を（2回）行わせる。'],
  [255, 'フードテストでは、評価基準が（4点以上）なら、最大（2施行）繰り返す。'],
  [256, 'フードテストでは、複数回施行した場合は（最低点）を評点とする。'],
  [257, 'フードテストの評価基準1点は、（嚥下なし）、（むせる）and/or（呼吸切迫）がみられる。'],
  [258, 'フードテストの評価基準2点は、（嚥下あり）、（呼吸切迫）があり、（不顕性誤嚥）が疑われる。'],
  [259, 'フードテストの評価基準3点は、（嚥下あり）、（呼吸良好）であるが、（むせる）and/or（湿性嗄声）、（口腔内残留中等度）がみられる。'],
  [260, 'フードテストの評価基準4点は、（嚥下あり）、（呼吸良好）で、（むせない）、（口腔内残留ほとんどなし）である。'],
  [261, 'フードテストの評価基準5点は、評価基準（4点）に加え、（反復嚥下）が（30秒以内に2回）可能である。'],

  // A: make technique context explicit for standalone random cards
  [266, '開口訓練の主な対象は、（舌骨挙上不全）（食道入口部開大不全）を認める患者である。'],
  [270, '頭部挙上訓練の主な対象は、（喉頭挙上低下）（食道入口部開大不全）を認める患者、（球麻痺）、高齢者である。'],
  [273, '前舌保持嚥下訓練（Masako法）の主な対象は、（喉頭蓋谷残留）など咽頭クリアランスが低下した患者である。'],
  [275, '前舌保持嚥下訓練（Masako法）は（間接訓練）であり、食物を用いた直接訓練では行わない。'],
  [288, 'バルーン拡張法の主な対象は、（Wallenberg症候群）（輪状咽頭嚥下障害）（頭頸部癌術後）など、食道入口部が開大しにくい患者である。'],
  [291, 'チューブ嚥下訓練の主な対象は、（嚥下反射惹起不全）や直接訓練が困難な患者である。チューブを（梨状窩）まで進め、嚥下に合わせて食道入口部へ通過させる。'],
  [309, '息こらえ嚥下法の主な対象は、（声門閉鎖不全）を認め、嚥下時誤嚥を生じる患者である。'],
  [314, 'メンデルソン手技の主な対象は、（喉頭挙上不全）（食道入口部開大不全）を認める患者である。'],
  [319, '頸部回旋の主な対象は（片側咽頭麻痺）（片側咽頭残留）であり、VF・VEで（効果）を確認して適応する。'],
  [324, '頸部屈曲位（chin-down）の主な対象は、（嚥下反射遅延）（喉頭侵入）を認める患者である。'],
  [330, '努力嚥下の主な対象は、（舌根運動低下）（咽頭残留）を認める患者である。'],
  [354, '顎突出嚥下の主な対象は（食道入口部開大不全）を認める患者である。'],
  [363, '氷なめ訓練の主な対象は（空嚥下困難）（偽性球麻痺）などである。'],
  [369, 'LSVTの主な対象は（パーキンソン病）患者などである。'],
  [371, 'のどのアイスマッサージの主な対象は（嚥下反射惹起遅延）のある患者である。'],
  [373, '歯肉マッサージ（ガム・ラビング）の主な対象は（口腔感覚低下）のある患者である。'],
  [376, '過敏除去（脱感作）の主な対象は（口腔過敏）（絞扼）反射が強い患者である。'],
  [391, '一側嚥下の主な対象は（重度一側咽頭麻痺）のある患者である。'],

  // A: make disease context explicit
  [943, 'ギラン・バレー症候群の治療には（血漿交換療法）（免疫グロブリン療法）が用いられる。'],
  [945, 'ギラン・バレー症候群では、さらに（三叉神経）（舌下神経）が障害されることもあり、さまざまな摂食嚥下障害を呈する。'],
  [955, '炎症性筋疾患・皮膚筋炎の治療には（ステロイド）（免疫抑制薬）などが用いられる。'],
  [970, '重症筋無力症では、症状として（眼瞼下垂）（複視）（四肢筋力低下）（開鼻声）（摂食嚥下障害）などを認める。'],
  [975, '重症筋無力症の薬物治療には（ステロイド）（免疫抑制薬）（抗コリンエステラーゼ薬）などが用いられる。'],

  // A/C: retain the earlier oral-care duplicate and remove its stray source number
  [1289, '頭頸部がん術後早期でも、創部に配慮して（口腔ケア）を行い、感染・分泌物管理を行う。']
]);

const REMOVE_IDS = new Set([
  // S: headings mistakenly converted into cloze cards
  231, 243, 400, 537,
  // A: later members of true exact-duplicate pairs
  981, 944, 849, 967, 961, 1292
]);

const extractAnswers = text => [...String(text).matchAll(/（([^（）]+)）/g)].map(m => m[1]);

for (const card of DATA.cards) {
  const fixed = TEXT_FIXES.get(card.id);
  if (fixed) {
    card.text = fixed;
    card.answers = extractAnswers(fixed);
    card.qa_fixed = true;
  }
}

DATA.cards = DATA.cards.filter(card => !REMOVE_IDS.has(card.id));

// Recalculate display metadata only after construction; this preserves all
// surviving IDs/refs and therefore existing learning-history linkage.
DATA.meta.actual_cards = DATA.cards.length;
DATA.meta.answer_terms = DATA.cards.reduce((sum, card) => sum + card.answers.length, 0);
DATA.meta.data_version = '2026-08-19-compact1380-sa-qa-v1';
DATA.meta.source_format_warnings = 0;
DATA.meta.note = '厳選コンパクト版を基礎にS/A判定QAを修正。見出し誤カード4件と真の完全重複6件を除外し、誤字・括弧不整合、検査/手技/疾患の文脈欠落を修正。既存IDは維持。';

for (const cat of DATA_CATEGORIES) {
  const cards = DATA.cards.filter(card => card.category === cat.name);
  cat.actual = cards.length;
  cat.answer_terms = cards.reduce((sum, card) => sum + card.answers.length, 0);
}
})();
