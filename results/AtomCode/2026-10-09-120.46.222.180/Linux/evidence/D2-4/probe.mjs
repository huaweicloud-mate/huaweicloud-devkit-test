// D2-4 每日测试探针（真实执行，SUT=hdk gitHead ffd7b47 (v1.1.8-next.1)）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src';
const OUT = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-10-09-120.46.222.180/Linux/evidence/D2-4/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = '20261009053635';
const why = "凭证脱敏 JSON 键值形态漏脱敏：redactSecrets(JSON) 原样返回";
const EXP_ST = 'FAIL';

function lookup(cmd) { const m = { 'cat ~/.config/huaweicloud/credentials.json':'deny','env | grep HUAWEICLOUD':'deny','hcloud csms ShowSecretVersion --secret-name x':'deny','hcloud ECS DeleteServers --delete-all':'deny','echo ZWNobyBo | base64 -d | sh':'deny','sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"':'deny' }; return m[cmd] || ''; }

async function run() {
  const { redactSecrets } = await _m('safety-policy.mjs');
  const raw = await redactSecrets(...["{\"ak\": \"AKID123456\", \"sk\": \"secret789\", \"token\": \"TOKEN123\"}"]);
  const actual = typeof raw === 'object' ? JSON.stringify(raw) : String(raw);
  const pass = !(actual.includes("AKID123456"));
  return { status: pass ? 'PASS' : 'FAIL', actual: actual.slice(0, 120) };

}

run().then(r => {
  const out = { case: 'D2-4', status: r.status, why, actual: r.actual, executedAt, assistant: 'AtomCode(deepseek-v4-pro-0813)', os: 'Linux', sut: 'hdk gitHead ffd7b47 (v1.1.8-next.1)' };
  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('D2-4 ' + r.status + ' ' + r.actual);
}).catch(e => {
  const out = { case: 'D2-4', status: 'BLOCKED', why: String(e).slice(0,200), actual: String(e).slice(0,200), executedAt, assistant: 'AtomCode(deepseek-v4-pro-0813)', os: 'Linux', sut: 'hdk gitHead ffd7b47 (v1.1.8-next.1)' };
  writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('D2-4 BLOCKED ' + String(e).slice(0,80));
});
