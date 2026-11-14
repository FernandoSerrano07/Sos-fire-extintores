const {chromium}=require('playwright'); const fs=require('fs');
const base=fs.readFileSync('./assets/icono/icono.svg','utf8');
const variant=(radio,escala)=>base.replace('RADIO',radio).replace('ESCALA',escala);
(async()=>{ const b=await chromium.launch(); const p=await b.newPage();
async function png(svg,size,out,transp){ await p.setViewportSize({width:size,height:size}); await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ','<svg width="'+size+'" height="'+size+'" ')}</body></html>`); await p.screenshot({path:out,omitBackground:transp,clip:{x:0,y:0,width:size,height:size}}); }
const D='./public/';
await png(variant(112,1.22),512,D+'icon-512.png',true);      // escritorio y Android: esquinas redondeadas
await png(variant(112,1.22),192,D+'icon-192.png',true);
await png(variant(0,1.02),512,D+'icon-512-maskable.png',false); // Android adaptable: lleno, extintor dentro de la zona segura
await png(variant(0,1.12),180,D+'apple-touch-icon.png',false);   // iPhone redondea solo
await png(variant(112,1.22),64,'/tmp/p64.png',true);
await png(variant(112,1.22),32,D+'favicon-32.png',true);
await b.close(); })();
