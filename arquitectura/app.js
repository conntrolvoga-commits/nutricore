(() => {
'use strict';
const KEY = 'arqcurso.v1';
const INTERVALS = [0, 1, 3, 7, 16];
const PASS = 70;
const C = window.COURSE;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>').replace(/\*(.+?)\*/g, '<i>$1</i>');
const uid = () => Math.random().toString(36).slice(2, 10);
const dayKey = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const addDays = (k, n) => { const d = new Date(k + 'T12:00:00'); d.setDate(d.getDate() + n); return dayKey(d); };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------- Datos del curso ----------
const mod = id => C.find(m => m.id === id);
const lessonKey = (m, i) => m.id + '-' + i;
const LESSONS = C.flatMap(m => m.lessons.map((l, i) => ({m, i, l, key: lessonKey(m, i)})));
const CARDS = C.flatMap(m => m.cards.map((c, i) => ({id: m.id + '-c' + i, mod: m.id, q: c[0], a: c[1]})));

// ---------- Estado ----------
let S = null;
try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
const fresh = () => ({done: {}, quiz: {}, exam: {best: null, att: 0}, cards: {}, notes: [], days: {}});
const norm = s => { s = s && typeof s === 'object' ? s : fresh(); s.done ||= {}; s.quiz ||= {}; s.exam ||= {best: null, att: 0}; s.cards ||= {}; s.notes ||= []; s.days ||= {}; return s; };
S = norm(S);
let warned = false;
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { if (!warned) { warned = true; toast('⚠️ No se pudo guardar en este navegador'); } } }
const act = () => { const k = dayKey(); S.days[k] = (S.days[k] || 0) + 1; };
const cst = id => S.cards[id] || {box: 0, due: '0000-00-00'};
const isDue = c => cst(c.id).due <= dayKey();
const dueOf = id => CARDS.filter(c => (id === 'all' || c.mod === id) && isDue(c));
function streak() {
  let k = dayKey(), n = 0;
  if (!S.days[k]) k = addDays(k, -1);
  while (S.days[k]) { n++; k = addDays(k, -1); }
  return n;
}
const modDone = m => m.lessons.filter((_, i) => S.done[lessonKey(m, i)]).length;
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }

// ---------- Contenido de lección ----------
function md(blocks) {
  let out = '', list = false;
  const close = () => { if (list) { out += '</ul>'; list = false; } };
  for (const b of blocks) {
    if (b.startsWith('- ')) { if (!list) { out += '<ul>'; list = true; } out += '<li>' + inline(b.slice(2)) + '</li>'; continue; }
    close();
    if (b.startsWith('## ')) out += '<h2>' + inline(b.slice(3)) + '</h2>';
    else if (b.startsWith('> ')) out += '<blockquote>' + inline(b.slice(2)) + '</blockquote>';
    else if (b.startsWith('@code\n')) out += '<pre><code>' + esc(b.slice(6)) + '</code></pre>';
    else out += '<p>' + inline(b) + '</p>';
  }
  close(); return out;
}

// ---------- Sesiones ----------
let study = null, quiz = null, showX = false;
function startStudy(id, all) {
  const pool = CARDS.filter(c => id === 'all' || c.mod === id);
  const cards = all ? pool : pool.filter(isDue);
  study = {id, queue: shuffle(cards).slice(0, 30), i: 0, flip: false, ok: 0};
}
function grade(v) {
  const s = study, c = s.queue[s.i], st = cst(c.id);
  if (v) { s.ok++; st.box = Math.min(4, st.box + 1); st.due = addDays(dayKey(), INTERVALS[st.box]); } else { st.box = 0; st.due = dayKey(); }
  S.cards[c.id] = st; act(); s.i++; s.flip = false; save(); render();
}
function startQuiz(id) {
  const src = id === 'exam' ? shuffle(C.flatMap(m => m.quiz)).slice(0, 20) : shuffle(mod(id).quiz);
  quiz = {id, i: 0, ok: 0, picked: null, wrong: [], qs: src.map(q => ({q: q.q, why: q.why, opts: shuffle(q.opts.map((t, k) => ({t, c: k === q.a})))}))};
}

// ---------- Vistas ----------
const back = (h, t) => `<p><a href="${h}">← ${esc(t)}</a></p>`;
const views = {
  home() {
    const total = LESSONS.length, done = LESSONS.filter(x => S.done[x.key]).length, pct = Math.round(done / total * 100);
    const next = LESSONS.find(x => !S.done[x.key]);
    const passed = C.filter(m => (S.quiz[m.id]?.best ?? -1) >= PASS).length;
    const week = Array.from({length: 7}, (_, i) => { const k = addDays(dayKey(), i - 6); return {k, n: S.days[k] || 0}; });
    const max = Math.max(1, ...week.map(w => w.n)), dn = ['D','L','M','X','J','V','S'];
    const due = dueOf('all').length;
    return `<h1>Arquitectura de Software</h1>
    <div class="card row sp"><div class="grow"><b>${done === total ? '¡Curso completado!' : done ? 'Sigue donde lo dejaste' : 'Empieza el curso'}</b>
      <div class="mute">${done} de ${total} lecciones</div>
      <div style="margin-top:10px">${next ? `<a class="btn" href="#/lesson/${next.m.id}/${next.i}">${done ? 'Continuar' : 'Empezar'}: ${esc(next.l.title)}</a>` : `<a class="btn" href="#/quiz/exam">Hacer el examen final</a>`}</div></div>
      <div class="ring" style="--p:${pct}"><b>${pct}%</b></div></div>
    <div class="grid">
      <div class="card stat"><b>${passed}/${C.length}</b><span>quizzes aprobados</span></div>
      <div class="card stat"><b>${S.exam.best == null ? '—' : S.exam.best + '%'}</b><span>examen final</span></div>
      <div class="card stat"><b>${due}</b><span>tarjetas por repasar</span></div></div>
    <h2>Actividad semanal</h2>
    <div class="card chart" role="img" aria-label="Actividad de los últimos 7 días">${week.map(w => `<div><i style="height:${Math.round(w.n / max * 70)}px"></i>${dn[new Date(w.k + 'T12:00:00').getDay()]}</div>`).join('')}</div>
    <h2>Copia de seguridad</h2>
    <div class="card"><p class="mute" style="margin-top:0">Tu progreso se guarda solo en este navegador. Guarda una copia por si cambias de dispositivo.</p>
      <div class="row"><button class="btn sec sm" data-act="export">${showX ? 'Cerrar' : '💾 Copia de seguridad'}</button><button class="btn ghost sm" data-act="reset">Reiniciar progreso</button></div>
      ${showX ? `<label for="xdata">Guarda este texto en un lugar seguro</label><textarea id="xdata" readonly>${esc(JSON.stringify(S))}</textarea>
        <button class="btn sec sm" data-act="copyx" style="margin-top:8px">Copiar</button>
        <label for="idata">Para restaurar, pega aquí una copia</label><textarea id="idata"></textarea>
        <button class="btn sm" data-act="doimport" style="margin-top:8px">Importar</button>` : ''}</div>`;
  },

  course() {
    const ex = S.exam;
    return `<h1>Temario</h1>
    ${C.map((m, n) => { const d = modDone(m), b = S.quiz[m.id]?.best;
      return `<a class="card mod" href="#/mod/${m.id}"><span class="em">${m.emoji}</span><div class="grow"><b>Módulo ${n + 1} · ${esc(m.title)}</b><br><small>${d}/${m.lessons.length} lecciones${b != null ? ' · quiz ' + b + '%' : ''}</small>
      <div class="bar" style="margin-top:6px"><i style="width:${d / m.lessons.length * 100}%"></i></div></div></a>`; }).join('')}
    <a class="card mod" href="#/quiz/exam"><span class="em">🎓</span><div class="grow"><b>Examen final</b><br><small>20 preguntas de todos los módulos · mejor nota: ${ex.best == null ? '—' : ex.best + '%'}</small></div></a>`;
  },

  mod(id) {
    const m = mod(id); if (!m) return views.course();
    const b = S.quiz[id]?.best, d = dueOf(id).length;
    return `${back('#/course', 'Temario')}<h1>${m.emoji} ${esc(m.title)}</h1><p>${esc(m.summary)}</p>
    <div class="card">${m.lessons.map((l, i) => `<a class="li" href="#/lesson/${id}/${i}"><span class="chk ${S.done[lessonKey(m, i)] ? 'on' : ''}">${S.done[lessonKey(m, i)] ? '✓' : i + 1}</span><span class="grow">${esc(l.title)}</span></a>`).join('')}</div>
    <div class="card"><b>✍️ Práctica</b><p>${inline(m.practice)}</p></div>
    <div class="row"><a class="btn" href="#/quiz/${id}">Quiz del módulo${b != null ? ' (' + b + '%)' : ''}</a><a class="btn sec" href="#/study/${id}">Tarjetas (${d} pendientes)</a></div>`;
  },

  lesson(id, i) {
    const m = mod(id); i = +i; const l = m?.lessons[i]; if (!l) return views.course();
    const k = lessonKey(m, i), last = i === m.lessons.length - 1, done = S.done[k];
    return `${back('#/mod/' + id, m.title)}<div class="mute">Lección ${i + 1} de ${m.lessons.length}</div><h1>${esc(l.title)}</h1>
    <article class="lesson">${md(l.body)}</article>
    <div class="row" style="margin-top:20px">
      ${i > 0 ? `<a class="btn ghost" href="#/lesson/${id}/${i - 1}">← Anterior</a>` : ''}
      <button class="btn ${done ? 'sec' : 'ok'} grow" data-act="done" data-m="${id}" data-i="${i}">${done ? '✓ Completada · ' : 'Marcar como completada · '}${last ? 'ir al quiz' : 'siguiente'}</button></div>`;
  },

  quiz(id) {
    if (id !== 'exam' && !mod(id)) return views.course();
    if (!quiz || quiz.id !== id) startQuiz(id);
    const z = quiz, name = id === 'exam' ? 'Examen final' : mod(id).title;
    if (z.i >= z.qs.length) {
      const pct = Math.round(z.ok / z.qs.length * 100), rec = id === 'exam' ? S.exam : (S.quiz[id] ||= {best: null, att: 0});
      if (!z.saved) { z.saved = true; rec.att = (rec.att || 0) + 1; if (rec.best == null || pct > rec.best) rec.best = pct; act(); save(); }
      return `<div class="card" style="text-align:center"><div style="font-size:3rem">${pct >= PASS ? '🏆' : '📚'}</div><h1>${z.ok} / ${z.qs.length} · ${pct}%</h1>
        <p>${pct >= PASS ? '¡Aprobado!' : 'Aún no llegas al ' + PASS + ' %. Repasa las lecciones y vuelve a intentarlo.'}</p>
        <div class="row" style="justify-content:center"><button class="btn" data-act="quizagain">Repetir</button><a class="btn sec" href="#/${id === 'exam' ? 'course' : 'mod/' + id}">Salir</a></div></div>
        ${z.wrong.length ? `<h2>Para repasar</h2>${z.wrong.map(q => `<div class="card"><b>${esc(q.q)}</b><p class="mute">${esc(q.opts.find(o => o.c).t)} — ${esc(q.why)}</p></div>`).join('')}` : ''}`;
    }
    const q = z.qs[z.i];
    return `<div class="row sp"><a href="#/${id === 'exam' ? 'course' : 'mod/' + id}">← Salir</a><span class="mute">${esc(name)} · ${z.i + 1}/${z.qs.length}</span></div>
    <div class="bar" style="margin:8px 0 14px"><i style="width:${z.i / z.qs.length * 100}%"></i></div>
    <div class="card"><b style="font-size:1.1rem">${esc(q.q)}</b></div>
    ${q.opts.map((o, k) => `<button class="opt ${z.picked == null ? '' : o.c ? 'good' : k === z.picked ? 'wrong' : ''}" data-act="pick" data-k="${k}" ${z.picked != null ? 'disabled' : ''}>${esc(o.t)}</button>`).join('')}
    ${z.picked != null ? `<div class="why"><b>${q.opts[z.picked].c ? '✅ Correcto' : '❌ Incorrecto'}.</b> ${esc(q.why)}</div><button class="btn block" data-act="qnext">${z.i + 1 >= z.qs.length ? 'Ver resultado' : 'Siguiente'}</button>` : ''}`;
  },

  review() {
    const all = dueOf('all').length;
    return `<h1>Repaso</h1><p class="mute">Tarjetas con repetición espaciada: las que aciertas vuelven a aparecer cada vez más tarde.</p>
    <a class="btn block ${all ? '' : 'sec'}" href="#/study/all" style="margin-bottom:12px">Repasar todo lo pendiente (${all})</a>
    ${C.map(m => `<a class="card mod" href="#/study/${m.id}"><span class="em">${m.emoji}</span><div class="grow"><b>${esc(m.title)}</b><br><small>${m.cards.length} tarjetas · ${dueOf(m.id).length} pendientes</small></div></a>`).join('')}
    <h2>Glosario</h2><input id="gsearch" type="search" placeholder="Buscar un concepto…" aria-label="Buscar en el glosario" data-act="gfilter">
    <div class="card" style="margin-top:10px">${[...CARDS].sort((a, b) => a.q.localeCompare(b.q, 'es')).map(c => `<div class="gl" data-t="${esc((c.q + ' ' + c.a).toLowerCase())}"><b>${esc(c.q)}</b>${esc(c.a)}</div>`).join('')}<div class="empty" id="gnone" hidden>Sin resultados.</div></div>`;
  },

  study(id) {
    if (!study || study.id !== id) startStudy(id);
    const s = study, back_ = id === 'all' ? '#/review' : '#/mod/' + id;
    if (!s.queue.length) return `${back('#/review', 'Repaso')}<div class="empty"><div style="font-size:3rem">🎉</div><h1>¡Nada pendiente!</h1><p>Vuelve mañana o repasa todas las tarjetas ahora.</p><button class="btn" data-act="studyall" data-id="${esc(id)}">Repasar todas</button></div>`;
    if (s.i >= s.queue.length) return `<div class="empty"><div style="font-size:3rem">${s.ok / s.queue.length >= .7 ? '🏆' : '💪'}</div><h1>Sesión terminada</h1><p>${s.ok} de ${s.queue.length} correctas</p><a class="btn" href="#/review">Volver</a></div>`;
    const c = s.queue[s.i];
    return `<div class="row sp"><a href="${back_}">← Salir</a><span class="mute">${s.i + 1} / ${s.queue.length}</span></div>
    <div class="bar" style="margin:8px 0 14px"><i style="width:${s.i / s.queue.length * 100}%"></i></div>
    <div class="card flash ${s.flip ? 'back' : ''}" data-act="flip" tabindex="0" role="button" aria-label="Girar tarjeta"><div><small>${s.flip ? 'Respuesta' : 'Concepto'}</small>${esc(s.flip ? c.a : c.q)}</div></div>
    ${s.flip ? `<div class="row"><button class="btn bad grow" data-act="grade" data-v="0">❌ No la sabía</button><button class="btn ok grow" data-act="grade" data-v="1">✅ La sabía</button></div>` : `<button class="btn block" data-act="flip">Mostrar respuesta</button>`}`;
  },

  prompt() {
    const txt = S.prompt ?? window.PROMPT_BASE;
    return `<h1>Prompt base</h1><p class="mute">Plantilla lista para copiar y pegar en una IA. Reemplaza los campos <code>[[ASÍ]]</code> con los datos de tu proyecto; puedes editar el texto aquí mismo y se guarda.</p>
    <div class="row" style="margin-bottom:10px"><button class="btn grow" data-act="pcopy">📋 Copiar prompt</button><button class="btn ghost sm" data-act="preset">Restaurar original</button></div>
    <label for="ptxt">Prompt (editable)</label><textarea id="ptxt" class="ptxt" data-act="ptxt" spellcheck="false">${esc(txt)}</textarea>
    <h2>Módulos opcionales</h2><p class="mute" style="margin-top:0">Pulsa para añadir la instrucción al final del prompt.</p>
    <div class="row">${window.PROMPT_MODULES.map((m, k) => `<button class="btn sec sm" data-act="addmod" data-k="${k}">+ ${esc(m.k)}</button>`).join('')}</div>`;
  },

  notes(id) {
    if (id) {
      const n = S.notes.find(x => x.id === id); if (!n) return views.notes();
      return `${back('#/notes', 'Notas')}<label for="nt">Título</label><input id="nt" value="${esc(n.title)}" data-act="notefield" data-f="title" data-id="${n.id}" maxlength="80">
      <label for="nb">Contenido</label><textarea id="nb" style="min-height:300px" data-act="notefield" data-f="body" data-id="${n.id}">${esc(n.body)}</textarea>
      <p class="mute">Se guarda automáticamente.</p><button class="btn ghost sm" data-act="delnote" data-id="${n.id}">Eliminar nota</button>`;
    }
    const list = [...S.notes].sort((a, b) => b.updated - a.updated);
    return `<div class="row sp"><h1>Notas</h1><button class="btn" data-act="newnote">+ Nueva</button></div>
    ${list.length ? list.map(n => `<a class="card mod" href="#/notes/${n.id}"><div class="grow"><b>${esc(n.title || 'Sin título')}</b><br><small>${esc((n.body || '').slice(0, 90))}</small></div></a>`).join('') : '<div class="empty">Apunta tus dudas, resúmenes y decisiones de diseño.</div>'}`;
  }
};

// ---------- Router y render ----------
let H = '#/home';
function route() { const [, name = 'home', a, b] = H.split('/'); return {name, a, b}; }
function go(h) {
  H = h; const {name} = route();
  if (name !== 'study') study = null;
  if (name !== 'quiz') quiz = null;
  render(); scrollTo(0, 0);
}
function render() {
  const {name, a, b} = route();
  $('#view').innerHTML = (views[name] || views.home)(a, b);
  const tab = {home: 'home', course: 'course', mod: 'course', lesson: 'course', quiz: 'course', review: 'review', study: 'review', notes: 'notes', prompt: 'prompt'}[name] || 'home';
  document.querySelectorAll('.tabs a').forEach(t => t.classList.toggle('on', t.dataset.tab === tab));
  const n = streak(); $('#streak').textContent = '🔥 ' + n + (n === 1 ? ' día' : ' días');
}
function arm(el) {
  if (el.dataset.armed) return true;
  const t = el.textContent; el.dataset.armed = '1'; el.textContent = '¿Seguro? Pulsa otra vez';
  setTimeout(() => { delete el.dataset.armed; if (el.isConnected) el.textContent = t; }, 3000);
  return false;
}

// ---------- Eventos ----------
document.addEventListener('click', e => {
  const lk = e.target.closest('a[href^="#/"]'); if (lk) { e.preventDefault(); go(lk.getAttribute('href')); return; }
  const el = e.target.closest('[data-act]'); if (!el || /^(INPUT|TEXTAREA)$/.test(el.tagName)) return;
  const a = el.dataset.act;
  switch (a) {
    case 'flip': study.flip = !study.flip; render(); break;
    case 'grade': grade(+el.dataset.v); break;
    case 'studyall': startStudy(el.dataset.id, true); render(); break;
    case 'done': {
      const m = mod(el.dataset.m), i = +el.dataset.i, k = lessonKey(m, i);
      if (!S.done[k]) { S.done[k] = true; act(); save(); toast('Lección completada ✔'); }
      go(i + 1 < m.lessons.length ? `#/lesson/${m.id}/${i + 1}` : `#/quiz/${m.id}`); break; }
    case 'pick': { const z = quiz, q = z.qs[z.i]; z.picked = +el.dataset.k; if (q.opts[z.picked].c) z.ok++; else z.wrong.push(q); render(); break; }
    case 'qnext': quiz.i++; quiz.picked = null; render(); scrollTo(0, 0); break;
    case 'quizagain': { const id = quiz.id; quiz = null; go('#/quiz/' + id); break; }
    case 'newnote': { const n = {id: uid(), title: '', body: '', updated: Date.now()}; S.notes.push(n); save(); go('#/notes/' + n.id); break; }
    case 'delnote': if (arm(el)) { S.notes = S.notes.filter(n => n.id !== el.dataset.id); save(); go('#/notes'); } break;
    case 'pcopy': {
      const t = $('#ptxt'), done = () => toast('Prompt copiado ✔'), fb = () => { t.focus(); t.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) {} ok ? done() : toast('Texto seleccionado: cópialo con Ctrl/⌘+C'); };
      (navigator.clipboard ? navigator.clipboard.writeText(t.value).then(done, fb) : fb()); break; }
    case 'preset': if (arm(el)) { delete S.prompt; save(); render(); toast('Prompt restaurado'); } break;
    case 'addmod': { const t = $('#ptxt'); t.value = t.value.replace(/\s*$/, '') + '\n\n' + window.PROMPT_MODULES[+el.dataset.k].t; S.prompt = t.value; save(); t.scrollTop = t.scrollHeight; toast('Módulo añadido al final'); break; }
    case 'export': showX = !showX; render(); break;
    case 'copyx': { const t = $('#xdata'); t.select(); (navigator.clipboard ? navigator.clipboard.writeText(t.value) : Promise.reject()).then(() => toast('Copiado'), () => toast('Selecciona y copia el texto')); break; }
    case 'doimport':
      try { const d = JSON.parse($('#idata').value); if (!d || typeof d !== 'object' || !d.done) throw 0; S = norm(d); save(); showX = false; render(); toast('Copia importada ✔'); }
      catch (err) { toast('El texto no es una copia válida'); }
      break;
    case 'reset': if (arm(el)) { S = fresh(); save(); render(); toast('Progreso reiniciado'); } break;
  }
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.flash')) { e.preventDefault(); study.flip = !study.flip; render(); }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.act === 'ptxt') { S.prompt = el.value; save(); }
  else if (el.dataset.act === 'notefield') { const n = S.notes.find(x => x.id === el.dataset.id); if (n) { n[el.dataset.f] = el.value; n.updated = Date.now(); save(); } }
  else if (el.dataset.act === 'gfilter') {
    const q = el.value.trim().toLowerCase(); let n = 0;
    document.querySelectorAll('.gl').forEach(g => { const ok = !q || g.dataset.t.includes(q); g.hidden = !ok; if (ok) n++; });
    $('#gnone').hidden = n > 0;
  }
});
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
render();
})();
