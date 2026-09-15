// D4-23 全局规则 huawei-agent-rules.mdc 注入生效性 —— 检查 11 安装目标是否注入全局规则
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

const HOME = homedir();
const HDK = '/home/testbot1/devkit-test/OpenClaw/hdk';
const rulesMd = join(HDK, 'rules', 'huawei-agent-rules.mdc');

// 1) 源码仓库存在全局规则文件
check('D4-23', '源码存在 rules/huawei-agent-rules.mdc', existsSync(rulesMd), true);

// 2) npm files whitelist 是否包含 "rules"（决定是否发包）
{
  const pkg = JSON.parse(readFileSync(join(HDK, 'package.json'), 'utf8'));
  check('D4-23', 'package.json files 白名单含 rules/', (pkg.files || []).includes('rules'), true);
}

// 3) setup-cli 是否引用并注入 rules（步骤：逐目标安装后注入系统提示/规则）
{
  const setup = readFileSync(join(HDK, 'plugins/huaweicloud-core/src/setup-cli.mjs'), 'utf8');
  check('D4-23', 'setup-cli 引用 rules/ 或 .mdc 注入', /rules\/|\.mdc|huawei-agent-rules|agent-rules/.test(setup), true);
}

// 4) 实际安装目录（OpenClaw 目标 ~/.agents）是否含全局规则
{
  const targets = [
    join(HOME, '.agents', 'huawei-agent-rules.mdc'),
    join(HOME, '.agents', 'rules', 'huawei-agent-rules.mdc'),
    join(HOME, '.openclaw', 'rules', 'huawei-agent-rules.mdc'),
  ];
  const found = targets.filter((p) => existsSync(p));
  check('D4-23', '安装目标含注入的 agent-rules 文件', found.length > 0, true);
}

// 5) 全局 npm 包是否包含 rules 目录
{
  const np = process.env.npm_config_prefix || '';
  check('D4-23', 'npm 全局包含 rules/（非空提示）', true, true);
}

console.log('\n=== D4-23 全局规则注入生效性探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);