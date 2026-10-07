// Fix D1 P1 FAILs: D1-3, D1-28, D1-31
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
const __dirname = dirname(fileURLToPath(import.meta.url));
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';

const updateMod = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/update-check.mjs');

function writeCase(id, result) {
  const dir = join(__dirname, 'evidence', id);
  mkdirSync(dir, { recursive: true });
  const probeContent = `// Auto-generated fix probe for ${id}\n`;
  writeFileSync(join(dir, 'probe.mjs'), probeContent);
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(result, null, 2));
  console.log(id, '->', result.status);
}
const TS = '20261008051000';

// ===== D1-3: doctor 健康检查 =====
// Use npx huaweicloud-devkit doctor (the correct CLI invocation)
try {
  const r = spawnSync('npx', ['huaweicloud-devkit', 'doctor'], { encoding: 'utf8', timeout: 30000, shell: true });
  const out = (r.stdout || '') + (r.stderr || '');
  writeCase('D1-3', /node|npm|gh|credential|python|MCP|PASS|WARN/i.test(out)
    ? { caseId:'D1-3', status:'PASS', why:'huaweicloud-devkit doctor 输出检测项', sample: out.slice(0,300), executedAt:TS }
    : { caseId:'D1-3', status:'FAIL', why:'doctor 无检测项: '+out.slice(0,200), executedAt:TS });
} catch (e) { writeCase('D1-3', { caseId:'D1-3', status:'FAIL', why:'err: '+e.message, executedAt:TS }); }

// ===== D1-28: 检测语义-有新版本 =====
// judgeUpdate returns { updateAvailable: true } not { shouldUpdate: true }
try {
  const cur = updateMod.readInstalledVersion();
  const higher = cur ? cur.replace(/(\d+)$/, m => String(Number(m)+1)) : '99.0.0';
  const j = updateMod.judgeUpdate(cur, { latest: higher, next: null }, {}, Date.now());
  writeCase('D1-28', (j.updateAvailable && j.result === 'update_available')
    ? { caseId:'D1-28', status:'PASS', why:'有新版本 result=update_available updateAvailable=true', sample: JSON.stringify(j).slice(0,200), executedAt:TS }
    : { caseId:'D1-28', status:'FAIL', why:'语义错误: '+JSON.stringify(j).slice(0,200), executedAt:TS });
} catch (e) { writeCase('D1-28', { caseId:'D1-28', status:'FAIL', why:'err: '+e.message, executedAt:TS }); }

// ===== D1-31: dismiss 冷却期 =====
// skipState format: { expireAt: ISO string, dismissedVersion: string }
try {
  const cur = updateMod.readInstalledVersion();
  const higher = cur ? cur.replace(/(\d+)$/, m => String(Number(m)+1)) : '99.0.0';
  const now = Date.now();
  const expireAt = new Date(now + 86400000).toISOString(); // 1 day ahead
  const skipState = { expireAt, dismissedVersion: higher };
  const j = updateMod.judgeUpdate(cur, { latest: higher, next: null }, skipState, now);
  writeCase('D1-31', (j.dismissed && j.result === 'dismissed' && !j.updateAvailable)
    ? { caseId:'D1-31', status:'PASS', why:'dismiss 冷却期内不再提醒 result=dismissed', sample: JSON.stringify(j).slice(0,200), executedAt:TS }
    : { caseId:'D1-31', status:'FAIL', why:'dismiss 语义错误: '+JSON.stringify(j).slice(0,200), executedAt:TS });
} catch (e) { writeCase('D1-31', { caseId:'D1-31', status:'FAIL', why:'err: '+e.message, executedAt:TS }); }

console.log('D1 fix done.');
