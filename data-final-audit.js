(()=>{
'use strict';
// Final Section 16-17 medical/anatomical audit patch (2026-08-20).
const FINAL_FIXES=new Map([
  [1303,'歯は、中心に（歯髄）があり、その周囲を（象牙質）が取り囲む。歯冠表面は（エナメル質）、歯根表面は（セメント質）で覆われる。'],
  [1322,'舌前2/3の一般感覚は、三叉神経第3枝である下顎神経の枝の（舌神経）が支配する。'],
  [1347,'食道は第（6頸椎）付近から始まり、第（10胸椎）付近で横隔膜の食道裂孔を通過し、胃との接合部はおおむねT11付近にある。'],
  [1370,'外舌筋には（オトガイ舌筋）、（舌骨舌筋）、（茎突舌筋）があり、解剖学的分類では口蓋舌筋を含めて4筋とする。']
]);
const extractAnswers=text=>[...String(text).matchAll(/（([^（）]+)）/g)].map(m=>m[1]);
for(const card of DATA.cards){
  const fixed=FINAL_FIXES.get(card.id);
  if(fixed){card.text=fixed;card.answers=extractAnswers(fixed);card.qa_fixed=true;card.final_audit_fixed=true;}
}
DATA.meta.answer_terms=DATA.cards.reduce((sum,card)=>sum+card.answers.length,0);
DATA.meta.data_version='2026-08-20-canonical1380-v2';
DATA.meta.note='厳選コンパクト版を基礎に医学・内容監査を反映。見出し誤カード4件と真の完全重複6件を除外。尺度名・手技名・検査名・疾患名は一律補完せず原資料の文脈構成を維持。最終口腔・神経解剖監査を反映。既存IDは保持。';
for(const cat of DATA_CATEGORIES){
  const cards=DATA.cards.filter(card=>card.category===cat.name);
  cat.actual=cards.length;
  cat.answer_terms=cards.reduce((sum,card)=>sum+card.answers.length,0);
}
})();
