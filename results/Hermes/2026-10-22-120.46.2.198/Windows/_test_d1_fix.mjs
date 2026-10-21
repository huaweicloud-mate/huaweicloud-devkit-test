import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
const hdkSrc = 'C:\\Users\\Administrator\\multica_workspaces\\vector-8988c3df7bc9\\task-fe1b399ab162\\hermes-home\\tools\\node-26.7.0-win32-x64\\node_modules\\huaweicloud-devkit\\plugins\\huaweicloud-core\\src';

// D1-31: Check judgeUpdate dismiss behavior
const mod = await import(pathToFileURL(join(hdkSrc, 'update-check.mjs')).href);
const fn = mod.judgeUpdate;
console.log('=== D1-31: judgeUpdate dismiss ===');
// Try different parameter signatures
const tests = [
  {args: ['1.1.9', {latest:'1.1.10'}, {dismiss:true, dismissVersion:'1.1.10'}], desc: '3 args with dismiss'},
  {args: ['1.1.9', {latest:'1.1.10'}, {dismiss:true}], desc: 'dismiss without version'},
  {args: ['1.1.9', {latest:'1.1.10'}], desc: 'no dismiss'},
];
for (const t of tests) {
  try {
    const r = fn(...t.args);
    console.log(JSON.stringify({desc: t.desc, result: r?.result, dismissed: r?.dismissed, keys: Object.keys(r||{})}));
  } catch(e) {
    console.log(JSON.stringify({desc: t.desc, error: e.message.slice(0,80)}));
  }
}

// D1-65: Check debug env var
console.log('\n=== D1-65: DEBUG env var ===');
const src = readFileSync(join(hdkSrc, 'update-check.mjs'), 'utf-8');
const debugLines = src.split('\n').filter(l => l.includes('DEBUG') || l.includes('debug'));
console.log('DEBUG lines:', debugLines.slice(0,5).map(l => l.trim().slice(0,80)));
