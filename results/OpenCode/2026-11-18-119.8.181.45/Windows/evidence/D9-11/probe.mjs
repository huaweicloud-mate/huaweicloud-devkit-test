// D9-11 WebSocket tunnel channel lifecycle — runs the repo fixture against SUT ws-exec/hwlink-tunnel-channel.mjs
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const EV = String.raw`C:\Users\Administrator\devkit-test\testbot4-win-Opencode\huaweicloud-devkit-test\results\OpenCode\2026-11-18-119.8.181.45\Windows\evidence\D9-11`;
const REPO = String.raw`C:\Users\Administrator\devkit-test\testbot4-win-Opencode\huaweicloud-devkit-test`;
const HDKSRC = String.raw`C:\Users\Administrator\devkit-test\testbot4-win-Opencode\hdk\plugins\huaweicloud-core\src`;
const CASE_ID = 'D9-11';
const NK = "20261118050500";

const r = spawnSync(process.execPath, [join(REPO, 'eval', 'harness', 'fixtures', 'd9-11-ws-tunnel.mjs'), HDKSRC, '--evid', EV], {
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
    ? 'hwlink-tunnel-channel 生命周期夹具真实执行：attach 注册 mux / onopen localServer / ready resolve / subConnections / close 清理与 mux 注销 / onClose 幂等 共 ' + pass + ' 断言全部通过'
    : 'hwlink 隧道生命周期断言失败：pass=' + pass + ' fail=' + fail,
  executedAt: NK,
  result: { exit: r.status, pass, fail, checks: lines.slice(-12) },
};
writeFileSync(join(EV, 'stdout.log'), JSON.stringify(rec, null, 2), 'utf8');
console.log(JSON.stringify({ caseId: CASE_ID, status: rec.status, why: rec.why }));
