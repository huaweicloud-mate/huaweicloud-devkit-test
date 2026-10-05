// D2-11 R3 STS token 拒绝落盘（P0）
// 断言：auth_switch action=persist 且带 securityToken 时返回 {status:'error', scope:'rejected'}，
//       且 S1（~/.config/huaweicloud/credentials.json）永不写入 securityToken
import { writeFileSync, readFileSync, existsSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const CASE = 'D2-11';

// 隔离 HOME（HUAWEICLOUD_HOME 为 S1 权威根）
const ISO = mkdtempSync(join(tmpdir(), 'hdk-d2-11-'));
process.env.HUAWEICLOUD_HOME = ISO;
process.env.HCLOUD_OBS_CONFIG_PATH = join(ISO, '.obsutilconfig');

function fmt() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}

const creds = await import(pathToFileURL(join(SRC, 'auth', 'credentials.mjs')).href);
const tools = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);

const s1 = creds.globalCredentialsPath();
const beforeExists = existsSync(s1);

const result = await tools.callTool('huaweicloud_auth_switch', {
  action: 'persist',
  ak: 'AKPROBER3TESTPROBER3TEST',
  sk: 'sk_probe_R3_should_never_persist_000000',
  securityToken: 'STS.PROBER3TOKENPROBER3TOKEN',
  region: 'cn-north-4',
});

const afterExists = existsSync(s1);
const s1Raw = afterExists ? readFileSync(s1, 'utf8') : null;
const s1Json = s1Raw ? JSON.parse(s1Raw) : null;

// 逐一核对：token 绝不落盘
const scanTargets = [];
for (const f of [s1, join(ISO, '.obsutilconfig')]) {
  if (!existsSync(f)) { scanTargets.push({ file: f, exists: false, containsToken: false }); continue; }
  const txt = readFileSync(f, 'utf8');
  scanTargets.push({ file: f, exists: true, containsToken: txt.includes('STS.PROBER3TOKENPROBER3TOKEN'), containsSk: txt.includes('sk_probe_R3_should_never_persist_000000') });
}

const rejected = result && result.status === 'error' && result.scope === 'rejected';
const tokenLeaked = scanTargets.some((t) => t.containsToken);
const skLeaked = scanTargets.some((t) => t.containsSk);
const ok = rejected && !tokenLeaked;

finish(ok ? 'PASS' : 'FAIL',
  ok
    ? `auth_switch persist+securityToken 被拒绝：{status:'${result.status}', scope:'${result.scope}'}；隔离 S1 与 OBS 配置均未落盘 token`
    : `R3 拒绝语义异常：result=${JSON.stringify(result)}；tokenLeaked=${tokenLeaked} skLeaked=${skLeaked}`,
  {
    isolatedHome: ISO,
    s1Path: s1,
    s1ExistedBefore: beforeExists,
    s1ExistsAfter: afterExists,
    s1Content: s1Json,
    authSwitchResult: result,
    onDiskScan: scanTargets,
    tokenLeaked,
    skLeaked,
  });