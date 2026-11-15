// D4-23 全局规则 huawei-agent-rules.mdc 注入生效性探针（Hermes Linux）
// 源码级 + 安装产物级双重核验：install --target 是否把仓库根 rules/huawei-agent-rules.mdc 注入。
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HDK = process.argv[2] || '/home/zhangshuang/devkit-test/Hermes/hdk';
const RULES_FILE = join(HDK, 'rules', 'huawei-agent-rules.mdc');
const SETUP_CLI = join(HDK, 'plugins', 'huaweicloud-core', 'src', 'setup-cli.mjs');

const out = [];
function check(name, ok, detail) { out.push({ name, ok, detail: String(detail).slice(0, 300) }); console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}${detail ? ' | ' + detail : ''}`); }

// 1) 规则文件存在
check('仓库根存在 rules/huawei-agent-rules.mdc', existsSync(RULES_FILE), RULES_FILE);

// 2) 源码安装链路引用 rules/.mdc（injectAgentRules 或 literal）
const srcDir = join(HDK, 'plugins', 'huaweicloud-core', 'src');
let grepOut = '';
try { grepOut = execSync(`grep -rn "injectAgentRules\\|AGENT_RULES_FILE\\|huawei-agent-rules" "${srcDir}" 2>/dev/null || true`, { encoding: 'utf8' }).trim(); } catch {}
check('源码存在规则注入引用(injectAgentRules)', grepOut.includes('injectAgentRules') || grepOut.includes('AGENT_RULES_FILE'), grepOut.slice(0, 200));

// 3) setup-cli.mjs 安装分支复制 rules
const setupText = readFileSync(SETUP_CLI, 'utf8');
const hasInject = /injectAgentRules\s*\(/.test(setupText) && /rules.*huawei-agent-rules\.mdc|AGENT_RULES_FILE/.test(setupText);
check('setup-cli.mjs 存在 injectAgentRules 复制步骤', hasInject, hasInject ? 'injectAgentRules() 调用 + copy rules/huawei-agent-rules.mdc' : '未找到注入调用');

// 4) 隔离安装产物核对（读 d1.log find 输出，install 产物含 .mdc）
const d1log = join(dirname(dirname(fileURLToPath(import.meta.url))), '_probes', 'd1.log');
let installed = [];
if (existsSync(d1log)) {
  const t = readFileSync(d1log, 'utf8');
  installed = t.split('\n').filter(l => l.includes('/rules/huawei-agent-rules.mdc') || l.includes('Agent Rules ->'));
}
check('隔离安装产物含 rules/huawei-agent-rules.mdc', installed.length > 0, installed.slice(0, 3).join(' '));

const allOk = out.every(x => x.ok);
console.log('\n=====SUMMARY JSON=====');
console.log(JSON.stringify({
  caseId: 'D4-23', sev: 'P0',
  verdict: allOk ? 'PASS' : 'FAIL',
  reason: allOk ? 'install --target 正确注入 rules/huawei-agent-rules.mdc（根文件+源码引用+install 产物三级一致）' : '注入链路缺失，见 facts',
  facts: out,
}, null, 2));