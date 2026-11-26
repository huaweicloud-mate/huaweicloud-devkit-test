// D9-11 WebSocket tunnel channel lifecycle - runs adapted repo fixture against SUT ws-exec (dist .js)
import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const EV = String.raw`C:\Users\Administrator\devkit-test\OpenCode\huaweicloud-devkit-test\results\OpenCode\2026-11-27-119.8.181.45\Windows\evidence\D9-11`;
const REPO = String.raw`C:\Users\Administrator\devkit-test\testbot4-win-Opencode\huaweicloud-devkit-test`;
const HDKSRC = String.raw`C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-3\node_modules\huaweicloud-devkit\plugins\huaweicloud-core\dist`;
const CASE_ID = 'D9-11';
const NK = (() => { const d = new Date(Date.now() + 8 * 3600 * 1000); return d.toISOString().replace(/[-:T]/g, '').slice(0, 14); })();

const srcFixture = join(REPO, 'eval', 'harness', 'fixtures', 'd9-11-ws-tunnel.mjs');
let fx = readFileSync(srcFixture, 'utf8');
fx = fx.split('ws-exec/hwlink-tunnel-channel.mjs').join('ws-exec/hwlink-tunnel-channel.js');
const adapted = join(EV, '_d9-11-fixture.mjs');
writeFileSync(adapted, fx, 'utf8');

const r = spawnSync(process.execPath, [adapted, HDKSRC, '--evid', EV], {
  encoding: 'utf8', timeout: 120000, cwd: REPO,
});
const out = (r.stdout || '') + (r.stderr || '');
writeFileSync(join(EV, 'fixture.log'), out, 'utf8');
const lines = (r.stdout || '').split(/\r?\n/).filter(Boolean);
const pass = lines.filter((l) => l.startsWith('PASS')).length;
const fail = lines.filter((l) => l.startsWith('FAIL')).length;
const ok = /RESULT:\s*PASS/.test(r.stdout || '') && fail === 0 && pass >= 8;
const rec = {
  caseId: CASE_ID,
  status: ok ? 'PASS' : 'FAIL',
  why: ok
    ? 'hwlink-tunnel-channel 生命周期夹具真实执行（dist SUT）：attach 注册 mux / onopen localServer / ready resolve / subConnections / close 反注册 / onClose 传递 - ' + pass + ' 项全部通过'
    : 'hwlink 隧道生命周期断言失败：pass=' + pass + ' fail=' + fail,
  executedAt: NK,
  result: { exit: r.status, pass, fail, checks: lines.slice(-12) },
};
writeFileSync(join(EV, 'stdout.log'), JSON.stringify(rec, null, 2), 'utf8');
console.log(JSON.stringify({ caseId: CASE_ID, status: rec.status, why: rec.why }));