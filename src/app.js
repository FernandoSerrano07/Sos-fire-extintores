/* ==========================================================================
   App de extintores · SOS FIRE
   - Técnico (teléfono): elegir/crear proyecto, revisar extintores por zona, reporte.
   - Administrador (computadora): proyectos en vivo, detalle por visita, técnicos.
   Partes: 1) utilidades  2) criterios del formato  3) sesión y datos  4) técnico
           5) ficha de inspección  6) administrador  7) Excel y PDF  8) arranque
   ========================================================================== */
'use strict';

/* ======================= 1) Utilidades ======================= */
const $ = (id) => document.getElementById(id);
const root = $('root');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const hoyISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const fmtFecha = (iso) => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
const hhmm = (t) => { if (!t) return ''; const d = new Date(t); const hoy = new Date().toDateString() === d.toDateString();
  return (hoy ? '' : d.toLocaleDateString('es', { day: '2-digit', month: '2-digit' }) + ' ') + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }); };
const hace = (t) => { if (!t) return ''; const m = Math.round((Date.now() - t) / 60000); if (m < 1) return 'ahora'; if (m < 60) return `hace ${m} min`; const h = Math.round(m / 60); if (h < 24) return `hace ${h} h`; return hhmm(t); };
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const inicioMes = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).getTime(); };
const iniciales = (n) => String(n || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
const AVC = [['#FDECEC', '#A3000F'], ['#E8F0FE', '#1A56C4'], ['#E6F4EA', '#167C3A'], ['#FFF4E0', '#8A4A00'], ['#EFEAFB', '#5B3CB0']];
const avColor = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return AVC[h % AVC.length]; };
const avatar = (nombre, k) => { const [bg, fg] = avColor(k || nombre); return `<span class="av" style="background:${bg};color:${fg}">${esc(iniciales(nombre))}</span>`; };
const ICON = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6h6"/><path d="M10 3h4v3"/><rect x="7" y="6" width="10" height="15" rx="3"/><path d="M17 9l3-2"/></svg>',
  rep: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/><path d="M9 17v-4"/><path d="M12 17v-6"/><path d="M15 17v-2"/></svg>',
  pin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C90012" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 4.5 9.5 10 6 10.5l7.5 7.5.5-3.5L19.5 9z"/><path d="M9 15l-4.5 4.5"/><path d="M14.5 4 20 9.5"/></svg>',
};
const LOGO = 'data:image/png;base64,' + LOGO_B64;

function toast(msg, undo) {
  const t = $('toast'); clearTimeout(toast._t); t.innerHTML = ''; t.append(document.createTextNode(msg));
  t.classList.toggle('act', !!undo);
  if (undo) { const b = document.createElement('button'); b.textContent = 'Deshacer'; b.onclick = () => { t.classList.remove('on', 'act'); undo(); }; t.append(b); }
  t.classList.add('on'); toast._t = setTimeout(() => t.classList.remove('on', 'act'), undo ? 5000 : 2200);
}
// Diálogo propio (alert/confirm no funcionan bien como app instalada)
function ask(titulo, msg, si = 'Aceptar', html = '') {
  return new Promise((res) => {
    $('dlgT').textContent = titulo; $('dlgM').textContent = msg; $('dlgB').innerHTML = html; $('dlgSi').textContent = si;
    $('dlgNo').classList.toggle('hide', si === null); if (si === null) $('dlgSi').textContent = 'Entendido';
    $('dlg').classList.add('on');
    const fin = (v) => { $('dlg').classList.remove('on'); $('dlgSi').onclick = $('dlgNo').onclick = null; res(v); };
    $('dlgSi').onclick = () => fin(true); $('dlgNo').onclick = () => fin(false);
  });
}
async function run(fn) { $('busy').classList.add('on'); try { await fn(); } catch (e) { console.error(e); toast('No se pudo: ' + (e.message || e)); } finally { $('busy').classList.remove('on'); } }
function descargar(nombre, blob) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); toast('Descargando ' + nombre);
}

/* ======================= 2) Criterios del formato (Hoja 2) ======================= */
// good = la opción correcta. col = columnas del Excel para cada opción (Bueno|Malo, Sí|No).
const CRIT = [
  { k: 'presion', l: 'Presión del manómetro', o: [['ok', 'Correcta'], ['baja', 'Baja'], ['alta', 'Alta']], good: 'ok', wide: true },
  { k: 'cilindro', l: 'Estado físico cilindro', o: [['b', 'Bueno'], ['m', 'Malo']], good: 'b', col: ['N', 'O'] },
  { k: 'instrucciones', l: 'Instrucciones de uso', o: [['s', 'Sí'], ['n', 'No']], good: 's', col: ['P', 'Q'] },
  { k: 'senal', l: 'Señalización', o: [['b', 'Bueno'], ['m', 'Malo']], good: 'b', col: ['R', 'S'] },
  { k: 'marchamo', l: 'Marchamo', o: [['s', 'Sí'], ['n', 'No']], good: 's', col: ['T', 'U'] },
  { k: 'manguera', l: 'Manguera', o: [['s', 'Sí'], ['n', 'No']], good: 's', col: ['V', 'W'] },
  { k: 'boquilla', l: 'Boquilla', o: [['s', 'Sí'], ['n', 'No']], good: 's', col: ['X', 'Y'] },
  { k: 'etiqueta', l: 'Etiqueta', o: [['s', 'Sí'], ['n', 'No']], good: 's', col: ['Z', 'AA'] },
  { k: 'altura', l: 'Altura', o: [['ok', 'Correcta'], ['mal', 'Incorrecta']], good: 'ok' },
];
const CK = Object.fromEntries(CRIT.map((c) => [c.k, c]));
const optLabel = (k, v) => (CK[k].o.find((o) => o[0] === v) || [, ''])[1];
const QUICK = ['Requiere recarga', 'Sin marchamo', 'Se colocó marchamo', 'Obstruido', 'Sin señalización', 'Golpeado / oxidado', 'Manguera dañada', 'No se encontró'];
const TIPOS = ['ABC', 'CO₂', 'K', 'Agua', 'BC', 'Otro'];

function estado(rev) {
  if (!rev || !rev.c) return 'pend';
  const vals = CRIT.map((c) => rev.c[c.k]);
  if (vals.every((v) => !v)) return 'pend';
  if (CRIT.some((c) => rev.c[c.k] && rev.c[c.k] !== c.good)) return 'bad';
  if (vals.some((v) => !v)) return 'part';
  return 'ok';
}
const fallasDe = (rev) => CRIT.filter((c) => rev && rev.c && rev.c[c.k] && rev.c[c.k] !== c.good).map((c) => `${c.l.replace(' del manómetro', '').replace(' de uso', '')}: ${optLabel(c.k, rev.c[c.k])}`);
// Recarga "MM/AAAA": vencida, por vencer (este mes o el siguiente) o al día
function venc(mmaaaa) {
  const m = String(mmaaaa || '').match(/^(\d{1,2})\/(\d{4})$/); if (!m) return null;
  const d = new Date(); const diff = (+m[2] * 12 + (+m[1] - 1)) - (d.getFullYear() * 12 + d.getMonth());
  return diff < 0 ? 'vencida' : diff <= 1 ? 'pronto' : 'ok';
}
const sumarMeses = (mmaaaa, n) => { const m = String(mmaaaa).match(/^(\d{1,2})\/(\d{4})$/); if (!m) return ''; const t = +m[2] * 12 + (+m[1] - 1) + n; return `${String(t % 12 + 1).padStart(2, '0')}/${Math.floor(t / 12)}`; };
const mesActual = () => { const d = new Date(); return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; };
// "EDIFICIO # 1 ZONA #2" -> "Edif. 1" · "ZONA #1" -> "Zona 1" · "EXTINTORES DE RESERVA" -> "Reserva"
function zonaCorta(z) {
  const s = String(z || '').trim(); if (!s) return 'Sin zona';
  const ed = s.match(/EDIFI?C?I?O\s*#?\s*(\d+)/i); if (ed) return 'Edif. ' + ed[1];
  if (/RESERVA/i.test(s)) return 'Reserva';
  const rest = s.replace(/ZONA\s*#?\s*\d+/i, '').replace(/[.,\s]+$/, '').trim();
  if (!rest) { const n = s.match(/ZONA\s*#?\s*(\d+)/i); return n ? 'Zona ' + n[1] : s; }
  const p = rest.split(/[,.]/)[0].trim().toLowerCase(); return (p[0].toUpperCase() + p.slice(1)).slice(0, 22);
}

/* ======================= 3) Sesión y datos ======================= */
const S = {
  me: null, rol: null,             // perfil y rol del usuario
  clientes: [], activas: [], mes: [], usuarios: [], config: {},
  // visita abierta
  vid: null, visita: null, cid: null, ext: [], rev: {}, revOk: false,
  // administración de un cliente
  aCid: null, aVid: null, aVisitas: [], aExt: [], aRev: {},
};
const U = { list: [], v: [], a: [] }; // suscripciones: generales, de visita, de admin
const stopAll = (k) => { U[k].forEach((u) => { try { u(); } catch (e) {} }); U[k] = []; };
const esAdmin = () => S.rol === 'admin';
const yo = () => (S.me && S.me.nombre) || '';
const online = (t) => t && Date.now() - t < 3 * 60000;
const ui = { q: '', zona: '', filtro: 'all', limit: 80, hq: '', hmes: '' };

let redrawT = null;
function redraw() { clearTimeout(redrawT); redrawT = setTimeout(route, 40); }
function cloudError(e) { console.error(e); if (e && e.code === 'permission-denied') toast('Sin permiso. Pida acceso al administrador.'); }

function iniciarDatos() {
  stopAll('list');
  U.list.push(Cloud.watchClientes((l) => { S.clientes = l; redraw(); }, cloudError));
  U.list.push(Cloud.watchVisitasActivas((l) => { S.activas = l; redraw(); }, cloudError));
  U.list.push(Cloud.watchVisitasDesde(inicioMes(), (l) => { S.mes = l; redraw(); }, cloudError));
  U.list.push(Cloud.watchConfig((c) => { S.config = c || {}; }, cloudError));
  if (esAdmin()) {
    U.list.push(Cloud.watchUsuarios((l) => { S.usuarios = l; redraw(); }, cloudError));
    setTimeout(limpiarViejas, 8000);
  }
}
setInterval(() => { if (/^#\/a/.test(location.hash) || location.hash === '' || location.hash === '#/') redraw(); }, 30000); // refresca "en línea"

const cliente = (cid) => S.clientes.find((c) => c.id === cid);
const visitaAbiertaDe = (cid) => S.activas.filter((v) => v.cid === cid).sort((a, b) => b.creada - a.creada)[0];
const visitasMesDe = (cid) => S.mes.filter((v) => v.cid === cid).sort((a, b) => b.creada - a.creada);
function frecTxt(c) {
  if (c.frecuencia === 'semanal') return `cada ${DIAS[c.dia ?? 2]}`;
  if (c.frecuencia === 'mensual') return 'visita mensual';
  return 'visita única';
}
const tocaHoy = (c) => (c.frecuencia === 'semanal' && Number(c.dia) === new Date().getDay()) || !!visitaAbiertaDe(c.id);

// Resumen que se guarda en la visita (para la pantalla del administrador)
function calcResumen(ext, rev) {
  let ok = 0, bad = 0, part = 0, pronto = 0;
  for (const e of ext) {
    const r = rev[e.id]; const s = estado(r);
    if (s === 'ok') ok++; else if (s === 'bad') bad++; else if (s === 'part') part++;
    const v = venc((r && r.recProx) || e.recProx); if (v === 'vencida' || v === 'pronto') pronto++;
  }
  return { total: ext.length, ok, bad, part, done: ok + bad + part, pronto };
}
let resT = null;
function guardarResumen(texto) {
  if (!S.vid) return;
  const patch = { resumen: calcResumen(S.ext, S.rev) };
  if (texto) patch.ultimaAct = { texto, t: Date.now(), by: yo() };
  clearTimeout(resT); resT = setTimeout(() => Cloud.updateVisita(S.vid, patch).catch(cloudError), texto ? 300 : 2500);
}

/* ---------- Rutas ----------
   #/            inicio (técnico: ¿dónde trabajas hoy? · admin: proyectos)
   #/t           admin viendo la pantalla del técnico
   #/nuevo       nuevo proyecto
   #/v/ID        visita (lista)   #/v/ID/reporte
   #/a/c/CID     admin: detalle del cliente     #/a/tecnicos */
function go(h) { if (location.hash === h) route(); else location.hash = h; }
window.addEventListener('hashchange', () => { ui.limit = 80; route(); window.scrollTo(0, 0); });

function route() {
  if (!S.me) return;
  const h = location.hash || '#/';
  let m;
  if ((m = h.match(/^#\/v\/([^/]+)(\/reporte)?$/))) { abrirVisita(m[1]); return m[2] ? renderReporte() : renderLista(); }
  salirVisita();
  if (h === '#/nuevo') return renderNuevo();
  if (esAdmin()) {
    if ((m = h.match(/^#\/a\/c\/([^/?]+)/))) return renderACliente(m[1]);
    salirACliente();
    if (h === '#/a/tecnicos') return renderATecnicos();
    if (h === '#/t') return renderTHome();
    return renderAHome();
  }
  return renderTHome();
}

// Suscribirse a una visita (extintores del cliente + revisiones en vivo)
let latido = null;
function abrirVisita(vid) {
  if (S.vid === vid) return;
  salirVisita();
  S.vid = vid; S.visita = S.activas.find((v) => v.id === vid) || S.mes.find((v) => v.id === vid) || null;
  S.cid = S.visita && S.visita.cid; S.ext = []; S.rev = {}; S.revOk = false;
  U.v.push(Cloud.watchVisita(vid, (v) => {
    S.visita = v; if (!v) { toast('La visita ya no existe'); go('#/'); return; }
    if (v.cid !== S.cid || !U.v._ext) {
      S.cid = v.cid; if (U.v._ext) U.v._ext();
      U.v._ext = Cloud.watchExtintores(v.cid, (l) => { S.ext = l.filter((e) => !e.baja).sort((a, b) => (a.n || 0) - (b.n || 0)); redraw(); }, cloudError);
    }
    redraw();
  }, cloudError));
  U.v.push(Cloud.watchRevisiones(vid, (l, srv) => {
    const antes = S.rev; S.rev = {}; for (const r of l) S.rev[r.eid || r.id] = r; S.revOk = S.revOk || srv;
    // aviso si otro técnico guardó el extintor que tengo abierto
    if (ed && antes[ed.eid] !== S.rev[ed.eid]) { const r = S.rev[ed.eid]; if (r && r.uid !== Cloud.uid() && (!antes[ed.eid] || antes[ed.eid].t !== r.t)) avisoOtro(r); }
    redraw();
  }, cloudError));
  const ping = () => { if (S.vid && S.me) Cloud.presente(S.vid, Cloud.uid(), yo()).catch(() => {}); };
  ping(); latido = setInterval(ping, 60000);
}
function salirVisita() {
  if (!S.vid) return;
  Cloud.salir(S.vid, Cloud.uid()).catch(() => {});
  clearInterval(latido); if (U.v._ext) U.v._ext(); stopAll('v');
  S.vid = S.visita = S.cid = null; S.ext = []; S.rev = {}; cerrarFicha();
}
window.addEventListener('pagehide', () => { if (S.vid) Cloud.salir(S.vid, Cloud.uid()).catch(() => {}); });

// Abre (o crea) la visita de hoy de un cliente
async function entrarCliente(cid) {
  const c = cliente(cid); if (!c) return;
  const v = visitaAbiertaDe(cid);
  if (v) return go('#/v/' + v.id);
  if (!(await ask(`Iniciar visita en ${c.nombre}`, `Se abrirá la inspección de hoy (${fmtFecha(hoyISO())}). Los demás técnicos que entren a este proyecto trabajarán en la misma.`, 'Iniciar visita'))) return;
  go('#/v/' + nuevaVisita(c));
}
function nuevaVisita(c) {
  const vid = Cloud.crearVisita({ cid: c.id, cliente: c.nombre, lugar: c.lugar || '', fecha: hoyISO(), creadoPor: yo() });
  Cloud.updateCliente(c.id, { ultimaVisita: { vid, fecha: hoyISO(), t: Date.now() } }).catch(cloudError);
  return vid;
}

/* ======================= 4) Técnico ======================= */
function topTec({ back, titulo, sub, extra = '' }) {
  return `<div class="top"><div class="brand">
      ${back ? `<button class="back" data-act="go" data-h="${back}" aria-label="Volver">‹</button>` : `<img src="${LOGO}" alt="SOS FIRE">`}
      <div class="r"><b>${esc(titulo)}</b>${sub || ''}</div>
    </div>${extra}</div>`;
}
const netPill = () => `<span class="net ${navigator.onLine ? 'on' : 'off'}">${navigator.onLine ? 'En línea' : 'Sin señal · se enviará'}</span>`;

// ----- Inicio del técnico: ¿Dónde trabajas hoy? -----
function renderTHome() {
  const q = norm(ui.hq);
  const match = (c) => !q || q.split(' ').every((t) => norm(`${c.nombre} ${c.lugar}`).includes(t));
  const cs = S.clientes.filter(match);
  const hoy = cs.filter(tocaHoy);
  const fij = cs.filter((c) => c.fijado && !hoy.includes(c));
  const mesIds = new Set(S.mes.map((v) => v.cid));
  const mes = cs.filter((c) => !c.fijado && !hoy.includes(c) && (mesIds.has(c.id) || (c.creado || 0) >= inicioMes()));
  const otros = q ? cs.filter((c) => !hoy.includes(c) && !fij.includes(c) && !mes.includes(c)) : [];
  const card = (c, big) => {
    const v = visitaAbiertaDe(c.id); const r = v && v.resumen;
    const quien = v ? Object.entries(v.tecnicos || {}).filter(([u, t]) => online(t.visto) && u !== Cloud.uid()).map(([, t]) => t.nombre.split(' ')[0]) : [];
    return `<button class="pcard ${big ? 'hoy' : ''}" data-act="cliente" data-id="${c.id}">
      <div class="h"><div><div class="n">${esc(c.nombre)}${c.lugar && c.lugar !== c.nombre ? ' · ' + esc(c.lugar) : ''}</div>
        <div class="d">${r ? `${r.done} / ${r.total} revisados` : esc(frecTxt(c))}</div></div>
        ${v ? '<span class="pill ok">En curso</span>' : c.ultimaVisita ? `<span class="pill pend">Última ${fmtFecha(c.ultimaVisita.fecha).slice(0, 5)}</span>` : ''}</div>
      ${r ? `<div class="bar"><i style="width:${(r.ok / Math.max(1, r.total)) * 100}%;background:var(--ok)"></i><i style="width:${(r.bad / Math.max(1, r.total)) * 100}%;background:var(--red)"></i></div>` : ''}
      ${big || quien.length ? `<div class="h d"><span>${quien.length ? 'Con ' + esc(quien.join(', ')) : esc(frecTxt(c))}</span><b style="color:var(--red)">Entrar ›</b></div>` : ''}
    </button>`;
  };
  const sec = (t, l, big) => (l.length ? `<div class="lbl" style="padding:6px 4px 0">${t}</div>${l.map((c) => card(c, big)).join('')}` : '');
  const d = new Date();
  root.innerHTML = `<div class="mob">
    ${topTec({ titulo: yo(), sub: esAdmin() ? '<button class="linkb" data-act="go" data-h="#/">Volver a administrador</button>' : '<button class="linkb" data-act="salir">Cerrar sesión</button>' })}
    <div style="background:#fff;padding:2px 16px 12px;border-bottom:1px solid var(--line);display:flex;flex-direction:column;gap:10px">
      <div><div style="font-size:20px;font-weight:800">¿Dónde trabajas hoy?</div><div class="muted" style="font-size:13px">${DIAS[d.getDay()][0].toUpperCase() + DIAS[d.getDay()].slice(1)} ${d.getDate()} de ${MESES[d.getMonth()]}</div></div>
      <label class="search">${ICON.search}<input id="hq" type="search" placeholder="Buscar cliente o lugar" value="${esc(ui.hq)}" autocomplete="off"></label>
    </div>
    <div class="pad">
      ${sec('Toca hoy', hoy, true)}${sec('Fijados', fij)}${sec('Este mes', mes)}${sec('Otros proyectos', otros)}
      ${!cs.length ? `<div class="empty">${q ? 'No se encontró ese cliente.' : 'Todavía no hay proyectos.'}<br>Créalo con el botón de abajo.</div>` : ''}
      ${!q && S.clientes.length > hoy.length + fij.length + mes.length ? '<div class="muted" style="font-size:12.5px;text-align:center">Los proyectos de meses anteriores aparecen al buscarlos.</div>' : ''}
    </div>
    <div class="foot" style="position:fixed;left:0;right:0;bottom:0;max-width:560px;margin:0 auto"><button class="btn pri" data-act="go" data-h="#/nuevo">+ Nuevo proyecto</button><small>¿Cliente nuevo? Créalo tú mismo y empieza a revisar</small></div>
  </div>`;
  const qi = $('hq'); qi.oninput = () => { ui.hq = qi.value; const pos = qi.selectionStart; renderTHome(); const n = $('hq'); n.focus(); n.setSelectionRange(pos, pos); };
}

// ----- Nuevo proyecto -----
const NV = { nombre: '', lugar: '', frecuencia: 'unica', dia: new Date().getDay(), carga: 'recorrido', excel: null, excelNombre: '' };
function renderNuevo() {
  const q = norm(NV.nombre);
  const parecidos = q.length >= 3 ? S.clientes.filter((c) => q.split(' ').every((t) => norm(`${c.nombre} ${c.lugar}`).includes(t))).slice(0, 3) : [];
  root.innerHTML = `<div class="mob" style="background:#fff">
    ${topTec({ back: esAdmin() ? '#/' : '#/', titulo: 'Nuevo proyecto' })}
    <div class="pad" style="padding:16px 16px 120px">
      <label class="field">Cliente<input id="nvN" value="${esc(NV.nombre)}" placeholder="Hotel Las Palmeras" autocomplete="off"></label>
      ${parecidos.length ? `<div class="sugg"><span class="h">¿Es alguno de estos? Tócalo para usarlo en vez de crear otro:</span>${parecidos.map((c) => `<button data-act="cliente" data-id="${c.id}">${esc(c.nombre)}${c.lugar ? ' · ' + esc(c.lugar) : ''}${c.ultimaVisita ? ` (última visita ${fmtFecha(c.ultimaVisita.fecha)})` : ''}</button>`).join('')}</div>` : ''}
      <label class="field">Lugar o sede<input id="nvL" value="${esc(NV.lugar)}" placeholder="Edificio, sucursal o dirección"></label>
      <div class="field">¿Cada cuánto se visita?
        <div class="seg3">${[['unica', 'Una vez'], ['mensual', 'Mensual'], ['semanal', 'Semanal']].map(([k, l]) => `<button class="segb ${NV.frecuencia === k ? 'on' : ''}" data-act="nvF" data-v="${k}">${l}</button>`).join('')}</div>
      </div>
      ${NV.frecuencia === 'semanal' ? `<label class="field">¿Qué día?<select id="nvD">${DIAS.map((d, i) => `<option value="${i}" ${+NV.dia === i ? 'selected' : ''}>${d}</option>`).join('')}</select></label>` : ''}
      <div class="field">¿Cómo cargo los extintores?
        <button class="opt ${NV.carga === 'recorrido' ? 'on' : ''}" data-act="nvC" data-v="recorrido"><b>Los agrego en el recorrido</b><span>Cada extintor que reviso queda guardado para la próxima visita.</span></button>
        <button class="opt ${NV.carga === 'excel' ? 'on' : ''}" data-act="nvC" data-v="excel" style="margin-top:6px"><b>Subir el Excel del cliente</b><span>${NV.excel ? `✓ ${esc(NV.excelNombre)}: ${NV.excel.length} extintores encontrados` : 'Formato de inspección (hoja 2): N°, Zona, Área, Marca, Tipo, Capacidad, Serie, Número.'}</span></button>
      </div>
      <div class="err" id="nvErr" style="text-align:left"></div>
    </div>
    <div class="foot" style="position:fixed;left:0;right:0;bottom:0;max-width:560px;margin:0 auto"><button class="btn pri" data-act="nvCrear">Crear y empezar</button><small>${esAdmin() ? 'Los técnicos lo ven al instante' : 'El administrador lo ve al instante en su pantalla'}</small></div>
  </div>`;
  $('nvN').oninput = (e) => { NV.nombre = e.target.value; const pos = e.target.selectionStart; renderNuevo(); $('nvN').focus(); $('nvN').setSelectionRange(pos, pos); };
  $('nvL').oninput = (e) => { NV.lugar = e.target.value; };
  if ($('nvD')) $('nvD').onchange = (e) => { NV.dia = +e.target.value; };
}
async function crearProyecto() {
  const nombre = NV.nombre.trim().replace(/\s+/g, ' '); const lugar = NV.lugar.trim();
  if (!nombre) { $('nvErr').textContent = 'Escriba el nombre del cliente.'; $('nvN').focus(); return; }
  if (NV.carga === 'excel' && !NV.excel) { $('nvErr').textContent = 'Seleccione el Excel del cliente o elija "Los agrego en el recorrido".'; return; }
  const c = { nombre, lugar, frecuencia: NV.frecuencia, dia: NV.frecuencia === 'semanal' ? +NV.dia : null, fijado: NV.frecuencia === 'semanal', creadoPor: yo() };
  const cid = await Cloud.crearCliente(c);
  if (NV.excel) Cloud.addExtintores(cid, NV.excel).catch(cloudError);
  const vid = nuevaVisita({ ...c, id: cid });
  Object.assign(NV, { nombre: '', lugar: '', frecuencia: 'unica', carga: 'recorrido', excel: null, excelNombre: '' });
  toast(`Proyecto ${nombre} creado`); go('#/v/' + vid);
}

// Lee el Excel de un cliente con el formato de la hoja 2 (o parecido): busca la fila de títulos
async function leerExcelCliente(file) {
  const wb = new ExcelJS.Workbook(); await wb.xlsx.load(await file.arrayBuffer());
  const txt = (v) => { if (v == null) return ''; if (typeof v === 'object') { if (v.richText) return v.richText.map((t) => t.text).join(''); if (v.result != null) return String(v.result); if (v.text) return String(v.text); } return String(v); };
  const claves = { n: /^n[°ºo.]?$|^num(ero)?$/, zona: /^zona/, area: /area|ubicaci/, marca: /^marca/, tipo: /tipo/, capacidad: /capacidad/, serie: /^serie/, numero: /numero del extintor|n[°º] ?extintor|numero ext/ };
  for (const ws of wb.worksheets) {
    let cols = null, start = 0;
    ws.eachRow((row, rn) => {
      if (cols) return;
      const m = {}; row.eachCell((cell, cn) => { const t = norm(txt(cell.value)); for (const [k, re] of Object.entries(claves)) if (m[k] == null && re.test(t)) m[k] = cn; });
      if (m.area && (m.marca || m.tipo)) { cols = m; start = rn + 1; }
    });
    if (!cols) continue;
    const out = []; let zona = '';
    for (let r = start; r <= ws.rowCount; r++) {
      const row = ws.getRow(r); const g = (k) => (cols[k] ? txt(row.getCell(cols[k]).value).replace(/\s+/g, ' ').trim() : '');
      const n = g('n'); const area = g('area');
      if (!area || norm(area).startsWith('area donde') || (cols.n && !/^\d+$/.test(n))) continue;
      if (g('zona') && !/^zona$/i.test(g('zona'))) zona = g('zona');
      out.push({ n: /^\d+$/.test(n) ? +n : out.length + 1, zona, area, marca: g('marca'), tipo: g('tipo').toUpperCase().replace(/C0?2|CO2/, 'CO₂'), capacidad: g('capacidad'), serie: g('serie'), numero: g('numero'), recAnt: '', recProx: '', ph: '' });
    }
    if (out.length) return out;
  }
  throw new Error('No se encontró la tabla de extintores (títulos Área, Marca, Tipo…).');
}
$('fileX').onchange = async (e) => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try { NV.excel = await leerExcelCliente(f); NV.excelNombre = f.name; NV.carga = 'excel'; } catch (err) { NV.excel = null; toast(err.message); }
  renderNuevo();
};

// ----- Lista de extintores de la visita -----
function zonasDe(ext) { const z = []; for (const e of ext) if (!z.includes(e.zona || '')) z.push(e.zona || ''); return z; }
function buscar(list, q) {
  const toks = norm(q).split(' ').filter(Boolean); if (!toks.length) return list;
  return list.filter((e) => { const t = norm(`${e.n} ${e.area} ${e.numero} ${e.serie} ${e.marca} ${e.tipo} ${zonaCorta(e.zona)}`); return toks.every((k) => (/^\d+$/.test(k) ? t.split(/[^a-z0-9ñ]+/).some((w) => w === k || w.replace(/^0+/, '') === k.replace(/^0+/, '') || w.startsWith(k)) : t.includes(k))); });
}
function marcar(txt, q) {
  let h = esc(txt); for (const t of norm(q).split(' ').filter((x) => x.length > 1 && !/^\d+$/.test(x))) {
    const i = norm(txt).indexOf(t); if (i >= 0 && norm(txt).length === txt.length) h = esc(txt.slice(0, i)) + '<mark>' + esc(txt.slice(i, i + t.length)) + '</mark>' + esc(txt.slice(i + t.length));
  } return h;
}
function vencPill(e, r) {
  const prox = (r && r.recProx) || e.recProx; const v = venc(prox);
  return v === 'vencida' ? `<span class="pill bad">Recarga vencida ${esc(prox)}</span>` : v === 'pronto' ? `<span class="pill warn">Recarga vence ${esc(prox)}</span>` : '';
}
function renderLista() {
  const v = S.visita; const c = v && cliente(v.cid);
  const ext = S.ext; const res = calcResumen(ext, S.rev);
  const zonas = zonasDe(ext);
  if (ui.zona && !zonas.includes(ui.zona)) ui.zona = '';
  let list = ui.zona ? ext.filter((e) => (e.zona || '') === ui.zona) : ext;
  list = buscar(list, ui.q);
  const cnt = { all: list.length, pend: 0, bad: 0, venc: 0, ok: 0 };
  for (const e of list) { const s = estado(S.rev[e.id]); if (s === 'pend' || s === 'part') cnt.pend++; if (s === 'bad') cnt.bad++; if (s === 'ok') cnt.ok++; const vv = venc((S.rev[e.id] && S.rev[e.id].recProx) || e.recProx); if (vv === 'vencida' || vv === 'pronto') cnt.venc++; }
  if (ui.filtro === 'pend') list = list.filter((e) => ['pend', 'part'].includes(estado(S.rev[e.id])));
  if (ui.filtro === 'bad') list = list.filter((e) => estado(S.rev[e.id]) === 'bad');
  if (ui.filtro === 'ok') list = list.filter((e) => estado(S.rev[e.id]) === 'ok');
  if (ui.filtro === 'venc') list = list.filter((e) => ['vencida', 'pronto'].includes(venc((S.rev[e.id] && S.rev[e.id].recProx) || e.recProx)));
  const shown = list.slice(0, ui.limit);
  let lastZ = null; const agrupar = !ui.zona && !ui.q;
  const rows = shown.map((e) => {
    const r = S.rev[e.id]; const s = estado(r);
    const head = agrupar && e.zona !== lastZ ? `<div class="zhead">${esc(e.zona || 'Sin zona')}</div>` : ''; lastZ = e.zona;
    const st = s === 'pend' ? '<span class="pill pend">Pendiente</span>' : s === 'ok' ? '<span class="pill ok">✓ Todo bien</span>' : s === 'bad' ? '<span class="pill bad">✕ Falla</span>' : '<span class="pill pend">Incompleto</span>';
    const det = s === 'bad' ? esc(fallasDe(r).join(' · ')) : '';
    return `${head}<div class="row ${s === 'ok' ? 'ok' : s === 'bad' ? 'bad' : ''}" id="r_${e.id}">
      <span class="num">${esc(e.n ?? '')}</span>
      <button class="main" data-act="ficha" data-id="${e.id}"><span class="t">${marcar(e.area || '(sin área)', ui.q)}</span>
        <span class="s">${esc([e.marca, e.tipo, e.capacidad].filter(Boolean).join(' · '))}${e.numero ? ' · N° ' + esc(e.numero) : ''}</span>
        <span class="st">${e.nuevo ? '<span class="pill new">Nuevo</span>' : ''}${st}${det ? `<span>${det}</span>` : ''}${r && r.t ? `<span>${esc((r.by || '').split(' ')[0])} ${hhmm(r.t)}</span>` : ''}${vencPill(e, r)}</span></button>
      ${s === 'pend' ? `<button class="quick" data-act="okRapido" data-id="${e.id}" aria-label="Marcar todo bien">✓ OK</button>` : `<button class="quick ed" data-act="ficha" data-id="${e.id}">Editar</button>`}
    </div>`;
  }).join('');
  const quienes = v ? Object.entries(v.tecnicos || {}).filter(([u, t]) => online(t.visto) && u !== Cloud.uid()).map(([, t]) => t.nombre.split(' ')[0]) : [];
  const fil = [['all', `Todos ${cnt.all}`, ''], ['pend', `Pendientes ${cnt.pend}`, ''], ['bad', `Con falla ${cnt.bad}`, 'bad'], ['venc', `Por vencer ${cnt.venc}`, 'warn'], ['ok', `OK ${cnt.ok}`, '']];
  root.innerHTML = `<div class="mob">
    ${topTec({ back: esAdmin() && v ? '#/a/c/' + v.cid : '#/', titulo: c ? c.nombre : (v ? v.cliente : 'Cargando…'), sub: `${netPill()}${quienes.length ? `<span class="muted" style="font-size:11.5px">También: ${esc(quienes.join(', '))}</span>` : ''}`,
      extra: `<div class="prog"><span>Visita ${v ? fmtFecha(v.fecha) : ''}${v && v.estado === 'terminada' ? ' · terminada' : ''}</span><b>${res.done} / ${res.total}</b></div>
      <div class="bar"><i style="width:${(res.ok / Math.max(1, res.total)) * 100}%;background:var(--ok)"></i><i style="width:${(res.bad / Math.max(1, res.total)) * 100}%;background:var(--red)"></i></div>
      <div class="sw"><label class="search">${ICON.search}<input id="q" type="search" placeholder="Número, serie o área: 0-218, generador…" value="${esc(ui.q)}" autocomplete="off" enterkeyhint="search">${ui.q ? '<button class="clr" data-act="qclr" aria-label="Limpiar">×</button>' : ''}</label>
        ${zonas.length > 1 ? `<div class="hs"><button class="zchip ${!ui.zona ? 'on' : ''}" data-act="zona" data-z="">Todas · ${ext.length}</button>${zonas.map((z) => { const zl = ext.filter((e) => (e.zona || '') === z); const d = zl.filter((e) => estado(S.rev[e.id]) !== 'pend').length; return `<button class="zchip ${ui.zona === z ? 'on' : ''}" data-act="zona" data-z="${esc(z)}">${esc(zonaCorta(z))} · ${d}/${zl.length}</button>`; }).join('')}</div>` : ''}
        <div class="hs">${fil.map(([k, l, cl]) => `<button class="chip ${cl} ${ui.filtro === k ? 'on' : ''}" data-act="filtro" data-f="${k}">${l}</button>`).join('')}</div>
      </div>` })}
    <div class="list">
      ${!S.revOk && !ext.length ? '<div class="empty">Cargando extintores…</div>' : ''}
      ${S.revOk && !ext.length ? '<div class="empty">Este proyecto todavía no tiene extintores.<br>Agrégalos mientras haces el recorrido.</div>' : ''}
      ${ext.length && !list.length ? `<div class="empty">Sin resultados${ui.q ? ` para “${esc(ui.q)}”` : ''}.</div>` : ''}
      ${rows}
      ${list.length > ui.limit ? `<button class="btn" data-act="mas" style="align-self:center">Ver ${Math.min(80, list.length - ui.limit)} más</button>` : ''}
      ${S.revOk ? `<button class="addbig" data-act="nuevoExt">+ ${ui.q ? `Agregar “${esc(ui.q)}” como extintor nuevo` : 'Agregar extintor que no está en la lista'}</button>` : ''}
    </div>
    ${navTec('lista')}
  </div>`;
  const qi = $('q'); qi.oninput = () => { ui.q = qi.value; ui.limit = 80; const pos = qi.selectionStart; renderLista(); const n = $('q'); n.focus(); n.setSelectionRange(pos, pos); };
  qi.onkeydown = (e) => { if (e.key === 'Enter' && list[0]) { e.preventDefault(); abrirFicha(list[0].id); } };
}
const navTec = (on) => `<nav class="nav"><button class="${on === 'lista' ? 'on' : ''}" data-act="go" data-h="#/v/${S.vid}">${ICON.ext}Extintores</button><button class="${on === 'rep' ? 'on' : ''}" data-act="go" data-h="#/v/${S.vid}/reporte">${ICON.rep}Reporte</button></nav>`;

// ----- Reporte de la visita (técnico) -----
function renderReporte() {
  const v = S.visita; const c = v && cliente(v.cid); const ext = S.ext; const r = calcResumen(ext, S.rev);
  const pct = (x) => (x / Math.max(1, r.total)) * 100;
  const zonas = zonasDe(ext).map((z) => { const zl = ext.filter((e) => (e.zona || '') === z); return { z, t: zl.length, ok: zl.filter((e) => estado(S.rev[e.id]) === 'ok').length, bad: zl.filter((e) => estado(S.rev[e.id]) === 'bad').length, d: zl.filter((e) => estado(S.rev[e.id]) !== 'pend').length }; });
  const porVencer = ext.filter((e) => ['vencida', 'pronto'].includes(venc((S.rev[e.id] && S.rev[e.id].recProx) || e.recProx)));
  const fallas = ext.filter((e) => estado(S.rev[e.id]) === 'bad');
  root.innerHTML = `<div class="mob">
    ${topTec({ back: '#/', titulo: c ? c.nombre : '', sub: `<span class="muted" style="font-size:12px">Reporte · ${v ? fmtFecha(v.fecha) : ''}</span>` })}
    <div class="pad">
      <div class="card"><h3>Avance</h3>
        <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:12px">
          <div class="kpi" style="padding:10px"><span>Revisados</span><b style="font-size:22px">${r.done}</b><span style="font-weight:400">de ${r.total}</span></div>
          <div class="kpi bad" style="padding:10px"><span>Con falla</span><b style="font-size:22px">${r.bad}</b></div>
          <div class="kpi warn" style="padding:10px"><span>Por vencer</span><b style="font-size:22px">${r.pronto}</b></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">${zonas.map((z) => `<div style="display:flex;flex-direction:column;gap:4px"><div style="display:flex;justify-content:space-between;font-size:12.5px"><span style="font-weight:600">${esc(zonaCorta(z.z))}</span><span class="muted">${z.d} / ${z.t}</span></div><div class="bar" style="height:6px"><i style="width:${(z.ok / z.t) * 100}%;background:var(--ok)"></i><i style="width:${(z.bad / z.t) * 100}%;background:var(--red)"></i></div></div>`).join('')}</div>
      </div>
      <div class="card"><h3>Descargar reporte</h3><p class="muted" style="margin:0 0 10px;font-size:12.5px">Sale en el formato de la hoja 2: Paso 1 y Paso 2, con las marcas en Bueno/Malo o Sí/No.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="btn xl" data-act="xlsx" style="height:52px">⬇ Excel</button><button class="btn pri" data-act="pdf" style="height:52px">⬇ PDF</button></div></div>
      <div class="card"><h3>Recarga por vencer (${porVencer.length})</h3>${porVencer.length ? porVencer.map((e) => `<div class="feed" style="cursor:pointer" data-act="ficha" data-id="${e.id}"><span class="tm"><b>#${esc(e.n)}</b></span><span style="flex:1">${esc(e.area)}<br><span class="muted">${esc([e.marca, e.tipo, e.capacidad].join(' · '))}</span></span>${vencPill(e, S.rev[e.id])}</div>`).join('') : '<p class="muted" style="margin:0;font-size:13px">Ninguno vence este mes ni el siguiente.</p>'}</div>
      <div class="card"><h3>Hallazgos (${fallas.length})</h3>${fallas.length ? fallas.map((e) => `<div class="feed" style="cursor:pointer" data-act="ficha" data-id="${e.id}"><span class="tm"><b>#${esc(e.n)}</b></span><span style="flex:1"><b>${esc(e.area)}</b><br><span class="muted">${esc(fallasDe(S.rev[e.id]).join(' · '))}${S.rev[e.id].obs ? ' — ' + esc(S.rev[e.id].obs) : ''}</span></span><b style="color:var(--red)">Corregir ›</b></div>`).join('') : '<p class="muted" style="margin:0;font-size:13px">Sin fallas registradas.</p>'}</div>
      ${v && v.estado === 'en_curso' ? `<button class="btn" data-act="terminar">Terminar visita</button>` : v ? `<p class="muted" style="text-align:center;font-size:13px">Visita terminada ${hhmm(v.cerrada)}</p>` : ''}
    </div>
    ${navTec('rep')}
  </div>`;
}

/* ======================= 5) Ficha de inspección ======================= */
let ed = null; // { eid, c:{}, obs, recAnt, recProx, ph, prevMalo }
const extDe = (eid) => S.ext.find((e) => e.id === eid);
function abrirFicha(eid) {
  const e = extDe(eid); if (!e) return; const r = S.rev[eid];
  ed = { eid, c: r ? { ...r.c } : {}, obs: r ? r.obs || '' : '', recAnt: (r && r.recAnt) || e.recAnt || '', recProx: (r && r.recProx) || e.recProx || '', ph: (r && r.ph) || e.ph || '', prevMalo: estado(r) === 'bad', aviso: '' };
  $('shN').textContent = '#' + (e.n ?? ''); $('shArea').textContent = e.area || '(sin área)'; $('shZona').textContent = e.zona || '';
  pintarFicha(); $('scrim').classList.add('on'); $('sheet').classList.add('on'); $('shBody').scrollTop = 0;
}
function cerrarFicha() { ed = null; $('scrim').classList.remove('on'); $('sheet').classList.remove('on'); }
function pintarFicha() {
  if (!ed) return; const e = extDe(ed.eid); const r = S.rev[ed.eid];
  const vv = venc(ed.recProx);
  const antes = r ? (estado(r) === 'bad' ? 'con falla: ' + fallasDe(r).join(', ') : estado(r) === 'ok' ? 'todo bien' : 'incompleto') : '';
  const otro = r && r.uid && r.uid !== Cloud.uid();
  $('shBody').innerHTML = `
    <div class="idg">
      <div><span>MARCA</span><b>${esc(e.marca || '—')}</b></div><div><span>TIPO</span><b>${esc(e.tipo || '—')}</b></div><div><span>CAPACIDAD</span><b>${esc(e.capacidad || '—')}</b></div>
      <div><span>SERIE</span><b>${esc(e.serie || '—')}</b></div><div><span>N° EXTINTOR</span><b>${esc(e.numero || '—')}</b></div>
      <div><span>PRÓX. RECARGA</span><b style="color:${vv === 'vencida' ? 'var(--red)' : vv === 'pronto' ? 'var(--warn)' : vv === 'ok' ? 'var(--ok)' : 'inherit'}">${esc(ed.recProx || '—')}</b></div>
    </div>
    ${ed.aviso ? `<div class="editbar warn">${ed.aviso}</div>` : r ? `<div class="editbar"><b>${otro ? 'Ya lo revisó ' + esc(r.by) : 'Ya revisado'}</b> (${hhmm(r.t)}): ${esc(antes)}${r.obs ? ' — “' + esc(r.obs) + '”' : ''}.${otro ? ' Solo cámbielo si encontró algo distinto.' : ''}</div>` : ''}
    <button class="allok" data-act="todoBien">${ed.prevMalo ? '✓ Cambiar a todo bien' : '✓ Todo bien · Guardar'}</button>
    <div class="lbl">Verificar estado</div>
    <div>${CRIT.map((c) => `<div class="crit ${c.wide ? 'wide' : ''}"><span class="l">${c.l}</span><div class="seg">${c.o.map(([v, l]) => `<button data-act="crit" data-k="${c.k}" data-v="${v}" class="${ed.c[c.k] === v ? (v === c.good ? 'g' : 'b') : ''}">${l}</button>`).join('')}</div></div>`).join('')}</div>
    <div class="dates">
      <div style="display:flex;justify-content:space-between;align-items:baseline"><span class="lbl">Fechas</span><span class="muted" style="font-size:11.5px">${r ? '' : 'Vienen de la inspección pasada'}</span></div>
      <div class="g3">
        <label class="field">Recarga anterior<input id="fRA" inputmode="numeric" placeholder="MM/AAAA" value="${esc(ed.recAnt)}"></label>
        <label class="field">Próxima recarga<input id="fRP" inputmode="numeric" placeholder="MM/AAAA" value="${esc(ed.recProx)}"></label>
        <label class="field">PH (año)<input id="fPH" inputmode="numeric" placeholder="AAAA" value="${esc(ed.ph)}"></label>
      </div>
      <button class="btn sm" data-act="recargaHoy" style="border:1.5px dashed var(--red);color:var(--red)">Se recargó hoy · actualizar fechas</button>
    </div>
    <div class="lbl">Observaciones</div>
    <div class="qc">${QUICK.map((q) => `<button data-act="qobs" data-q="${esc(q)}" class="${ed.obs.split(';').map((x) => x.trim()).includes(q) ? 'on' : ''}">${esc(q)}</button>`).join('')}</div>
    <label><span class="sr">Observaciones</span><textarea class="obs" id="fObs" placeholder="Hallazgos, cambios, recargas…">${esc(ed.obs)}</textarea></label>
    <div class="hint" id="fHint"></div>`;
  const mmaa = (inp, k) => { inp.oninput = () => { let v = inp.value.replace(/[^\d]/g, '').slice(0, 6); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); inp.value = v; ed[k] = v; }; };
  mmaa($('fRA'), 'recAnt'); mmaa($('fRP'), 'recProx');
  $('fPH').oninput = (ev) => { ev.target.value = ev.target.value.replace(/[^\d]/g, '').slice(0, 4); ed.ph = ev.target.value; };
  $('fObs').oninput = (ev) => { ed.obs = ev.target.value; };
}
function avisoOtro(r) { if (!ed) return; ed.aviso = `<b>${esc(r.by || 'Otro técnico')} acaba de guardar este extintor</b> (${estado(r) === 'bad' ? 'con falla' : 'todo bien'}). Si guarda, se reemplaza con lo suyo. <button class="linkb" data-act="ficha" data-id="${ed.eid}">Ver lo que guardó</button>`; pintarFicha(); }

function guardarFicha({ cerrar = true } = {}) {
  if (!ed) return false;
  const vacio = CRIT.every((c) => !ed.c[c.k]) && !ed.obs.trim();
  const e = extDe(ed.eid);
  if (vacio) { if (cerrar) cerrarFicha(); return false; }
  for (const k of ['recAnt', 'recProx']) if (ed[k] && !/^\d{2}\/\d{4}$/.test(ed[k])) { $('fHint').textContent = 'Las fechas van como MM/AAAA, por ejemplo 03/2027.'; return false; }
  const prev = S.rev[ed.eid] ? JSON.parse(JSON.stringify(S.rev[ed.eid])) : null; const eid = ed.eid;
  const rec = { eid, c: ed.c, obs: ed.obs.trim(), recAnt: ed.recAnt, recProx: ed.recProx, ph: ed.ph, t: Date.now(), by: yo(), uid: Cloud.uid() };
  S.rev[eid] = rec; Cloud.saveRevision(S.vid, eid, rec).catch(cloudError);
  if (e && (e.recAnt !== rec.recAnt || e.recProx !== rec.recProx || e.ph !== rec.ph)) Cloud.saveExtintor(S.cid, eid, { recAnt: rec.recAnt, recProx: rec.recProx, ph: rec.ph }).catch(cloudError);
  const s = estado(rec);
  guardarResumen(`${yo().split(' ')[0]} ${s === 'bad' ? 'marcó con falla' : 'revisó'} #${e ? e.n : ''} ${e ? e.area : ''}${s === 'bad' ? ' · ' + fallasDe(rec).join(', ') : ' · todo bien'}`);
  toast(`#${e ? e.n : ''} guardado`, () => { if (prev) { S.rev[eid] = prev; Cloud.saveRevision(S.vid, eid, prev); } else { delete S.rev[eid]; Cloud.saveRevision(S.vid, eid, null); } guardarResumen(); redraw(); });
  if (cerrar) cerrarFicha();
  afterSave(); return true;
}
function afterSave() { if (ui.q) { ui.q = ''; route(); const q = $('q'); if (q) q.focus(); } else route(); }
function okRapido(eid) {
  const e = extDe(eid); if (!e) return;
  const c = Object.fromEntries(CRIT.map((x) => [x.k, x.good]));
  ed = { eid, c, obs: '', recAnt: e.recAnt || '', recProx: e.recProx || '', ph: e.ph || '' };
  guardarFicha({ cerrar: true });
}
$('scrim').onclick = cerrarFicha; $('shX').onclick = cerrarFicha;
$('shGuardar').onclick = () => guardarFicha();
$('shBorrar').onclick = async () => {
  if (!ed || !S.rev[ed.eid]) { cerrarFicha(); return; }
  if (!(await ask('Borrar revisión', 'Se quitarán las marcas y observaciones de este extintor en esta visita.', 'Borrar'))) return;
  const eid = ed.eid; delete S.rev[eid]; Cloud.saveRevision(S.vid, eid, null).catch(cloudError); guardarResumen(); cerrarFicha(); route();
};
$('shSig').onclick = () => {
  if (!ed) return; const eid = ed.eid; const vacio = CRIT.every((c) => !ed.c[c.k]) && !ed.obs.trim();
  if (!vacio && !guardarFicha({ cerrar: false })) return;
  const list = ui.zona ? S.ext.filter((e) => (e.zona || '') === ui.zona) : S.ext; const i = list.findIndex((e) => e.id === eid);
  const sig = list.slice(i + 1).find((e) => estado(S.rev[e.id]) === 'pend');
  if (sig) abrirFicha(sig.id); else { cerrarFicha(); toast('No hay más pendientes después de este'); }
};
$('shEditar').onclick = () => { if (ed) formExtintor(ed.eid); };

// ----- Datos del extintor (agregar nuevo o corregir) -----
async function formExtintor(eid, sugerencia = '') {
  const e = eid ? extDe(eid) : null; const zonas = zonasDe(S.ext).filter(Boolean);
  const marcas = [...new Set(S.ext.map((x) => (x.marca || '').trim()).filter(Boolean))];
  const nextN = S.ext.reduce((m, x) => Math.max(m, +x.n || 0), 0) + 1;
  const zonaDef = e ? e.zona : (ui.zona || zonas[0] || '');
  const html = `
    <label class="field">Zona<input id="xZ" list="xZl" value="${esc(zonaDef)}" placeholder="ZONA #1"><datalist id="xZl">${zonas.map((z) => `<option value="${esc(z)}">`).join('')}</datalist></label>
    <label class="field">Área donde está ubicado<input id="xA" value="${esc(e ? e.area : sugerencia)}" placeholder="Bodega de mantenimiento"></label>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <label class="field">Marca<input id="xM" list="xMl" value="${esc(e ? e.marca : '')}"><datalist id="xMl">${marcas.map((m) => `<option value="${esc(m)}">`).join('')}</datalist></label>
      <label class="field">Tipo<select id="xT">${TIPOS.map((t) => `<option ${e && e.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <label class="field">Capacidad<input id="xC" value="${esc(e ? e.capacidad : '')}" placeholder="10"></label>
      <label class="field">Serie<input id="xS" value="${esc(e ? e.serie : '')}" placeholder="S/S"></label>
      <label class="field">Número del extintor<input id="xN" value="${esc(e ? e.numero : '')}"></label>
      <label class="field">N° en la lista<input id="xO" inputmode="numeric" value="${esc(e ? e.n : nextN)}"></label>
    </div>
    ${e ? '<button class="btn sm ghost" id="xBaja" style="color:var(--red);width:auto">Quitar de la lista (ya no existe)</button>' : ''}`;
  const p = ask(e ? `Datos del extintor #${e.n}` : 'Agregar extintor', e ? 'Corrija lo que haya cambiado (por ejemplo, si lo sustituyeron o lo movieron de área).' : 'Queda guardado en este proyecto para las próximas visitas.', e ? 'Guardar' : 'Agregar y revisar', html);
  let baja = false; const bb = $('xBaja'); if (bb) bb.onclick = async () => { baja = true; $('dlgSi').click(); };
  if (!(await p)) return;
  if (baja) {
    if (!(await ask('Quitar extintor', `¿Quitar el #${e.n} ${e.area} de la lista? Ya no aparecerá en las próximas visitas.`, 'Quitar'))) return;
    Cloud.saveExtintor(S.cid, eid, { baja: true, bajaT: Date.now() }).catch(cloudError); cerrarFicha(); toast(`#${e.n} quitado`); return;
  }
  const d = { zona: $('xZ').value.trim(), area: $('xA').value.trim().replace(/\s+/g, ' '), marca: $('xM').value.trim(), tipo: $('xT').value, capacidad: $('xC').value.trim(), serie: $('xS').value.trim(), numero: $('xN').value.trim(), n: +$('xO').value || nextN };
  if (!d.area) { toast('Escriba el área del extintor'); return formExtintor(eid, sugerencia); }
  if (e) { Cloud.saveExtintor(S.cid, eid, d).catch(cloudError); Object.assign(e, d); if (ed && ed.eid === eid) { $('shArea').textContent = d.area; $('shZona').textContent = d.zona; pintarFicha(); } toast('Datos actualizados'); route(); return; }
  const id = Cloud.nuevoIdExtintor(S.cid);
  const nuevo = { ...d, recAnt: '', recProx: '', ph: '', nuevo: true, creado: Date.now(), creadoPor: yo() };
  Cloud.saveExtintor(S.cid, id, nuevo).catch(cloudError);
  S.ext = S.ext.concat([{ id, ...nuevo }]).sort((a, b) => (a.n || 0) - (b.n || 0));
  ui.q = ''; ui.filtro = 'all'; guardarResumen(`${yo().split(' ')[0]} agregó el extintor #${d.n} en ${d.area}`); route(); abrirFicha(id);
}

/* ======================= 6) Administrador ======================= */
function headAdm(on) {
  return `<header class="ah"><div class="in">
    <div class="l"><img src="${LOGO}" alt="SOS FIRE"><span class="tag">ADMINISTRADOR</span></div>
    <nav class="anav"><button class="${on === 'p' ? 'on' : ''}" data-act="go" data-h="#/">Proyectos</button><button class="${on === 't' ? 'on' : ''}" data-act="go" data-h="#/a/tecnicos">Técnicos</button><button data-act="go" data-h="#/t">Vista del técnico</button></nav>
    <div class="inline">${netPill()}<span class="muted" style="font-size:13px">${esc(yo())}</span><button class="btn sm ghost" data-act="salir">Salir</button></div>
  </div></header>`;
}
const tecChips = (v) => {
  const l = Object.entries((v && v.tecnicos) || {}).sort((a, b) => (b[1].visto || 0) - (a[1].visto || 0));
  return l.length ? l.map(([u, t]) => `<span class="chipT">${avatar(t.nombre, u)}${esc(t.nombre)}<span class="dot" style="background:${online(t.visto) ? 'var(--ok)' : '#C9C9C9'}" title="${online(t.visto) ? 'En línea' : 'Desconectado'}"></span></span>`).join('') : '<span class="muted" style="font-size:13px">Nadie ha entrado todavía</span>';
};
const barRes = (r, h = 10) => (r ? `<div class="bar" style="height:${h}px"><i style="width:${(r.ok / Math.max(1, r.total)) * 100}%;background:var(--ok)"></i><i style="width:${(r.bad / Math.max(1, r.total)) * 100}%;background:var(--red)"></i></div>` : `<div class="bar" style="height:${h}px"></div>`);

function renderAHome() {
  const hoy = hoyISO();
  const tecOn = new Set(); S.activas.forEach((v) => Object.entries(v.tecnicos || {}).forEach(([u, t]) => { if (online(t.visto)) tecOn.add(u); }));
  const fallasHoy = S.mes.filter((v) => v.fecha === hoy).reduce((a, v) => a + ((v.resumen && v.resumen.bad) || 0), 0);
  const mesIds = new Set(S.mes.map((v) => v.cid));
  const fij = S.clientes.filter((c) => c.fijado).sort((a, b) => a.nombre.localeCompare(b.nombre));
  const mes = S.clientes.filter((c) => !c.fijado && (mesIds.has(c.id) || (c.creado || 0) >= inicioMes())).sort((a, b) => ((b.ultimaVisita || {}).t || b.creado || 0) - ((a.ultimaVisita || {}).t || a.creado || 0));
  const q = norm(ui.hq);
  const arch = S.clientes.filter((c) => !c.fijado && !mes.includes(c))
    .filter((c) => !q || q.split(' ').every((t) => norm(`${c.nombre} ${c.lugar}`).includes(t)))
    .filter((c) => !ui.hmes || ((c.ultimaVisita && c.ultimaVisita.fecha) || '').startsWith(ui.hmes))
    .sort((a, b) => ((b.ultimaVisita || {}).t || 0) - ((a.ultimaVisita || {}).t || 0));
  const meses = [...new Set(S.clientes.filter((c) => !c.fijado && !mes.includes(c) && c.ultimaVisita).map((c) => c.ultimaVisita.fecha.slice(0, 7)))].sort().reverse();
  const cardFijado = (c) => {
    const v = visitaAbiertaDe(c.id); const ult = v || visitasMesDe(c.id)[0]; const r = ult && ult.resumen;
    return `<button class="acard" data-act="go" data-h="#/a/c/${c.id}">
      <div class="h"><div><div class="n">${esc(c.nombre)}</div><div class="d">${r ? r.total + ' extintores · ' : ''}${esc(frecTxt(c))}${c.lugar && c.lugar !== c.nombre ? ' · ' + esc(c.lugar) : ''}</div></div>
        ${v ? '<span class="pill ok">En curso</span>' : c.frecuencia === 'semanal' ? `<span class="pill pend">Próxima: ${DIAS[c.dia]}</span>` : '<span class="pill pend">Sin visita hoy</span>'}</div>
      <div style="display:flex;flex-direction:column;gap:6px"><div style="display:flex;justify-content:space-between;font-size:13px"><b>${v ? 'Avance de hoy' : ult ? 'Última visita · ' + fmtFecha(ult.fecha).slice(0, 5) : 'Sin visitas este mes'}</b><b>${r ? `${r.done} / ${r.total} · ${Math.round((r.done / Math.max(1, r.total)) * 100)} %` : ''}</b></div>${barRes(r)}</div>
      <div style="display:flex;flex-direction:column;gap:7px"><span style="font-size:12px;font-weight:700" class="muted">${v ? 'Técnicos en este proyecto' : 'Técnicos de la última visita'}</span><div class="inline">${tecChips(ult)}</div></div>
      ${r && (r.bad || r.pronto) ? `<div class="inline">${r.bad ? `<span class="pill bad" style="font-size:12.5px;padding:4px 10px">${r.bad} con falla</span>` : ''}${r.pronto ? `<span class="pill warn" style="font-size:12.5px;padding:4px 10px">${r.pronto} recargas por vencer</span>` : ''}</div>` : ''}
      <div class="f"><span>${ult && ult.ultimaAct ? esc(ult.ultimaAct.texto) + ' · ' + hace(ult.ultimaAct.t) : 'Sin actividad hoy'}</span><b>Ver ›</b></div>
    </button>`;
  };
  const filaMes = (c) => {
    const v = visitaAbiertaDe(c.id) || visitasMesDe(c.id)[0]; const r = v && v.resumen;
    const quien = v ? Object.values(v.tecnicos || {}).map((t) => t.nombre.split(' ')[0]).join(', ') : '';
    return `<div class="mrow"><div class="i" data-act="go" data-h="#/a/c/${c.id}"><b>${esc(c.nombre)}${c.lugar ? ' · ' + esc(c.lugar) : ''}</b><span>Creado por ${esc(c.creadoPor || 'el administrador')} · ${c.creado ? new Date(c.creado).toLocaleDateString('es') : ''}</span></div>
      <div class="p"><span>${r ? `${r.done} / ${r.total} · ${Math.round((r.done / Math.max(1, r.total)) * 100)} %` : 'Sin revisiones'}</span>${barRes(r, 8)}</div>
      <span style="flex:none;font-size:13px;font-weight:700">${esc(quien || '—')}</span>
      ${v && v.estado === 'en_curso' ? '<span class="pill ok">En curso</span>' : '<span class="pill pend">Terminado</span>'}
      <button class="btn sm" data-act="fijar" data-id="${c.id}">Fijar</button></div>`;
  };
  root.innerHTML = `<div class="adm">${headAdm('p')}<main class="am">
    <div class="sech"><div><h1>Proyectos</h1><div class="sub">Los técnicos también pueden crear proyectos desde el teléfono. Aquí aparecen al instante.</div></div><button class="btn pri" data-act="go" data-h="#/nuevo">+ Nuevo proyecto</button></div>
    <div class="kpis">
      <div class="kpi"><span>En curso hoy</span><b>${S.activas.length}</b></div>
      <div class="kpi"><span>Técnicos en campo</span><b>${tecOn.size}</b></div>
      <div class="kpi"><span>Proyectos este mes</span><b>${new Set([...mesIds, ...mes.map((c) => c.id)]).size}</b></div>
      <div class="kpi bad"><span>Fallas encontradas hoy</span><b>${fallasHoy}</b></div>
    </div>
    ${!S.clientes.length ? `<div class="box"><h2>Empecemos</h2><p class="sub" style="margin:0">Cargue Decameron Salinitas con sus ${DECAMERON.extintores.length} extintores de la hoja 2, o cree un proyecto nuevo.</p><div class="inline"><button class="btn pri" data-act="cargarDecameron">Cargar Decameron Salinitas</button><button class="btn" data-act="go" data-h="#/nuevo">Crear otro proyecto</button></div></div>` : ''}
    ${fij.length ? `<section class="sec"><div class="sech"><div class="t">${ICON.pin}<h2>Fijados</h2><span class="sub">· clientes de visita frecuente, siempre arriba</span></div></div><div class="grid2">${fij.map(cardFijado).join('')}</div></section>` : ''}
    <section class="sec"><div class="sech"><div class="t"><h2>Este mes · ${MESES[new Date().getMonth()]}</h2><span class="sub">· proyectos con visitas en el mes; el 1.º del próximo mes pasan al archivo</span></div></div>
      <div class="tbl" style="overflow:hidden">${mes.length ? mes.map(filaMes).join('') : '<div class="mrow"><span class="muted">Todavía no hay otros proyectos este mes.</span></div>'}</div></section>
    <section class="sec"><div class="sech"><div class="t"><h2>Archivo</h2><span class="sub">· todos los proyectos anteriores</span></div>
        <div class="inline"><label class="searchA">${ICON.search}<input id="aq" placeholder="Buscar cliente o lugar" value="${esc(ui.hq)}"></label>
        <select class="sm" id="ames" aria-label="Mes"><option value="">Todos los meses</option>${meses.map((m) => `<option value="${m}" ${ui.hmes === m ? 'selected' : ''}>${MESES[+m.slice(5) - 1]} ${m.slice(0, 4)}</option>`).join('')}</select></div></div>
      <div class="tbl"><table><thead><tr><th>Proyecto</th><th>Última visita</th><th>Frecuencia</th><th>Creado por</th><th style="text-align:right;padding-right:18px">Acciones</th></tr></thead><tbody>
        ${arch.length ? arch.map((c) => `<tr><td><b>${esc(c.nombre)}</b>${c.lugar ? ' · ' + esc(c.lugar) : ''}</td><td>${c.ultimaVisita ? fmtFecha(c.ultimaVisita.fecha) : '—'}</td><td>${esc(frecTxt(c))}</td><td>${esc(c.creadoPor || '—')}</td><td style="text-align:right;padding-right:18px;white-space:nowrap"><button class="lnk" data-act="go" data-h="#/a/c/${c.id}">Ver</button> · <button class="lnk" data-act="fijar" data-id="${c.id}">Fijar</button></td></tr>`).join('') : `<tr><td colspan="5" class="muted">${q || ui.hmes ? 'No hay proyectos con ese filtro.' : 'El archivo está vacío.'}</td></tr>`}
      </tbody></table></div></section>
    <div class="box" style="flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:space-between"><div><h2>Reportes guardados</h2><div class="sub">Las visitas terminadas se borran solas después de este plazo (los clientes y sus extintores no se borran).</div></div>
      <select class="sm" id="aret">${[2, 3, 6, 12, 24].map((m) => `<option value="${m}" ${(S.config.retencionMeses || 6) === m ? 'selected' : ''}>Guardar ${m} meses</option>`).join('')}</select></div>
  </main></div>`;
  const aq = $('aq'); aq.oninput = () => { ui.hq = aq.value; const p = aq.selectionStart; renderAHome(); const n = $('aq'); n.focus(); n.setSelectionRange(p, p); };
  $('ames').onchange = (e) => { ui.hmes = e.target.value; renderAHome(); };
  $('aret').onchange = async (e) => { const m = +e.target.value; if (!(await ask('Cambiar plazo', `Las visitas terminadas con más de ${m} meses se borrarán. Descargue antes los reportes que quiera conservar.`, 'Cambiar'))) { e.target.value = S.config.retencionMeses || 6; return; } Cloud.saveConfig({ retencionMeses: m }).then(limpiarViejas).catch(cloudError); };
}
async function limpiarViejas() {
  if (!esAdmin()) return;
  try {
    const meses = S.config.retencionMeses || 6; const lim = Date.now() - meses * 30.44 * 864e5; let n = 0;
    for (const v of await Cloud.todasLasVisitas()) if (v.estado === 'terminada' && (v.cerrada || v.creada || 0) < lim) { await Cloud.borrarVisita(v.id); n++; }
    if (n) toast(`${n} visita(s) con más de ${meses} meses se borraron`);
  } catch (e) { console.error(e); }
}

// ----- Detalle del cliente / visita -----
function salirACliente() { if (!S.aCid) return; stopAll('a'); if (U.a._rev) U.a._rev(); U.a._rev = null; S.aCid = S.aVid = null; S.aVisitas = []; S.aExt = []; S.aRev = {}; }
function verVisitaAdm(vid) {
  if (S.aVid === vid) return; S.aVid = vid; S.aRev = {}; if (U.a._rev) U.a._rev();
  U.a._rev = vid ? Cloud.watchRevisiones(vid, (l) => { S.aRev = {}; for (const r of l) S.aRev[r.eid || r.id] = r; redraw(); }, cloudError) : null;
}
function renderACliente(cid) {
  if (S.aCid !== cid) {
    salirACliente(); S.aCid = cid;
    U.a.push(Cloud.watchVisitasCliente(cid, (l) => { S.aVisitas = l.sort((a, b) => b.creada - a.creada); if (!S.aVid || !l.find((v) => v.id === S.aVid)) verVisitaAdm((l.find((v) => v.estado === 'en_curso') || l[0] || {}).id || null); redraw(); }, cloudError));
    U.a.push(Cloud.watchExtintores(cid, (l) => { S.aExt = l.filter((e) => !e.baja).sort((a, b) => (a.n || 0) - (b.n || 0)); redraw(); }, cloudError));
  }
  const c = cliente(cid); const v = S.aVisitas.find((x) => x.id === S.aVid); const ext = S.aExt; const rev = S.aRev;
  if (!c) { root.innerHTML = `<div class="adm">${headAdm('p')}<main class="am"><p class="muted">Cargando proyecto…</p></main></div>`; return; }
  const r = calcResumen(ext, rev);
  const zonas = zonasDe(ext).map((z) => { const zl = ext.filter((e) => (e.zona || '') === z); return { z, t: zl.length, ok: zl.filter((e) => estado(rev[e.id]) === 'ok').length, bad: zl.filter((e) => estado(rev[e.id]) === 'bad').length, d: zl.filter((e) => estado(rev[e.id]) !== 'pend').length }; });
  const porTec = {}; Object.values(rev).forEach((x) => { porTec[x.uid] = (porTec[x.uid] || 0) + 1; });
  const feed = Object.values(rev).sort((a, b) => b.t - a.t).slice(0, 8);
  const hall = ext.filter((e) => estado(rev[e.id]) === 'bad').map((e) => ({ e, tipo: 'Falla', det: fallasDe(rev[e.id]).join(', ') + (rev[e.id].obs ? ' — ' + rev[e.id].obs : ''), by: rev[e.id].by }))
    .concat(ext.filter((e) => ['vencida', 'pronto'].includes(venc((rev[e.id] && rev[e.id].recProx) || e.recProx))).map((e) => { const p = (rev[e.id] && rev[e.id].recProx) || e.recProx; return { e, tipo: venc(p) === 'vencida' ? 'Vencida' : 'Por vencer', det: 'Recarga ' + p, by: '' }; }));
  root.innerHTML = `<div class="adm">${headAdm('p')}<main class="am">
    <button class="lnk" data-act="go" data-h="#/" style="align-self:flex-start;color:var(--muted)">‹ Todos los proyectos</button>
    <div class="sech"><div><h1>${esc(c.nombre)}${c.lugar && c.lugar !== c.nombre ? ' · ' + esc(c.lugar) : ''}</h1>
        <div class="sub">${ext.length} extintores · ${esc(frecTxt(c))}${c.fijado ? ' · fijado' : ''}</div></div>
      <div class="inline">
        ${S.aVisitas.length ? `<select class="sm" id="selV" aria-label="Visita">${S.aVisitas.map((x) => `<option value="${x.id}" ${x.id === S.aVid ? 'selected' : ''}>Visita ${fmtFecha(x.fecha)}${x.estado === 'en_curso' ? ' (en curso)' : ''}</option>`).join('')}</select>` : ''}
        ${v ? `<button class="btn" data-act="go" data-h="#/v/${v.id}">Ver como técnico</button><button class="btn xl" data-act="xlsxA">⬇ Excel</button><button class="btn pri" data-act="pdfA">⬇ PDF</button>` : `<button class="btn pri" data-act="nuevaVisitaA">Iniciar visita de hoy</button>`}
      </div></div>
    ${v ? `<div class="kpis">
      <div class="kpi"><span>Avance</span><b>${Math.round((r.done / Math.max(1, r.total)) * 100)} %</b>${barRes(r, 8)}</div>
      <div class="kpi"><span>Revisados</span><b>${r.done} <span style="font-size:16px;color:var(--muted)">/ ${r.total}</span></b></div>
      <div class="kpi"><span>Pendientes</span><b>${r.total - r.done}</b></div>
      <div class="kpi bad"><span>Con falla</span><b>${r.bad}</b></div>
      <div class="kpi warn"><span>Recarga por vencer</span><b>${r.pronto}</b></div></div>
    <div class="cols"><div class="main"><div class="box"><h2>Avance por zona</h2><div class="zgrid">${zonas.map((z) => `<span style="font-weight:600">${esc(zonaCorta(z.z))}</span><div class="bar"><i style="width:${(z.ok / z.t) * 100}%;background:var(--ok)"></i><i style="width:${(z.bad / z.t) * 100}%;background:var(--red)"></i></div><b style="${z.d ? '' : 'color:var(--muted)'}">${z.d} / ${z.t}</b>`).join('') || '<span class="muted">Sin extintores todavía.</span>'}</div></div></div>
      <div class="side">
        <div class="box"><h2>Técnicos ${v.estado === 'en_curso' ? 'en campo' : 'de la visita'}</h2>${Object.entries(v.tecnicos || {}).map(([u, t]) => `<div class="trow">${avatar(t.nombre, u)}<div class="i"><b>${esc(t.nombre)}</b><span>${porTec[u] || 0} revisados</span></div><span class="pill ${online(t.visto) ? 'ok' : 'pend'}">${online(t.visto) ? 'En línea' : 'Desconectado'}</span></div>`).join('') || '<span class="muted">Nadie ha entrado todavía.</span>'}</div>
        <div class="box"><h2>Actividad ${v.estado === 'en_curso' ? 'en vivo' : ''}</h2>${feed.map((x) => { const e = ext.find((y) => y.id === x.eid); const s = estado(x); return `<div class="feed"><span class="tm">${new Date(x.t).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</span><span><b>${esc((x.by || '').split(' ')[0])}</b> ${s === 'bad' ? 'marcó con falla' : 'revisó'} <b>#${esc(e ? e.n : '')}</b> ${esc(e ? e.area : '')}${s === 'bad' ? ' · ' + esc(fallasDe(x).join(', ')) : ' · ✓ todo bien'}</span></div>`; }).join('') || '<span class="muted">Sin revisiones todavía.</span>'}</div>
      </div></div>
    <div class="sec"><h2>Hallazgos y vencimientos (${hall.length})</h2><div class="tbl"><table><thead><tr><th>N°</th><th>Área</th><th>Extintor</th><th>Problema</th><th>Técnico</th></tr></thead><tbody>
      ${hall.map((h) => `<tr><td><b>${esc(h.e.n)}</b></td><td>${esc(h.e.area)}</td><td>${esc([h.e.marca, h.e.tipo, h.e.capacidad].filter(Boolean).join(' · '))}</td><td><span class="pill ${h.tipo === 'Falla' || h.tipo === 'Vencida' ? 'bad' : 'warn'}">${h.tipo}</span> ${esc(h.det)}</td><td>${esc((h.by || '—').split(' ')[0])}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">Sin hallazgos ni vencimientos.</td></tr>'}
    </tbody></table></div></div>` : `<div class="box"><p class="muted" style="margin:0">Este proyecto no tiene visitas todavía.</p></div>`}
    <div class="cols"><div class="main"><div class="sec"><h2>Historial de visitas</h2><div class="tbl"><table><thead><tr><th>Fecha</th><th>Técnicos</th><th>Resultado</th><th>Estado</th><th style="text-align:right;padding-right:18px">Reporte</th></tr></thead><tbody>
      ${S.aVisitas.map((x) => `<tr><td><b>${fmtFecha(x.fecha)}</b></td><td>${esc(Object.values(x.tecnicos || {}).map((t) => t.nombre.split(' ')[0]).join(', ') || '—')}</td><td>${x.resumen ? `${x.resumen.done}/${x.resumen.total} · ${x.resumen.bad} con falla` : '—'}</td><td>${x.estado === 'en_curso' ? '<span class="pill ok">En curso</span>' : '<span class="pill pend">Terminada</span>'}</td><td style="text-align:right;padding-right:18px;white-space:nowrap"><button class="lnk" data-act="selV" data-id="${x.id}">Ver</button> · <button class="lnk" data-act="xlsxV" data-id="${x.id}">Excel</button> · <button class="lnk" data-act="pdfV" data-id="${x.id}">PDF</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted">Sin visitas.</td></tr>'}
    </tbody></table></div></div></div>
    <div class="side"><div class="box"><h2>Datos del proyecto</h2>
      <label class="field">Cliente<input id="cN" value="${esc(c.nombre)}"></label>
      <label class="field">Lugar o sede<input id="cL" value="${esc(c.lugar || '')}"></label>
      <label class="field">Frecuencia<select id="cF">${[['unica', 'Una vez'], ['mensual', 'Mensual'], ['semanal', 'Semanal']].map(([k, l]) => `<option value="${k}" ${c.frecuencia === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      ${c.frecuencia === 'semanal' ? `<label class="field">Día de visita<select id="cD">${DIAS.map((d, i) => `<option value="${i}" ${+c.dia === i ? 'selected' : ''}>${d}</option>`).join('')}</select></label>` : ''}
      <div class="inline"><button class="btn sm pri" data-act="guardarCliente">Guardar</button><button class="btn sm" data-act="fijar" data-id="${c.id}">${c.fijado ? 'Quitar de fijados' : 'Fijar arriba'}</button>
      ${v && v.estado === 'en_curso' ? '<button class="btn sm" data-act="terminarA">Terminar visita</button>' : v ? '<button class="btn sm" data-act="reabrirA">Reabrir visita</button>' : ''}</div>
    </div></div></div>
  </main></div>`;
  if ($('selV')) $('selV').onchange = (e) => { verVisitaAdm(e.target.value); redraw(); };
}

// ----- Técnicos -----
function renderATecnicos() {
  const enVisita = (u) => S.activas.find((v) => v.tecnicos && v.tecnicos[u] && online(v.tecnicos[u].visto));
  const visMes = (u) => S.mes.filter((v) => v.tecnicos && v.tecnicos[u]).length;
  const us = S.usuarios.slice().sort((a, b) => (b.activo - a.activo) || a.nombre.localeCompare(b.nombre));
  root.innerHTML = `<div class="adm">${headAdm('t')}<main class="am"><div class="cols">
    <section class="main"><div><h1>Técnicos</h1><div class="sub">Se registran una sola vez. Con su usuario pueden entrar a cualquier proyecto y crear proyectos nuevos.</div></div>
      <div class="tbl"><table><thead><tr><th>Persona</th><th>Ahora</th><th>Visitas este mes</th><th>Rol</th><th style="text-align:right;padding-right:18px">Acceso</th></tr></thead><tbody>
      ${us.map((u) => { const v = enVisita(u.id); return `<tr><td><div class="trow">${avatar(u.nombre, u.id)}<div class="i"><b>${esc(u.nombre)}</b><span>${esc(u.usuario || u.email || '')}</span></div></div></td>
        <td>${v ? `<span class="pill ok">${esc(v.cliente)}</span>` : '<span class="muted">—</span>'}</td><td><b>${visMes(u.id)}</b></td><td>${u.rol === 'admin' ? 'Administrador' : 'Técnico'}</td>
        <td style="text-align:right;padding-right:18px">${u.id === Cloud.uid() ? '<span class="muted">Usted</span>' : `<button class="btn sm ${u.activo ? '' : 'pri'}" data-act="acceso" data-id="${u.id}">${u.activo ? 'Quitar acceso' : 'Dar acceso'}</button>`}</td></tr>`; }).join('') || '<tr><td colspan="5" class="muted">Todavía no hay técnicos.</td></tr>'}
      </tbody></table></div></section>
    <section class="side"><div class="box"><h2>Agregar técnico</h2>
      <label class="field">Nombre completo<input id="tN" placeholder="Jorge Ramírez"></label>
      <label class="field">Usuario (para entrar)<input id="tU" placeholder="jorge" autocapitalize="off"></label>
      <label class="field">Contraseña inicial<input id="tP" value="SOS-${Math.floor(1000 + Math.random() * 9000)}"></label>
      <label class="field">Rol<select id="tR"><option value="tecnico">Técnico</option><option value="admin">Administrador</option></select></label>
      <span class="muted" style="font-size:12.5px">La app le pide cambiar la contraseña la primera vez que entra.</span>
      <button class="btn pri" data-act="crearTec">Crear</button><div class="err" id="tErr"></div>
      <div class="muted" style="border-top:1px solid var(--line);padding-top:10px;font-size:13px">Si alguien deja la empresa, se le quita el acceso con un clic. Sus revisiones quedan en los reportes.</div>
    </div></section></div></main></div>`;
}

/* ======================= 7) Excel (hoja 2) y PDF ======================= */
function b64ToBuf(b64) { const s = atob(b64); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; }
const nombreArchivo = (c, v, ext) => `Extintores_${String(c.nombre).replace(/[^\wÁÉÍÓÚáéíóúñÑ]+/g, '_')}_${v.fecha}.${ext}`;
const tecnicosDe = (v) => Object.values((v && v.tecnicos) || {}).map((t) => t.nombre).join(', ');
// Datos de una visita cualquiera (la abierta o una del historial)
async function datosVisita(vid) {
  const v = S.aVisitas.find((x) => x.id === vid) || (S.visita && S.visita.id === vid ? S.visita : null) || S.mes.find((x) => x.id === vid);
  const c = cliente(v.cid);
  const ext = v.cid === S.cid && S.ext.length ? S.ext : v.cid === S.aCid && S.aExt.length ? S.aExt : null;
  const rev = vid === S.vid ? S.rev : vid === S.aVid ? S.aRev : Object.fromEntries((await Cloud.revisiones(vid)).map((r) => [r.eid || r.id, r]));
  return { c, v, ext: ext || S.aExt, rev };
}
// Orden del reporte: por zona (en el orden en que aparecen) y luego por N°
function ordenReporte(ext) { const z = zonasDe(ext); return ext.slice().sort((a, b) => z.indexOf(a.zona || '') - z.indexOf(b.zona || '') || (a.n || 0) - (b.n || 0)); }

async function exportXlsx({ c, v, ext, rev }) {
  const wb = new ExcelJS.Workbook(); await wb.xlsx.load(b64ToBuf(TEMPLATE_B64));
  const ws = wb.worksheets[0];
  const clone = (st) => JSON.parse(JSON.stringify(st || {}));
  const set = (addr, val) => { const cell = ws.getCell(addr); cell.style = clone(cell.style); cell.value = val; };
  // La banda con el logo de Decameron solo va en los reportes de Decameron
  if (!/decameron/i.test(c.nombre)) { ws._media = []; const img = wb.addImage({ base64: LOGO_B64, extension: 'png' }); ws.addImage(img, { tl: { col: 1.2, row: 0.3 }, ext: { width: 520, height: 160 } }); }
  set('F4', c.pais || 'El Salvador'); set('M4', c.lugar || c.nombre);
  set('I3', 'Fecha de inspección'); set('I4', fmtFecha(v.fecha)); set('T3', 'Técnico(s)'); set('T4', tecnicosDe(v));
  const proto = ws.getRow(9); const protoSt = {}; for (let col = 2; col <= 35; col++) protoSt[col] = clone(proto.getCell(col).style);
  const h = proto.height;
  const lista = ordenReporte(ext); let rn = 9;
  const red = { argb: 'FFC90012' };
  for (const e of lista) {
    const row = ws.getRow(rn); row.height = h;
    for (let col = 2; col <= 35; col++) row.getCell(col).style = clone(protoSt[col]);
    if (rn > 9) ws.mergeCells(`AF${rn}:AI${rn}`);
    const r = rev[e.id] || {}; const cc = r.c || {};
    const put = (col, val, bad) => { const cell = ws.getCell(`${col}${rn}`); cell.value = val; if (bad) cell.font = { ...clone(cell.font), color: red, bold: true }; };
    put('E', e.n); put('F', e.zona); put('G', e.area); put('H', e.marca); put('I', e.tipo); put('J', e.capacidad); put('K', e.serie); put('L', e.numero);
    if (cc.presion) put('M', optLabel('presion', cc.presion), cc.presion !== 'ok');
    for (const k of ['cilindro', 'instrucciones', 'senal', 'marchamo', 'manguera', 'boquilla', 'etiqueta']) {
      const cr = CK[k]; const val = cc[k]; if (!val) continue;
      const idx = cr.o.findIndex((o) => o[0] === val); put(cr.col[idx], '✓', val !== cr.good);
    }
    put('AB', r.recAnt || e.recAnt || ''); put('AC', r.recProx || e.recProx || '', ['vencida', 'pronto'].includes(venc(r.recProx || e.recProx)));
    put('AD', r.ph || e.ph || ''); if (cc.altura) put('AE', optLabel('altura', cc.altura), cc.altura !== 'ok');
    put('AF', r.obs || '');
    rn++;
  }
  ws.pageSetup = { ...ws.pageSetup, paperSize: 1, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '5:8', printArea: `B1:AI${Math.max(9, rn - 1)}`, horizontalCentered: true };
  ws.headerFooter = { oddFooter: `&L&8${c.nombre} · ${fmtFecha(v.fecha)}&R&8Página &P de &N` };
  const buf = await wb.xlsx.writeBuffer();
  descargar(nombreArchivo(c, v, 'xlsx'), new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
}

async function exportPdf({ c, v, ext, rev }) {
  const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'landscape', compress: true });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 10;
  const RED = [201, 0, 18], BLUE = [29, 78, 144], GRAY = [74, 74, 74];
  const head = () => {
    doc.addImage(LOGO, 'PNG', M, 7, 40, 15.4, 'logo', 'FAST');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...BLUE);
    doc.text('INSPECCIÓN DE EXTINTORES', W - M, 12, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(60);
    doc.text(`${c.nombre}${c.lugar && c.lugar !== c.nombre ? ' · ' + c.lugar : ''} · ${fmtFecha(v.fecha)} · Técnico(s): ${tecnicosDe(v) || '—'}`, W - M, 18, { align: 'right' });
  };
  const res = calcResumen(ext, rev); head();
  const limpia = (rows) => rows.map((r) => r.map((x) => (typeof x === 'string' ? x.replace(/₂/g, '2') : x)));
  doc.autoTable({ startY: 27, margin: { left: M, right: M }, head: [['Extintores', 'Revisados', 'Todo bien', 'Con falla', 'Pendientes', 'Recarga por vencer']],
    body: [[res.total, res.done, res.ok, res.bad, res.total - res.done, res.pronto]], headStyles: { fillColor: BLUE, halign: 'center' }, bodyStyles: { halign: 'center', fontStyle: 'bold' }, styles: { fontSize: 10 } });
  const hall = ordenReporte(ext).filter((e) => estado(rev[e.id]) === 'bad').map((e) => [e.n, zonaCorta(e.zona), e.area, [e.marca, e.tipo, e.capacidad].join(' · '), fallasDe(rev[e.id]).join(', '), rev[e.id].obs || '']);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(40); doc.text(`Hallazgos (${hall.length})`, M, doc.lastAutoTable.finalY + 9);
  doc.autoTable({ startY: doc.lastAutoTable.finalY + 12, margin: { left: M, right: M }, head: [['N°', 'Zona', 'Área', 'Extintor', 'Falla', 'Observaciones']], body: hall.length ? limpia(hall) : [['', '', 'Sin fallas registradas', '', '', '']],
    headStyles: { fillColor: RED }, styles: { fontSize: 8.5, cellPadding: 1.8 }, columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 24 }, 2: { cellWidth: 55 }, 3: { cellWidth: 38 } } });
  const pv = ordenReporte(ext).filter((e) => ['vencida', 'pronto'].includes(venc((rev[e.id] && rev[e.id].recProx) || e.recProx))).map((e) => { const p = (rev[e.id] && rev[e.id].recProx) || e.recProx; return [e.n, zonaCorta(e.zona), e.area, [e.marca, e.tipo, e.capacidad].join(' · '), p, venc(p) === 'vencida' ? 'Vencida' : 'Vence pronto']; });
  if (pv.length) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(40); doc.text(`Recarga por vencer (${pv.length})`, M, doc.lastAutoTable.finalY + 9);
    doc.autoTable({ startY: doc.lastAutoTable.finalY + 12, margin: { left: M, right: M }, head: [['N°', 'Zona', 'Área', 'Extintor', 'Próxima recarga', 'Estado']], body: limpia(pv), headStyles: { fillColor: [180, 110, 0] }, styles: { fontSize: 8.5, cellPadding: 1.8 } });
  }
  // Tabla completa con el formato de la hoja 2
  doc.addPage(); head();
  const yn = (k, val) => (val ? (CK[k].o.find((o) => o[0] === val) || [, ''])[1] : '');
  const body = ordenReporte(ext).map((e) => { const r = rev[e.id] || {}; const cc = r.c || {};
    return [e.n, zonaCorta(e.zona), e.area, e.marca, e.tipo, e.capacidad, e.serie, e.numero, yn('presion', cc.presion), yn('cilindro', cc.cilindro), yn('instrucciones', cc.instrucciones), yn('senal', cc.senal), yn('marchamo', cc.marchamo), yn('manguera', cc.manguera), yn('boquilla', cc.boquilla), yn('etiqueta', cc.etiqueta), r.recAnt || e.recAnt || '', r.recProx || e.recProx || '', r.ph || e.ph || '', yn('altura', cc.altura), r.obs || '']; });
  const keys = [null, null, null, null, null, null, null, null, 'presion', 'cilindro', 'instrucciones', 'senal', 'marchamo', 'manguera', 'boquilla', 'etiqueta', null, 'recProx', null, 'altura', null];
  doc.autoTable({ startY: 26, margin: { left: M, right: M, top: 26, bottom: 12 }, theme: 'grid',
    head: [[{ content: 'PASO 1 · DESCRIBIR EXTINTOR', colSpan: 8 }, { content: 'PASO 2 · VERIFICAR ESTADO DEL EXTINTOR', colSpan: 13 }],
      ['N°', 'Zona', 'Área', 'Marca', 'Tipo', 'Cap.', 'Serie', 'N° ext.', 'Presión', 'Cilindro', 'Instr.', 'Señal.', 'Marchamo', 'Manguera', 'Boquilla', 'Etiqueta', 'Rec. ant.', 'Próxima', 'PH', 'Altura', 'Observaciones']],
    body: limpia(body), headStyles: { fillColor: BLUE, fontSize: 6, halign: 'center', valign: 'middle', cellPadding: 1.2, lineColor: [255, 255, 255], lineWidth: 0.2 },
    styles: { fontSize: 6.8, cellPadding: 1.2, valign: 'middle', lineColor: [190, 190, 190], lineWidth: 0.15, overflow: 'linebreak' },
    columnStyles: { 0: { cellWidth: 7, halign: 'center' }, 1: { cellWidth: 14 }, 2: { cellWidth: 30 }, 3: { cellWidth: 12 }, 4: { cellWidth: 8, halign: 'center' }, 5: { cellWidth: 8, halign: 'center' }, 6: { cellWidth: 11 }, 7: { cellWidth: 10 },
      8: { cellWidth: 11.5, halign: 'center' }, 9: { cellWidth: 10.5, halign: 'center' }, 10: { cellWidth: 8, halign: 'center' }, 11: { cellWidth: 10, halign: 'center' }, 12: { cellWidth: 12, halign: 'center' }, 13: { cellWidth: 12, halign: 'center' }, 14: { cellWidth: 11, halign: 'center' }, 15: { cellWidth: 11, halign: 'center' }, 16: { cellWidth: 11, halign: 'center' }, 17: { cellWidth: 11, halign: 'center' }, 18: { cellWidth: 7.5, halign: 'center' }, 19: { cellWidth: 11.5, halign: 'center' }, 20: { cellWidth: 'auto' } },
    didParseCell: (d) => { if (d.section !== 'body') return; const k = keys[d.column.index]; if (!k) return; const e = ordenReporte(ext)[d.row.index]; const r = rev[e.id] || {};
      const bad = k === 'recProx' ? ['vencida', 'pronto'].includes(venc(d.cell.raw)) : r.c && r.c[k] && r.c[k] !== CK[k].good;
      if (bad) { d.cell.styles.textColor = RED; d.cell.styles.fontStyle = 'bold'; d.cell.styles.fillColor = [253, 236, 236]; } },
    willDrawPage: (d) => { if (d.pageNumber > 1) head(); } });
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(130); doc.text(`SOS FIRE · ${c.nombre} · ${fmtFecha(v.fecha)}`, M, H - 5); doc.text(`Página ${i} de ${n}`, W - M, H - 5, { align: 'right' }); }
  descargar(nombreArchivo(c, v, 'pdf'), doc.output('blob'));
}

/* ======================= 8) Acciones y arranque ======================= */
const ACT = {
  go: (el) => go(el.dataset.h),
  salir: async () => { if (await ask('Cerrar sesión', '¿Salir de la app en este dispositivo?', 'Salir')) { salirVisita(); stopAll('list'); await Cloud.logout(); } },
  cliente: (el) => (location.hash === '#/nuevo' && !el.closest('.sugg') ? null : entrarCliente(el.dataset.id)),
  nvF: (el) => { NV.frecuencia = el.dataset.v; renderNuevo(); },
  nvC: (el) => { NV.carga = el.dataset.v; if (NV.carga === 'excel') $('fileX').click(); else { NV.excel = null; renderNuevo(); } },
  nvCrear: () => crearProyecto(),
  zona: (el) => { ui.zona = el.dataset.z; ui.limit = 80; renderLista(); },
  filtro: (el) => { ui.filtro = el.dataset.f; ui.limit = 80; renderLista(); },
  qclr: () => { ui.q = ''; renderLista(); $('q').focus(); },
  mas: () => { ui.limit += 80; renderLista(); },
  ficha: (el) => abrirFicha(el.dataset.id),
  okRapido: (el) => okRapido(el.dataset.id),
  nuevoExt: () => formExtintor(null, ui.q),
  crit: (el) => { const { k, v } = el.dataset; ed.c[k] = ed.c[k] === v ? '' : v; ed.aviso = ''; pintarFicha(); },
  todoBien: () => {
    for (const c of CRIT) ed.c[c.k] = c.good;
    if (ed.prevMalo && ed.obs.trim()) { ed.prevMalo = false; pintarFicha(); $('fObs').style.borderColor = 'var(--warn)'; $('fHint').textContent = 'Ya quedó todo en bien. ¿La observación sigue aplicando? Bórrela o edítela y toque Guardar.'; $('fObs').scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    guardarFicha();
  },
  recargaHoy: () => { ed.recAnt = mesActual(); ed.recProx = sumarMeses(ed.recAnt, 12); const o = ed.obs.split(';').map((x) => x.trim()).filter(Boolean); if (!o.includes('Recargado')) o.push('Recargado'); ed.obs = o.join('; '); pintarFicha(); },
  qobs: (el) => { let p = ed.obs.split(';').map((x) => x.trim()).filter(Boolean); const q = el.dataset.q; p = p.includes(q) ? p.filter((x) => x !== q) : [...p, q]; ed.obs = p.join('; '); pintarFicha(); },
  terminar: async () => { if (!(await ask('Terminar visita', 'La visita queda cerrada y pasa al historial. Si falta algo, el administrador puede reabrirla.', 'Terminar'))) return; await Cloud.updateVisita(S.vid, { estado: 'terminada', cerrada: Date.now(), resumen: calcResumen(S.ext, S.rev), ultimaAct: { texto: `${yo().split(' ')[0]} terminó la visita`, t: Date.now(), by: yo() } }).catch(cloudError); toast('Visita terminada'); go('#/'); },
  xlsx: () => run(async () => exportXlsx(await datosVisita(S.vid))),
  pdf: () => run(async () => exportPdf(await datosVisita(S.vid))),
  // administrador
  fijar: (el) => { const c = cliente(el.dataset.id); Cloud.updateCliente(c.id, { fijado: !c.fijado }).catch(cloudError); toast(c.fijado ? 'Quitado de fijados' : `${c.nombre} fijado arriba`); },
  selV: (el) => { verVisitaAdm(el.dataset.id); redraw(); window.scrollTo(0, 0); },
  xlsxA: () => run(async () => exportXlsx(await datosVisita(S.aVid))),
  pdfA: () => run(async () => exportPdf(await datosVisita(S.aVid))),
  xlsxV: (el) => run(async () => exportXlsx(await datosVisita(el.dataset.id))),
  pdfV: (el) => run(async () => exportPdf(await datosVisita(el.dataset.id))),
  nuevaVisitaA: () => { const c = cliente(S.aCid); const vid = nuevaVisita(c); verVisitaAdm(vid); toast('Visita de hoy iniciada'); },
  terminarA: async () => { if (!(await ask('Terminar visita', 'La visita pasa al historial.', 'Terminar'))) return; Cloud.updateVisita(S.aVid, { estado: 'terminada', cerrada: Date.now(), resumen: calcResumen(S.aExt, S.aRev) }).catch(cloudError); },
  reabrirA: () => Cloud.updateVisita(S.aVid, { estado: 'en_curso' }).catch(cloudError),
  guardarCliente: () => { const p = { nombre: $('cN').value.trim(), lugar: $('cL').value.trim(), frecuencia: $('cF').value }; if ($('cD')) p.dia = +$('cD').value; else if (p.frecuencia === 'semanal') p.dia = new Date().getDay(); if (!p.nombre) return toast('Escriba el nombre del cliente'); Cloud.updateCliente(S.aCid, p).then(() => toast('Proyecto actualizado')).catch(cloudError); },
  cargarDecameron: () => run(async () => {
    const d = DECAMERON; const cid = await Cloud.crearCliente({ nombre: d.cliente, lugar: d.lugar, pais: d.pais, frecuencia: 'semanal', dia: 2, fijado: true, creadoPor: yo() });
    await Cloud.addExtintores(cid, d.extintores.map((e) => ({ ...e, recAnt: '', recProx: '', ph: '' })));
    toast(`${d.cliente} cargado con ${d.extintores.length} extintores`);
  }),
  acceso: async (el) => { const u = S.usuarios.find((x) => x.id === el.dataset.id); if (u.activo && !(await ask('Quitar acceso', `${u.nombre} ya no podrá entrar a la app. Sus revisiones quedan en los reportes.`, 'Quitar acceso'))) return; Cloud.setUsuario(u.id, { activo: !u.activo }).catch(cloudError); },
  crearTec: async () => {
    const nombre = $('tN').value.trim(), usuario = $('tU').value.trim(), clave = $('tP').value, rol = $('tR').value;
    if (!nombre || !usuario) { $('tErr').textContent = 'Escriba nombre y usuario.'; return; }
    if (clave.length < 6) { $('tErr').textContent = 'La contraseña debe tener al menos 6 caracteres.'; return; }
    $('tErr').textContent = '';
    try { await Cloud.crearTecnico({ nombre, usuario, clave, rol }); await ask('Listo', `${nombre} ya puede entrar con el usuario “${usuario}” y la contraseña “${clave}”. La app le pedirá cambiarla.`, null); renderATecnicos(); }
    catch (e) { $('tErr').textContent = /email-already/.test(e.code || '') ? 'Ese usuario ya existe.' : /network/.test(e.code || '') ? 'Sin conexión. Intente de nuevo.' : 'No se pudo crear: ' + (e.code || e.message); }
  },
};
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]'); if (!el || el.closest('#dlg .acts')) return;
  const f = ACT[el.dataset.act]; if (f) { e.preventDefault(); f(el); }
});
window.addEventListener('online', redraw); window.addEventListener('offline', redraw);

// ----- Pantallas de entrada -----
function gate(html) { root.innerHTML = `<div class="gate on"><div class="box">${html}</div></div>`; }
function pantallaLogin(msg = '') {
  gate(`<img src="${LOGO}" alt="SOS FIRE"><h2>Inspección de extintores</h2><p>Entre con el usuario y la contraseña que le dio SOS FIRE.</p>
    <form id="fLogin"><label class="field">Usuario o correo<input id="lU" autocomplete="username" autocapitalize="off" required></label>
    <label class="field">Contraseña<input id="lP" type="password" autocomplete="current-password" required></label>
    <button class="btn pri" type="submit" id="lB">Entrar</button><div class="err" id="lE">${esc(msg)}</div></form>`);
  $('fLogin').onsubmit = async (e) => {
    e.preventDefault(); $('lE').textContent = ''; $('lB').disabled = true;
    try { await Cloud.login($('lU').value, $('lP').value); }
    catch (err) { $('lE').textContent = /network/.test(err.code || '') ? 'Sin conexión. Intente cuando tenga señal.' : 'Usuario o contraseña incorrectos.'; }
    finally { const b = $('lB'); if (b) b.disabled = false; }
  };
}
function pantallaClave() {
  gate(`<img src="${LOGO}" alt="SOS FIRE"><h2>Cree su contraseña</h2><p>Es la primera vez que entra. Escoja una contraseña que solo usted sepa.</p>
    <form id="fClave"><label class="field">Contraseña nueva<input id="c1" type="password" autocomplete="new-password" minlength="6" required></label>
    <label class="field">Repítala<input id="c2" type="password" autocomplete="new-password" required></label>
    <button class="btn pri" type="submit">Guardar y entrar</button><div class="err" id="cE"></div></form>`);
  $('fClave').onsubmit = async (e) => {
    e.preventDefault(); const a = $('c1').value, b = $('c2').value;
    if (a.length < 6) { $('cE').textContent = 'Use al menos 6 caracteres.'; return; } if (a !== b) { $('cE').textContent = 'Las dos contraseñas no coinciden.'; return; }
    try { await Cloud.cambiarClave(a); await Cloud.setUsuario(Cloud.uid(), { debeCambiar: false }); }
    catch (err) { $('cE').textContent = /recent/.test(err.code || '') ? 'Por seguridad, salga y vuelva a entrar, luego cámbiela.' : 'No se pudo guardar: ' + (err.code || err.message); }
  };
}

function arrancar() {
  if (!CLOUD_CONFIG || !window.Cloud) {
    gate(`<img src="${LOGO}" alt="SOS FIRE"><h2>Falta conectar Firebase</h2><p>Esta app guarda todo en la nube. Agregue la variable FIREBASE_CONFIG en Render y vuelva a publicar (vea el README).</p>`); return;
  }
  Cloud.init(CLOUD_CONFIG);
  let unMe = null;
  Cloud.onUser((u) => {
    if (unMe) { unMe(); unMe = null; } stopAll('list'); salirVisita(); salirACliente(); S.me = null;
    if (!u) { pantallaLogin(); return; }
    gate(`<img src="${LOGO}" alt="SOS FIRE"><p>Entrando…</p>`);
    const adminCorreo = ADMIN_EMAILS.map((x) => x.toLowerCase()).includes((u.email || '').toLowerCase());
    unMe = Cloud.watchUsuario(u.uid, async (p) => {
      if (!p && adminCorreo) { await Cloud.setUsuario(u.uid, { nombre: 'Administrador', usuario: u.email, email: u.email, rol: 'admin', activo: true, debeCambiar: false, creado: Date.now() }).catch(cloudError); return; }
      if (!p) { gate(`<img src="${LOGO}" alt="SOS FIRE"><h2>Sin acceso</h2><p>Su usuario no está registrado en la app de extintores. Pida al administrador que lo agregue.</p><button class="btn" data-act="salir">Salir</button>`); return; }
      if (!p.activo && !adminCorreo) { gate(`<img src="${LOGO}" alt="SOS FIRE"><h2>Acceso desactivado</h2><p>El administrador quitó su acceso. Si es un error, comuníquese con él.</p><button class="btn" data-act="salir">Salir</button>`); return; }
      if (p.debeCambiar) { pantallaClave(); return; }
      const nuevo = !S.me; S.me = p; S.rol = adminCorreo ? 'admin' : p.rol;
      if (nuevo) iniciarDatos();
      route();
    }, cloudError);
  });
}
arrancar();
if ('serviceWorker' in navigator && location.protocol === 'https:') { try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {} }
