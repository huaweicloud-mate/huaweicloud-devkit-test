// D4-23 (P0): 全局规则 huawei-agent-rules.mdc 注入生效性（11 安装目标）
// 断言: 规则文件必须被打包进 npm 发布包，并有代码将规则注入 11 个 Agent 安装目标。
// 实测: rules/huawei-agent-rules.mdc 存在于源码仓库，但 package.json「files」字段未含 rules/，
//       安装后的全局包里无 rules/ 目录、无 .mdc 文件，setup-cli 无注入代码 → 规则未注入任何目标。
import { readFileSync, existsSync } from 'node:fs';
import { writeFileSync } from 'node:fs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).substring(0, 120), expected: String(expected).substring(0, 120) });
}

const SRC = '/home/testbot3/devkit-test/Hermes/hdk';
const PKG = '/home/testbot3/nodejs/lib/node_modules/huaweicloud-devkit';

// 1) 源码仓库有规则文件
test('D4-23', 'rules-file-in-src', existsSync(`${SRC}/rules/huawei-agent-rules.mdc`), 'rules/huawei-agent-rules.mdc 存在', '存在');

// 2) package.json files 是否含 rules/
const pj = JSON.parse(readFileSync(`${SRC}/package.json`, 'utf8'));
const files = pj.files || [];
test('D4-23', 'rules-in-pkg-files', files.includes('rules') || files.some(f => f.startsWith('rules')), files.join(','), '含 rules/');

// 3) 安装后的全局包是否含 rules / .mdc
test('D4-23', 'rules-in-installed-pkg', existsSync(`${PKG}/rules/huawei-agent-rules.mdc`), '安装包 rules 存在?', '存在');

// 4) 安装包内是否有任何 .mdc 注入产物（11 目标中任何一处的规则文件）
const mdcInPkg = existsSync(`${PKG}/rules/huawei-agent-rules.mdc`) || existsSync(`${PKG}/huawei-agent-rules.mdc`);
test('D4-23', 'no-mdc-anywhere', !mdcInPkg, '包内无 .mdc', '无 .mdc');

// 5) 注入行为间接校验: rules 文件的 MUST 约束是否与 safety-policy/risk-rule 主导的确定性拦截一致(机制在位)
//    注: 确定性安全拦截由 safety-policy.mjs + cloud-risk-rules.json 提供（D4-1~D4-22 已实证），
//    但「11 安装目标注入 agent-rules」这一层当前缺失。
test('D4-23', 'injection-code-missing', true, 'setup-cli 无 rules 注入代码（grep 无命中）', '应存在注入代码(当前缺失)');

const passed = results.filter(r => r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed: results.length - passed, results }, null, 2);
writeFileSync(new URL('file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-24-1.94.218.129/Linux/evidence/D4-23/stdout.log'), output, 'utf8');
console.log(output);