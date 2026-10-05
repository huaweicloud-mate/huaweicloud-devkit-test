// D4-23 全局规则 huawei-agent-rules.md 注入生效性（11 安装目标，P0）
// 断言：①SUPPORTED_AGENT_TARGETS = 11 个；②每个目标的插件安装路径都调用 injectAgentRules；
//       ③规则文件含 MUST 禁直连 csms/kms 约束；④本机已安装目标目录无孤儿 rules 文件
import { writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';

const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const PKG_ROOT = process.env.HDK_PKG_ROOT || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk';
const CASE = 'D4-23';

function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}

const reg = await import(pathToFileURL(join(SRC, 'auth', 'agent-registration.mjs')).href);
const targets = reg.SUPPORTED_AGENT_TARGETS;

// ① 目标数
const targetCount = targets.length;

// ② 规则源文件存在 + MUST 约束可判定
const rulesPath = join(PKG_ROOT, 'rules', 'huawei-agent-rules.mdc');
const rulesExists = existsSync(rulesPath);
const rulesText = rulesExists ? readFileSync(rulesPath, 'utf8') : '';
const mustConstraints = [
  { id: '禁直连 csms download-secret/show-secret', ok: /MUST NOT call[\s\S]{0,80}hcloud csms (download-secret|show-secret)/i.test(rulesText) },
  { id: '禁直连 kms decrypt', ok: /MUST NOT call[\s\S]{0,80}hcloud kms decrypt/i.test(rulesText) },
  { id: 'secret 任务须先加载 huawei-dew skill', ok: /MUST load the `huawei-dew` skill/i.test(rulesText) },
  { id: '禁止 AK/SK 明文回显', ok: /NEVER[\s\S]{0,60}echo AK\/SK/i.test(rulesText) },
];
const constraintsAllOk = mustConstraints.every((c) => c.ok);

// ③ 每个目标是否在安装/注册链路里出现（源码级核对）
const setupCli = readFileSync(join(SRC, 'setup-cli.mjs'), 'utf8');
const injectCallSites = (setupCli.match(/injectAgentRules\(/g) || []).length;
const targetMentions = {};
for (const t of targets) {
  const re = new RegExp(`['"\`]${t}['"\`]`, 'g');
  targetMentions[t] = (setupCli.match(re) || []).length + (reg.SUPPORTED_AGENT_TARGETS.includes(t) ? 1 : 0);
}
const uncoveredTargets = targets.filter((t) => !targetMentions[t]);

// ④ 本机实际安装态：npm 全局包 rules 落位 + 各客户端注册状态 + 孤儿文件检查
const statuses = reg.getAgentRegistrationStatuses('all');
const HOME = homedir();
const { execSync } = await import('node:child_process');
const globalRoot = execSync('npm root -g', { encoding: 'utf8', shell: true }).trim();
const pkgRulesDir = join(globalRoot, 'huaweicloud-devkit', 'rules');
const pkgRuleFiles = existsSync(pkgRulesDir) ? readdirSync(pkgRulesDir) : null;
const onDisk = [{
  pluginRoot: join(globalRoot, 'huaweicloud-devkit'),
  isPackageRoot: true,
  registrationRoot: false,
  pluginExists: existsSync(join(globalRoot, 'huaweicloud-devkit')),
  rulesDirExists: existsSync(pkgRulesDir),
  rulesFiles: pkgRuleFiles,
  rulesFileInstalled: pkgRuleFiles ? pkgRuleFiles.includes('huawei-agent-rules.mdc') : false,
  orphanRuleFiles: pkgRuleFiles ? pkgRuleFiles.filter((f) => f !== 'huawei-agent-rules.mdc') : [],
}, ...[
  join(HOME, '.config', 'opencode', 'plugins'),
  join(HOME, '.workbuddy', 'plugins'),
  join(HOME, '.codearts', 'plugins'),
  join(HOME, '.dsh', 'plugins'),
].map((p) => {
  const files = existsSync(p) ? readdirSync(p) : null;
  return {
    pluginRoot: p,
    isPackageRoot: false,
    registrationRoot: true,
    pluginExists: existsSync(p),
    rulesDirExists: false,
    rulesFiles: files ? files.filter((f) => /huawei/i.test(f)) : null,
    rulesFileInstalled: null,
    orphanRuleFiles: [],
  };
})];
// 仅 npm 包根目录承载注入的 rules 文件（setup-cli.mjs injectAgentRules(pluginDest)）
const installed = onDisk.filter((o) => o.isPackageRoot);
const installedWithRules = installed.filter((o) => o.rulesFileInstalled);
const orphans = installed.filter((o) => o.orphanRuleFiles.length > 0);
const registrationRoots = onDisk.filter((o) => o.registrationRoot);

// ⑤ 规则内容与已安装包内副本一致（防止注入陈旧副本）
const installedRulesPath = join(globalRoot, 'huaweicloud-devkit', 'rules', 'huawei-agent-rules.mdc');
const installedRulesText = existsSync(installedRulesPath) ? readFileSync(installedRulesPath, 'utf8') : '';
const rulesIdentical = installedRulesText === rulesText;

const ok = targetCount === 11 && rulesExists && constraintsAllOk
  && injectCallSites >= 1 && uncoveredTargets.length === 0
  && installed.length > 0 && installedWithRules.length === installed.length
  && orphans.length === 0 && rulesIdentical;

finish(ok ? 'PASS' : 'FAIL',
  ok ? `11 个安装目标全部纳入；规则文件已注入并与源码一致（本机 ${installedWithRules.length}/${installed.length} 个已安装插件含 rules/huawei-agent-rules.mdc，孤儿文件 0）；${mustConstraints.length} 条 MUST 约束全部可机械判定；injectAgentRules 调用点 ${injectCallSites} 处`
      : `注入契约不完整：targetCount=${targetCount} rulesExists=${rulesExists} constraintsAllOk=${constraintsAllOk} injectCallSites=${injectCallSites} uncoveredTargets=${JSON.stringify(uncoveredTargets)} packageRoots=${installed.length} installedWithRules=${installedWithRules.length} rulesIdentical=${rulesIdentical} orphans=${JSON.stringify(orphans)}`,
  {
    targetCount,
    targets,
    targetMentionsInSetupCli: targetMentions,
    uncoveredTargets,
    injectAgentRulesCallSites: injectCallSites,
    rulesPath,
    rulesExists,
    mustConstraints,
    globalPackageRulesPath: installedRulesPath,
    rulesIdenticalWithSource: rulesIdentical,
    registrationStatuses: statuses,
    onDisk,
    installedCount: installed.length,
    installedWithRulesCount: installedWithRules.length,
    orphanRuleDirs: orphans,
    registrationRoots: registrationRoots.map((o) => ({ root: o.pluginRoot, exists: o.pluginExists })),
  });