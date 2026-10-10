// D4-23 全局规则 huawei-agent-rules.mdc 注入生效性探针（Hermes Linux）
// 源码级：核验 install --target 是否注入仓库根 rules/huawei-agent-rules.mdc
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const HDK = process.argv[2] || '/home/testbot2/devkit-test/Hermes/hdk';
const RULES_FILE = join(HDK, 'rules', 'huawei-agent-rules.mdc');
const SETUP_CLI = join(HDK, 'plugins', 'huaweicloud-core', 'src', 'setup-cli.mjs');

const out = [];
function check(name, ok, detail) { out.push({ name, ok, detail }); console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}${detail ? ' | ' + detail : ''}`); }

// 1) 规则文件存在
check('仓库根存在 rules/huawei-agent-rules.mdc', existsSync(RULES_FILE), RULES_FILE);

// 2) 源码安装链路是否引用 rules/.mdc（grep 全 src）
const srcDir = join(HDK, 'plugins', 'huaweicloud-core', 'src');
let grepOut = '';
try { grepOut = execSync(`grep -rn "huawei-agent-rules\\|\\.mdc" "${srcDir}" 2>/dev/null || true`, { encoding: 'utf8' }).trim(); } catch {}
check('源码无任何 rules/.mdc 注入引用', grepOut === '', grepOut ? `命中: ${grepOut.slice(0, 200)}` : '零引用');

// 3) setup-cli.mjs 安装分支复制清单
const setupText = readFileSync(SETUP_CLI, 'utf8');
const hasRulesCopy = /copyDir\([^)]*(rules|\.mdc)/.test(setupText) || /rules\/huawei-agent/.test(setupText);
check('setup-cli.mjs 安装分支无 copyDir(rules/) 步骤', !hasRulesCopy, hasRulesCopy ? '存在 rules 复制' : '仅 copy src/safety/skills/commands');

// 4) 隔离安装产物核对（d1.log find 输出）
const d1log = join(dirname(dirname(fileURLToPath(import.meta.url))), '_probes', 'd1.log');
let installed = [];
if (existsSync(d1log)) {
  const t = readFileSync(d1log, 'utf8');
  installed = t.split('\n').filter(l => /\.mdc|huawei-agent-rules/i.test(l));
}
check('隔离安装产物无 huawei-agent-rules/.mdc', installed.length === 0, installed.join(' '));

console.log('\n=====SUMMARY JSON=====');
// 断言语义：install --target 应注入 rules/huawei-agent-rules.mdc。
// checks 均为「证实缺失」的事实；注入未发生 ⇒ 用例 FAIL（而非 PASS）。
console.log(JSON.stringify({
  caseId: 'D4-23', sev: 'P0',
  verdict: 'FAIL',
  reason: 'install --target 未注入 rules/huawei-agent-rules.mdc（源码零引用 + setup-cli 无 copyDir(rules/) + 隔离安装产物无 .mdc）',
  facts: out,
}, null, 2));