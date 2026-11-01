import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit';

// D4-23 全局规则注入生效性：核对 rules/huawei-agent-rules.mdc 是否为孤儿文件
const mdc = join(PKG, 'rules', 'huawei-agent-rules.mdc');
const exists = existsSync(mdc);
let referenced = false;
const setup = join(PKG, 'bin', 'setup.cjs');
if (existsSync(setup)) {
  const txt = readFileSync(setup, 'utf8');
  referenced = /agent-rules|\.mdc|rules[\/\\]/.test(txt);
}

// 结论：文件存在但 setup.cjs 无任何引用 → 孤儿文件（未注入 11 安装目标）
const orphan = exists && !referenced;
const status = orphan ? 'SPEC-MISMATCH' : 'PASS';
const rec = {
  status,
  why: (orphan
    ? `rules/huawei-agent-rules.mdc exists=true but bin/setup.cjs references=false → 孤儿文件，未注入任何安装目标（11 目标均未收到 agent-rules）`
    : `rules file exists=${exists} referenced=${referenced}`),
  executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''),
  caseId: 'D4-23'
};
writeFileSync(__dirname + '/stdout.log', JSON.stringify(rec, null, 2));
console.log(JSON.stringify(rec));
process.exit(0);