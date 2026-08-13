(() => {
  const PATCH_VERSION = 'results-v1';
  if (document.documentElement.dataset.resultPatch === PATCH_VERSION) return;
  document.documentElement.dataset.resultPatch = PATCH_VERSION;

  const css = `
.result-hero{text-align:center;padding-top:26px}.result-icon{width:64px;height:64px;border-radius:50%;margin:0 auto 10px;display:grid;place-items:center;background:#e5f4ec;color:var(--good);font-size:34px;font-weight:900}.result-hero h2{font-size:26px;margin-bottom:4px}.result-hero>p{margin:0 0 16px;color:var(--muted)}.result-metrics{grid-template-columns:repeat(5,1fr);margin-top:18px}.result-rate{max-width:420px;margin:18px auto 6px;background:var(--soft);border:1px solid #cedde9;border-radius:14px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between}.result-rate span{font-size:14px;color:var(--muted);font-weight:700}.result-rate b{font-size:28px;color:var(--navy)}.result-actions{justify-content:center;margin-top:18px}.result-actions .btn{min-width:180px}.result-note{text-align:left;max-width:620px;margin:16px auto 0}@media(max-width:640px){.result-metrics{grid-template-columns:repeat(2,1fr)}.result-actions .btn{width:100%}}
`;
  const style = document.createElement('style');
  style.dataset.resultPatch = PATCH_VERSION;
  style.textContent = css;
  document.head.appendChild(style);

  const resultView = document.createElement('section');
  resultView.id = 'resultView';
  resultView.className = 'hidden';
  resultView.innerHTML = `
    <div class="panel result-hero">
      <div class="result-icon">✓</div>
      <h2>学習結果</h2>
      <p id="resultSummary">今回の学習結果です。</p>
      <div class="metrics result-metrics">
        <div class="metric"><b id="rTotal">0</b><span>出題数</span></div>
        <div class="metric"><b id="rGood">0</b><span>できた</span></div>
        <div class="metric"><b id="rUncertain">0</b><span>自信なし</span></div>
        <div class="metric"><b id="rReview">0</b><span>要復習</span></div>
        <div class="metric"><b id="rUnrated">0</b><span>未評価</span></div>
      </div>
      <div class="result-rate"><span>できた率</span><b id="rRate">-</b></div>
      <div id="resultNote" class="notice result-note hidden"></div>
      <div class="actions result-actions">
        <button class="btn primary" id="retryWeakBtn">要復習・自信なしをもう一度</button>
        <button class="btn secondary" id="retryAllBtn">同じ問題をもう一度</button>
        <button class="btn ghost" id="resultHomeBtn">学習条件へ戻る</button>
      </div>
    </div>`;
  const statsView = document.getElementById('statsView');
  statsView.parentNode.insertBefore(resultView, statsView);

  const baseRenderCard = renderCard;
  const baseRateCurrent = rateCurrent;
  const baseMove = move;
  const baseSwitchView = switchView;
  const baseStartFromFilters = startFromFilters;
  const baseResumeSession = resumeSession;

  function ensureRatings() {
    if (!session.ratings || typeof session.ratings !== 'object') session.ratings = {};
    return session.ratings;
  }
  function rateLabel(rate) {
    return rate === 'good' ? 'できた' : rate === 'uncertain' ? '自信なし' : rate === 'review' ? '要復習' : '未評価';
  }
  function persistSession() {
    ensureRatings();
    state.lastSession = {ids:[...session.ids], pos:session.pos, ratings:{...session.ratings}};
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  renderCard = function () {
    baseRenderCard();
    if (!session.ids || !session.ids.length || document.getElementById('studyView').classList.contains('hidden')) return;
    ensureRatings();
    const card = currentCard();
    if (!card) return;
    const isLast = session.pos === session.ids.length - 1;
    const next = document.getElementById('nextBtn');
    const bottom = document.getElementById('bottomNextBtn');
    next.disabled = false;
    bottom.disabled = false;
    next.textContent = isLast ? '結果を見る →' : '次へ →';
    bottom.textContent = isLast ? '結果を見る →' : '次の問題へ →';
    if (session.ratings[card.id]) document.getElementById('lastResult').textContent = '今回: ' + rateLabel(session.ratings[card.id]);
    persistSession();
  };

  rateCurrent = function (rate) {
    const card = currentCard();
    if (card) {
      ensureRatings();
      session.ratings[card.id] = rate;
    }
    return baseRateCurrent(rate);
  };

  function sessionResult() {
    ensureRatings();
    const counts = {total:session.ids.length, good:0, uncertain:0, review:0, unrated:0};
    for (const id of session.ids) {
      const r = session.ratings[id];
      if (r === 'good') counts.good++;
      else if (r === 'uncertain') counts.uncertain++;
      else if (r === 'review') counts.review++;
      else counts.unrated++;
    }
    counts.rated = counts.total - counts.unrated;
    counts.rate = counts.rated ? Math.round(counts.good / counts.rated * 100) : 0;
    return counts;
  }

  function showResultView() {
    ['homeView','studyView','statsView','dataView'].forEach(id => document.getElementById(id).classList.add('hidden'));
    resultView.classList.remove('hidden');
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === 'home'));
    window.scrollTo({top:0, behavior:'smooth'});
  }

  function finishSession() {
    if (!session.ids || !session.ids.length) { switchView('home'); return; }
    const r = sessionResult();
    document.getElementById('rTotal').textContent = r.total;
    document.getElementById('rGood').textContent = r.good;
    document.getElementById('rUncertain').textContent = r.uncertain;
    document.getElementById('rReview').textContent = r.review;
    document.getElementById('rUnrated').textContent = r.unrated;
    document.getElementById('rRate').textContent = r.rated ? r.rate + '%' : '-';
    document.getElementById('resultSummary').textContent = `${r.total}問の学習が終了しました。`;
    const weak = r.review + r.uncertain;
    const note = document.getElementById('resultNote');
    if (r.unrated) {
      note.textContent = `未評価が ${r.unrated} 問あります。できた率は評価済み問題だけで計算しています。`;
      note.classList.remove('hidden');
    } else if (weak) {
      note.textContent = `要復習・自信なしが ${weak} 問あります。下のボタンからまとめて解き直せます。`;
      note.classList.remove('hidden');
    } else {
      note.textContent = '';
      note.classList.add('hidden');
    }
    const weakBtn = document.getElementById('retryWeakBtn');
    weakBtn.disabled = weak === 0;
    weakBtn.style.display = weak === 0 ? 'none' : '';
    state.lastSession = null;
    saveState();
    showResultView();
  }

  move = function (d) {
    if (d > 0 && session.ids && session.ids.length && session.pos === session.ids.length - 1) {
      finishSession();
      return;
    }
    return baseMove(d);
  };

  switchView = function (v) {
    if (v === 'result') { showResultView(); return; }
    resultView.classList.add('hidden');
    return baseSwitchView(v);
  };

  function restartWith(ids) {
    if (!ids || !ids.length) return;
    session = {ids:[...ids], pos:0, answerShown:false, ratings:{}};
    state.lastSession = {ids:[...ids], pos:0, ratings:{}};
    saveState();
    switchView('study');
    renderCard();
  }

  document.getElementById('retryWeakBtn').onclick = () => {
    ensureRatings();
    restartWith(session.ids.filter(id => session.ratings[id] === 'review' || session.ratings[id] === 'uncertain'));
  };
  document.getElementById('retryAllBtn').onclick = () => restartWith(session.ids);
  document.getElementById('resultHomeBtn').onclick = () => switchView('home');

  document.getElementById('startBtn').onclick = () => {
    baseStartFromFilters();
    if (!document.getElementById('studyView').classList.contains('hidden')) {
      session.ratings = {};
      persistSession();
      renderCard();
    }
  };
  document.getElementById('resumeBtn').onclick = () => {
    const savedRatings = state.lastSession && state.lastSession.ratings ? {...state.lastSession.ratings} : {};
    baseResumeSession();
    if (!document.getElementById('studyView').classList.contains('hidden')) {
      session.ratings = savedRatings;
      renderCard();
    }
  };
})();
