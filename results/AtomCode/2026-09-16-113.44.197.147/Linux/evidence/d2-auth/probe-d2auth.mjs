// D2 认证真云探针：D2-1 (三端同步) / D2-16 (import 读后擦除) / D2-11 (STS token 拒绝落盘)
// 真实凭证下运行，红线：不破坏既有管理员凭证（STS 拒绝路在写盘前返回；import 用 temporary 不落盘）
import { callTool } from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/tools.mjs';
import {
  readGlobalCredentials,
  globalCredentialsPath,
  obsConfigPath,
} from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
import { existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';

let pass = 0, fail = 0;
function check(id, desc, cond, detail = '') {
  const ok = Boolean(cond);
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${desc}  => ${ok}${detail ? ' | ' + detail : ''}`);
}
const red = (s) => (typeof s === 'string' && s ? s.slice(0, 4) + '***' + s.slice(-4) : '<empty>');

// 读取当前 S1（管理员）凭证，用于「同账号 + 假 token」触发 persistCredentials 的 STS 拒绝路（写盘前返回，安全）
const current = readGlobalCredentials() || {};
const currentAk = current.ak || '';
const currentSk = current.sk || '';

// ---------- D2-11 : R3 STS token 拒绝落盘 ----------
// 用当前 ak/sk（无冲突）+ 假 securityToken 调 auth_switch persist → 应在写盘前被拒绝
{
  const r = await callTool('huaweicloud_auth_switch', {
    mode: 'memory',
    action: 'persist',
    ak: currentAk,
    sk: currentSk,
    securityToken: 'STS-FAKE-TEST-TOKEN-000000',
    region: 'cn-north-4',
  }).catch((e) => ({ thrown: e.message }));
  const rejected = r && r.status === 'error' && r.scope === 'rejected';
  check('D2-11', 'auth_switch persist + securityToken 返回 {status:error, scope:rejected}', rejected, JSON.stringify({ status: r?.status, scope: r?.scope }));
  const after = readGlobalCredentials() || {};
  const tokenEmpty = !after.securityToken;
  check('D2-11', 'S1 (credentials.json) 未写入 securityToken（token 永不落盘）', tokenEmpty, `securityToken=${red(after.securityToken)}`);
}

// ---------- D2-16 : import 文件读取后擦除 ----------
{
  const importPath = join(dirname(globalCredentialsPath()), 'creds-import.json');
  // 确保起点干净
  rmSync(importPath, { force: true });
  writeFileSync(importPath, JSON.stringify({ ak: 'AKIMPORTFAKE', sk: 'SKIMPORTFAKE', securityToken: '', region: 'cn-north-4' }));
  const beforeExists = existsSync(importPath);
  const r = await callTool('huaweicloud_auth_switch', { mode: 'import', action: 'temporary' }).catch((e) => ({ thrown: e.message }));
  const afterExists = existsSync(importPath);
  check('D2-16', 'mode=import 读取 creds-import.json 后无条件擦除（exists=False）', beforeExists && !afterExists, `before=${beforeExists} after=${afterExists}`);
  check('D2-16', 'import 进入 temporary（不落盘，不破坏 S1）', r?.status === 'ok' && r?.scope === 'temporary', JSON.stringify({ status: r?.status, scope: r?.scope }));
}

// ---------- D2-1 : auth init 三端同步（真云 E2E 核对）----------
{
  const s1 = globalCredentialsPath();
  const s2 = join(homedir(), '.hcloud', 'config.json');
  const s2alt = join(homedir(), '.hcloud', 'config');
  const s3 = obsConfigPath();
  check('D2-1', 'S1 credentials.json 存在且含 ak/sk', existsSync(s1) && Boolean(currentAk) && Boolean(currentSk), `path=${s1} ak=${red(currentAk)}`);
  check('D2-1', 'S2 KooCLI current 档存在 (~/.hcloud/config[.json])', existsSync(s2) || existsSync(s2alt), `path=${s2} (alt=${existsSync(s2alt)})`);
  check('D2-1', 'S3 OBS config 存在 (~/.obsutilconfig)', existsSync(s3), `path=${s3} exists=${existsSync(s3)}`);

  // 真云 E2E：S2 KooCLI 用真实凭证实际可用（只读 IAM API 冒烟）
  let hc = null;
  try { hc = await callTool('huaweicloud_run_readonly_command', { args: ['IAM', 'KeystoneListProjects', '--cli-region=cn-north-4'], timeoutMs: 30000 }); } catch (e) { hc = { error: e.message }; }
  const hcOk = hc && hc.ok !== false && !hc.error && !(hc.errorCode) && (hc.stdout || '').includes('projects');
  check('D2-1', '真云 E2E：S2 KooCLI 只读 API 实际可用（KeystoneListProjects 返回 projects）', Boolean(hcOk), hcOk ? 'ok' : JSON.stringify({ error: hc?.error, code: hc?.errorCode }).slice(0, 160));
}

console.log(`TOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);