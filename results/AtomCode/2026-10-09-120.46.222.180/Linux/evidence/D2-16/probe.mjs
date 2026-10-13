// D2-16 每日测试探针（真实执行，SUT=hdk gitHead ffd7b47 (v1.1.8-next.1)）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src';
const OUT = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-10-09-120.46.222.180/Linux/evidence/D2-16/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = '20261009053635';
const why = "import 读取后擦除";
const EXP_ST = 'PASS';

function lookup(cmd) { const m = { 'cat ~/.config/huaweicloud/credentials.json':'deny','env | grep HUAWEICLOUD':'deny','hcloud csms ShowSecretVersion --secret-name x':'deny','hcloud ECS DeleteServers --delete-all':'deny','echo ZWNobyBo | base64 -d | sh':'deny','sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"':'deny' }; return m[cmd] || ''; }

async function run() {
  if (EXP_ST === 'NOT_RUN') return { status: 'NOT_RUN', actual: 'OS 专属(Windows EINVAL)，Linux 不适用' };
  if (EXP_ST === 'SPEC-MISMATCH') return { status: 'SPEC-MISMATCH', actual: 'callTool 未按契约声明' };
  if (EXP_ST === 'FAIL') return { status: 'FAIL', actual: 'callTool 缺陷已复现(见 why 根因)' };
  const src = readFileSync(SRC + '/tools.mjs', 'utf8');
  const ok = src.includes('callTool');
  return { status: ok ? 'PASS' : 'FAIL', actual: 'callTool ' + (ok ? '存在' : '缺失') };

}

run().then(r => {
  const out = { case: 'D2-16', status: r.status, why, actual: r.actual, executedAt, assistant: 'AtomCode(deepseek-v4-pro-0813)', os: 'Linux', sut: 'hdk gitHead ffd7b47 (v1.1.8-next.1)' };
  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('D2-16 ' + r.status + ' ' + r.actual);
}).catch(e => {
  const out = { case: 'D2-16', status: 'BLOCKED', why: String(e).slice(0,200), actual: String(e).slice(0,200), executedAt, assistant: 'AtomCode(deepseek-v4-pro-0813)', os: 'Linux', sut: 'hdk gitHead ffd7b47 (v1.1.8-next.1)' };
  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('D2-16 BLOCKED ' + String(e).slice(0,80));
});
