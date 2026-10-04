import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'stdout.log');
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
let status = 'PASS', why = '', evidence = {};
try {
  // D4-23: 全局规则 huawei-agent-rules.md 注入生效性
  // 实际文件名 huawei-agent-rules.mdc，由 setup-cli.mjs injectAgentRules 注入到 plugin dest/rules/
  const rulesPath = join(HDK, 'rules/huawei-agent-rules.mdc').replace(/\\/g,'/');
  evidence.rulesPath = rulesPath;
  evidence.exists = existsSync(rulesPath);
  if (!existsSync(rulesPath)) {
    status = 'FAIL'; why = 'rules/huawei-agent-rules.mdc 不存在';
  } else {
    const content = readFileSync(rulesPath, 'utf8');
    evidence.contentLen = content.length;
    evidence.hasKmsConstraint = /csms|kms|decrypt/i.test(content);
    evidence.hasMustNot = /MUST NOT|禁止|不得/i.test(content);
    evidence.hasApproval = /approval|审批|确认/i.test(content);
    // 验证 injectAgentRules 函数存在于 setup-cli.mjs
    const setupSrc = readFileSync(join(HDK, 'plugins/huaweicloud-core/src/setup-cli.mjs').replace(/\\/g,'/'), 'utf8');
    evidence.injectAgentRulesDefined = /function injectAgentRules/.test(setupSrc);
    evidence.agentRulesFileConst = /AGENT_RULES_FILE\s*=\s*'huawei-agent-rules\.mdc'/.test(setupSrc);
    if (evidence.hasKmsConstraint && evidence.hasMustNot && evidence.injectAgentRulesDefined) {
      status = 'PASS'; why = 'huawei-agent-rules.mdc 存在，含 csms/kms 禁直连 MUST NOT 约束，injectAgentRules 在 setup-cli.mjs 注册';
    } else {
      status = 'FAIL'; why = 'rules 内容或注入不完整：' + JSON.stringify(evidence).slice(0,300);
    }
  }
} catch (e) {
  status = 'FAIL'; why = 'probe error: ' + (e && e.message);
}
const result = { caseId: 'D4-23', status, why, evidence, executedAt: '20261005050100' };
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
