(()=>{'use strict';
const REMOVE_IDS=new Set([119,140,142,149,150,156,159,160,230,263]);
const SECTION_ORDER=[115,116,1391,1392,1393,117,136,137,138,139,141,143,144,145,146,147,148,151,152,153,154,155,157,158,1394,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,1395,1396,1397,1398,223,224,225,226,227,228,229,232,233,234,235,236,237,238,239,240,241,242,244,245,246,247,248,249,250,251,252,253,254,255,256,257,258,259,260,261,262,264,120,118,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135];
DATA.cards=DATA.cards.filter(card=>!REMOVE_IDS.has(card.id));
const byId=new Map(DATA.cards.map(card=>[card.id,card]));
const ordered=[];
for(let i=0;i<SECTION_ORDER.length;i++){const card=byId.get(SECTION_ORDER[i]);if(!card)throw new Error(`[source-revision] missing card ${SECTION_ORDER[i]}`);card.local_no=String(i+1).padStart(3,'0');card.ref='③-'+card.local_no;ordered.push(card);}
const before=DATA.cards.filter(c=>c.category_symbol==='①'||c.category_symbol==='②');
const after=DATA.cards.filter(c=>!['①','②','③'].includes(c.category_symbol));
DATA.cards=[...before,...ordered,...after];
const ids=DATA.cards.map(c=>c.id);
if(new Set(ids).size!==ids.length)throw new Error('[source-revision] duplicate IDs');
if(ordered.length!==146)throw new Error(`[source-revision] section ③ count ${ordered.length}`);
if(DATA.cards.length!==1378)throw new Error(`[source-revision] total count ${DATA.cards.length}`);
DATA.meta.actual_cards=1378;
DATA.meta.answer_terms=DATA.cards.reduce((s,c)=>s+c.answers.length,0);
if(DATA.meta.answer_terms!==2385)throw new Error(`[source-revision] answer terms ${DATA.meta.answer_terms}`);
DATA.meta.source_file='摂食嚥下認定_厳選コンパクト版修正①.docx';
DATA.meta.source_pages=82;
DATA.meta.data_version='2026-08-26-compact1378-revision1';
DATA.meta.note='修正①を優先資料として③スクリーニング・評価尺度の差分を反映。既存IDを可能な限り維持し、見出し行はカード化しない。他16分野と競合しない既存医学・内容監査は維持。';
for(const cat of DATA_CATEGORIES){const cards=DATA.cards.filter(c=>c.category===cat.name);cat.actual=cards.length;cat.answer_terms=cards.reduce((s,c)=>s+c.answers.length,0);}
})();
