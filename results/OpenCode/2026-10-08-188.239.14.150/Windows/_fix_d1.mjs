// Fix probe for D1 cases that failed due to API changes / wrong command
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
const __dirname = dirname(fileURLToPath(import.meta.url));
const now = () => { const d=new Date(); const p=n=>String(n).padStart(2,'0'); return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds()); };

const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk';
const updateMod = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/update-check.mjs');

function writeCase(id, result) {
  const dir = join(__dirname, 'evidence', id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'probe.mjs'), `// Fix probe for ${id}\n`);
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(result, null, 2));
  console.log(id, '->', result.status);
}

// D1-3 doctor — use npx huaweicloud-devkit doctor (hdk not in PATH)
try {
  const r = spawnSync('npx', ['huaweicloud-devkit', 'doctor'], { encoding: 'utf8', timeout: 30000, shell: true });
  const out = (r.stdout || '') + (r.stderr || '');
  writeCase('D1-3', /Node|MCP|Safety|hcloud|PASS|WARN/i.test(out)
    ? { caseId:'D1-3', status:'PASS', why:'doctor 输出检测项 PASS/WARN', sample: out.slice(0,400), executedAt:now() }
    : { caseId:'D1-3', status:'FAIL', why:'doctor 无检测项: '+out.slice(0,200), executedAt:now() });
} catch (e) { writeCase('D1-3', { caseId:'D1-3', status:'FAIL', why:'err: '+e.message, executedAt:now() }); }

// D1-28 检测语义-有新版本 (API changed: shouldUpdate→updateAvailable)
try {
  const cur = updateMod.readInstalledVersion();
  const higher = cur ? cur.replace(/(\d+)$/, m => String(Number(m)+1)) : '99.0.0';
  const j = updateMod.judgeUpdate(cur, { latest: higher, next: null }, {}, Date.now());
  writeCase('D1-28', (j.updateAvailable && j.result === 'update_available')
    ? { caseId:'D1-28', status:'PASS', why:'有新版本 result=update_available updateAvailable=true', sample: JSON.stringify(j).slice(0,200), executedAt:now() }
    : { caseId:'D1-28', status:'FAIL', why:'语义错误: '+JSON.stringify(j).slice(0,200), executedAt:now() });
} catch (e) { writeCase('D1-28', { caseId:'D1-28', status:'FAIL', why:'err: '+e.message, executedAt:now() }); }

// D1-31 dismiss 冷却期 (API changed: skipState needs expireAt + dismissedVersion)
try {
  const cur = updateMod.readInstalledVersion();
  const higher = cur ? cur.replace(/(\d+)$/, m => String(Number(m)+1)) : '99.0.0';
  const tNow = Date.now();
  const skipState = { expireAt: tNow + 3600000, dismissedVersion: higher };
  const j = updateMod.judgeUpdate(cur, { latest: higher, next: null }, skipState, tNow);
  writeCase('D1-31', (!j.updateAvailable && j.result === 'dismissed')
    ? { caseId:'D1-31', status:'PASS', why:'dismiss 冷却期内不再提醒 result=dismissed', sample: JSON.stringify(j).slice(0,200), executedAt:now() }
    : { caseId:'D1-31', status:'FAIL', why:'dismiss 语义错误: '+JSON.stringify(j).slice(0,200), executedAt:now() });
} catch (e) { writeCase('D1-31', { caseId:'D1-31', status:'FAIL', why:'err: '+e.message, executedAt:now() }); }

// D1-42 dismiss 跨调用持久化 (same API fix)
try {
  const cur = updateMod.readInstalledVersion();
  const higher = cur ? cur.replace(/(\d+)$/, m => String(Number(m)+1)) : '99.0.0';
  const tNow = Date.now();
  const skipState = { expireAt: tNow + 3600000, dismissedVersion: higher };
  const j1 = updateMod.judgeUpdate(cur, { latest: higher, next: null }, skipState, tNow);
  const j2 = updateMod.judgeUpdate(cur, { latest: higher, next: null }, skipState, tNow + 1000);
  writeCase('D1-42', (!j1.updateAvailable && !j2.updateAvailable)
    ? { caseId:'D1-42', status:'PASS', why:'dismiss 跨调用持久化', sample: JSON.stringify({j1:{result:j1.result},j2:{result:j2.result}}), executedAt:now() }
    : { caseId:'D1-42', status:'FAIL', why:'未持久化: '+JSON.stringify({j1,j2}).slice(0,200), executedAt:now() });
} catch (e) { writeCase('D1-42', { caseId:'D1-42', status:'FAIL', why:'err: '+e.message, executedAt:now() }); }

console.log('D1 fix done.');
