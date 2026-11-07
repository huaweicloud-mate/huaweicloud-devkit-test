// D4-23 全局规则 huawei-agent-rules.mdc 注入生效性探针（Hermes Linux 2026-10-07 修正）
// 源码级 + 隔离安装产物核验：install --target 应注入仓库根 rules/huawei-agent-rules.mdc。
// 注：1.1.8-next.1（commit 6908f6e "publish rules (#758)"）已新增 injectAgentRules，修复本缺陷，
//     本探针据此改为「检测注入已生效」方向（旧版反向断言「缺注入」已过期）。
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HDK = process.argv[2] || '/home/zhangshuang/devkit-test/Hermes/hdk';
const RULES_FILE = join(HDK, 'rules', 'huawei-agent-rules.mdc');
const SETUP_CLI = join(HDK, 'plugins', 'huaweicloud-core', 'src', 'setup-cli.mjs');

const out = [];
const checks = [];
function record(name, ok, detail) {
  out.push({ name, ok, detail });
  checks.push(ok);
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}${detail ? ' | ' + detail : ''}`);
}

// 1) 规则文件存在
record('仓库根存在 rules/huawei-agent-rules.mdc', existsSync(RULES_FILE), RULES_FILE);

// 2) 源码安装链路存在 rules/.mdc 注入引用（injectAgentRules）
const srcDir = join(HDK, 'plugins', 'huaweicloud-core', 'src');
let grepOut = '';
try { grepOut = execSync(`grep -rn "injectAgentRules\\|huawei-agent-rules\\|\\.mdc" "${srcDir}" 2>/dev/null | head -40 || true`, { encoding: 'utf8' }).trim(); } catch {}
record('源码存在 rules/.mdc 注入引用（injectAgentRules）', grepOut.length > 0, grepOut ? grepOut.split('\n').slice(0, 3).join(' ') : '零引用');

// 3) setup-cli.mjs 存在 injectAgentRules 复制步骤 + 计数调用点
const setupText = readFileSync(SETUP_CLI, 'utf8');
const callSites = (setupText.match(/injectAgentRules\(pluginDest\)/g) || []).length;
const hasFn = /function injectAgentRules\s*\(/.test(setupText);
record('setup-cli.mjs 定义 injectAgentRules 且 >=1 安装目标调用', hasFn && callSites > 0, `定义=${hasFn}, 调用点=${callSites}`);

// 4) 隔离安装产物生成了 huawei-agent-rules.mdc（d1.log 中 "Agent Rules ->" 输出）
const d1log = join(dirname(dirname(fileURLToPath(import.meta.url))), '_probes', 'd1.log');
let installed = [];
if (existsSync(d1log)) {
  const t = readFileSync(d1log, 'utf8');
  installed = t.split('\n').filter(l => /Agent Rules ->.*huawei-agent-rules\.mdc/i.test(l));
}
record('隔离安装产物已生成 huawei-agent-rules.mdc', installed.length > 0, installed.slice(0, 2).join(' '));

const allOk = checks.length > 0 && checks.every(Boolean);
console.log('\n=====SUMMARY JSON=====');
console.log(JSON.stringify({
  caseId: 'D4-23',
  sev: 'P0',
  verdict: allOk ? 'PASS' : 'FAIL',
  reason: allOk
    ? `install --target 已注入 rules/huawei-agent-rules.mdc（源码 injectAgentRules 调用点=${callSites}，隔离安装产物已生成 .mdc）`
    : '注入链路不完整：详见 facts',
  facts: out,
}, null, 2));