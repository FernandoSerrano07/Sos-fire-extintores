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
const sv = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
Object.assign(ICON, {
  grid: sv('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
  users: sv('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
  phone: sv('<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>'),
  live: sv('<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'),
  folder: sv('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
  alert: sv('<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>'),
  cal: sv('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  arch: sv('<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>'),
  clock: sv('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  db: sv('<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'),
  pinS: sv('<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>'),
  check: sv('<path d="M20 6 9 17l-5-5"/>'),
  wrench: sv('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'),
});
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
  { k: 'presion', l: 'Presión del manómetro', o: [['ok', 'Buena'], ['mal', 'Mala']], good: 'ok', also: ['na'], wide: false },
  { k: 'cilindro', l: 'Estado físico cilindro', o: [['b', 'Bueno'], ['m', 'Malo']], good: 'b', col: ['N', 'O'] },
  { k: 'instrucciones', l: 'Instrucciones de uso', o: [['s', 'Sí'], ['n', 'No']], good: 's', col: ['P', 'Q'] },
  { k: 'senal', l: 'Señalización', o: [['b', 'Bueno'], ['m', 'Malo']], good: 'b', col: ['R', 'S'] },
  { k: 'marchamo', l: 'Marchamo', o: [['s', 'Sí'], ['n', 'No']], good: 's', col: ['T', 'U'] },
  { k: 'manguera', l: 'Manguera', o: [['s', 'Sí'], ['n', 'No']], good: 's', col: ['V', 'W'] },
  { k: 'boquilla', l: 'Boquilla', o: [['s', 'Sí'], ['n', 'No']], good: 's', col: ['X', 'Y'] },
  { k: 'etiqueta', l: 'Etiqueta', o: [['s', 'Sí'], ['n', 'No']], good: 's', col: ['Z', 'AA'] },
];
const CK = Object.fromEntries(CRIT.map((c) => [c.k, c])); // se completa con las revisiones propias de cada cliente
// Qué revisiones lleva cada cliente (cada uno tiene su formato de reporte). Sin configurar = todas, como Decameron.
const EXTRAS = [['recargas', 'Fechas de recarga'], ['ph', 'PH (prueba hidrostática)'], ['altura', 'Altura al tope']];
const TODAS = CRIT.map((c) => c.k).concat(EXTRAS.map((x) => x[0]));
const FMT_EXTRA = { recargas: ['recA', 'recP'], ph: ['ph'], altura: ['alt'] };
const usa = (cid, k) => {
  const c = S.clientes.find((x) => x.id === cid); if (!c) return true;
  if (c.formato) return FMT_EXTRA[k] ? c.formato.items.some((i) => FMT_EXTRA[k].includes(i.t)) : c.formato.items.some((i) => i.t === 'chk' && i.k === k);
  return !Array.isArray(c.criterios) || c.criterios.includes(k);
};
const critFmt = (it) => ({ k: it.k, l: it.l, o: it.o === 'sn' ? [['s', 'Sí'], ['n', 'No']] : [['b', 'Bueno'], ['m', 'Malo']], good: it.o === 'sn' ? 's' : 'b' });
function registrarFormatos() { for (const c of S.clientes) if (c.formato) for (const it of c.formato.items) if (it.t === 'chk') CK[it.k] = critFmt(it); }
const critDe = (cid) => { const c = S.clientes.find((x) => x.id === cid); return c && c.formato ? c.formato.items.filter((i) => i.t === 'chk').map(critFmt) : CRIT.filter((x) => usa(cid, x.k)); };
const optLabel = (k, v) => ((CK[k] || { o: [] }).o.find((o) => o[0] === v) || [, k === 'presion' && (v === 'baja' || v === 'alta') ? 'Mala' : ''])[1];
// Frases que el cliente ya usa en su hoja 2 (columna Observaciones)
const QUICK = ['Cambiar manómetro', 'PH ficticia', 'Cambiar manguera', 'Se cambió manómetro', 'Manguera cristalizada', 'Tarjeta de control no visible', 'Despresurizado', 'Descargado en bodega', 'Se cambió cincho plástico', 'Retirado para MYRE', 'Se sometió a MYRE', 'Pendiente de MYRE', 'Se efectuó MYRE', 'Requiere recarga'];
// Situación del extintor: cuando no se puede inspeccionar normalmente
const SIT = [['', 'Normal'], ['noenc', 'No se encontró'], ['reserva', 'Reserva'], ['retirado', 'Retirado']];
const SIT_TXT = { noenc: 'No encontrado', reserva: 'Reserva', retirado: 'Retirado' };
// Soporte (la gran mayoría de la hoja 2 lo anota en Observaciones)
const SOP = [['', 'Bien'], ['pend', 'Por cambiar'], ['ok', 'Ya se cambió']];
const SOP_TXT = { pend: 'Se debe efectuar cambio de soporte', ok: 'Se efectuó cambio de soporte' };
const ALT_MAX = 1.53; // m (5 pies) al tope del extintor de hasta 18 kg
const esBueno = (c, v) => v === c.good || (c.also || []).includes(v);
const esCO2 = (t) => /^c[o0]\s*(₂|2)/i.test(String(t || '').trim());
const altNum = (a) => { const m = String(a || '').replace(',', '.').match(/\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null; };
const altTxt = (a) => { const n = altNum(a); return n == null ? '' : n.toFixed(2); };
const sopDe = (e, r) => (r && r.soporte !== undefined ? r.soporte : (e && e.soporte) || '');
const phVencido = (ph) => { const m = String(ph || '').match(/^(\d{1,2})\/(\d{4})$/); if (!m) return false; const d = new Date(); return (d.getFullYear() * 12 + d.getMonth()) - (+m[2] * 12 + (+m[1] - 1)) >= 60; };
// Observaciones como las escribe el cliente: "PH ficticia / Se debe efectuar cambio de soporte"
const obsReporte = (e, r) => [r && r.sit ? SIT_TXT[r.sit] : '', r && r.obs ? r.obs.split(';').map((x) => x.trim()).filter(Boolean).join(' / ') : '', r && r.t ? SOP_TXT[sopDe(e, r)] || '' : sopDe(e, r) === 'pend' ? SOP_TXT.pend : ''].filter(Boolean).join(' / ');
const TIPOS = ['ABC', 'CO₂', 'K', 'Agua', 'BC', 'Otro'];

function estado(rev) {
  if (!rev) return 'pend';
  if (rev.sit === 'noenc') return 'bad';
  if (rev.sit) return 'esp';
  if (!rev.c) return 'pend';
  const KS = rev.ck ? rev.ck.map((k) => CK[k]).filter(Boolean) : CRIT;
  const vals = KS.map((c) => rev.c[c.k]);
  if (vals.every((v) => !v)) return 'pend';
  if (Object.keys(rev.c).some((k) => CK[k] && rev.c[k] && !esBueno(CK[k], rev.c[k]))) return 'bad';
  if (vals.some((v) => !v)) return 'part';
  return 'ok';
}
const fallasDe = (rev) => (rev && rev.sit === 'noenc' ? ['No se encontró'] : []).concat(Object.values(CK).filter((c) => rev && rev.c && rev.c[c.k] && !esBueno(c, rev.c[c.k])).map((c) => `${c.l.replace(' del manómetro', '').replace(' de uso', '')}: ${optLabel(c.k, rev.c[c.k])}`));
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
  // vencimientos: extintores de todos los proyectos
  allExt: {},
};
const U = { list: [], v: [], a: [] }; // suscripciones: generales, de visita, de admin
const stopAll = (k) => { U[k].forEach((u) => { try { u(); } catch (e) {} }); U[k] = []; };
const esAdmin = () => S.rol === 'admin';
const yo = () => (S.me && S.me.nombre) || '';
const online = (t) => t && Date.now() - t < 3 * 60000;
const ui = { q: '', zona: '', filtro: 'all', limit: 80, hq: '', hmes: '', vTab: 'mes', vCli: '' };
const UX = {}; // suscripciones a extintores por cliente (panel de vencimientos)

let redrawT = null;
let perfilIntentado = null;
let sigBusy = false;
// No se redibuja mientras alguien firma o escribe su nombre en el cierre; se hace al terminar
const bloqueado = () => sigBusy || !!(document.activeElement && document.activeElement.closest && document.activeElement.closest('.nore'));
function redraw() { clearTimeout(redrawT); redrawT = setTimeout(() => (bloqueado() ? redraw() : route()), bloqueado() ? 400 : 40); }
function cloudError(e) { console.error(e); if (e && e.code === 'permission-denied') toast('Sin permiso. Pida acceso al administrador.'); }

function iniciarDatos() {
  stopAll('list');
  U.list.push(Cloud.watchClientes((l) => { S.clientes = l; registrarFormatos(); redraw(); }, cloudError));
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
  let ok = 0, bad = 0, part = 0, pronto = 0, esp = 0, sop = 0;
  for (const e of ext) {
    const r = rev[e.id]; const s = estado(r);
    if (s === 'ok') ok++; else if (s === 'bad') bad++; else if (s === 'part') part++; else if (s === 'esp') esp++;
    if (sopDe(e, r) === 'pend') sop++;
    const v = venc((r && r.recProx) || e.recProx); if (v === 'vencida' || v === 'pronto') pronto++;
  }
  return { total: ext.length, ok: ok + esp, bad, part, done: ok + bad + part + esp, pronto, sop };
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
      ${bannerInstalar()}
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
  const cnt = { all: list.length, pend: 0, bad: 0, venc: 0, ok: 0, sop: 0 };
  for (const e of list) { const s = estado(S.rev[e.id]); if (s === 'pend' || s === 'part') cnt.pend++; if (s === 'bad') cnt.bad++; if (s === 'ok' || s === 'esp') cnt.ok++; if (sopDe(e, S.rev[e.id]) === 'pend') cnt.sop++; const vv = venc((S.rev[e.id] && S.rev[e.id].recProx) || e.recProx); if (vv === 'vencida' || vv === 'pronto') cnt.venc++; }
  if (ui.filtro === 'pend') list = list.filter((e) => ['pend', 'part'].includes(estado(S.rev[e.id])));
  if (ui.filtro === 'bad') list = list.filter((e) => estado(S.rev[e.id]) === 'bad');
  if (ui.filtro === 'ok') list = list.filter((e) => ['ok', 'esp'].includes(estado(S.rev[e.id])));
  if (ui.filtro === 'sop') list = list.filter((e) => sopDe(e, S.rev[e.id]) === 'pend');
  if (ui.filtro === 'venc') list = list.filter((e) => ['vencida', 'pronto'].includes(venc((S.rev[e.id] && S.rev[e.id].recProx) || e.recProx)));
  const shown = list.slice(0, ui.limit);
  let lastZ = null; const agrupar = !ui.zona && !ui.q;
  const rows = shown.map((e) => {
    const r = S.rev[e.id]; const s = estado(r);
    const head = agrupar && e.zona !== lastZ ? `<div class="zhead">${esc(e.zona || 'Sin zona')}</div>` : ''; lastZ = e.zona;
    const st = s === 'pend' ? '<span class="pill pend">Pendiente</span>' : s === 'ok' ? '<span class="pill ok">✓ Todo bien</span>' : s === 'bad' ? '<span class="pill bad">✕ Falla</span>' : s === 'esp' ? `<span class="pill pend">${SIT_TXT[r.sit]}</span>` : '<span class="pill pend">Incompleto</span>';
    const sopP = sopDe(e, r) === 'pend' ? '<span class="pill warn">Soporte</span>' : '';
    const det = s === 'bad' ? esc(fallasDe(r).join(' · ')) : '';
    return `${head}<div class="row ${s === 'ok' ? 'ok' : s === 'bad' ? 'bad' : ''}" id="r_${e.id}">
      <span class="num">${esc(e.n ?? '')}</span>
      <button class="main" data-act="ficha" data-id="${e.id}"><span class="t">${marcar(e.area || '(sin área)', ui.q)}</span>
        <span class="s">${esc([e.marca, e.tipo, e.capacidad].filter(Boolean).join(' · '))}${e.numero ? ' · N° ' + esc(e.numero) : ''}</span>
        <span class="st">${e.nuevo ? '<span class="pill new">Nuevo</span>' : ''}${st}${sopP}${det ? `<span>${det}</span>` : ''}${r && r.t ? `<span>${esc((r.by || '').split(' ')[0])} ${hhmm(r.t)}</span>` : ''}${vencPill(e, r)}</span></button>
      ${s === 'pend' ? `<button class="quick" data-act="okRapido" data-id="${e.id}" aria-label="Marcar todo bien">✓ OK</button>` : `<button class="quick ed" data-act="ficha" data-id="${e.id}">Editar</button>`}
    </div>`;
  }).join('');
  const quienes = v ? Object.entries(v.tecnicos || {}).filter(([u, t]) => online(t.visto) && u !== Cloud.uid()).map(([, t]) => t.nombre.split(' ')[0]) : [];
  const fil = [['all', `Todos ${cnt.all}`, ''], ['pend', `Pendientes ${cnt.pend}`, ''], ['bad', `Con falla ${cnt.bad}`, 'bad'], ['venc', `Por vencer ${cnt.venc}`, 'warn'], ['sop', `Soporte ${cnt.sop}`, 'warn'], ['ok', `OK ${cnt.ok}`, '']];
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
    ${S.revOk && v && v.estado === 'en_curso' ? '<button class="fab" data-act="nuevoExt" aria-label="Agregar extintor">+ Agregar</button>' : ''}
    ${navTec('lista')}
  </div>`
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
      ${v ? tarjetaResumen(v, c, ext, S.rev, true) : ''}
      ${v ? bloqueFirmas(v, c) : ''}
      ${v && v.estado === 'en_curso' ? `<button class="btn pri" data-act="terminar" style="height:52px">Terminar visita</button>` : v ? `<p class="muted" style="text-align:center;font-size:13px">Visita terminada ${hhmm(v.cerrada)}</p>` : ''}
    </div>
    ${navTec('rep')}
  </div>`;
  if (v) iniciarFirmas(v);
}



/* ----- Resumen "Acciones correctivas o de mejora" (texto automático del reporte) ----- */
const unir = (a) => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1]);
function datosResumen(ext, rev) {
  const d = { n: calcResumen(ext, rev).done, bad: 0, mant: 0, mangueras: 0, ph: 0, noenc: 0, nuevos: 0, somP: 0, somC: 0, retP: 0, retC: 0, sopOk: 0, sopPend: 0, recargas: 0 };
  for (const e of ext) {
    const r = rev[e.id]; const co2 = esCO2(e.tipo);
    if (e.nuevo) d.nuevos++;
    if (sopDe(e, r) === 'pend') d.sopPend++;
    if (['vencida', 'pronto'].includes(venc((r && r.recProx) || e.recProx))) d.recargas++;
    if (!r || estado(r) === 'pend') continue;
    const obs = String(r.obs || '').toLowerCase();
    const ret = r.sit === 'retirado' || /retirad\w* para myre/.test(obs);
    const som = !ret && /se (sometio|sometió|efectuo|efectuó) (a )?myre/.test(obs);
    if (r.soporte === 'ok') d.sopOk++;
    if (r.sit === 'noenc') { d.noenc++; continue; }
    if (ret) { co2 ? d.retC++ : d.retP++; }
    if (som) { co2 ? d.somC++ : d.somP++; }
    const sinCrit = r.sit === 'reserva';
    if (estado(r) === 'bad') d.bad++;
    const mang = (r.c && r.c.manguera === 'n') || /manguera/.test(obs); if (mang) d.mangueras++;
    if (/ph fic|ph\b/.test(obs) || (co2 && phVencido(r.ph || e.ph))) d.ph++;
    if (!sinCrit && (estado(r) === 'bad' || mang || /man[oó]metro|cincho|despresuriz|requiere recarga|descargado/.test(obs))) d.mant++;
  }
  return d;
}
// Devuelve el texto con **negrita**; si el administrador lo editó, usa el suyo.
function textoResumen({ c, v, ext, rev }) {
  if (v && v.resumenTxt && v.resumenTxt.trim()) return v.resumenTxt.trim();
  const d = datosResumen(ext, rev); const pl = (n, a, b) => (n === 1 ? a : b);
  if (!d.n) return 'Todavía no hay extintores revisados en esta visita. Al revisarlos, este resumen se completa solo.';
  const hallazgos = [d.mant && 'necesidades de mantenimiento', d.mangueras && 'cambios de mangueras', d.ph && 'registros de pruebas hidrostáticas por verificar', d.noenc && 'extintores no localizados'].filter(Boolean);
  let t = `Durante la inspección de ${d.n} ${pl(d.n, 'extintor', 'extintores')}, `;
  if (hallazgos.length) t += `se identificaron equipos con ${unir(hallazgos)}, por lo que es importante continuar con las acciones correctivas${d.noenc || d.nuevos ? ' y la actualización del inventario' : ''}.`;
  else t += `no se identificaron hallazgos que requieran acciones correctivas${d.nuevos ? '; se actualizó el inventario con los extintores nuevos' : ''}, por lo que se recomienda mantener el programa de inspección y mantenimiento.`;
  const tot = d.somP + d.somC + d.retP + d.retC; const pqs = d.somP + d.retP, co2 = d.somC + d.retC;
  const av = [];
  if (tot) {
    const partes = [];
    if (pqs) partes.push(`**${pqs} de Polvo Químico Seco**`);
    if (co2) partes.push(`**${co2} ${d.retC ? 'retirados para PH y Recarga de' : 'de'} Dióxido de carbono**`);
    av.push(`ya iniciamos las recargas correspondientes, registrando un total de **${tot} ${pl(tot, 'extintor sometido', 'extintores sometidos')} a Recarga y Mantenimiento**, ${unir(partes)}`);
  }
  if (d.sopOk) av.push(`la sustitución de soportes, logrando efectuar **${d.sopOk} ${pl(d.sopOk, 'cambio', 'cambios')} de soporte durante las jornadas de trabajo**`);
  if (av.length) {
    t += ` Como avance significativo, ${av.length > 1 ? av[0] + ', así como ' + av[1] : av[0]}.`;
    t += d.sopOk ? ' Estas acciones representan un avance importante para mejorar las condiciones de seguridad de los equipos, especialmente aquellos que anteriormente se encontraban sujetos mediante soportes plásticos inadecuados.' : ' Estas acciones representan un avance importante para mejorar las condiciones de seguridad de los equipos.';
  }
  const rec = [d.sopPend && 'los cambios de soporte pendientes', (d.bad - d.noenc > 0 || d.mangueras) && 'la revisión de equipos deteriorados', (d.recargas || d.ph) && 'las recargas necesarias'].filter(Boolean);
  const donde = /decameron/i.test((c && c.nombre) || '') ? 'en todo el complejo' : 'en todas las instalaciones';
  t += rec.length ? ` Recomendamos continuar priorizando ${unir(rec)}, con el objetivo de evidenciar mejoras progresivas ${donde} y garantizar su correcto funcionamiento ante una emergencia.` : ` Recomendamos mantener la revisión periódica, con el objetivo de conservar las condiciones de seguridad ${donde} y garantizar su correcto funcionamiento ante una emergencia.`;
  return t;
}
const partesNegrita = (t) => String(t).split('**').map((x, i) => ({ t: x, b: i % 2 === 1 })).filter((p) => p.t);
const resumenHtml = (t) => partesNegrita(t).map((p) => (p.b ? `<b>${esc(p.t)}</b>` : esc(p.t))).join('');
function tarjetaResumen(v, c, ext, rev, puedeEditar) {
  const t = textoResumen({ c, v, ext, rev });
  return `<div class="card2 resumen"><div class="hd"><div class="sech"><div class="t"><span class="ic v">${ICON.check}</span><h2>Acciones correctivas o de mejora</h2></div></div></div><div class="bd"><p class="restx">${resumenHtml(t)}</p>
    <p class="muted" style="font-size:12px;margin:8px 0 0">${v && v.resumenTxt ? 'Texto editado a mano.' : 'Se escribe solo según lo que se ha revisado y se actualiza con cada cambio.'} Sale al final del Excel y del PDF.</p>
    ${puedeEditar ? `<div class="inline" style="margin-top:10px"><button class="btn sm" data-act="resEdit" data-id="${v.id}">✎ Editar texto</button>${v.resumenTxt ? `<button class="btn sm ghost" data-act="resAuto" data-id="${v.id}">Volver al automático</button>` : ''}</div>` : ''}</div></div>`;
}

/* ----- Firmas del técnico y del encargado (cierre de visita) ----- */
const F = (v) => (v && v.firmas) || {};
const encLabel = (c) => `Encargado ${c ? String(c.nombre).split(/\s+/)[0].toUpperCase() : 'del cliente'}`;
function bloqueFirmas(v, c) {
  const f = F(v); const abierta = v.estado === 'en_curso';
  const tecDef = f.tecNombre != null ? f.tecNombre : tecnicosDe(v) || yo();
  if (!abierta) return `<div class="card"><h3>Firmas</h3><div class="firmasRO">
      <div><span class="lbl">Equipo SOS FIRE</span>${f.tec ? `<img src="${f.tec}" alt="Firma Equipo SOS FIRE">` : '<div class="nofirma">Sin firma</div>'}<b>Equipo SOS FIRE</b></div>
      <div><span class="lbl">${esc(encLabel(c))}</span>${f.enc ? `<img src="${f.enc}" alt="Firma encargado">` : '<div class="nofirma">Sin firma</div>'}<b>${esc(f.encNombre || '—')}</b></div></div></div>`;
  return `<div class="card nore-wrap"><h3>Cierre de visita · firmas</h3><p class="muted" style="margin:-4px 0 10px;font-size:12.5px">Firmen con el dedo. Salen en el Excel y el PDF del reporte.</p>
    <div class="sigrow"><label>Firma Equipo SOS FIRE</label><button class="linkb" data-act="sigClr" data-id="tec">Borrar firma</button></div>
    <canvas class="sig" id="sigTec"></canvas>
    <label class="field" style="margin-top:14px">Nombre del ${esc(encLabel(c).replace('Encargado', 'encargado'))}<input class="nore" id="fEncN" value="${esc(f.encNombre || '')}" placeholder="Nombre y apellido" autocomplete="off"></label>
    <div class="sigrow"><label>Firma ${esc(encLabel(c).replace('Encargado', 'encargado'))}</label><button class="linkb" data-act="sigClr" data-id="enc">Borrar firma</button></div>
    <canvas class="sig" id="sigEnc"></canvas></div>`;
}
function sigPad(cv, key) {
  if (!cv) return;
  const r = window.devicePixelRatio || 1; const w = cv.clientWidth, h = cv.clientHeight; cv.width = w * r; cv.height = h * r;
  const ctx = cv.getContext('2d'); ctx.scale(r, r); ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1a1a1a';
  const prev = F(S.visita)[key]; if (prev) { const im = new Image(); im.onload = () => ctx.drawImage(im, 0, 0, w, h); im.src = prev; }
  let drawing = false, last = null, rayas = false;
  const pt = (e) => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  cv.onpointerdown = (e) => { drawing = true; sigBusy = true; last = pt(e); cv.setPointerCapture(e.pointerId); };
  cv.onpointermove = (e) => { if (!drawing) return; const p = pt(e); ctx.beginPath(); ctx.moveTo(...last); ctx.lineTo(...p); ctx.stroke(); last = p; rayas = true; };
  const end = () => { if (!drawing) return; drawing = false; sigBusy = false; if (!rayas) return;
    // Se guarda a tamaño normal para que sincronice rápido
    const o = document.createElement('canvas'); o.width = w; o.height = h; o.getContext('2d').drawImage(cv, 0, 0, w, h);
    const url = o.toDataURL('image/png'); S.visita.firmas = { ...F(S.visita), [key]: url };
    Cloud.updateVisita(S.vid, { [`firmas.${key}`]: url, [`firmas.${key}T`]: Date.now() }).catch(cloudError); };
  cv.onpointerup = end; cv.onpointercancel = end;
}
function iniciarFirmas(v) {
  if (v.estado !== 'en_curso') return;
  sigPad($('sigTec'), 'tec'); sigPad($('sigEnc'), 'enc');
  for (const [id, k] of [['fTecN', 'tecNombre'], ['fEncN', 'encNombre']]) {
    const el = $(id); if (!el) continue; let t = null;
    el.oninput = () => { S.visita.firmas = { ...F(S.visita), [k]: el.value }; clearTimeout(t); t = setTimeout(() => Cloud.updateVisita(S.vid, { [`firmas.${k}`]: el.value.trim() }).catch(cloudError), 600); };
    el.onblur = () => { clearTimeout(t); Cloud.updateVisita(S.vid, { [`firmas.${k}`]: el.value.trim() }).catch(cloudError); };
  }
}

/* ======================= 5) Ficha de inspección ======================= */
let ed = null; // { eid, c:{}, obs, recAnt, recProx, ph, prevMalo }
const extDe = (eid) => S.ext.find((e) => e.id === eid);
function abrirFicha(eid) {
  const e = extDe(eid); if (!e) return; const r = S.rev[eid];
  ed = { eid, c: r && r.c ? { ...r.c } : {}, obs: r ? r.obs || '' : '', recAnt: (r && r.recAnt) || e.recAnt || '', recProx: (r && r.recProx) || e.recProx || '', ph: (r && r.ph) || e.ph || '', altura: (r && r.altura) || e.altura || '', sit: (r && r.sit) || '', soporte: sopDe(e, r), prevMalo: estado(r) === 'bad', aviso: '' };
  if (usa(S.cid, 'presion') && !ed.c.presion && esCO2(e.tipo) && !ed.sit) { ed.c.presion = 'na'; ed.presionAuto = true; }
  $('shN').textContent = '#' + (e.n ?? ''); $('shArea').textContent = e.area || '(sin área)'; $('shZona').textContent = e.zona || '';
  pintarFicha(); $('scrim').classList.add('on'); $('sheet').classList.add('on'); $('shBody').scrollTop = 0;
}
// ¿La ficha sigue como estaba al abrirla? (para no guardar revisiones vacías)
function fichaVacia() {
  const e = extDe(ed.eid) || {}; const r = S.rev[ed.eid];
  const sinCrit = critDe(S.cid).every((c) => !ed.c[c.k] || (c.k === 'presion' && ed.presionAuto && ed.c.presion === 'na'));
  return !ed.sit && sinCrit && !ed.obs.trim() && (ed.altura || '') === ((r && r.altura) || e.altura || '') && ed.soporte === sopDe(e, r) && !r;
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
    <div class="lbl">Situación del extintor</div>
    <div class="seg sit">${SIT.map(([v, l]) => `<button data-act="sit" data-v="${v}" class="${ed.sit === v ? (v === '' ? 'g' : v === 'noenc' ? 'b' : 'w') : ''}">${l}</button>`).join('')}</div>
    ${ed.sit ? `<div class="editbar" style="margin-top:10px">${ed.sit === 'noenc' ? 'No se encontró en su lugar: queda como hallazgo. Anote dónde estaba o dónde puede estar.' : ed.sit === 'reserva' ? 'Está de reserva: no se revisa el estado, solo queda anotado.' : 'Fue retirado del sitio (por ejemplo a MYRE o a bodega). Anote el motivo abajo.'}</div>` : `
    <div class="lbl">Verificar estado</div>
    <div>${critDe(S.cid).map((c) => `<div class="crit ${c.wide ? 'wide' : ''}"><span class="l">${c.l}${c.k === 'presion' && esCO2(e.tipo) ? ' <small class="muted">· el CO₂ no tiene manómetro</small>' : ''}</span><div class="seg">${c.o.map(([v, l]) => `<button data-act="crit" data-k="${c.k}" data-v="${v}" class="${ed.c[c.k] === v ? (esBueno(c, v) ? 'g' : 'b') : ''}">${l}</button>`).join('')}</div></div>`).join('')}</div>
    ${usa(S.cid, 'altura') ? `<div class="crit wide"><span class="l">Altura al tope (metros) <small id="altHint" style="color:var(--warn);font-weight:700">${altNum(ed.altura) > ALT_MAX ? '· pasa de 1.53 m' : ''}</small></span>
      <input id="fAlt" class="altin" inputmode="decimal" placeholder="1.50" value="${esc(ed.altura)}"></div>` : ''}
    <div class="crit wide"><span class="l">Soporte</span><div class="seg">${SOP.map(([v, l]) => `<button data-act="sop" data-v="${v}" class="${ed.soporte === v ? (v === 'pend' ? 'b' : 'g') : ''}">${l}</button>`).join('')}</div></div>`}
    ${usa(S.cid, 'recargas') || usa(S.cid, 'ph') ? `    <div class="dates">
      <div style="display:flex;justify-content:space-between;align-items:baseline"><span class="lbl">Fechas</span><span class="muted" style="font-size:11.5px">${r ? '' : 'Vienen de la inspección pasada'}</span></div>
      <div class="g3">
        ${usa(S.cid, 'recargas') ? `<label class="field">Recarga anterior<input id="fRA" inputmode="numeric" placeholder="MM/AAAA" value="${esc(ed.recAnt)}"></label>
        <label class="field">Próxima recarga<input id="fRP" inputmode="numeric" placeholder="MM/AAAA" value="${esc(ed.recProx)}"></label>` : ''}
        ${!usa(S.cid, 'ph') ? '' : esCO2(e.tipo) ? `<label class="field">PH (prueba hidrostática)<input id="fPH" inputmode="numeric" placeholder="MM/AAAA" value="${esc(ed.ph)}">${phVencido(ed.ph) ? '<small style="color:var(--warn);font-weight:700">Tiene más de 5 años</small>' : ''}</label>` : '<div class="field"><span>PH (prueba hidrostática)</span><div class="phna">n/a · solo en los CO₂</div></div>'}
      </div>
      <button class="btn sm" data-act="recargaHoy" style="border:1.5px dashed var(--red);color:var(--red)">Se recargó hoy · actualizar fechas</button>
    </div>` : ''}
    <div class="lbl">Observaciones</div>
    <div class="qc">${QUICK.map((q) => `<button data-act="qobs" data-q="${esc(q)}" class="${ed.obs.split(';').map((x) => x.trim()).includes(q) ? 'on' : ''}">${esc(q)}</button>`).join('')}</div>
    <label><span class="sr">Observaciones</span><textarea class="obs" id="fObs" placeholder="Hallazgos, cambios, recargas…">${esc(ed.obs)}</textarea></label>
    <div class="hint" id="fHint"></div>`;
  const mmaa = (inp, k) => { if (!inp) return; inp.oninput = () => { let v = inp.value.replace(/[^\d]/g, '').slice(0, 6); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); inp.value = v; ed[k] = v; }; };
  mmaa($('fRA'), 'recAnt'); mmaa($('fRP'), 'recProx');
  mmaa($('fPH'), 'ph');
  // Sin volver a dibujar la ficha: si no, el primer toque en "Todo bien" se pierde al salir del campo
  const fa = $('fAlt'); const hint = () => { const h = $('altHint'); if (h) h.textContent = altNum(ed.altura) > ALT_MAX ? '· pasa de 1.53 m' : ''; };
  if (fa) { fa.oninput = () => { fa.value = fa.value.replace(',', '.').replace(/[^\d.]/g, '').slice(0, 5); ed.altura = fa.value; hint(); };
    fa.onblur = () => { if (altNum(ed.altura) != null) { ed.altura = altTxt(ed.altura); fa.value = ed.altura; hint(); } }; }
  $('fObs').oninput = (ev) => { ed.obs = ev.target.value; };
}
function avisoOtro(r) { if (!ed) return; ed.aviso = `<b>${esc(r.by || 'Otro técnico')} acaba de guardar este extintor</b> (${estado(r) === 'bad' ? 'con falla' : 'todo bien'}). Si guarda, se reemplaza con lo suyo. <button class="linkb" data-act="ficha" data-id="${ed.eid}">Ver lo que guardó</button>`; pintarFicha(); }

function guardarFicha({ cerrar = true } = {}) {
  if (!ed) return false;
  const vacio = fichaVacia();
  const e = extDe(ed.eid);
  if (vacio) { if (cerrar) cerrarFicha(); return false; }
  for (const k of ['recAnt', 'recProx', 'ph']) if (ed[k] && !/^\d{2}\/\d{4}$/.test(ed[k]) && !(k === 'ph' && /^\d{4}$/.test(ed[k]))) { $('fHint').textContent = 'Las fechas van como MM/AAAA, por ejemplo 03/2027.'; return false; }
  const prev = S.rev[ed.eid] ? JSON.parse(JSON.stringify(S.rev[ed.eid])) : null; const eid = ed.eid;
  if (esCO2(e && e.tipo) === false) ed.ph = '';
  const rec = { eid, ck: critDe(S.cid).map((x) => x.k), c: ed.sit ? {} : ed.c, obs: ed.obs.trim(), recAnt: ed.recAnt, recProx: ed.recProx, ph: ed.ph, altura: altTxt(ed.altura), sit: ed.sit || '', soporte: ed.soporte || '', t: Date.now(), by: yo(), uid: Cloud.uid() };
  S.rev[eid] = rec; Cloud.saveRevision(S.vid, eid, rec).catch(cloudError);
  const sopPend = rec.soporte === 'pend' ? 'pend' : '';
  if (e && (e.recAnt !== rec.recAnt || e.recProx !== rec.recProx || (e.ph || '') !== rec.ph || (e.altura || '') !== rec.altura || (e.soporte || '') !== sopPend)) { const dd = { recAnt: rec.recAnt, recProx: rec.recProx, ph: rec.ph, altura: rec.altura, soporte: sopPend }; Object.assign(e, dd); Cloud.saveExtintor(S.cid, eid, dd).catch(cloudError); }
  const s = estado(rec);
  guardarResumen(`${yo().split(' ')[0]} ${s === 'bad' ? 'marcó con falla' : 'revisó'} #${e ? e.n : ''} ${e ? e.area : ''}${s === 'bad' ? ' · ' + fallasDe(rec).join(', ') : s === 'esp' ? ' · ' + SIT_TXT[rec.sit].toLowerCase() : ' · todo bien'}`);
  toast(`#${e ? e.n : ''} guardado`, () => { if (prev) { S.rev[eid] = prev; Cloud.saveRevision(S.vid, eid, prev); } else { delete S.rev[eid]; Cloud.saveRevision(S.vid, eid, null); } guardarResumen(); redraw(); });
  if (cerrar) cerrarFicha();
  afterSave(); return true;
}
function afterSave() { if (ui.q) { ui.q = ''; route(); const q = $('q'); if (q) q.focus(); } else route(); }
function okRapido(eid) {
  const e = extDe(eid); if (!e) return;
  const c = Object.fromEntries(critDe(S.cid).map((x) => [x.k, x.good]));
  if (esCO2(e.tipo) && c.presion) c.presion = 'na';
  ed = { eid, c, obs: '', recAnt: e.recAnt || '', recProx: e.recProx || '', ph: e.ph || '', altura: e.altura || '', sit: '', soporte: sopDe(e, null) };
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
  if (!ed) return; const eid = ed.eid; const vacio = fichaVacia();
  if (!vacio && !guardarFicha({ cerrar: false })) return;
  const list = ui.zona ? S.ext.filter((e) => (e.zona || '') === ui.zona) : S.ext; const i = list.findIndex((e) => e.id === eid);
  const sig = list.slice(i + 1).find((e) => estado(S.rev[e.id]) === 'pend');
  if (sig) abrirFicha(sig.id); else { cerrarFicha(); toast('No hay más pendientes después de este'); }
};
$('shEditar').onclick = () => { if (ed) formExtintor(ed.eid); };

// ----- Datos del extintor (agregar nuevo o corregir) -----
async function formExtintor(eid, sugerencia = '', adm = false) {
  const CID = adm ? S.aCid : S.cid, EXT = adm ? S.aExt : S.ext;
  const e = eid ? EXT.find((x) => x.id === eid) : null; const zonas = zonasDe(EXT).filter(Boolean);
  const marcas = [...new Set(EXT.map((x) => (x.marca || '').trim()).filter(Boolean))];
  const nextN = EXT.reduce((m, x) => Math.max(m, +x.n || 0), 0) + 1;
  const zonaDef = e ? e.zona : (ui.zona || zonas[0] || '');
  const html = `
    <label class="field">Zona<input id="xZ" list="xZl" value="${esc(zonaDef)}" placeholder="ZONA #1"><datalist id="xZl">${zonas.map((z) => `<option value="${esc(z)}">`).join('')}</datalist></label>
    <label class="field">Área donde está ubicado<input id="xA" value="${esc(e ? e.area : sugerencia)}" placeholder="Bodega de mantenimiento" autocomplete="off"></label>
    ${e ? '' : '<div id="xSug"></div>'}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <label class="field">Marca<input id="xM" list="xMl" value="${esc(e ? e.marca : '')}"><datalist id="xMl">${marcas.map((m) => `<option value="${esc(m)}">`).join('')}</datalist></label>
      <label class="field">Tipo<select id="xT">${TIPOS.map((t) => `<option ${e && e.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <label class="field">Capacidad<input id="xC" value="${esc(e ? e.capacidad : '')}" placeholder="10"></label>
      <label class="field">Serie<input id="xS" value="${esc(e ? e.serie : '')}" placeholder="S/S"></label>
      <label class="field">Número del extintor<input id="xN" value="${esc(e ? e.numero : '')}"></label>
      <label class="field">N° en la lista<input id="xO" inputmode="numeric" value="${esc(e ? e.n : nextN)}"></label>
    </div>
    ${e ? '<button class="btn sm ghost" id="xBaja" style="color:var(--red);width:auto">Eliminar extintor definitivamente</button>' : ''}`;
  const p = ask(e ? `Datos del extintor #${e.n}` : 'Agregar extintor', e ? 'Corrija lo que haya cambiado (por ejemplo, si lo sustituyeron o lo movieron de área).' : 'Queda guardado en este proyecto para las próximas visitas.', e ? 'Guardar' : 'Agregar y revisar', html);
  let abrirOtro = null;
  if (!e) {
    // Mientras escribe, muestra extintores parecidos para no duplicar (como en la app de detectores)
    const sug = () => {
      const a = norm($('xA').value), n = norm($('xN').value), sr = norm($('xS').value);
      const cand = EXT.filter((x) => (a.length >= 3 && norm(x.area).includes(a)) || (n.length >= 2 && norm(x.numero) === n) || (sr.length >= 4 && sr !== 'ss' && norm(x.serie) === sr)).slice(0, 3);
      $('xSug').innerHTML = cand.length ? `<div class="sugg"><div class="h">¿Ya existe? Tóquelo para abrirlo en vez de agregarlo:</div>${cand.map((x) => `<button type="button" data-sg="${x.id}"><b>#${esc(x.n)}</b>${esc(x.area)}<small>${esc([x.marca, x.tipo, x.numero ? 'N° ' + x.numero : ''].filter(Boolean).join(' · '))}</small></button>`).join('')}</div>` : '';
    };
    for (const id of ['xA', 'xN', 'xS']) $(id).addEventListener('input', sug);
    $('xSug').onclick = (ev) => { const b = ev.target.closest('[data-sg]'); if (!b) return; abrirOtro = b.dataset.sg; $('dlgNo').click(); };
    sug();
  }
  let baja = false; const bb = $('xBaja'); if (bb) bb.onclick = async () => { baja = true; $('dlgSi').click(); };
  if (!(await p)) { if (abrirOtro) { ui.q = ''; ui.filtro = 'all'; route(); abrirFicha(abrirOtro); } return; }
  if (baja) {
    if (!(await ask('Eliminar extintor', `¿Eliminar definitivamente el #${e.n} ${e.area}? Se borra de la lista y de las próximas visitas. No se puede deshacer.`, 'Eliminar'))) return;
    Cloud.borrarExtintor(CID, eid).catch(cloudError); cerrarFicha(); toast(`#${e.n} eliminado`); return;
  }
  const d = { zona: $('xZ').value.trim(), area: $('xA').value.trim().replace(/\s+/g, ' '), marca: $('xM').value.trim(), tipo: $('xT').value, capacidad: $('xC').value.trim(), serie: $('xS').value.trim(), numero: $('xN').value.trim(), n: +$('xO').value || nextN };
  if (!d.area) { toast('Escriba el área del extintor'); return formExtintor(eid, sugerencia, adm); }
  const dup = EXT.find((x) => x.id !== eid && d.numero && norm(x.numero) === norm(d.numero) && norm(x.zona) === norm(d.zona));
  if (dup && !(await ask('Ese número ya existe', `El extintor N° ${d.numero} ya está en ${d.zona || 'esta zona'} (#${dup.n} ${dup.area}). ¿Agregar de todos modos?`, 'Agregar igual'))) return formExtintor(eid, sugerencia, adm);
  if (e) { Cloud.saveExtintor(CID, eid, d).catch(cloudError); Object.assign(e, d); if (ed && ed.eid === eid) { $('shArea').textContent = d.area; $('shZona').textContent = d.zona; pintarFicha(); } toast('Datos actualizados'); route(); return; }
  const id = Cloud.nuevoIdExtintor(CID);
  const nuevo = { ...d, recAnt: '', recProx: '', ph: '', nuevo: true, creado: Date.now(), creadoPor: yo() };
  Cloud.saveExtintor(CID, id, nuevo).catch(cloudError);
  EXT = EXT.concat([{ id, ...nuevo }]).sort((a, b) => (a.n || 0) - (b.n || 0));
  ui.q = ''; ui.filtro = 'all'; guardarResumen(`${yo().split(' ')[0]} agregó el extintor #${d.n} en ${d.area}`); route(); abrirFicha(id);
}


// Carga una lista de extintores desde Excel: actualiza los que tienen el mismo N° y agrega los que no existen.
async function importarExtintores(file) {
  if (!file) return;
  try {
    const wb = new ExcelJS.Workbook(); await wb.xlsx.load(await file.arrayBuffer()); const ws = wb.worksheets[0];
    const txt = (v) => (v == null ? '' : typeof v === 'object' ? String(v.text != null ? v.text : v.result != null ? v.result : (v.richText ? v.richText.map((x) => x.text).join('') : '')) : String(v)).trim();
    const filas = []; ws.eachRow((row, i) => { if (i === 1) return; const g = (k) => txt(row.getCell(k).value); const n = +g(1); if (!n) return; filas.push({ n, zona: g(2), area: g(3), marca: g(4), tipo: g(5), capacidad: g(6), serie: g(7), numero: g(8) }); });
    if (!filas.length) return toast('No encontré filas. Use la columnas: N°, Zona, Área, Marca, Tipo, Capacidad, Serie, Número');
    const por = new Map(S.aExt.map((e) => [e.n, e])); const camb = []; const nuevos = [];
    for (const f of filas) { const e = por.get(f.n); if (!e) { nuevos.push(f); continue; } const dif = Object.keys(f).filter((k) => String(e[k] == null ? '' : e[k]) !== String(f[k])); if (dif.length) camb.push({ e, f }); }
    if (!camb.length && !nuevos.length) return toast('La lista ya está igual que en la app');
    if (!(await ask('Cargar Excel', `${camb.length} extintor(es) se van a corregir y ${nuevos.length} nuevo(s) se van a agregar. Las revisiones ya hechas no se tocan.`, 'Aplicar'))) return;
    for (const { e, f } of camb) await Cloud.saveExtintor(S.aCid, e.id, f);
    if (nuevos.length) await Cloud.addExtintores(S.aCid, nuevos.map((f) => ({ ...f, recAnt: '', recProx: '', ph: '' })));
    toast(`Listo: ${camb.length} corregidos, ${nuevos.length} agregados`);
  } catch (e) { cloudError(e); }
}

/* ======================= 6) Administrador ======================= */
function headAdm(on) {
  return `<header class="ah"><div class="in">
    <div class="l"><img src="${LOGO}" alt="SOS FIRE"><span class="tag">PANEL ADMINISTRADOR</span></div>
    <nav class="anav"><button class="${on === 'p' ? 'on' : ''}" data-act="go" data-h="#/">${ICON.grid}Proyectos</button><button class="${on === 't' ? 'on' : ''}" data-act="go" data-h="#/a/tecnicos">${ICON.users}Técnicos</button><button data-act="go" data-h="#/t">${ICON.phone}Vista del técnico</button></nav>
    <div class="inline">${botonInstalar('btn sm')}${netPill()}<div class="me">${avatar(yo(), Cloud.uid())}<div><b>${esc(yo())}</b><small>Administrador</small></div></div><button class="btn sm ghost" data-act="salir">Salir</button></div>
  </div></header>`;
}
const kpiCard = (ic, cls, label, val, small = '', extra = '', acc = '') => `<div class="kpi"${acc ? ` style="--acc:${acc}"` : ''}><div class="ic ${cls}">${ICON[ic]}</div><span>${label}</span><b>${val}</b>${small ? `<small>${small}</small>` : ''}${extra}</div>`;
const ring = (pct, color) => { const r = 32, c = 2 * Math.PI * r; return `<div class="ring"><svg viewBox="0 0 76 76"><circle cx="38" cy="38" r="${r}" fill="none" stroke="#EEF0F3" stroke-width="7"/><circle cx="38" cy="38" r="${r}" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(c * pct) / 100} ${c}"/></svg><b>${pct}%</b></div>`; };
const logoProy = (c) => { const [bg, fg] = avColor(c.id || c.nombre); return `<span class="lg" style="background:${bg};color:${fg}">${esc(iniciales(c.nombre))}</span>`; };
const tecChips = (v) => {
  const l = Object.entries((v && v.tecnicos) || {}).sort((a, b) => (b[1].visto || 0) - (a[1].visto || 0));
  return l.length ? l.map(([u, t]) => `<span class="chipT">${avatar(t.nombre, u)}${esc(t.nombre)}<span class="dot" style="background:${online(t.visto) ? 'var(--ok)' : '#C9C9C9'}" title="${online(t.visto) ? 'En línea' : 'Desconectado'}"></span></span>`).join('') : '<span class="muted" style="font-size:13px">Nadie ha entrado todavía</span>';
};
const barRes = (r, h = 10) => (r ? `<div class="bar" style="height:${h}px"><i style="width:${(r.ok / Math.max(1, r.total)) * 100}%;background:var(--ok)"></i><i style="width:${(r.bad / Math.max(1, r.total)) * 100}%;background:var(--red)"></i></div>` : `<div class="bar" style="height:${h}px"></div>`);


/* ----- Vencimientos de recarga (todos los proyectos) ----- */
const mesesDif = (mmaaaa) => { const m = String(mmaaaa || '').match(/^(\d{1,2})\/(\d{4})$/); if (!m) return null; const d = new Date(); return (+m[2] * 12 + (+m[1] - 1)) - (d.getFullYear() * 12 + d.getMonth()); };
function vigilarExtintores() {
  if (!esAdmin()) return;
  const ids = new Set(S.clientes.map((c) => c.id));
  for (const cid of Object.keys(UX)) if (!ids.has(cid)) { UX[cid](); delete UX[cid]; delete S.allExt[cid]; }
  for (const cid of ids) if (!UX[cid]) UX[cid] = Cloud.watchExtintores(cid, (l) => { S.allExt[cid] = l.filter((e) => !e.baja); if (location.hash === '#/' || location.hash === '') redraw(); }, cloudError);
}
function vencimientos() {
  const out = { venc: [], mes: [], prox: [] };
  for (const c of S.clientes) for (const e of S.allExt[c.id] || []) {
    const d = mesesDif(e.recProx); if (d == null || d > 1) continue;
    out[d < 0 ? 'venc' : d === 0 ? 'mes' : 'prox'].push({ c, e, d });
  }
  const ord = (a, b) => a.c.nombre.localeCompare(b.c.nombre) || a.d - b.d || (a.e.n || 0) - (b.e.n || 0);
  for (const k in out) out[k].sort(ord);
  return out;
}
const V_TABS = [['mes', 'Vencen este mes'], ['venc', 'Ya vencidos'], ['prox', 'Vencen el próximo mes']];
function seccionVencimientos() {
  const V = vencimientos(); const cargando = S.clientes.some((c) => !S.allExt[c.id]);
  const lista = V[ui.vTab].filter((x) => !ui.vCli || x.c.id === ui.vCli);
  const clientesCon = [...new Map([...V.venc, ...V.mes, ...V.prox].map((x) => [x.c.id, x.c])).values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const porCli = {}; for (const x of lista) (porCli[x.c.id] = porCli[x.c.id] || { c: x.c, n: 0 }).n++;
  const pill = (x) => x.d < 0 ? `<span class="pill bad">Vencida ${esc(x.e.recProx)}</span>` : x.d === 0 ? `<span class="pill warn">Vence ${esc(x.e.recProx)}</span>` : `<span class="pill new">Vence ${esc(x.e.recProx)}</span>`;
  return `<section class="sec" id="secVenc"><div class="card2"><div class="hd"><div class="sech" style="flex:1"><div class="t"><span class="ic a">${ICON.wrench}</span><h2>Vencimientos de recarga</h2><span class="sub" style="margin:0">de todos los proyectos · ${esc(MESES[new Date().getMonth()])} ${new Date().getFullYear()}</span></div></div>
      <div class="inline"><select class="sm" id="vCli" aria-label="Cliente"><option value="">Todos los clientes</option>${clientesCon.map((c) => `<option value="${c.id}" ${ui.vCli === c.id ? 'selected' : ''}>${esc(c.nombre)}</option>`).join('')}</select>
      <button class="btn sm xl" data-act="xlsxVenc" ${lista.length ? '' : 'disabled style="opacity:.5"'}>⬇ Excel</button></div></div>
    <div class="vtabs">${V_TABS.map(([k, l]) => `<button class="vtab ${ui.vTab === k ? 'on' : ''} ${k}" data-act="vTab" data-id="${k}">${l}<span>${V[k].filter((x) => !ui.vCli || x.c.id === ui.vCli).length}</span></button>`).join('')}</div>
    ${lista.length && !ui.vCli && Object.keys(porCli).length > 1 ? `<div class="vcli">${Object.values(porCli).map((p) => `<button class="tg" data-act="vCliSel" data-id="${p.c.id}">${esc(p.c.nombre)} <b>${p.n}</b></button>`).join('')}</div>` : ''}
    <div class="tbl" style="max-height:440px;overflow-y:auto"><table><thead><tr><th>Cliente</th><th>N°</th><th>Zona · Área</th><th>Extintor</th><th>Serie</th><th>Última recarga</th><th>Próxima recarga</th></tr></thead><tbody>
      ${lista.map((x) => `<tr><td><div class="pn">${logoProy(x.c)}<div><b>${esc(x.c.nombre)}</b><small>${esc(x.c.lugar && x.c.lugar !== x.c.nombre ? x.c.lugar : '')}</small></div></div></td><td><b>${esc(x.e.n)}</b></td><td>${esc(zonaCorta(x.e.zona))}<small style="display:block;color:var(--mut)">${esc(x.e.area)}</small></td><td>${esc([x.e.marca, x.e.tipo, x.e.capacidad].filter(Boolean).join(' · '))}</td><td>${esc(x.e.serie || '—')}</td><td>${esc(x.e.recAnt || '—')}</td><td>${pill(x)}</td></tr>`).join('')
        || `<tr><td colspan="7" style="text-align:center;padding:28px;color:var(--mut)">${cargando ? 'Cargando extintores…' : ui.vTab === 'venc' ? 'No hay extintores con la recarga vencida.' : ui.vTab === 'mes' ? 'Ningún extintor vence este mes.' : 'Ningún extintor vence el próximo mes.'}<br><small>La fecha sale de la "próxima recarga" que anotan los técnicos en cada extintor.</small></td></tr>`}
    </tbody></table></div></div></section>`;
}
async function exportVencimientos() {
  const V = vencimientos(); const lista = V[ui.vTab].filter((x) => !ui.vCli || x.c.id === ui.vCli); if (!lista.length) return;
  const titulo = (V_TABS.find((t) => t[0] === ui.vTab) || [, ''])[1];
  const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Vencimientos', { views: [{ state: 'frozen', ySplit: 6, showGridLines: false }] });
  const cols = [['Cliente', 26], ['Lugar', 18], ['N°', 6], ['Zona', 24], ['Área', 32], ['Marca', 12], ['Tipo', 8], ['Capacidad', 10], ['Serie', 14], ['N° extintor', 11], ['Última recarga', 13], ['Próxima recarga', 14], ['Estado', 17]];
  ws.columns = cols.map(([, w]) => ({ width: w }));
  ws.addImage(wb.addImage({ base64: LOGO_B64, extension: 'png' }), { tl: { col: 0.15, row: 0.2 }, ext: { width: 150, height: 58 } });
  ws.mergeCells('C2:M2'); ws.getCell('C2').value = 'RECARGA DE EXTINTORES · ' + titulo.toUpperCase(); ws.getCell('C2').font = { bold: true, size: 15, color: { argb: 'FFC90012' } };
  ws.mergeCells('C3:M3'); ws.getCell('C3').value = `${ui.vCli ? cliente(ui.vCli).nombre + ' · ' : 'Todos los clientes · '}${MESES[new Date().getMonth()]} ${new Date().getFullYear()} · ${lista.length} extintores`; ws.getCell('C3').font = { size: 11, color: { argb: 'FF555555' } };
  const hr = ws.getRow(6); cols.forEach(([t], i) => { const c = hr.getCell(i + 1); c.value = t; c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC90012' } }; c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; }); hr.height = 24;
  const brd = { style: 'thin', color: { argb: 'FFDDDDDD' } };
  lista.forEach((x, i) => { const e = x.e; const r = ws.getRow(7 + i);
    [x.c.nombre, x.c.lugar || '', e.n, e.zona || '', e.area || '', e.marca || '', String(e.tipo || '').replace(/₂/g, '2'), e.capacidad || '', e.serie || '', e.numero || '', e.recAnt || '', e.recProx || '', x.d < 0 ? 'Vencida' : x.d === 0 ? 'Vence este mes' : 'Próximo mes']
      .forEach((v, j) => { const c = r.getCell(j + 1); c.value = v; c.border = { top: brd, bottom: brd, left: brd, right: brd }; c.alignment = { vertical: 'middle', wrapText: j === 4 || j === 3, horizontal: [2, 6, 7, 10, 11, 12].includes(j) ? 'center' : 'left' }; if (i % 2) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F8F8' } }; });
    const st = r.getCell(13); st.font = { bold: true, color: { argb: x.d < 0 ? 'FFC90012' : x.d === 0 ? 'FF8A4A00' : 'FF1A56C4' } }; });
  ws.autoFilter = { from: 'A6', to: `M${6 + lista.length}` };
  ws.pageSetup = { paperSize: 1, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '6:6', horizontalCentered: true };
  const buf = await wb.xlsx.writeBuffer();
  descargar(`Vencimientos_${titulo.replace(/\s+/g, '_')}_${ui.vCli ? String(cliente(ui.vCli).nombre).replace(/[^\wÁÉÍÓÚáéíóúñÑ]+/g, '_') + '_' : ''}${hoyISO()}.xlsx`, new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
}

function renderAHome() {
  vigilarExtintores();
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
  const nMes = new Set([...mesIds, ...mes.map((c) => c.id)]).size;
  const extHoy = S.mes.filter((v) => v.fecha === hoy).reduce((a, v) => a + ((v.resumen && v.resumen.done) || 0), 0);

  const card = (c) => {
    const v = visitaAbiertaDe(c.id); const ult = v || visitasMesDe(c.id)[0]; const r = ult && ult.resumen;
    const pct = r ? Math.round((r.done / Math.max(1, r.total)) * 100) : 0;
    const st = v ? '<span class="stt live"><i></i>En curso</span>' : ult ? '<span class="stt done"><i></i>Terminado</span>' : c.frecuencia === 'semanal' ? `<span class="stt wait"><i></i>Próxima: ${DIAS[c.dia]}</span>` : '<span class="stt done"><i></i>Sin visita</span>';
    const tecs = Object.entries((ult && ult.tecnicos) || {}).sort((a, b) => (b[1].visto || 0) - (a[1].visto || 0));
    const stack = tecs.slice(0, 5).map(([u, t]) => avatar(t.nombre, u).replace('</span>', `${online(t.visto) && v ? '<i class="on"></i>' : ''}</span>`)).join('');
    const meta = [r ? `${r.total} extintores` : '', frecTxt(c), c.lugar && c.lugar !== c.nombre ? c.lugar : ''].filter(Boolean).map(esc).join(' · ');
    return `<div class="pc" data-act="go" data-h="#/a/c/${c.id}" role="link" tabindex="0">
      <div class="tp">${logoProy(c)}<div class="tt"><b>${esc(c.nombre)}</b><span>${meta}</span></div>${st}</div>
      <div class="mid">${ring(pct, r && r.bad ? '#C90012' : '#167C3A')}
        <div class="stats"><div><small>Revisados</small><b>${r ? r.done : 0}<span style="font-size:12px;color:var(--mut);font-weight:500"> / ${r ? r.total : 0}</span></b></div>
        <div class="r"><small>Con falla</small><b>${r ? r.bad : 0}</b></div><div class="a"><small>Por vencer</small><b>${r ? r.pronto || 0 : 0}</b></div></div></div>
      <div class="team">${tecs.length ? `<div class="stack">${stack}</div><span>${esc(tecs.map(([, t]) => t.nombre.split(' ')[0]).join(', '))}</span>` : '<span>Sin técnicos asignados todavía</span>'}</div>
      <div class="ft"><span class="act">${ICON.clock}${ult && ult.ultimaAct ? esc(ult.ultimaAct.texto) + ' · ' + hace(ult.ultimaAct.t) : ult ? 'Última visita ' + fmtFecha(ult.fecha) : 'Sin actividad'}</span>
        <span class="go"><button class="pinb" data-act="fijar" data-id="${c.id}" title="${c.fijado ? 'Quitar de fijados' : 'Fijar arriba'}">${ICON.pinS}${c.fijado ? 'Desfijar' : 'Fijar'}</button><b>Ver detalle →</b></span></div>
    </div>`;
  };
  const secH = (ic, cls, titulo, n, sub, extra = '') => `<div class="sech"><div class="t"><span class="ic ${cls}">${ICON[ic]}</span><h2>${titulo}</h2>${n != null ? `<span class="count">${n}</span>` : ''}<span class="sub" style="margin:0">${sub}</span></div>${extra}</div>`;
  const fechaLarga = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });

  root.innerHTML = `<div class="adm">${headAdm('p')}<main class="am">
    <div class="sech"><div><div class="eyebrow">${esc(fechaLarga)}</div><h1>Proyectos</h1><div class="sub">Seguimiento en tiempo real de las inspecciones de extintores. Los proyectos que crean los técnicos aparecen al instante.</div></div><button class="btn pri" data-act="go" data-h="#/nuevo">+ Nuevo proyecto</button></div>
    <div class="kpis">
      ${kpiCard('live', 'g', 'En curso hoy', S.activas.length, S.activas.length === 1 ? 'visita abierta' : 'visitas abiertas', '', S.activas.length ? '#167C3A' : '')}
      ${kpiCard('users', 'b', 'Técnicos en campo', tecOn.size, 'conectados ahora')}
      ${kpiCard('folder', 'v', 'Proyectos este mes', nMes, `${extHoy} extintores revisados hoy`)}
      ${kpiCard('alert', 'r', 'Fallas encontradas hoy', fallasHoy, fallasHoy ? 'requieren atención' : 'sin novedades', '', fallasHoy ? '#C90012' : '')}
      ${(() => { const V = vencimientos(); return `<div class="kclick" data-act="verVenc">${kpiCard('wrench', 'a', 'Recargas este mes', V.mes.length, V.venc.length ? `<span style="color:var(--red-ink);font-weight:600">+ ${V.venc.length} ya vencidas</span> · ver lista →` : 'ver lista →', '', V.mes.length || V.venc.length ? '#B25E00' : '')}</div>`; })()}
    </div>
    ${!S.clientes.length ? `<div class="box"><h2>Empecemos</h2><p class="sub" style="margin:0">Cargue Decameron Salinitas con sus ${DECAMERON.extintores.length} extintores de la hoja 2, o cree un proyecto nuevo.</p><div class="inline"><button class="btn pri" data-act="cargarDecameron">Cargar Decameron Salinitas</button><button class="btn" data-act="go" data-h="#/nuevo">Crear otro proyecto</button></div></div>` : ''}
    ${fij.length ? `<section class="sec">${secH('pinS', 'r', 'Fijados', fij.length, 'clientes de visita frecuente, siempre arriba')}<div class="gridP">${fij.map(card).join('')}</div></section>` : ''}
    <section class="sec">${secH('cal', 'b', `Este mes · ${MESES[new Date().getMonth()]}`, mes.length, 'el 1.º del próximo mes pasan al archivo')}
      <div class="gridP">${mes.map(card).join('')}<div class="pc add" data-act="go" data-h="#/nuevo" role="link" tabindex="0"><span class="lg">+</span>Nuevo proyecto</div></div></section>
    ${S.clientes.length ? seccionVencimientos() : ''}
    <section class="sec"><div class="card2"><div class="hd">${secH('arch', 'n', 'Archivo', arch.length, 'proyectos anteriores').replace('class="sech"', 'class="sech" style="flex:1"')}
        <div class="inline"><label class="searchA">${ICON.search}<input id="aq" placeholder="Buscar cliente o lugar" value="${esc(ui.hq)}"></label>
        <select class="sm" id="ames" aria-label="Mes"><option value="">Todos los meses</option>${meses.map((m) => `<option value="${m}" ${ui.hmes === m ? 'selected' : ''}>${MESES[+m.slice(5) - 1]} ${m.slice(0, 4)}</option>`).join('')}</select></div></div>
      <div class="tbl"><table><thead><tr><th>Proyecto</th><th>Última visita</th><th>Frecuencia</th><th>Creado por</th><th style="text-align:right;padding-right:18px">Acciones</th></tr></thead><tbody>
        ${arch.length ? arch.map((c) => `<tr><td><div class="pn">${logoProy(c)}<div><b>${esc(c.nombre)}</b><small>${esc(c.lugar || '')}</small></div></div></td><td>${c.ultimaVisita ? fmtFecha(c.ultimaVisita.fecha) : '—'}</td><td>${esc(frecTxt(c))}</td><td>${esc(c.creadoPor || '—')}</td><td style="text-align:right;padding-right:18px;white-space:nowrap"><button class="pinb" data-act="fijar" data-id="${c.id}">${ICON.pinS}Fijar</button> <button class="btn sm" data-act="go" data-h="#/a/c/${c.id}">Ver</button></td></tr>`).join('') : `<tr><td colspan="5" class="muted" style="text-align:center;padding:28px">${q || ui.hmes ? 'No hay proyectos con ese filtro.' : 'El archivo está vacío. Los proyectos de meses anteriores aparecerán aquí.'}</td></tr>`}
      </tbody></table></div></div></section>
    <div class="box"><div class="setrow"><span class="ic n">${ICON.db}</span><div class="tx"><h2>Reportes guardados</h2><div class="sub">Las visitas terminadas se borran solas después de este plazo. Los clientes y sus extintores no se borran.</div></div>
      <select class="sm" id="aret">${[2, 3, 6, 12, 24].map((m) => `<option value="${m}" ${(S.config.retencionMeses || 6) === m ? 'selected' : ''}>Guardar ${m} meses</option>`).join('')}</select></div></div>
  </main></div>`;
  const aq = $('aq'); aq.oninput = () => { ui.hq = aq.value; const p = aq.selectionStart; renderAHome(); const n = $('aq'); n.focus(); n.setSelectionRange(p, p); };
  $('ames').onchange = (e) => { ui.hmes = e.target.value; renderAHome(); };
  if ($('vCli')) $('vCli').onchange = (e) => { ui.vCli = e.target.value; renderAHome(); };
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
  const pctT = Math.round((r.done / Math.max(1, r.total)) * 100);
  const hd = (ic, cls, t, n, extra = '') => `<div class="hd"><div class="sech"><div class="t"><span class="ic ${cls}">${ICON[ic]}</span><h2>${t}</h2>${n != null ? `<span class="count">${n}</span>` : ''}</div></div>${extra}</div>`;
  const stV = v ? (v.estado === 'en_curso' ? '<span class="stt live"><i></i>Visita en curso</span>' : '<span class="stt done"><i></i>Visita terminada</span>') : '';
  const tecs = v ? Object.entries(v.tecnicos || {}) : [];
  root.innerHTML = `<div class="adm">${headAdm('p')}<main class="am">
    <button class="back2" data-act="go" data-h="#/">‹ Todos los proyectos</button>
    <div class="phead"><div class="pl">${logoProy(c).replace('class="lg"', 'class="lg"')}<div style="min-width:0"><h1>${esc(c.nombre)}${c.lugar && c.lugar !== c.nombre ? ` <span style="color:var(--mut);font-weight:500">· ${esc(c.lugar)}</span>` : ''}</h1>
        <div class="tags">${stV}<span class="tg">${ICON.ext}${ext.length} extintores</span><span class="tg">${ICON.cal}${esc(frecTxt(c))}</span>${c.fijado ? `<span class="tg">${ICON.pinS}Fijado</span>` : ''}${c.creadoPor ? `<span class="tg">${ICON.users}Creado por ${esc(c.creadoPor)}</span>` : ''}</div></div></div>
      <div class="inline">
        ${S.aVisitas.length ? `<select class="sm" id="selV" aria-label="Visita">${S.aVisitas.map((x) => `<option value="${x.id}" ${x.id === S.aVid ? 'selected' : ''}>Visita ${fmtFecha(x.fecha)}${x.estado === 'en_curso' ? ' (en curso)' : ''}</option>`).join('')}</select>` : ''}
        ${v ? `<button class="btn" data-act="go" data-h="#/v/${v.id}">${ICON.phone.replace('<svg', '<svg width="16" height="16"')}Ver como técnico</button><button class="btn xl" data-act="xlsxA">⬇ Excel</button><button class="btn pri" data-act="pdfA">⬇ PDF</button>` : `<button class="btn pri" data-act="nuevaVisitaA">Iniciar visita de hoy</button>`}
      </div></div>
    ${v ? `<div class="kpis">
      ${kpiCard('live', 'g', 'Avance', pctT + ' %', '', barRes(r, 8))}
      ${kpiCard('check', 'b', 'Revisados', `${r.done} <span style="font-size:16px;color:var(--mut);font-weight:500">/ ${r.total}</span>`)}
      ${kpiCard('clock', 'n', 'Pendientes', r.total - r.done)}
      ${kpiCard('alert', 'r', 'Con falla', r.bad, '', '', r.bad ? '#C90012' : '')}
      ${kpiCard('wrench', 'a', 'Recarga por vencer', r.pronto, '', '', r.pronto ? '#B25E00' : '')}
      ${kpiCard('grid', 'v', 'Soportes por cambiar', r.sop || 0, r.sop ? 'pendientes en este proyecto' : 'ninguno pendiente')}</div>
    <div class="cols"><div class="main">
      <div class="card2">${hd('grid', 'g', 'Avance por zona', zonas.length)}<div class="bd"><div class="zg">${zonas.map((z) => `<div class="zt ${z.bad ? 'hasbad' : z.d === z.t ? 'full' : ''}"><div class="zh"><b title="${esc(z.z)}">${esc(zonaCorta(z.z))}</b><span>${Math.round((z.d / Math.max(1, z.t)) * 100)}%</span></div><div class="bar" style="height:7px"><i style="width:${(z.ok / z.t) * 100}%;background:var(--ok)"></i><i style="width:${(z.bad / z.t) * 100}%;background:var(--red)"></i></div><div class="zf"><span>${z.d} de ${z.t} revisados</span>${z.bad ? `<span class="r">${z.bad} con falla</span>` : z.d === z.t ? '<span style="color:var(--ok);font-weight:600">Completa</span>' : ''}</div></div>`).join('') || '<span class="muted">Sin extintores todavía.</span>'}</div></div></div>
      <div class="card2">${hd('alert', 'r', 'Hallazgos y vencimientos', hall.length)}<div class="tbl"><table><thead><tr><th>N°</th><th>Área</th><th>Extintor</th><th>Problema</th><th>Técnico</th></tr></thead><tbody>
        ${hall.map((h) => `<tr><td><b>${esc(h.e.n)}</b></td><td>${esc(h.e.area)}</td><td>${esc([h.e.marca, h.e.tipo, h.e.capacidad].filter(Boolean).join(' · '))}</td><td><span class="pill ${h.tipo === 'Falla' || h.tipo === 'Vencida' ? 'bad' : 'warn'}">${h.tipo}</span> ${esc(h.det)}</td><td>${esc((h.by || '—').split(' ')[0])}</td></tr>`).join('') || `<tr><td colspan="5" style="text-align:center;padding:26px;color:var(--mut)"><span style="display:inline-flex;align-items:center;gap:8px"><span class="ic g" style="width:28px;height:28px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center">${ICON.check.replace('<svg', '<svg width="14" height="14"')}</span>Sin hallazgos ni vencimientos</span></td></tr>`}
      </tbody></table></div></div>
      ${tarjetaResumen(v, c, ext, rev, true)}
    </div>
    <div class="side">
      <div class="card2 side2">${hd('users', 'b', v.estado === 'en_curso' ? 'Técnicos en campo' : 'Técnicos de la visita', tecs.length)}<div class="bd" style="padding-top:4px;padding-bottom:6px">${tecs.map(([u, t]) => `<div class="tcard">${avatar(t.nombre, u).replace('</span>', online(t.visto) ? '<i class="on"></i></span>' : '</span>')}<div class="i"><b>${esc(t.nombre)}</b><small>${online(t.visto) ? '<span style="color:var(--ok);font-weight:600">● En línea</span>' : t.visto ? 'Visto ' + hace(t.visto) : 'Desconectado'}</small></div><div class="n"><b>${porTec[u] || 0}</b><small>revisados</small></div></div>`).join('') || '<p class="muted" style="margin:10px 0">Nadie ha entrado todavía.</p>'}</div></div>
      <div class="card2 side2">${hd('live', 'g', v.estado === 'en_curso' ? 'Actividad en vivo' : 'Actividad', null)}<div class="bd"><div class="tl">${feed.map((x) => { const e = ext.find((y) => y.id === x.eid); const s = estado(x); return `<div class="it"><span class="dt ic ${s === 'bad' ? 'r' : 'g'}">${s === 'bad' ? ICON.alert : ICON.check}</span><div class="tx"><b>${esc((x.by || '').split(' ')[0])}</b> ${s === 'bad' ? 'marcó con falla' : 'revisó'} <b>#${esc(e ? e.n : '')}</b> ${esc(e ? e.area : '')}${s === 'bad' ? ' · ' + esc(fallasDe(x).join(', ')) : ''}<small>${new Date(x.t).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })} · ${hace(x.t)}</small></div></div>`; }).join('') || '<span class="muted">Sin revisiones todavía.</span>'}</div></div></div>
      <div class="card2 side2">${hd('check', 'v', 'Firmas', null)}<div class="bd"><div class="firmasRO">
        <div><span class="lbl">Equipo SOS FIRE</span>${F(v).tec ? `<img src="${F(v).tec}" alt="Firma técnico">` : '<div class="nofirma">Sin firma todavía</div>'}<b>Equipo SOS FIRE</b></div>
        <div><span class="lbl">${esc(encLabel(c))}</span>${F(v).enc ? `<img src="${F(v).enc}" alt="Firma encargado">` : '<div class="nofirma">Sin firma todavía</div>'}<b>${esc(F(v).encNombre || '—')}</b></div></div></div></div>
    </div></div>` : `<div class="emptyc">Este proyecto no tiene visitas todavía. Pulse <b>Iniciar visita de hoy</b> para empezar.</div>`}
    <div class="cols"><div class="main"><div class="card2">${hd('clock', 'v', 'Historial de visitas', S.aVisitas.length)}<div class="tbl"><table><thead><tr><th>Fecha</th><th>Técnicos</th><th>Resultado</th><th>Estado</th><th style="text-align:right;padding-right:18px">Reporte</th></tr></thead><tbody>
      ${S.aVisitas.map((x) => `<tr${x.id === S.aVid ? ' style="background:#FAFAFB"' : ''}><td><b>${fmtFecha(x.fecha)}</b></td><td><div class="stack">${Object.entries(x.tecnicos || {}).slice(0, 4).map(([u, t]) => avatar(t.nombre, u)).join('')}</div></td><td>${x.resumen ? `<b>${x.resumen.done}/${x.resumen.total}</b> revisados${x.resumen.bad ? ` · <span style="color:var(--red-ink);font-weight:600">${x.resumen.bad} con falla</span>` : ''}` : '—'}</td><td>${x.estado === 'en_curso' ? '<span class="stt live"><i></i>En curso</span>' : '<span class="stt done"><i></i>Terminada</span>'}</td><td style="text-align:right;padding-right:18px;white-space:nowrap"><button class="btn sm" data-act="selV" data-id="${x.id}">Ver</button> <button class="btn sm" data-act="xlsxV" data-id="${x.id}" style="color:#107C41">Excel</button> <button class="btn sm" data-act="pdfV" data-id="${x.id}" style="color:var(--red)">PDF</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted" style="text-align:center;padding:24px">Sin visitas.</td></tr>'}
    </tbody></table></div></div>
      <div class="card2">${hd('wrench', 'n', 'Extintores del proyecto', ext.length)}<div class="bd">
        <div class="inline" style="margin-bottom:10px"><input id="aExtQ" placeholder="Buscar por N°, área, marca, serie…" style="flex:1;min-width:160px;height:38px;border:1.5px solid #ddd;border-radius:10px;padding:0 10px"><button class="btn sm" data-act="aExtNuevo">+ Agregar</button><button class="btn sm" data-act="aExtExcel">⬇ Lista Excel</button><button class="btn sm" data-act="aExtImp">⬆ Cargar Excel</button></div>
        <div class="tbl" style="max-height:420px;overflow:auto"><table><thead><tr><th>N°</th><th>Zona</th><th>Área</th><th>Extintor</th><th></th></tr></thead><tbody id="aExtT">${ext.map((e) => `<tr data-q="${esc(norm([e.n, e.zona, e.area, e.marca, e.tipo, e.capacidad, e.serie, e.numero].join(' ')))}"><td><b>${esc(e.n)}</b></td><td>${esc(zonaCorta(e.zona || ''))}</td><td>${esc(e.area)}</td><td>${esc([e.marca, e.tipo, e.capacidad, e.numero && 'N° ' + e.numero].filter(Boolean).join(' · '))}</td><td style="text-align:right"><button class="btn sm" data-act="aExtEd" data-id="${e.id}">✎ Editar</button></td></tr>`).join('')}</tbody></table></div></div></div>
    </div>
    <div class="side"><div class="card2 side2">${hd('wrench', 'n', 'Datos del proyecto', null)}<div class="bd nore">
      <label class="field">Cliente<input id="cN" value="${esc(c.nombre)}"></label>
      <label class="field">Lugar o sede<input id="cL" value="${esc(c.lugar || '')}"></label>
      <label class="field">Frecuencia<select id="cF">${[['unica', 'Una vez'], ['mensual', 'Mensual'], ['semanal', 'Semanal']].map(([k, l]) => `<option value="${k}" ${c.frecuencia === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      ${c.frecuencia === 'semanal' ? `<label class="field">Día de visita<select id="cD">${DIAS.map((d, i) => `<option value="${i}" ${+c.dia === i ? 'selected' : ''}>${d}</option>`).join('')}</select></label>` : ''}
      <div class="lbl" style="margin:6px 0 2px">Formato del reporte</div>
      ${c.formato ? `<div class="muted" style="font-size:12.5px;margin-bottom:6px">Este cliente usa su propio Excel. El técnico revisa: <b>${esc(c.formato.items.filter((i) => i.t === 'chk').map((i) => i.l).join(', '))}</b>.</div>` : '<div class="muted" style="font-size:12.5px;margin-bottom:6px">Usa el formato estándar de SOS FIRE (el de Decameron). Para que el reporte salga con las columnas de otro cliente, suba su Excel.</div>'}
      <div class="inline" style="margin-bottom:12px"><button class="btn sm" data-act="fmtSubir">⬆ ${c.formato ? 'Cambiar Excel del cliente' : 'Subir Excel del cliente'}</button>${c.formato ? '<button class="btn sm ghost" data-act="fmtQuitar">Volver al formato estándar</button>' : ''}</div>
      <div class="inline"><button class="btn sm pri" data-act="guardarCliente">Guardar cambios</button><button class="btn sm" data-act="fijar" data-id="${c.id}">${c.fijado ? 'Quitar de fijados' : 'Fijar arriba'}</button>
      ${v && v.estado === 'en_curso' ? '<button class="btn sm" data-act="terminarA">Terminar visita</button>' : v ? '<button class="btn sm" data-act="reabrirA">Reabrir visita</button>' : ''}</div>
      <div class="inline" style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line)">${v ? '<button class="btn sm" data-act="borrarVisitaA" style="color:#C90012">Borrar esta visita</button>' : ''}<button class="btn sm" data-act="borrarClienteA" style="color:#C90012">Eliminar proyecto</button></div>
    </div></div></div></div>
  </main></div>`;
  if ($('aExtQ')) { $('aExtQ').value = ui.aq || ''; const fl = () => { const q = norm($('aExtQ').value); ui.aq = $('aExtQ').value; document.querySelectorAll('#aExtT tr').forEach((tr) => { tr.style.display = !q || tr.dataset.q.includes(q) ? '' : 'none'; }); }; $('aExtQ').oninput = fl; fl(); }
  if ($('selV')) $('selV').onchange = (e) => { verVisitaAdm(e.target.value); redraw(); };
}

// ----- Técnicos -----
const nuevaClave = () => 'SOS-' + Math.floor(1000 + Math.random() * 9000);
let claveTec = nuevaClave(); const formTec = { tN: '', tU: '', tR: 'tecnico' }; let htmlTec = '';
function renderATecnicos() {
  const enVisita = (u) => S.activas.find((v) => v.tecnicos && v.tecnicos[u] && online(v.tecnicos[u].visto));
  const visMes = (u) => S.mes.filter((v) => v.tecnicos && v.tecnicos[u]).length;
  const us = S.usuarios.slice().sort((a, b) => (b.activo - a.activo) || a.nombre.localeCompare(b.nombre));
  const html = `<div class="adm">${headAdm('t')}<main class="am"><div class="cols">
    <section class="main"><div><h1>Técnicos</h1><div class="sub">Se registran una sola vez. Con su usuario pueden entrar a cualquier proyecto y crear proyectos nuevos.</div></div>
      <div class="tbl"><table><thead><tr><th>Persona</th><th>Ahora</th><th>Visitas este mes</th><th>Rol</th><th style="text-align:right;padding-right:18px">Acceso</th></tr></thead><tbody>
      ${us.map((u) => { const v = enVisita(u.id); return `<tr><td><div class="trow">${avatar(u.nombre, u.id)}<div class="i"><b>${esc(u.nombre)}</b><span>${esc(u.usuario || u.email || '')}</span></div></div></td>
        <td>${v ? `<span class="pill ok">${esc(v.cliente)}</span>` : '<span class="muted">—</span>'}</td><td><b>${visMes(u.id)}</b></td><td>${u.rol === 'admin' ? 'Administrador' : 'Técnico'}</td>
        <td style="text-align:right;padding-right:18px">${u.id === Cloud.uid() ? '<span class="muted">Usted</span>' : `<button class="btn sm ${u.activo ? '' : 'pri'}" data-act="acceso" data-id="${u.id}">${u.activo ? 'Quitar acceso' : 'Dar acceso'}</button> <button class="btn sm" data-act="borrarUsu" data-id="${u.id}" style="color:#C90012">Eliminar</button>`}</td></tr>`; }).join('') || '<tr><td colspan="5" class="muted">Todavía no hay técnicos.</td></tr>'}
      </tbody></table></div></section>
    <section class="side"><div class="box nore"><h2>Agregar técnico</h2>
      <label class="field">Nombre completo<input id="tN" placeholder="Jorge Ramírez" value="${esc(formTec.tN)}"></label>
      <label class="field">Usuario (para entrar)<input id="tU" placeholder="jorge" autocapitalize="off" value="${esc(formTec.tU)}"></label>
      <label class="field">Contraseña inicial<input id="tP" value="${esc(claveTec)}"></label>
      <label class="field">Rol<select id="tR"><option value="tecnico">Técnico</option><option value="admin" ${formTec.tR === 'admin' ? 'selected' : ''}>Administrador</option></select></label>
      <span class="muted" style="font-size:12.5px">La app le pide cambiar la contraseña la primera vez que entra.</span>
      <button class="btn pri" data-act="crearTec">Crear</button><div class="err" id="tErr"></div>
      <div class="muted" style="border-top:1px solid var(--line);padding-top:10px;font-size:13px">Si alguien deja la empresa, se le quita el acceso con un clic. Sus revisiones quedan en los reportes.</div>
    </div></section></div></main></div>`;
  if (html !== htmlTec || !document.getElementById('tN')) { htmlTec = html; root.innerHTML = html; }
  for (const id of ['tN', 'tU', 'tP', 'tR']) { const el = $(id); if (el) el.oninput = el.onchange = () => { if (id === 'tP') claveTec = el.value; else formTec[id] = el.value; }; }
}


/* ======================= Formato propio de cada cliente (Excel que sube el administrador) ======================= */
const TIPOS_COL = [['n', 'N°'], ['zona', 'Zona'], ['area', 'Área / ubicación'], ['marca', 'Marca'], ['tipo', 'Tipo'], ['cap', 'Capacidad'], ['serie', 'Serie'], ['num', 'Número del extintor'], ['chk', 'Revisión del técnico'], ['recA', 'Recarga anterior'], ['recP', 'Próxima recarga'], ['ph', 'PH'], ['alt', 'Altura'], ['obs', 'Observaciones'], ['skip', 'No usar']];
const REG_COL = [[/^n[°ºo.]?$|^no\.?$|^num\.?$|^item$|^#$/, 'n'], [/zona/, 'zona'], [/area|ubicaci|lugar|sitio/, 'area'], [/marca/, 'marca'], [/^tipo|tipo de ext/, 'tipo'], [/capacidad|peso|libras|lbs/, 'cap'], [/serie/, 'serie'], [/numero|n° ext|no\. ext|codigo|cod\./, 'num'], [/observ|comentari|nota/, 'obs'], [/^ph|prueba hidro/, 'ph'], [/altura/, 'alt'], [/anterior/, 'recA'], [/proxim/, 'recP'], [/presion|manometro|cilindro|senal|marchamo|manguera|boquilla|etiqueta|estado|instrucc|sello|seguro|gabinete|soporte|pin\b/, 'chk']];
const clasificaCol = (t) => { const n = norm(t); if (!n) return null; for (const [re, k] of REG_COL) if (re.test(n)) return k; return null; };
function celTxt(ws, r, c) {
  const cell = ws.getCell(r, c); const m = cell.isMerged && cell.master ? cell.master : cell; const v = m.value; if (v == null) return '';
  if (typeof v === 'object') return String(v.richText ? v.richText.map((x) => x.text).join('') : v.text != null ? v.text : v.result != null ? v.result : '').trim();
  return String(v).trim();
}
// Lee el Excel del cliente: busca la fila de títulos y arma la lista de columnas (el administrador la confirma después)
function parsearPlantilla(ws) {
  const maxC = ws.columnCount; let best = 0, hr = 0;
  for (let r = 1; r <= Math.min(30, ws.rowCount); r++) { let sc = 0; for (let c = 1; c <= maxC; c++) { const t = celTxt(ws, r, c); if (t && clasificaCol(t)) sc++; } if (sc > best) { best = sc; hr = r; } }
  if (best < 3) return null;
  const SUB = /^(bueno|buena|buen|malo|mala|mal|si|no|anterior|proxima|proximo|ant|prox)$/;
  let nSub = 0; for (let c = 1; c <= maxC; c++) if (SUB.test(norm(celTxt(ws, hr + 1, c)))) nSub++;
  const hasSub = nSub >= 2; const fi = hr + (hasSub ? 2 : 1);
  const grupos = new Map();
  for (let c = 1; c <= maxC; c++) {
    const cell = ws.getCell(hr, c); const t = celTxt(ws, hr, c); const sub = hasSub ? norm(celTxt(ws, hr + 1, c)) : '';
    if (!t && !sub) continue;
    const key = cell.isMerged && cell.master ? cell.master.address : cell.address;
    if (!grupos.has(key)) grupos.set(key, { l: t, cols: [], subs: [] });
    const g = grupos.get(key); g.cols.push(c); g.subs.push(sub);
  }
  const items = []; let nk = 0;
  for (const g of grupos.values()) {
    const bm = g.subs.every((x) => /^(bueno|buena|buen|malo|mala|mal)$/.test(x)), sn = g.subs.every((x) => /^(si|no)$/.test(x));
    if (g.cols.length === 2 && (bm || sn)) { items.push({ t: 'chk', l: g.l, o: bm ? 'bm' : 'sn', cb: g.cols[0], cm: g.cols[1] }); continue; }
    if (g.subs.some((x) => /^(anterior|ant)$/.test(x)) && g.subs.some((x) => /^(proxima|proximo|prox)$/.test(x))) { g.cols.forEach((c, i) => items.push({ t: /^ant/.test(g.subs[i]) ? 'recA' : 'recP', l: (g.l + ' ' + g.subs[i]).trim(), c })); continue; }
    g.cols.forEach((c, i) => { const t = [g.l, g.subs[i]].filter(Boolean).join(' '); const tp = clasificaCol(g.l) || clasificaCol(t) || 'skip'; items.push({ t: tp, l: g.subs[i] && g.cols.length > 1 ? t : g.l, o: 'bm', c }); });
  }
  return { hoja: ws.name, hr, fi, cmax: maxC, items };
}
const letraCol = (n) => { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
// Pantalla donde el administrador confirma qué es cada columna del Excel
async function confirmarColumnas(fm) {
  const html = `<div style="max-height:52vh;overflow:auto;text-align:left"><div style="display:grid;grid-template-columns:44px 1fr 150px;gap:6px;font-size:11.5px;font-weight:700;color:var(--muted);margin-bottom:4px"><span>Col.</span><span>Título en su Excel</span><span>Es…</span></div>${fm.items.map((it, i) => `<div style="display:grid;grid-template-columns:44px 1fr 150px;gap:6px;align-items:center;margin-bottom:6px"><b style="font-size:12.5px">${letraCol(it.c || it.cb)}</b><input data-fl="${i}" value="${esc(it.l)}" style="height:36px;border:1.5px solid #ddd;border-radius:8px;padding:0 8px;font-size:13px;width:100%"><div><select data-ft="${i}" style="height:36px;width:100%;border:1.5px solid #ddd;border-radius:8px;font-size:12.5px">${TIPOS_COL.map(([k, l]) => `<option value="${k}" ${it.t === k ? 'selected' : ''}>${l}</option>`).join('')}</select>${it.t === 'chk' ? `<select data-fo="${i}" style="height:30px;width:100%;margin-top:3px;border:1.5px solid #ddd;border-radius:8px;font-size:12px"><option value="bm" ${it.o === 'bm' ? 'selected' : ''}>Bueno / Malo</option><option value="sn" ${it.o === 'sn' ? 'selected' : ''}>Sí / No</option></select>` : ''}</div></div>`).join('')}</div>`;
  const ok = await ask('Columnas del formato del cliente', 'Revise que cada columna sea lo correcto. Las marcadas como "Revisión del técnico" son las que el técnico verá al revisar cada extintor. Lo que ponga "No usar" no aparece.', 'Guardar formato', html);
  if (!ok) return null;
  const out = JSON.parse(JSON.stringify(fm));
  out.items.forEach((it, i) => { const l = document.querySelector(`[data-fl="${i}"]`), t = document.querySelector(`[data-ft="${i}"]`), o = document.querySelector(`[data-fo="${i}"]`); if (l) it.l = l.value.trim() || it.l; if (t) it.t = t.value; if (o) it.o = o.value; });
  return out;
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

// Resumen "Acciones correctivas o de mejora" y firmas al pie del Excel (sirve para cualquier formato)
function cierreXlsx(ws, wb, rn, { c, v, ext, rev }, cA, cZ, h, izq, der) {
  const LA = letraCol(cA), LZ = letraCol(cZ);
  // Resumen "Acciones correctivas o de mejora", como lo escribe el cliente al final de la hoja 2
  {
    const AZUL = 'FF1D4E90'; const borde = { style: 'thin', color: { argb: 'FF2F5597' } };
    ws.mergeCells(`${LA}${rn}:${LZ}${rn}`); const hc = ws.getCell(`${LA}${rn}`); hc.value = 'Acciones correctivas o de mejora';
    hc.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' }, name: 'Arial' }; hc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL } }; hc.alignment = { horizontal: 'center', vertical: 'middle' }; ws.getRow(rn).height = 16;
    rn++;
    const txt = textoResumen({ c, v, ext, rev });
    ws.mergeCells(`${LA}${rn}:${LZ}${rn}`); const bc = ws.getCell(`${LA}${rn}`);
    bc.value = { richText: partesNegrita(txt).map((p) => ({ text: p.t, font: { name: 'Arial', size: 9.5, bold: p.b } })) };
    bc.alignment = { wrapText: true, vertical: 'top', horizontal: 'justify' };
    for (let col = cA; col <= cZ; col++) { const cl = ws.getRow(rn).getCell(col); cl.border = { bottom: borde, left: col === cA ? borde : undefined, right: col === cZ ? borde : undefined }; }
    let anchoCh = 0; for (let col = cA; col <= cZ; col++) anchoCh += ws.getColumn(col).hidden ? 0 : (ws.getColumn(col).width || 8);
    const lineas = Math.ceil(txt.replace(/\*\*/g, '').length / (anchoCh * 1.05)); ws.getRow(rn).height = Math.max(40, lineas * 13.5 + 12);
    rn++;
  }
  // Firmas al pie, como en el formato de detectores
  const f = F(v); const r1 = rn + 1, r2 = rn + 2, r3 = rn + 3;
  const thin = { style: 'thin', color: { argb: 'FF7F7F7F' } };
  // La plantilla está a escala grande (filas de ~194 pt, letra 72): el bloque de firmas se escala igual
  const k = Math.max(1, (h || 27) / 27);
  const bloque = (c1, c2, titulo, nombre, firma, etiqueta) => {
    ws.mergeCells(`${c1}${r1}:${c2}${r1}`); const t = ws.getCell(`${c1}${r1}`); t.value = titulo ? `${titulo}: ${nombre || ''}` : nombre; t.font = { bold: true, size: Math.round(10 * k) }; t.alignment = { vertical: 'middle' };
    ws.mergeCells(`${c1}${r2}:${c2}${r2}`); ws.getCell(`${c1}${r2}`).border = { bottom: { style: 'medium', color: { argb: 'FF7F7F7F' } } };
    ws.mergeCells(`${c1}${r3}:${c2}${r3}`); const l = ws.getCell(`${c1}${r3}`); l.value = etiqueta; l.font = { size: Math.round(9 * k), color: { argb: 'FF555555' } }; l.alignment = { horizontal: 'center', vertical: 'top' };
    if (firma) { const col = ws.getColumn(c1).number - 1; ws.addImage(wb.addImage({ base64: firma.split(',')[1], extension: 'png' }), { tl: { col: col + 0.4, row: r2 - 1 + 0.08 }, ext: { width: Math.round(230 * k), height: Math.round(76 * k) } }); }
  };
  ws.getRow(r1).height = Math.round(22 * k); ws.getRow(r2).height = Math.round(64 * k); ws.getRow(r3).height = Math.round(18 * k);
  bloque(izq[0], izq[1], '', 'Equipo SOS FIRE', f.tec, 'Firma Equipo SOS FIRE');
  bloque(der[0], der[1], encLabel(c), f.encNombre, f.enc, 'Firma ' + encLabel(c).replace('Encargado', 'encargado'));
  rn = r3 + 1;
  return { rn, r3 };
}

// Excel con el formato propio del cliente: se llena su mismo archivo, solo con las columnas que trae
async function exportXlsxFmt({ c, v, ext, rev }) {
  const f = c.formato; const wb = new ExcelJS.Workbook(); await wb.xlsx.load(b64ToBuf(c.formatoTpl));
  const ws = wb.getWorksheet(f.hoja) || wb.worksheets[0]; const clone = (st) => JSON.parse(JSON.stringify(st || {}));
  const cmax = f.cmax; const fi = f.fi; const proto = ws.getRow(fi); const protoSt = {}; for (let col = 1; col <= cmax; col++) protoSt[col] = clone(proto.getCell(col).style);
  const h = proto.height; const merges = Object.values(ws._merges || {}).map((m) => m.model).filter((m) => m && m.top === fi && m.bottom === fi).map((m) => [m.left, m.right]);
  // se quitan las filas de ejemplo que traiga el archivo del cliente
  for (const m of Object.values(ws._merges || {}).map((x) => x.model).filter((m) => m && m.top >= fi)) { try { ws.unMergeCells(m.top, m.left, m.bottom, m.right); } catch (e) { /* ya estaba suelta */ } }
  if (ws.rowCount > fi) ws.spliceRows(fi + 1, ws.rowCount - fi);
  const red = { argb: 'FFC90012' }; let rn = fi;
  for (const e of ordenReporte(ext)) {
    const row = ws.getRow(rn); if (h) row.height = h;
    for (let col = 1; col <= cmax; col++) { row.getCell(col).style = clone(protoSt[col]); }
    for (const [l, r] of merges) { try { ws.mergeCells(rn, l, rn, r); } catch (er) { /* ya unida */ } }
    const rv = rev[e.id] || {}; const cc = rv.c || {};
    const put = (col, val, bad) => { const cell = ws.getCell(rn, col); cell.value = val; if (bad) cell.font = { ...clone(cell.font), color: red, bold: true }; };
    for (const it of f.items) {
      if (it.t === 'n') put(it.c, e.n); else if (it.t === 'zona') put(it.c, e.zona); else if (it.t === 'area') put(it.c, e.area); else if (it.t === 'marca') put(it.c, e.marca);
      else if (it.t === 'tipo') put(it.c, e.tipo); else if (it.t === 'cap') put(it.c, e.capacidad); else if (it.t === 'serie') put(it.c, e.serie); else if (it.t === 'num') put(it.c, e.numero);
      else if (it.t === 'recA') put(it.c, rv.recAnt || e.recAnt || '');
      else if (it.t === 'recP') { const x = rv.recProx || e.recProx || ''; put(it.c, x, ['vencida', 'pronto'].includes(venc(x))); }
      else if (it.t === 'ph') put(it.c, esCO2(e.tipo) ? (rv.ph || e.ph || '') : rv.t && !rv.sit ? 'n/a' : '', esCO2(e.tipo) && phVencido(rv.ph || e.ph));
      else if (it.t === 'alt') { const a = altNum(rv.altura || e.altura); if (a != null) put(it.c, a.toFixed(2), a > ALT_MAX); }
      else if (it.t === 'obs') put(it.c, obsReporte(e, rv));
      else if (it.t === 'chk') {
        const val = cc[it.k]; if (!val) continue; const cr = CK[it.k]; const bad = !esBueno(cr, val);
        if (it.cb) put(cr.o[0][0] === val ? it.cb : it.cm, '✓', bad); else put(it.c, (cr.o.find((o) => o[0] === val) || [, ''])[1], bad);
      }
    }
    rn++;
  }
  const cA = Math.min(...f.items.map((i) => i.c || i.cb)), cZ = cmax; const w = cZ - cA;
  const cz = cierreXlsx(ws, wb, rn, { c, v, ext, rev }, cA, cZ, h, [letraCol(cA + 1), letraCol(cA + Math.max(2, Math.floor(w * 0.4)))], [letraCol(cA + Math.floor(w * 0.55)), letraCol(cZ - 1)]);
  ws.pageSetup = { ...ws.pageSetup, paperSize: 1, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: `1:${fi - 1}`, printArea: `${letraCol(1)}1:${letraCol(cZ)}${Math.max(fi, cz.rn - 1)}`, horizontalCentered: true };
  ws.headerFooter = { oddFooter: `&L&8${c.nombre} · ${fmtFecha(v.fecha)}&R&8Página &P de &N` };
  const buf = await wb.xlsx.writeBuffer();
  descargar(nombreArchivo(c, v, 'xlsx'), new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
}

// Subir el Excel de un cliente (solo administrador): se leen sus columnas y se confirman
async function subirFormato(file) {
  if (!file) return; const c = cliente(S.aCid); if (!c) return;
  try {
    const buf = await file.arrayBuffer(); const wb = new ExcelJS.Workbook(); await wb.xlsx.load(buf); const ws = wb.worksheets[0];
    const fm = ws && parsearPlantilla(ws);
    if (!fm) return toast('No pude ubicar los títulos de las columnas. Revise que el Excel tenga una fila con Zona, Área, Marca, Tipo, etc.');
    const ok = await confirmarColumnas(fm); if (!ok) return;
    if (!ok.items.some((i) => i.t === 'chk')) return toast('Marque al menos una columna como "Revisión del técnico"');
    ok.items.filter((i) => i.t === 'chk').forEach((i, n) => { i.k = 'x' + c.id.slice(0, 4) + n; });
    let bin = ''; const u8 = new Uint8Array(buf); for (let i = 0; i < u8.length; i += 8192) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); const b64 = btoa(bin);
    if (b64.length > 900000) return toast('El Excel es muy pesado (quite imágenes grandes) y no cabe en la base de datos');
    await Cloud.updateCliente(c.id, { formato: ok, formatoTpl: b64 }); toast('Formato guardado. El reporte saldrá con las columnas de este Excel');
  } catch (e) { console.error(e); toast('No pude leer ese Excel: ' + (e.message || e)); }
}

async function exportXlsx({ c, v, ext, rev }) {
  if (c.formato && c.formatoTpl) return exportXlsxFmt({ c, v, ext, rev });
  const wb = new ExcelJS.Workbook(); await wb.xlsx.load(b64ToBuf(TEMPLATE_B64));
  const ws = wb.worksheets[0];
  const clone = (st) => JSON.parse(JSON.stringify(st || {}));
  const set = (addr, val) => { const cell = ws.getCell(addr); cell.style = clone(cell.style); cell.value = val; };
  // La banda con el logo de Decameron solo va en los reportes de Decameron
  if (!/decameron/i.test(c.nombre)) { ws._media = []; const img = wb.addImage({ base64: LOGO_B64, extension: 'png' }); ws.addImage(img, { tl: { col: 4.2, row: 0.15 }, ext: { width: 150, height: 58 } }); }
  set('F4', c.pais || 'El Salvador'); set('M4', c.lugar || c.nombre);
  set('I3', 'Fecha de inspección'); set('I4', fmtFecha(v.fecha)); for (const r of ['T3:U3', 'T4:U4']) ws.unMergeCells(r); ws.mergeCells('T3:AA3'); ws.mergeCells('T4:AA4'); set('T3', 'Realizado por'); set('T4', 'Equipo SOS FIRE');
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
    const U = (k) => usa(c.id, k);
    put('E', e.n); put('F', e.zona); put('G', e.area); put('H', e.marca); put('I', e.tipo); put('J', e.capacidad); put('K', e.serie); put('L', e.numero);
    if (cc.presion && U('presion')) put('M', cc.presion === 'ok' ? '✓' : cc.presion === 'na' ? 'n/a' : optLabel('presion', cc.presion), !esBueno(CK.presion, cc.presion));
    for (const k of ['cilindro', 'instrucciones', 'senal', 'marchamo', 'manguera', 'boquilla', 'etiqueta']) {
      const cr = CK[k]; const val = cc[k]; if (!val || !U(k)) continue;
      const idx = cr.o.findIndex((o) => o[0] === val); put(cr.col[idx], '✓', !esBueno(cr, val));
    }
    if (U('recargas')) { put('AB', r.recAnt || e.recAnt || ''); put('AC', r.recProx || e.recProx || '', ['vencida', 'pronto'].includes(venc(r.recProx || e.recProx))); }
    if (U('ph')) put('AD', esCO2(e.tipo) ? (r.ph || e.ph || '') : r.t && !r.sit ? 'n/a' : '', esCO2(e.tipo) && phVencido(r.ph || e.ph));
    const aN = altNum(r.altura || e.altura); if (aN != null && U('altura')) put('AE', aN.toFixed(2), aN > ALT_MAX);
    put('AF', obsReporte(e, r));
    rn++;
  }
  // Columnas que este cliente no usa: se ocultan (cada cliente tiene su propio formato)
  { const ocultar = []; for (const cr of CRIT) if (!usa(c.id, cr.k)) ocultar.push(...(cr.col || ['M']));
    if (!usa(c.id, 'recargas')) ocultar.push('AB', 'AC'); if (!usa(c.id, 'ph')) ocultar.push('AD'); if (!usa(c.id, 'altura')) ocultar.push('AE');
    for (const l of ocultar) ws.getColumn(l).hidden = true; }
  { const cz = cierreXlsx(ws, wb, rn, { c, v, ext, rev }, 2, 35, h, ['E', 'L'], ['T', 'AE']); rn = cz.rn; }
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
    doc.text(`${c.nombre}${c.lugar && c.lugar !== c.nombre ? ' · ' + c.lugar : ''} · ${fmtFecha(v.fecha)} · Equipo SOS FIRE`, W - M, 18, { align: 'right' });
  };
  const res = calcResumen(ext, rev); head();
  const limpia = (rows) => rows.map((r) => r.map((x) => (typeof x === 'string' ? x.replace(/₂/g, '2') : x)));
  doc.autoTable({ startY: 27, margin: { left: M, right: M }, head: [['Extintores', 'Revisados', 'Todo bien', 'Con falla', 'Pendientes', 'Recarga por vencer', 'Soporte por cambiar']],
    body: [[res.total, res.done, res.ok, res.bad, res.total - res.done, res.pronto, res.sop]], headStyles: { fillColor: BLUE, halign: 'center' }, bodyStyles: { halign: 'center', fontStyle: 'bold' }, styles: { fontSize: 10 } });
  const hall = ordenReporte(ext).filter((e) => estado(rev[e.id]) === 'bad').map((e) => [e.n, zonaCorta(e.zona), e.area, [e.marca, e.tipo, e.capacidad].join(' · '), fallasDe(rev[e.id]).join(', '), obsReporte(e, rev[e.id])]);
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
  if (c.formato) {
    const its = c.formato.items.filter((i) => i.t !== 'skip'); const lista = ordenReporte(ext);
    const val = (it, e, rv) => { const cc = rv.c || {};
      switch (it.t) { case 'n': return e.n; case 'zona': return zonaCorta(e.zona); case 'area': return e.area; case 'marca': return e.marca; case 'tipo': return e.tipo; case 'cap': return e.capacidad; case 'serie': return e.serie; case 'num': return e.numero;
        case 'recA': return rv.recAnt || e.recAnt || ''; case 'recP': return rv.recProx || e.recProx || ''; case 'ph': return esCO2(e.tipo) ? (rv.ph || e.ph || '') : rv.t && !rv.sit ? 'n/a' : ''; case 'alt': return altTxt(rv.altura || e.altura); case 'obs': return obsReporte(e, rv);
        case 'chk': return cc[it.k] ? ((CK[it.k].o.find((o) => o[0] === cc[it.k]) || [, ''])[1]) : ''; default: return ''; } };
    doc.autoTable({ startY: 26, margin: { left: M, right: M, top: 26, bottom: 12 }, theme: 'grid', head: [its.map((i) => i.l)],
      body: limpia(lista.map((e) => its.map((it) => val(it, e, rev[e.id] || {})))),
      headStyles: { fillColor: BLUE, fontSize: 6.5, halign: 'center', valign: 'middle', cellPadding: 1.2, lineColor: [255, 255, 255], lineWidth: 0.2 },
      styles: { fontSize: 6.8, cellPadding: 1.2, valign: 'middle', lineColor: [190, 190, 190], lineWidth: 0.15, overflow: 'linebreak' },
      columnStyles: Object.fromEntries(its.map((it, i) => [i, ['area', 'obs'].includes(it.t) ? { cellWidth: 'auto' } : { halign: 'center' }])),
      didParseCell: (d) => { if (d.section !== 'body') return; const it = its[d.column.index]; const e = lista[d.row.index]; const rv = rev[e.id] || {}; let bad = false;
        if (it.t === 'chk') bad = rv.c && rv.c[it.k] && !esBueno(CK[it.k], rv.c[it.k]); else if (it.t === 'recP') bad = ['vencida', 'pronto'].includes(venc(d.cell.raw)); else if (it.t === 'alt') bad = altNum(d.cell.raw) > ALT_MAX;
        if (bad) { d.cell.styles.textColor = RED; d.cell.styles.fontStyle = 'bold'; d.cell.styles.fillColor = [253, 236, 236]; } },
      willDrawPage: (d) => { if (d.pageNumber > 1) head(); } });
  } else {
  const yn = (k, val) => (val ? (k === 'presion' && val === 'na' ? 'n/a' : (CK[k].o.find((o) => o[0] === val) || [, ''])[1]) : '');
  const body = ordenReporte(ext).map((e) => { const r = rev[e.id] || {}; const cc = r.c || {};
    return [e.n, zonaCorta(e.zona), e.area, e.marca, e.tipo, e.capacidad, e.serie, e.numero, yn('presion', cc.presion), yn('cilindro', cc.cilindro), yn('instrucciones', cc.instrucciones), yn('senal', cc.senal), yn('marchamo', cc.marchamo), yn('manguera', cc.manguera), yn('boquilla', cc.boquilla), yn('etiqueta', cc.etiqueta), r.recAnt || e.recAnt || '', r.recProx || e.recProx || '', esCO2(e.tipo) ? (r.ph || e.ph || '') : r.t && !r.sit ? 'n/a' : '', altTxt(r.altura || e.altura), obsReporte(e, r)]; });
  const drop = new Set(); CRIT.forEach((cr, i) => { if (!usa(c.id, cr.k)) drop.add(8 + i); });
  if (!usa(c.id, 'recargas')) { drop.add(16); drop.add(17); } if (!usa(c.id, 'ph')) drop.add(18); if (!usa(c.id, 'altura')) drop.add(19);
  const sel = (arr) => arr.filter((_, i) => !drop.has(i));
  const remap = (o) => { const out = {}; let n = 0; for (let i = 0; i <= 20; i++) if (!drop.has(i)) out[n++] = o[i]; return out; };
  const keys = sel([null, null, null, null, null, null, null, null, 'presion', 'cilindro', 'instrucciones', 'senal', 'marchamo', 'manguera', 'boquilla', 'etiqueta', null, 'recProx', null, 'altura', null]);
  doc.autoTable({ startY: 26, margin: { left: M, right: M, top: 26, bottom: 12 }, theme: 'grid',
    head: [[{ content: 'PASO 1 · DESCRIBIR EXTINTOR', colSpan: 8 }, { content: 'PASO 2 · VERIFICAR ESTADO DEL EXTINTOR', colSpan: 13 - drop.size }],
      sel(['N°', 'Zona', 'Área', 'Marca', 'Tipo', 'Cap.', 'Serie', 'N° ext.', 'Presión', 'Cilindro', 'Instr.', 'Señal.', 'Marchamo', 'Manguera', 'Boquilla', 'Etiqueta', 'Rec. ant.', 'Próxima', 'PH', 'Altura', 'Observaciones'])],
    body: limpia(body.map(sel)), headStyles: { fillColor: BLUE, fontSize: 6, halign: 'center', valign: 'middle', cellPadding: 1.2, lineColor: [255, 255, 255], lineWidth: 0.2 },
    styles: { fontSize: 6.8, cellPadding: 1.2, valign: 'middle', lineColor: [190, 190, 190], lineWidth: 0.15, overflow: 'linebreak' },
    columnStyles: remap({ 0: { cellWidth: 7, halign: 'center' }, 1: { cellWidth: 14 }, 2: { cellWidth: 30 }, 3: { cellWidth: 12 }, 4: { cellWidth: 8, halign: 'center' }, 5: { cellWidth: 8, halign: 'center' }, 6: { cellWidth: 11 }, 7: { cellWidth: 10 },
      8: { cellWidth: 11.5, halign: 'center' }, 9: { cellWidth: 10.5, halign: 'center' }, 10: { cellWidth: 8, halign: 'center' }, 11: { cellWidth: 10, halign: 'center' }, 12: { cellWidth: 12, halign: 'center' }, 13: { cellWidth: 12, halign: 'center' }, 14: { cellWidth: 11, halign: 'center' }, 15: { cellWidth: 11, halign: 'center' }, 16: { cellWidth: 11, halign: 'center' }, 17: { cellWidth: 11, halign: 'center' }, 18: { cellWidth: 7.5, halign: 'center' }, 19: { cellWidth: 11.5, halign: 'center' }, 20: { cellWidth: 'auto' } }),
    didParseCell: (d) => { if (d.section !== 'body') return; const k = keys[d.column.index]; if (!k) return; const e = ordenReporte(ext)[d.row.index]; const r = rev[e.id] || {};
      const bad = k === 'recProx' ? ['vencida', 'pronto'].includes(venc(d.cell.raw)) : k === 'altura' ? altNum(d.cell.raw) > ALT_MAX : r.c && r.c[k] && !esBueno(CK[k], r.c[k]);
      if (bad) { d.cell.styles.textColor = RED; d.cell.styles.fontStyle = 'bold'; d.cell.styles.fillColor = [253, 236, 236]; } },
    willDrawPage: (d) => { if (d.pageNumber > 1) head(); } });
  }
  // Resumen "Acciones correctivas o de mejora" (justificado, con negrita)
  let yEnd = doc.lastAutoTable.finalY + 6;
  {
    const txt = textoResumen({ c, v, ext, rev }).replace(/₂/g, '2'); const fs = 8.2, lh = 4.1, bw0 = W - 2 * M, pad = 3;
    doc.setFontSize(fs); const sp = (() => { doc.setFont('helvetica', 'normal'); return doc.getTextWidth(' '); })();
    const pal = []; for (const p of partesNegrita(txt)) for (const w of p.t.split(/\s+/)) if (w) { doc.setFont('helvetica', p.b ? 'bold' : 'normal'); pal.push({ w, b: p.b, wd: doc.getTextWidth(w) }); }
    const lineas = []; let cur = [], ancho = 0;
    for (const p of pal) { const n = cur.length ? ancho + sp + p.wd : p.wd; if (n > bw0 - 2 * pad && cur.length) { lineas.push(cur); cur = [p]; ancho = p.wd; } else { cur.push(p); ancho = n; } }
    if (cur.length) lineas.push(cur);
    const alto = 6 + lineas.length * lh + 2 * pad;
    if (yEnd + alto > H - 14) { doc.addPage(); head(); yEnd = 28; }
    doc.setFillColor(...BLUE); doc.rect(M, yEnd, bw0, 6, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255); doc.text('Acciones correctivas o de mejora', W / 2, yEnd + 4.1, { align: 'center' });
    doc.setDrawColor(...BLUE); doc.setLineWidth(0.3); doc.rect(M, yEnd + 6, bw0, alto - 6);
    doc.setFontSize(fs); doc.setTextColor(40); let yy = yEnd + 6 + pad + 3;
    lineas.forEach((ln, i) => {
      const util = bw0 - 2 * pad; const suma = ln.reduce((a, p) => a + p.wd, 0); const ult = i === lineas.length - 1;
      const gap = !ult && ln.length > 1 ? (util - suma) / (ln.length - 1) : sp; let x = M + pad;
      for (const p of ln) { doc.setFont('helvetica', p.b ? 'bold' : 'normal'); doc.text(p.w, x, yy); x += p.wd + gap; }
      yy += lh;
    });
    yEnd += alto;
  }
  // Firmas al final del reporte
  const f = F(v); let y = yEnd + 10;
  if (y + 46 > H - 12) { doc.addPage(); head(); y = 32; }
  const bw = (W - 2 * M - 20) / 2;
  [[M, 'Equipo SOS FIRE', 'Equipo SOS FIRE', f.tec, ''], [M + bw + 20, encLabel(c), f.encNombre, f.enc, encLabel(c)]].forEach(([x, titulo, nombre, firma, sub]) => {
    doc.setDrawColor(200); doc.setLineWidth(0.3); doc.roundedRect(x, y, bw, 44, 2, 2);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...GRAY); doc.text(('Firma ' + titulo).toUpperCase(), x + 4, y + 6);
    if (firma) { try { doc.addImage(firma, 'PNG', x + bw / 2 - 30, y + 8, 60, 20); } catch (e) {} } else { doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(170); doc.text('Sin firma', x + bw / 2, y + 20, { align: 'center' }); }
    doc.setDrawColor(120); doc.line(x + 12, y + 31, x + bw - 12, y + 31);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(40); doc.text(String(nombre || '—'), x + bw / 2, y + 37, { align: 'center' });
    doc.setFontSize(7.5); doc.setTextColor(120); if (sub) doc.text(sub, x + bw / 2, y + 41.5, { align: 'center' });
  });
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(130); doc.text(`SOS FIRE · ${c.nombre} · ${fmtFecha(v.fecha)}`, M, H - 5); doc.text(`Página ${i} de ${n}`, W - M, H - 5, { align: 'right' }); }
  descargar(nombreArchivo(c, v, 'pdf'), doc.output('blob'));
}

/* ======================= Instalar como app (teléfono y computadora) ======================= */
let promptInstalar = null;
const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const instalada = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const puedeInstalar = () => !instalada() && (!!promptInstalar || esIOS);
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); promptInstalar = e; if (S.me) redraw(); else pintarBotonLogin(); });
window.addEventListener('appinstalled', () => { promptInstalar = null; toast('App instalada. Ábrala desde su pantalla de inicio o escritorio.'); redraw(); });
function botonInstalar(cls = 'btn sm') { return puedeInstalar() ? `<button class="${cls}" data-act="instalar">⬇ Instalar app</button>` : ''; }
function bannerInstalar() {
  if (!puedeInstalar() || localStorage.getItem('ext_noInstalar')) return '';
  return `<div class="card" style="display:flex;align-items:center;gap:12px;border-color:var(--red)"><img src="icon-192.png" alt="" style="width:44px;height:44px;border-radius:10px;border:1px solid var(--line)">
    <div style="flex:1;min-width:0"><b style="font-size:14.5px">Instale la app</b><div class="muted" style="font-size:12.5px">Ábrala desde la pantalla de inicio, sin buscar el enlace. Funciona aunque no haya señal.</div></div>
    <div style="display:flex;flex-direction:column;gap:4px"><button class="btn sm pri" data-act="instalar">Instalar</button><button class="btn sm ghost" data-act="noInstalar" style="height:28px">Ahora no</button></div></div>`;
}
async function instalar() {
  if (promptInstalar) { promptInstalar.prompt(); const r = await promptInstalar.userChoice.catch(() => ({})); if (r.outcome === 'accepted') promptInstalar = null; redraw(); return; }
  if (esIOS) { await ask('Instalar en iPhone', 'En iPhone se instala desde Safari:', null, `<ol style="margin:0 0 12px;padding-left:20px;font-size:14px;line-height:1.6"><li>Abra este enlace en <b>Safari</b>.</li><li>Toque el botón <b>Compartir</b> (cuadro con flecha hacia arriba).</li><li>Elija <b>Agregar a inicio</b> y toque <b>Agregar</b>.</li></ol>`); return; }
  await ask('Instalar la app', 'Abra este enlace en Chrome o Edge y use el menú (⋮) → "Instalar app" o "Agregar a la pantalla principal".', null);
}
function pintarBotonLogin() { const b = $('lInst'); if (b) b.innerHTML = botonInstalar('btn'); }

/* ======================= 8) Acciones y arranque ======================= */
const ACT = {
  go: (el) => go(el.dataset.h),
  instalar: () => instalar(),
  noInstalar: () => { try { localStorage.setItem('ext_noInstalar', '1'); } catch (e) {} redraw(); },
  salir: async () => { if (await ask('Cerrar sesión', '¿Salir de la app en este dispositivo?', 'Salir')) { salirVisita(); stopAll('list'); for (const k of Object.keys(UX)) { UX[k](); delete UX[k]; } S.allExt = {}; await Cloud.logout(); } },
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
  sit: (el) => { ed.sit = el.dataset.v; ed.aviso = ''; pintarFicha(); },
  sop: (el) => { ed.soporte = ed.soporte === el.dataset.v && el.dataset.v ? '' : el.dataset.v; pintarFicha(); },
  crit: (el) => { const { k, v } = el.dataset; if (k === 'presion') ed.presionAuto = false; ed.c[k] = ed.c[k] === v ? '' : v; ed.aviso = ''; pintarFicha(); },
  todoBien: () => {
    for (const c of critDe(S.cid)) ed.c[c.k] = c.good;
    if (esCO2((extDe(ed.eid) || {}).tipo) && usa(S.cid, 'presion')) ed.c.presion = 'na';
    ed.sit = '';
    if (ed.prevMalo && ed.obs.trim()) { ed.prevMalo = false; pintarFicha(); $('fObs').style.borderColor = 'var(--warn)'; $('fHint').textContent = 'Ya quedó todo en bien. ¿La observación sigue aplicando? Bórrela o edítela y toque Guardar.'; $('fObs').scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    guardarFicha();
  },
  recargaHoy: () => { ed.recAnt = mesActual(); ed.recProx = sumarMeses(ed.recAnt, 12); const o = ed.obs.split(';').map((x) => x.trim()).filter(Boolean); if (!o.includes('Recargado')) o.push('Recargado'); ed.obs = o.join('; '); pintarFicha(); },
  qobs: (el) => { let p = ed.obs.split(';').map((x) => x.trim()).filter(Boolean); const q = el.dataset.q; p = p.includes(q) ? p.filter((x) => x !== q) : [...p, q]; ed.obs = p.join('; '); pintarFicha(); },
  terminar: async () => {
    const f = F(S.visita); const falta = [!f.tec && 'la firma del Equipo SOS FIRE', !f.enc && 'la firma del encargado'].filter(Boolean);
    if (falta.length && !(await ask('Faltan firmas', `Falta ${falta.join(' y ')}. Puede firmar abajo en "Cierre de visita". ¿Terminar la visita sin ${falta.length > 1 ? 'ellas' : 'ella'}?`, 'Terminar sin firmas'))) { const cv = $(!f.tec ? 'sigTec' : 'sigEnc'); if (cv) cv.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (!falta.length && !(await ask('Terminar visita', 'La visita queda cerrada y pasa al historial con las firmas. Si falta algo, el administrador puede reabrirla.', 'Terminar'))) return;
    if (f.tecNombre == null) Cloud.updateVisita(S.vid, { 'firmas.tecNombre': tecnicosDe(S.visita) || yo() }).catch(cloudError); await Cloud.updateVisita(S.vid, { estado: 'terminada', cerrada: Date.now(), resumen: calcResumen(S.ext, S.rev), ultimaAct: { texto: `${yo().split(' ')[0]} terminó la visita`, t: Date.now(), by: yo() } }).catch(cloudError); toast('Visita terminada'); go('#/'); },
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
  resEdit: async (el) => {
    const v = S.visita && S.visita.id === el.dataset.id ? S.visita : (S.aVisitas.find((x) => x.id === el.dataset.id) || S.visita); if (!v) return;
    const lista = S.visita && S.visita.id === v.id ? S.ext : S.aExt; const revs = S.visita && S.visita.id === v.id ? S.rev : S.aRev;
    const actual = textoResumen({ c: cliente(v.cid), v, ext: lista, rev: revs });
    if (!(await ask('Acciones correctivas o de mejora', 'Edite el texto. Lo que va entre ** ** sale en negrita. Para volver al texto automático use el botón "Volver al automático".', 'Guardar', `<textarea id="resT" rows="11" style="width:100%;border:1.5px solid #ddd;border-radius:10px;padding:10px;font:inherit;font-size:14px;line-height:1.4">${esc(actual)}</textarea>`))) return;
    const nuevo = $('resT') ? $('resT').value.trim() : ''; v.resumenTxt = nuevo === actual ? v.resumenTxt || '' : nuevo;
    Cloud.updateVisita(v.id, { resumenTxt: v.resumenTxt }).catch(cloudError); route();
  },
  resAuto: (el) => { const v = S.visita && S.visita.id === el.dataset.id ? S.visita : (S.aVisitas.find((x) => x.id === el.dataset.id) || S.visita); if (!v) return; v.resumenTxt = ''; Cloud.updateVisita(v.id, { resumenTxt: '' }).catch(cloudError); route(); },
  sigClr: (el) => { const k = el.dataset.id; S.visita.firmas = { ...F(S.visita), [k]: '' }; Cloud.updateVisita(S.vid, { [`firmas.${k}`]: '' }).catch(cloudError); route(); },
  vTab: (el) => { ui.vTab = el.dataset.id; renderAHome(); },
  vCliSel: (el) => { ui.vCli = el.dataset.id; renderAHome(); },
  verVenc: () => { const v = vencimientos(); if (!v.mes.length && v.venc.length) ui.vTab = 'venc'; renderAHome(); const s = $('secVenc'); if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
  xlsxVenc: () => run(exportVencimientos),
  aExtEd: (el) => formExtintor(el.dataset.id, '', true),
  aExtNuevo: () => formExtintor(null, '', true),
  aExtExcel: async () => {
    const c = cliente(S.aCid); const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Extintores');
    ws.columns = [['N°', 6], ['Zona', 24], ['Área', 40], ['Marca', 14], ['Tipo', 8], ['Capacidad', 11], ['Serie', 16], ['Número', 12]].map(([header, width]) => ({ header, width }));
    S.aExt.forEach((e) => ws.addRow([e.n, e.zona, e.area, e.marca, e.tipo, e.capacidad, e.serie, e.numero]));
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }; ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4E90' } }; ws.views = [{ state: 'frozen', ySplit: 1 }];
    const buf = await wb.xlsx.writeBuffer(); descargar(`Extintores_${(c ? c.nombre : 'proyecto').replace(/\s+/g, '_')}.xlsx`, new Blob([buf], { type: 'application/octet-stream' }));
  },
  aExtImp: () => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.xlsx'; i.onchange = () => importarExtintores(i.files[0]); i.click(); },
  fmtSubir: () => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.xlsx'; i.onchange = () => subirFormato(i.files[0]); i.click(); },
  fmtQuitar: async () => { if (!(await ask('Volver al formato estándar', 'El reporte volverá a salir con el formato de SOS FIRE. Las revisiones ya hechas no se pierden.', 'Volver'))) return; Cloud.updateCliente(S.aCid, { formato: Cloud.deleteField(), formatoTpl: Cloud.deleteField() }).then(() => toast('Formato estándar')).catch(cloudError); },
  borrarVisitaA: async () => {
    const v = S.aVisitas.find((x) => x.id === S.aVid); if (!v) return;
    if (!(await ask('Borrar visita', `Se borrará la visita del ${fmtFecha(v.fecha)} con todas sus revisiones y firmas. No se puede deshacer. Descargue antes el reporte si lo necesita.`, 'Borrar'))) return;
    try { await Cloud.borrarVisita(v.id); S.aVid = null; toast('Visita borrada'); route(); } catch (e) { cloudError(e); }
  },
  borrarClienteA: async () => {
    const c = cliente(S.aCid); if (!c) return;
    if (!(await ask('Eliminar proyecto', `Se borrará "${c.nombre}" con sus ${S.aExt.length} extintores y todas sus visitas, revisiones y firmas. No se puede deshacer. Descargue antes los reportes.`, 'Eliminar'))) return;
    if (!(await ask('¿Seguro?', `Última confirmación: eliminar "${c.nombre}" para siempre.`, 'Sí, eliminar'))) return;
    try { const id = c.id; await Cloud.borrarCliente(id); toast('Proyecto eliminado'); location.hash = '#/'; } catch (e) { cloudError(e); }
  },
  reabrirA: () => Cloud.updateVisita(S.aVid, { estado: 'en_curso' }).catch(cloudError),
  guardarCliente: () => { const p = { nombre: $('cN').value.trim(), lugar: $('cL').value.trim(), frecuencia: $('cF').value }; if ($('cD')) p.dia = +$('cD').value; else if (p.frecuencia === 'semanal') p.dia = new Date().getDay(); if (!p.nombre) return toast('Escriba el nombre del cliente'); Cloud.updateCliente(S.aCid, p).then(() => toast('Proyecto actualizado')).catch(cloudError); },
  cargarDecameron: () => run(async () => {
    const d = DECAMERON; const cid = await Cloud.crearCliente({ nombre: d.cliente, lugar: d.lugar, pais: d.pais, frecuencia: 'semanal', dia: 2, fijado: true, creadoPor: yo() });
    await Cloud.addExtintores(cid, d.extintores.map((e) => ({ ...e, recAnt: '', recProx: '', ph: '' })));
    toast(`${d.cliente} cargado con ${d.extintores.length} extintores`);
  }),
  borrarUsu: async (el) => {
    const u = S.usuarios.find((x) => x.id === el.dataset.id); if (!u) return;
    if (u.id === Cloud.uid()) return toast('No puede eliminarse a sí mismo');
    if (ADMIN_EMAILS.map((x) => x.toLowerCase()).includes(String(u.email || '').toLowerCase())) return toast('Ese administrador está fijado en la configuración de la app; para quitarlo cámbielo en Render (ADMIN_EMAILS)');
    if (u.rol === 'admin' && u.activo && S.usuarios.filter((x) => x.rol === 'admin' && x.activo).length <= 1) return toast('Debe quedar al menos un administrador');
    if (!(await ask(`Eliminar a ${u.nombre}`, `${u.nombre} (${u.usuario || u.email || ''}) dejará de aparecer y ya no podrá entrar. Sus revisiones quedan en los reportes. No se puede deshacer.`, 'Eliminar'))) return;
    try { await Cloud.borrarUsuario(u.id); toast('Usuario eliminado'); } catch (e) { cloudError(e); }
  },
  acceso: async (el) => { const u = S.usuarios.find((x) => x.id === el.dataset.id); if (u.activo && !(await ask('Quitar acceso', `${u.nombre} ya no podrá entrar a la app. Sus revisiones quedan en los reportes.`, 'Quitar acceso'))) return; Cloud.setUsuario(u.id, { activo: !u.activo }).catch(cloudError); },
  crearTec: async () => {
    const nombre = $('tN').value.trim(), usuario = $('tU').value.trim(), clave = $('tP').value, rol = $('tR').value;
    if (!nombre || !usuario) { $('tErr').textContent = 'Escriba nombre y usuario.'; return; }
    if (clave.length < 6) { $('tErr').textContent = 'La contraseña debe tener al menos 6 caracteres.'; return; }
    $('tErr').textContent = '';
    try { await Cloud.crearTecnico({ nombre, usuario, clave, rol }); formTec.tN = ''; formTec.tU = ''; formTec.tR = 'tecnico'; claveTec = nuevaClave(); htmlTec = ''; await ask('Listo', `${nombre} ya puede entrar con el usuario “${usuario}” y la contraseña “${clave}”. La app le pedirá cambiarla.`, null); renderATecnicos(); }
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
    <button class="btn pri" type="submit" id="lB">Entrar</button><div class="err" id="lE">${esc(msg)}</div></form>
    <div id="lInst" style="margin-top:6px">${botonInstalar('btn')}</div>`);
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
      if (!p && adminCorreo) {
        // Se intenta una sola vez: si las reglas de Firebase no incluyen este correo, la escritura se rechaza y antes se repetía sin parar (pantalla parpadeando).
        if (perfilIntentado === u.uid) { gate(`<img src="${LOGO}" alt="SOS FIRE"><h2>Falta autorizar su correo</h2><p>El correo <b>${esc(u.email)}</b> está en ADMIN_EMAILS de Render, pero las <b>reglas de Firestore</b> todavía tienen otro correo. En Firebase → Firestore → Reglas, cambie el correo de administrador por este y pulse <b>Publicar</b>. Luego recargue.</p><button class="btn" data-act="salir">Salir</button>`); return; }
        perfilIntentado = u.uid;
        await Cloud.setUsuario(u.uid, { nombre: 'Administrador', usuario: u.email, email: u.email, rol: 'admin', activo: true, debeCambiar: false, creado: Date.now() }).catch((e) => { cloudError(e); }); return;
      }
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
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) { try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {} }
