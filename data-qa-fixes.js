(() => {
'use strict';

// 2026-08-19 QA: S-priority fixes for the 1,390-card compact dataset.
// Keep all existing IDs/refs stable. Erroneous heading cards are removed only
// after DATA.cards has been constructed so later IDs never shift.

const TEXT_FIXES = new Map([
  [112, '構成失行の主な責任病巣（右頭頂葉）'],
  [242, 'プロフィール5は、（むせることがしばしば）で、（全量飲むことが困難）である。'],
  [293, 'K-point刺激の対象には、（嚥下反射惹起遅延）（重度嚥下障害）も含まれる。'],
  [401, 'VEでは、検査食に（青色・緑色などの食用着色料）を添加し、（咽頭残留・喉頭侵入）などを評価する。'],
  [738, 'レビー小体型認知症では、（認知機能の変動）（幻視）（パーキンソニズム）が特徴である。'],
  [746, 'レビー小体型認知症などで視空間認知障害がある場合は、（できる動作に合わせて食器の位置を調整）する。'],
  [1042, 'ACE阻害薬カプトプリルでは、（サブスタンスP増加）などを介して（嚥下反射）（咳反射）の改善がみられることがある。']
]);

const REMOVE_HEADING_IDS = new Set([231, 243, 400, 537]);
const extractAnswers = text => [...String(text).matchAll(/（([^（）]+)）/g)].map(m => m[1]);

for (const card of DATA.cards) {
  const fixed = TEXT_FIXES.get(card.id);
  if (fixed) {
    card.text = fixed;
    card.answers = extractAnswers(fixed);
    card.qa_fixed = true;
  }
}

DATA.cards = DATA.cards.filter(card => !REMOVE_HEADING_IDS.has(card.id));

// Recalculate display metadata only after construction; this preserves the
// original stable IDs/refs and therefore existing learning-history linkage.
DATA.meta.actual_cards = DATA.cards.length;
DATA.meta.answer_terms = DATA.cards.reduce((sum, card) => sum + card.answers.length, 0);
DATA.meta.data_version = '2026-08-19-compact1386-s-qa-v1';
DATA.meta.source_format_warnings = 0;
DATA.meta.note = '厳選コンパクト版を基礎に、S判定11件をQA修正。見出し誤カード4件を除外し、誤字・括弧不整合7件を修正。既存IDは維持。';

for (const cat of DATA_CATEGORIES) {
  const cards = DATA.cards.filter(card => card.category === cat.name);
  cat.actual = cards.length;
  cat.answer_terms = cards.reduce((sum, card) => sum + card.answers.length, 0);
}
})();
