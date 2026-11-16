// Reduce la plantilla de la hoja 2 (hecha a escala gigante, zoom 30 %) a tamaño normal
const ExcelJS=require('exceljs');
const S=0.155;
(async()=>{ const [src,dst]=process.argv.slice(2); const wb=new ExcelJS.Workbook(); await wb.xlsx.readFile(src); const ws=wb.worksheets[0];
  for(let c=1;c<=36;c++){ const col=ws.getColumn(c); col.width=Math.max(1.2,+( (col.width||9)*S ).toFixed(2)); }
  // observaciones (AF:AI) un poco más anchas para que se lean
  ws.getColumn('AF').width=6; ws.getColumn('AG').width=6; ws.getColumn('AH').width=6; ws.getColumn('AI').width=12;
  for(const [c,w] of [['F',20],['M',8.5],['AB',8.5],['AC',8.5],['AE',8.5],['AD',8.5]]) ws.getColumn(c).width=w;
  for(let r=1;r<=9;r++){ const row=ws.getRow(r); if(row.height) row.height=Math.max(6,+(row.height*S).toFixed(1));
    for(let c=1;c<=36;c++){ const cell=row.getCell(c); cell.style=JSON.parse(JSON.stringify(cell.style||{})); if(cell.font&&cell.font.size){ cell.font={...cell.font,size:Math.max(r>=3&&r<=7?8:7,Math.round(cell.font.size*S*2)/2)}; } } }
  ws.getRow(9).height=24; ws.getRow(3).height=ws.getRow(4).height=15; ws.getRow(5).height=13; ws.getRow(1).height=ws.getRow(2).height=24; ws.getRow(6).height=ws.getRow(7).height=ws.getRow(8).height=19;
  ws.views=[{state:'normal',zoomScale:100,zoomScaleNormal:100,showGridLines:false,activeCell:'E9'}];
  ws.properties.defaultRowHeight=15;
  await wb.xlsx.writeFile(dst);
})();
