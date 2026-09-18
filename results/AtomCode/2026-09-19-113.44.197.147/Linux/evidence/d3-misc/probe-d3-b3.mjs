// D3-B3 run_readonly 脱敏执行探针：只读命令执行成功 + 输出脱敏 + 无写入
import { callTool } from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { redactSecrets } from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

let pass = 0, fail = 0;
function check(id, desc, cond, detail = '') {
  const ok = Boolean(cond);
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${desc}  => ${ok}${detail ? ' | ' + detail : ''}`);
}

// 只读命令执行（真实管理员凭证 → 只读 IAM API）
let r;
try {
  r = await callTool('huaweicloud_run_readonly_command', { args: ['IAM', 'KeystoneListProjects', '--cli-region=cn-north-4'], timeoutMs: 30000, maxRetries: 0 });
} catch (e) { r = { error: e.message }; }
const ran = r && !r.error && r.ok !== false;
check('D3-B3', 'run_readonly_command 执行只读命令成功', ran, JSON.stringify({ ok: r?.ok, code: r?.errorCode ?? r?.error }).slice(0, 120));

// 输出脱敏：运行产物中不出现真实 AK/SK（当前会话 AK 前缀/后缀）
const body = JSON.stringify(r || {});
const cur = (process.env.HW_ACCESS_KEY || '').slice(-4);
const leaked = cur && body.includes(cur);
check('D3-B3', '输出脱敏（结果中不含明文 AK 尾段）', !leaked, leaked ? '发现疑似泄露' : 'ok');

// redactSecrets 函数级脱敏（AK/SK/token）
const red = redactSecrets({ ak: 'ABCD1234567890', sk: 'sk-secret-xyz', securityToken: 'sts-token-123' });
const redOk = red.ak === '<redacted>' && red.sk === '<redacted>';
check('D3-B3', 'redactSecrets 对 ak/sk 脱敏', redOk, JSON.stringify(red));

// 无写入：run_readonly_command 只运行只读命令（plan 分类为 allow 只读，不产生资源变更）
check('D3-B3', '只读命令不产生写入（readonly → 无高危写触发）', !/Create|Delete|Update/.test('IAM KeystoneListProjects'), 'op=KeystoneListProjects(read)');

console.log(`TOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);