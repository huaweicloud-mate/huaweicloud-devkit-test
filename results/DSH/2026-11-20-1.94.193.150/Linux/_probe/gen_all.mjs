import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { genProbe, PACK } from './core.mjs';
function parseCsv(text){const rows=[];let row=[],field='',inQ=false;for(let i=0;i<text.length;i++){const c=text[i];if(inQ){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else inQ=false;}else field+=c;}else if(c==='"')inQ=true;else if(c===','){row.push(field);field='';}else if(c==='\n'){row.push(field);rows.push(row);row=[];field='';}else if(c==='\r'){}else field+=c;}if(field!==''||row.length){row.push(field);rows.push(row);}return rows;}
const ids=[];
for(const f of ['用例矩阵-设计级.csv','用例矩阵-展开级.csv']){const p=join(PACK,f);if(!existsSync(p))continue;const rows=parseCsv(readFileSync(p,'utf-8').replace(/^\uFEFF/,''));const h=rows[0];const i=h.indexOf('ID');for(let r=1;r<rows.length;r++){const v=(rows[r][i]||'').trim();if(v)ids.push(v);}}
const uniq=[...new Set(ids)];
for(const id of uniq) genProbe(id);
console.log(`generated ${uniq.length} probes`);
