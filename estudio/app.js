(() => {
'use strict';
const KEY = 'estudio.v1';
const INTERVALS = [0, 1, 3, 7, 16];      // días de espera por caja Leitner (1..5)
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const dayKey = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const addDays = (key, n) => { const d = new Date(key + 'T12:00:00'); d.setDate(d.getDate() + n); return dayKey(d); };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------- Estado ----------
function seed() {
  return {
    decks: SAMPLE_DECKS.map(d => ({id: uid(), name: d.name, emoji: d.emoji,
      cards: d.cards.map(([q, a]) => ({id: uid(), q, a, box: 0, due: dayKey()}))})),
    notes: [], days: {}, goal: 20, quizBest: {}
  };
}
let S;
try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
if (!S || !Array.isArray(S.decks)) S = seed();
S.notes ||= []; S.days ||= {}; S.goal ||= 20; S.quizBest ||= {};
let saveFailed = false;
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { if (!saveFailed) { saveFailed = true; toast('⚠️ No se pudo guardar en este navegador'); } }
}
const today = () => (S.days[dayKey()] ||= {reviews: 0, correct: 0, focus: 0});
const deckById = id => S.decks.find(d => d.id === id);
const dueCards = d => d.cards.filter(c => c.due <= dayKey());

function streak() {
  let k = dayKey(), n = 0;
  const active = key => { const x = S.days[key]; return x && (x.reviews > 0 || x.focus > 0); };
  if (!active(k)) k = addDays(k, -1);
  while (active(k)) { n++; k = addDays(k, -1); }
  return n;
}

let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }

// ---------- Sesiones en memoria ----------
let study = null, quiz = null, pomo = null, pomoTick = null;

// ---------- Vistas ----------
const views = {
  home() {
    const t = today(), due = S.decks.reduce((n, d) => n + dueCards(d).length, 0);
    const total = S.decks.reduce((n, d) => n + d.cards.length, 0);
    const mastered = S.decks.reduce((n, d) => n + d.cards.filter(c => c.box >= 4).length, 0);
    const pct = Math.min(100, Math.round(t.reviews / S.goal * 100));
    const week = Array.from({length: 7}, (_, i) => { const k = addDays(dayKey(), i - 6); return {k, n: (S.days[k] || {}).reviews || 0}; });
    const max = Math.max(1, ...week.map(w => w.n));
    const dn = ['D','L','M','X','J','V','S'];
    return `<h1>¡Hola! 👋</h1>
    <div class="card row sp"><div><b>Meta de hoy</b><div class="mute">${t.reviews} de ${S.goal} tarjetas repasadas</div>
      <div class="mute">${due} pendientes para hoy</div>
      <div style="margin-top:10px">${due ? `<a class="btn" href="#/study/all">Repasar ahora</a>` : `<span class="pill">Todo al día 🎉</span>`}</div></div>
      <div class="ring" style="--p:${pct}"><b>${pct}%</b></div></div>
    <div class="grid">
      <div class="card stat"><b>${total}</b><span>tarjetas</span></div>
      <div class="card stat"><b>${mastered}</b><span>dominadas</span></div>
      <div class="card stat"><b>${t.reviews ? Math.round(t.correct / t.reviews * 100) : 0}%</b><span>aciertos hoy</span></div>
      <div class="card stat"><b>${t.focus}</b><span>min de enfoque</span></div></div>
    <h2>Últimos 7 días</h2>
    <div class="card chart" role="img" aria-label="Tarjetas repasadas en los últimos 7 días">${week.map(w =>
      `<div><i style="height:${Math.round(w.n / max * 70)}px"></i>${dn[new Date(w.k + 'T12:00:00').getDay()]}</div>`).join('')}</div>
    <h2>Ajustes</h2>
    <div class="card"><label for="goal">Meta diaria (tarjetas)</label>
      <input id="goal" type="number" min="1" max="500" value="${S.goal}" data-act="goal">
      <div class="row" style="margin-top:12px">
        <button class="btn sec sm" data-act="export">⬇️ Exportar copia</button>
        <label class="btn sec sm" style="margin:0">⬆️ Importar<input type="file" accept="application/json" data-act="import" hidden></label>
        <button class="btn ghost sm" data-act="reset">Reiniciar</button></div>
      <p class="mute">Tus datos se guardan solo en este dispositivo. Exporta una copia de vez en cuando.</p></div>`;
  },

  cards() {
    return `<h1>Mis tarjetas</h1>
    ${S.decks.length ? S.decks.map(d => { const due = dueCards(d).length, m = d.cards.filter(c => c.box >= 4).length;
      return `<a class="card deck" href="#/deck/${d.id}"><span class="em">${esc(d.emoji)}</span>
      <div class="grow"><b>${esc(d.name)}</b><br><small>${d.cards.length} tarjetas · ${due} pendientes</small>
      <div class="bar" style="margin-top:6px"><i style="width:${d.cards.length ? m / d.cards.length * 100 : 0}%"></i></div></div></a>`; }).join('')
      : `<div class="empty">Aún no tienes mazos. ¡Crea el primero!</div>`}
    <form class="card" data-act="newdeck"><b>Nuevo mazo</b>
      <div class="row" style="margin-top:8px"><input name="emoji" value="📘" maxlength="2" style="width:70px" aria-label="Emoji">
      <input name="name" class="grow" placeholder="Nombre (ej. Geografía)" required maxlength="40" aria-label="Nombre del mazo">
      <button class="btn">Crear</button></div></form>`;
  },

  deck(id) {
    const d = deckById(id); if (!d) return views.cards();
    const due = dueCards(d).length;
    return `<p><a href="#/cards">← Mazos</a></p><h1>${esc(d.emoji)} ${esc(d.name)}</h1>
    <div class="row"><a class="btn ${due ? '' : 'sec'}" href="#/study/${d.id}">Repasar (${due})</a>
      <a class="btn sec" href="#/quiz/${d.id}">Hacer quiz</a>
      <button class="btn ghost sm" data-act="studyall" data-id="${d.id}">Repasar todo</button></div>
    <form class="card" style="margin-top:14px" data-act="newcard" data-id="${d.id}"><b>Añadir tarjeta</b>
      <label for="q">Pregunta</label><input id="q" name="q" required maxlength="300">
      <label for="a">Respuesta</label><input id="a" name="a" required maxlength="300">
      <button class="btn" style="margin-top:12px">Añadir</button></form>
    <h2>Tarjetas (${d.cards.length})</h2><div class="card">
    ${d.cards.length ? d.cards.map(c => `<div class="item"><div><p><b>${esc(c.q)}</b></p><p class="mute">${esc(c.a)}</p></div>
      <div class="row"><span class="pill">Caja ${c.box + 1}</span><button class="btn ghost sm" data-act="delcard" data-id="${d.id}" data-card="${c.id}" aria-label="Borrar tarjeta">🗑️</button></div></div>`).join('')
      : '<div class="empty">Este mazo está vacío.</div>'}</div>
    <button class="btn ghost sm" data-act="deldeck" data-id="${d.id}">Eliminar mazo</button>`;
  },

  study(id) {
    if (!study || study.id !== id) startStudy(id);
    const s = study;
    if (!s.queue.length) return `<p><a href="#/home">← Inicio</a></p><div class="empty"><div style="font-size:3rem">🎉</div><h1>¡Nada pendiente!</h1>
      <p>Vuelve mañana o repasa todo el mazo.</p>${id !== 'all' ? `<button class="btn" data-act="studyall" data-id="${id}">Repasar todo</button>` : ''}</div>`;
    if (s.i >= s.queue.length) {
      const pct = Math.round(s.ok / s.queue.length * 100);
      return `<div class="empty"><div style="font-size:3rem">${pct >= 70 ? '🏆' : '💪'}</div><h1>¡Sesión terminada!</h1>
        <p>${s.ok} de ${s.queue.length} correctas (${pct}%)</p>
        <a class="btn" href="#/home">Volver al inicio</a></div>`;
    }
    const c = s.queue[s.i];
    return `<div class="row sp"><a href="#/${id === 'all' ? 'home' : 'deck/' + id}">← Salir</a><span class="mute">${s.i + 1} / ${s.queue.length}</span></div>
      <div class="bar" style="margin:8px 0 14px"><i style="width:${s.i / s.queue.length * 100}%"></i></div>
      <div class="card flash ${s.flip ? 'back' : ''}" data-act="flip" tabindex="0" role="button" aria-label="Girar tarjeta"><div><small>${s.flip ? 'Respuesta' : 'Pregunta'}</small>${esc(s.flip ? c.a : c.q)}</div></div>
      ${s.flip ? `<div class="row"><button class="btn bad grow" data-act="grade" data-v="0">❌ No la sabía</button><button class="btn ok grow" data-act="grade" data-v="1">✅ La sabía</button></div>`
        : `<button class="btn block" data-act="flip">Mostrar respuesta</button>`}`;
  },

  quiz(id) {
    if (id) return quizView(id);
    return `<h1>Quiz</h1><p class="mute">Preguntas de opción múltiple creadas con tus tarjetas (necesitas al menos 4).</p>
    ${S.decks.map(d => `<a class="card deck" href="${d.cards.length >= 4 ? '#/quiz/' + d.id : '#/deck/' + d.id}"><span class="em">${esc(d.emoji)}</span>
      <div class="grow"><b>${esc(d.name)}</b><br><small>${d.cards.length >= 4 ? 'Mejor: ' + (S.quizBest[d.id] ?? '—') + (S.quizBest[d.id] != null ? '%' : '') : 'Añade al menos 4 tarjetas'}</small></div></a>`).join('') || '<div class="empty">Crea un mazo primero.</div>'}`;
  },

  notes(id) {
    if (id) {
      const n = S.notes.find(x => x.id === id); if (!n) return views.notes();
      return `<p><a href="#/notes">← Notas</a></p><label for="nt">Título</label><input id="nt" value="${esc(n.title)}" data-act="notefield" data-f="title" data-id="${n.id}" maxlength="80">
        <label for="nb">Contenido</label><textarea id="nb" style="min-height:300px" data-act="notefield" data-f="body" data-id="${n.id}">${esc(n.body)}</textarea>
        <p class="mute">Se guarda automáticamente.</p><button class="btn ghost sm" data-act="delnote" data-id="${n.id}">Eliminar nota</button>`;
    }
    const list = [...S.notes].sort((a, b) => b.updated - a.updated);
    return `<div class="row sp"><h1>Notas</h1><button class="btn" data-act="newnote">+ Nueva</button></div>
      ${list.length ? list.map(n => `<a class="card deck" href="#/notes/${n.id}"><div class="grow"><b>${esc(n.title || 'Sin título')}</b><br><small>${esc((n.body || '').slice(0, 80))}</small></div></a>`).join('')
        : '<div class="empty">Escribe aquí tus apuntes, resúmenes e ideas.</div>'}`;
  },

  focus() {
    const modes = {work: 'Estudio', rest: 'Descanso'};
    const left = pomo ? Math.max(0, Math.ceil((pomo.end - Date.now()) / 1000)) : (pomoCfg.work * 60);
    return `<h1>Enfoque</h1><p class="mute">Técnica Pomodoro: estudia concentrado y descansa después.</p>
    <div class="card"><div class="mute" style="text-align:center" id="pmode">${pomo ? modes[pomo.mode] : 'Listo'}</div>
      <div class="timer" id="ptime">${fmt(left)}</div>
      <div class="row" style="justify-content:center">
        ${pomo ? `<button class="btn bad" data-act="pstop">Detener</button>` : `<button class="btn" data-act="pstart">▶ Empezar ${pomoCfg.work} min</button>`}</div>
      ${pomo ? '' : `<div class="row" style="margin-top:14px"><div class="grow"><label for="pw">Estudio (min)</label><input id="pw" type="number" min="1" max="120" value="${pomoCfg.work}" data-act="pcfg" data-f="work"></div>
        <div class="grow"><label for="pr">Descanso (min)</label><input id="pr" type="number" min="1" max="60" value="${pomoCfg.rest}" data-act="pcfg" data-f="rest"></div></div>`}</div>
    <div class="card stat"><b>${today().focus}</b><span>minutos de enfoque hoy</span></div>`;
  }
};

// ---------- Estudio ----------
function startStudy(id, all) {
  let cards = id === 'all' ? S.decks.flatMap(d => dueCards(d)) : (deckById(id) ? (all ? deckById(id).cards : dueCards(deckById(id))) : []);
  study = {id, queue: shuffle(cards).slice(0, 30), i: 0, flip: false, ok: 0};
}
function grade(v) {
  const s = study, c = s.queue[s.i], t = today();
  t.reviews++; if (v) { t.correct++; s.ok++; c.box = Math.min(4, c.box + 1); c.due = addDays(dayKey(), INTERVALS[c.box]); }
  else { c.box = 0; c.due = dayKey(); }
  s.i++; s.flip = false; save(); render();
}

// ---------- Quiz ----------
function quizView(id) {
  const d = deckById(id); if (!d || d.cards.length < 4) return views.quiz();
  if (!quiz || quiz.id !== id) {
    const qs = shuffle(d.cards).slice(0, 10).map(c => {
      const wrong = shuffle(d.cards.filter(x => x.a !== c.a)).slice(0, 3).map(x => x.a);
      return {q: c.q, a: c.a, opts: shuffle([c.a, ...wrong])};
    });
    quiz = {id, qs, i: 0, ok: 0, picked: null};
  }
  const z = quiz;
  if (z.i >= z.qs.length) {
    const pct = Math.round(z.ok / z.qs.length * 100);
    if (S.quizBest[id] == null || pct > S.quizBest[id]) { S.quizBest[id] = pct; save(); }
    return `<div class="empty"><div style="font-size:3rem">${pct >= 70 ? '🏆' : '📚'}</div><h1>${z.ok} / ${z.qs.length}</h1>
      <p>${pct >= 90 ? '¡Excelente!' : pct >= 70 ? '¡Muy bien!' : 'Sigue practicando, ¡vas a mejorar!'}</p>
      <div class="row" style="justify-content:center"><button class="btn" data-act="quizagain">Otra vez</button><a class="btn sec" href="#/quiz">Salir</a></div></div>`;
  }
  const q = z.qs[z.i];
  return `<div class="row sp"><a href="#/quiz">← Salir</a><span class="mute">${z.i + 1} / ${z.qs.length}</span></div>
    <div class="bar" style="margin:8px 0 14px"><i style="width:${z.i / z.qs.length * 100}%"></i></div>
    <div class="card"><b style="font-size:1.15rem">${esc(q.q)}</b></div>
    ${q.opts.map((o, k) => `<button class="opt ${z.picked == null ? '' : o === q.a ? 'good' : k === z.picked ? 'wrong' : ''}" data-act="pick" data-k="${k}" ${z.picked != null ? 'disabled' : ''}>${esc(o)}</button>`).join('')}
    ${z.picked != null ? `<button class="btn block" data-act="qnext">${z.i + 1 >= z.qs.length ? 'Ver resultado' : 'Siguiente'}</button>` : ''}`;
}

// ---------- Pomodoro ----------
let pomoCfg = {work: 25, rest: 5};
const fmt = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
function beep() { try { const a = new AudioContext(), o = a.createOscillator(); o.connect(a.destination); o.frequency.value = 880; o.start(); o.stop(a.currentTime + .4); } catch (e) {} }
function pomoRun(mode) {
  const min = pomoCfg[mode];
  pomo = {mode, end: Date.now() + min * 6e4, min};
  clearInterval(pomoTick);
  pomoTick = setInterval(() => {
    const left = Math.ceil((pomo.end - Date.now()) / 1000);
    if (left <= 0) {
      beep();
      if (pomo.mode === 'work') { today().focus += pomo.min; save(); toast('¡Bien hecho! A descansar ☕'); renderStreak(); pomoRun('rest'); }
      else { clearInterval(pomoTick); pomo = null; toast('Descanso terminado'); }
      render(); return;
    }
    const el = $('#ptime'); if (el) el.textContent = fmt(left);
  }, 500);
  render();
}

// ---------- Render / router ----------
function route() {
  const [, name = 'home', a] = location.hash.split('/');
  return {name, a};
}
function render() {
  const {name, a} = route();
  const map = {home: 'home', cards: 'cards', deck: 'cards', study: 'cards', quiz: 'quiz', notes: 'notes', focus: 'focus'};
  const fn = views[name] || views.home;
  $('#view').innerHTML = fn(a);
  document.querySelectorAll('.tabs a').forEach(t => t.classList.toggle('on', t.dataset.tab === (map[name] || 'home')));
  renderStreak();
}
function renderStreak() { const n = streak(); $('#streak').textContent = '🔥 ' + n + (n === 1 ? ' día' : ' días'); }
let lastHash = '';
window.addEventListener('hashchange', () => {
  const {name} = route();
  if (name !== 'study') study = null;
  if (name !== 'quiz') quiz = null;
  render(); scrollTo(0, 0);
});

// ---------- Eventos ----------
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || el.tagName === 'FORM' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return;
  const act = el.dataset.act, id = el.dataset.id;
  switch (act) {
    case 'flip': study.flip = !study.flip; render(); break;
    case 'grade': grade(+el.dataset.v); break;
    case 'studyall': startStudy(id, true); location.hash = '#/study/' + id; render(); break;
    case 'pick': { const q = quiz.qs[quiz.i]; quiz.picked = +el.dataset.k; if (q.opts[quiz.picked] === q.a) quiz.ok++; render(); break; }
    case 'qnext': quiz.i++; quiz.picked = null; render(); break;
    case 'quizagain': { const id = quiz.id; quiz = null; render(); break; }
    case 'delcard': { const d = deckById(id); d.cards = d.cards.filter(c => c.id !== el.dataset.card); save(); render(); break; }
    case 'deldeck': if (confirm('¿Eliminar este mazo y todas sus tarjetas?')) { S.decks = S.decks.filter(d => d.id !== id); save(); location.hash = '#/cards'; } break;
    case 'newnote': { const n = {id: uid(), title: '', body: '', updated: Date.now()}; S.notes.push(n); save(); location.hash = '#/notes/' + n.id; break; }
    case 'delnote': if (confirm('¿Eliminar esta nota?')) { S.notes = S.notes.filter(n => n.id !== id); save(); location.hash = '#/notes'; } break;
    case 'pstart': pomoRun('work'); break;
    case 'pstop': clearInterval(pomoTick); pomo = null; render(); break;
    case 'export': {
      const b = new Blob([JSON.stringify(S, null, 1)], {type: 'application/json'}), a = document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = 'estudio-' + dayKey() + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1e3); break; }
    case 'reset': if (confirm('Esto borra todo tu progreso y restaura los mazos de ejemplo. ¿Continuar?')) { S = seed(); save(); render(); toast('Datos reiniciados'); } break;
  }
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.flash')) { e.preventDefault(); study.flip = !study.flip; render(); }
});
document.addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target, act = f.dataset.act, fd = new FormData(f);
  if (act === 'newdeck') {
    S.decks.push({id: uid(), name: fd.get('name').trim(), emoji: fd.get('emoji').trim() || '📘', cards: []}); save(); render(); toast('Mazo creado');
  } else if (act === 'newcard') {
    deckById(f.dataset.id).cards.push({id: uid(), q: fd.get('q').trim(), a: fd.get('a').trim(), box: 0, due: dayKey()}); save(); render();
    $('#q')?.focus(); toast('Tarjeta añadida');
  }
});
document.addEventListener('input', e => {
  const el = e.target, act = el.dataset.act;
  if (act === 'notefield') { const n = S.notes.find(x => x.id === el.dataset.id); if (n) { n[el.dataset.f] = el.value; n.updated = Date.now(); save(); } }
  else if (act === 'goal') { const v = Math.max(1, Math.min(500, +el.value || 20)); S.goal = v; save(); }
  else if (act === 'pcfg') { pomoCfg[el.dataset.f] = Math.max(1, Math.min(120, +el.value || 1)); }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.act === 'pcfg') render();
  if (el.dataset.act === 'import' && el.files[0]) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (!Array.isArray(d.decks)) throw 0;
        S = d; S.notes ||= []; S.days ||= {}; S.goal ||= 20; S.quizBest ||= {}; save(); render(); toast('Copia importada ✔');
      } catch (err) { toast('Archivo no válido'); }
    };
    r.readAsText(el.files[0]);
  }
});

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
if (!location.hash) location.hash = '#/home'; else render();
render();
})();
