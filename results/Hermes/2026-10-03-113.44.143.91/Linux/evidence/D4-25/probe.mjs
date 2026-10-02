// D4-25 Python hook 事件遥测分类 — spawn probe-d4-25.py 真实执行
import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const EVID = dirname(fileURLToPath(import.meta.url));
const r = spawnSync('python3', [join(EVID, '..', 'probe-d4-25.py')], { encoding: 'utf8', timeout: 60000 });
const out = (r.stdout || '') + (r.stderr || '');
const status = out.includes('PASS') && !out.includes('FAIL') ? 'PASS' : 'FAIL';
const obj = { status, why: status === 'FAIL' ? 'hooks/huaweicloud-safety.py:46 WRITE_OPERATION_RE 前置捕获组导致写操作落 cli:invoke 而非 cli:write' : undefined, executedAt: new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14) };
writeFileSync(new URL('file:///home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-10-03-113.44.143.91/Linux/evidence/D4-25/stdout.log'), JSON.stringify(obj, null, 2), 'utf8');
console.log('D4-25 => ' + status);
console.log(out.slice(0, 800));
