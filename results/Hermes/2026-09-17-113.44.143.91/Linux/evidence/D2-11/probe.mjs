// D2-11 深挖：STS 临时凭证 + S1 冲突 是否绕过 R3 拒绝落盘
// 隔离 HUAWEICLOUD_HOME，预写 S1 不同账号，auth_switch persist 带 securityToken
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const iso = mkdtempSync(join(tmpdir(), 'hdk-d211-'));
process.env.HUAWEICLOUD_HOME = iso;
const evRoot = '/home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-17-113.44.143.91/Linux/evidence';

const tools = await import(pathToFileURL('/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs').href);
const creds = await import(pathToFileURL('/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs').href);
const { callTool } = tools;
const { writeGlobalCredentials, readGlobalCredentials } = creds;

const lines = [];
// 预写 S1 = 旧账号 OLD_AK
writeGlobalCredentials({ ak: 'OLD_AK_ACCOUNT', sk: 'OLD_SK_ACCOUNT', securityToken: '', region: 'cn-north-4', configuredBySession: false });
const prev = readGlobalCredentials();
lines.push(`  S1 预写入: prev.ak=${prev?.ak}`);

// persist 带 securityToken（STS 临时凭证）+ 不同 ak → 触发 conflict 分支
const res = await callTool('huaweicloud_auth_switch', {
  action: 'persist',
  ak: 'NEW_AK_ACCOUNT',
  sk: 'NEW_SK_ACCOUNT',
  securityToken: 'STS_TEMPORARY_TOKEN_123',
  region: 'cn-north-4',
});

lines.push(`  actual: status=${res?.status}, scope=${res?.scope}, error=${res?.error}`);
const expectRejected = res?.status === 'error' && res?.scope === 'rejected';
lines.push(`  expected: status=error, scope=rejected (R3: STS token 永不落盘)`);
lines.push(`  detail: ${expectRejected ? '' : 'conflict 分支先返回 needs_confirmation，未走 persistCredentials 的 R3 STS 拒绝检查 → 临时凭证可进入落盘确认流程'}`);

const pass = expectRejected;
const out = `=== CASE D2-11 ===  ${pass ? 'PASS' : 'FAIL'}  (STS 冲突态 R3 拒绝)\n` + lines.join('\n') + '\n';
const evdir = join(evRoot, 'D2-11');
import { mkdirSync } from 'node:fs';
mkdirSync(evdir, { recursive: true });
writeFileSync(join(evdir, 'stdout.log'), out, 'utf8');
console.log(out);