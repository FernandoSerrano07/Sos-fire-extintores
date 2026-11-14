// Construye dist/index.html: una sola página que funciona sin internet una vez abierta.
// - Inserta ExcelJS, jsPDF y jsPDF-AutoTable, la capa de Firebase y el código de la app.
// - Inserta el logo, la plantilla de la hoja 2 y los 302 extintores de Decameron Salinitas.
// - Lee FIREBASE_CONFIG y ADMIN_EMAILS de las variables de entorno (Render → Environment).
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync } from 'node:fs';
import { build } from 'esbuild';

const read = (p) => readFileSync(p, 'utf8');
const lib = (p) => read(`node_modules/${p}`);

function leerConfigNube() {
  let raw = (process.env.FIREBASE_CONFIG || '').trim();
  if (!raw) { console.log('  Firebase: NO configurado (la app mostrará cómo conectarlo)'); return null; }
  raw = raw.replace(/^[^{]*/, '').replace(/[^}]*$/, ''); // quita "const firebaseConfig =" y ";"
  let cfg;
  try { cfg = JSON.parse(raw); } catch { cfg = Function(`"use strict"; return (${raw});`)(); }
  for (const k of ['apiKey', 'authDomain', 'projectId', 'appId']) if (!cfg[k]) throw new Error(`FIREBASE_CONFIG no tiene "${k}"`);
  console.log(`  Firebase: proyecto "${cfg.projectId}"${cfg.emulator ? ' (EMULADOR)' : ''}`);
  return cfg;
}
const admins = (process.env.ADMIN_EMAILS || '').split(/[,;\s]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
console.log(`  Administradores por correo: ${admins.length ? admins.length : 'ninguno (defina ADMIN_EMAILS)'}`);

const nube = leerConfigNube();
const cloud = (await build({ entryPoints: ['src/cloud.js'], bundle: true, minify: true, format: 'iife', target: 'es2019', write: false, legalComments: 'none' })).outputFiles[0].text;
const app = read('src/app.js');
const decameron = JSON.parse(read('assets/decameron_salinitas.json'));
console.log(`  Decameron Salinitas: ${decameron.extintores.length} extintores`);

const noScriptEnd = (s) => s.replace(/<\/script/gi, '<\\/script');
let html = read('src/app.html');
const reemplazos = {
  '/*LIB_EXCELJS*/': lib('exceljs/dist/exceljs.min.js'),
  '/*LIB_JSPDF*/': lib('jspdf/dist/jspdf.umd.min.js'),
  '/*LIB_AUTOTABLE*/': lib('jspdf-autotable/dist/jspdf.plugin.autotable.min.js'),
  '/*LIB_CLOUD*/': noScriptEnd(cloud),
  '/*APP_JS*/': noScriptEnd(app),
  '/*LOGO_B64*/': readFileSync('assets/logo.png').toString('base64'),
  '/*TEMPLATE_B64*/': readFileSync('assets/plantilla_extintores.xlsx').toString('base64'),
  '/*DECAMERON_JSON*/': noScriptEnd(JSON.stringify(decameron)),
  '/*CLOUD_CONFIG*/null': nube ? JSON.stringify(nube) : 'null',
  '/*ADMIN_EMAILS*/[]': JSON.stringify(admins),
};
for (const [k, v] of Object.entries(reemplazos)) {
  if (html.split(k).length !== 2) throw new Error(`Marcador ${k} no encontrado una sola vez en src/app.html`);
  html = html.split(k).join(v);
}
if (existsSync('dist')) rmSync('dist', { recursive: true });
mkdirSync('dist');
writeFileSync('dist/index.html', html);
cpSync('public', 'dist', { recursive: true });
writeFileSync('dist/sw.js', read('dist/sw.js').replace('__VERSION__', new Date().toISOString()));
console.log(`Listo: dist/index.html (${(html.length / 1e6).toFixed(2)} MB)`);
