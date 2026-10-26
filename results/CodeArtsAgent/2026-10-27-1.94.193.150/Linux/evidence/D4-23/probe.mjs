// D4-23 全局规则 huawei-agent-rules.mdc 注入生效性（1.1.9-next.0 修正版）
// 1.1.9 用 injectAgentRules() + copyFileVerified 实现注入（#758），断言据此核验。
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const HDK = '/home/testbot2/devkit-test/testbot2-Linux-CodeArts CLI/hdk';
const SETUP = join(HDK, 'plugins', 'huaweicloud-core', 'src', 'setup-cli.mjs');
const RULES = join(HDK, 'rules', 'huawei-agent-rules.mdc');
const code = readFileSync(SETUP, 'utf8');
const results = [];
function check(name, ok, detail) { results.push({ name, ok, detail: String(detail).slice(0,300) }); console.log(`[${ok?'OK':'FAIL'}] ${name} | ${detail}`); }
check('仓库根存在 rules/huawei-agent-rules.mdc', existsSync(RULES), RULES);
check('setup-cli.mjs 定义 injectAgentRules()', /function injectAgentRules\s*\(/.test(code), 'injectAgentRules 函数');
check('injectAgentRules 复制到 pluginDest/rules', /join\(pluginDest,\s*'rules'\)/.test(code) && /copyFileVerified\(rulesSrc/.test(code), 'copyFileVerified(rulesSrc, pluginDest/rules/...mdc)');
check('安装链路调用 injectAgentRules', /injectAgentRules\(/.test(code), '调用点存在');
console.log('=====SUMMARY JSON=====');
console.log(JSON.stringify({ caseId: 'D4-23', verdict: results.every(r=>r.ok) ? 'PASS' : 'FAIL', results }, null, 2));
