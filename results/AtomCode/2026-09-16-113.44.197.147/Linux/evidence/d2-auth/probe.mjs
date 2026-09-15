// 凭证与鉴权探针：直调 credentials.mjs / agent-registration.mjs 导出函数
import {
  resolveCredentials,
  readGlobalCredentials,
  writeGlobalCredentials,
  setConfiguredBySession,
  setRuntimeCredentials,
  clearRuntimeCredentials,
  hasRuntimeCredentials,
  resolveCredentialsWithRuntime,
} from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
import { getAgentRegistrationStatuses } from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/auth/agent-registration.mjs';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let pass = 0, fail = 0;
function eq(id, desc, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${desc}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// D2-5 凭证缺失报错指引：子进程隔离 HOME，无 env/无文件 → 抛 HDKIT_CRED_MISSING
{
  const fakeHome = mkdtempSync(join(tmpdir(), 'hdk-probe-home-'));
  const snippet = `
    import { resolveCredentials } from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
    let code = null, msg = '';
    try { resolveCredentials(); } catch (e) { code = e.code; msg = e.message; }
    console.log(JSON.stringify({ code, msg: msg.slice(0, 40) }));
  `;
  let out;
  try {
    out = execFileSync(process.execPath, ['--input-type=module', '-e', snippet], {
      env: { ...process.env, HOME: fakeHome, HW_ACCESS_KEY: '', HW_SECRET_KEY: '', HW_SECURITY_TOKEN: '' },
      encoding: 'utf8',
    });
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
  }
  console.log(`INFO   D2-5  子进程输出 => ${out.trim().slice(0, 120)}`);
  let code = null;
  try { code = JSON.parse(out.trim()).code; } catch {}
  eq('D2-5', '缺凭证抛 HDKIT_CRED_MISSING', code, 'HDKIT_CRED_MISSING');
}

// D2-1 auth 三端同步：runtime 凭证读写
eq('D2-1', 'setRuntimeCredentials 后 hasRuntimeCredentials', (setRuntimeCredentials('AK1', 'SK1', undefined, 'cn-north-4'), hasRuntimeCredentials()), true);
{
  const r = resolveCredentialsWithRuntime({ allowMissing: true });
  eq('D2-1', 'runtime AK 生效', r && r.ak, 'AK1');
  eq('D2-1', 'runtime SK 生效', r && r.sk, 'SK1');
}
clearRuntimeCredentials();
eq('D2-1', 'clearRuntimeCredentials 后不保持', hasRuntimeCredentials(), false);

// D2-13 R9 configuredBySession 优先 env
{
  const savedAK = process.env.HW_ACCESS_KEY;
  process.env.HW_ACCESS_KEY = 'ENV_AK';
  setConfiguredBySession(true);
  const bak = readGlobalCredentials();
  writeGlobalCredentials({ ak: 'STORE_AK', sk: 'STORE_SK', region: 'cn-north-4', configuredBySession: true });
  const r = resolveCredentials({ allowMissing: true });
  eq('D2-13', 'configuredBySession 优先 (STORE_AK)', r.ak, 'STORE_AK');
  writeGlobalCredentials(bak || {});
  setConfiguredBySession(false);
  if (savedAK) process.env.HW_ACCESS_KEY = savedAK; else delete process.env.HW_ACCESS_KEY;
}

// D1-26 agent 注册状态：11 安装目标枚举（agents 为对象，11 键）
{
  const st = getAgentRegistrationStatuses('all');
  const keys = Object.keys(st.agents || {});
  console.log(`INFO   D1-26  agents keys(${keys.length}) => ${keys.join(',')}`);
  eq('D1-26', 'agent 注册状态覆盖 11 项目标', keys.length, 11);
}

console.log(`TOTAL pass=${pass} fail=${fail}`);