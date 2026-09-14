// Supplementary: D1-39/D1-40 real dist-tags + D4-23 rules injection
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const SRC = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const HDR = '/home/testbot1/devkit-test/Hermes/hdk';
const update = await import(pathToFileURL(join(SRC, 'update-check.mjs')).href);

function emit(id, cond, detail) {
  console.log(`RESULT ${id} ${cond ? 'PASS' : 'FAIL'} ${detail}`);
}

// D1-39 Linux 升级检测链可用 (queryDistTagsSync 真实可用, 无 EINVAL)
try {
  const tags = update.queryDistTagsSync({ timeoutMs: 20000 });
  const ok = tags && typeof tags.latest === 'string' && typeof tags.next === 'string';
  const j = ok ? update.judgeUpdate('1.1.2', tags, null) : null;
  emit('D1-39', ok && j && j.result === 'update_available',
    `queryDistTagsSync=>${JSON.stringify(tags)} judgeUpdate('1.1.2')=>${j?.result}/${j?.targetVersion} (Linux 无 .cmd/EINVAL)`);
} catch (e) {
  emit('D1-39', false, `异常: ${e.message}`);
}

// D1-40 真实镜像 lag (官方 dist-tags 下本地 1.1.3 不提示倒退)
try {
  const tags = update.queryDistTagsSync({ timeoutMs: 20000 });
  const j = update.judgeUpdate('1.1.3', tags, null);
  const ok = j.result !== 'update_available' || update.semverCompare(j.targetVersion, '1.1.3') > 0;
  emit('D1-40', ok, `真实镜像 dist-tags=${JSON.stringify(tags)} judgeUpdate('1.1.3')=>${j.result}/${j.targetVersion}`);
} catch (e) {
  emit('D1-40', false, `异常: ${e.message}`);
}

// D4-23 全局规则 huawei-agent-rules.mdc 注入生效性
{
  const ruleExists = existsSync(join(HDR, 'rules', 'huawei-agent-rules.mdc'));
  // 全仓 grep (排除 .git / node_modules) 查找注入引用
  const r = spawnSync('grep', ['-rniE', 'huawei-agent-rules|\\.mdc', HDR,
    '--include=*.mjs', '--include=*.cjs', '--include=*.js', '--include=*.json', '--include=*.md',
    '--exclude-dir=.git', '--exclude-dir=node_modules'], { encoding: 'utf8' });
  const matches = (r.stdout || '').split('\n').filter((l) => l.trim() && !l.includes('rules/huawei-agent-rules.mdc:'));
  const hasInjection = matches.length > 0 && matches.some((l) => /setup-cli|install|copyFile|inject|rules/.test(l) && !/huawei-agent-rules\.mdc/.test(l.split(':')[0]));
  // 更精确: setup-cli.mjs 是否复制 agent-rules
  const setup = readFileSync(join(HDR, 'plugins/huaweicloud-core/src/setup-cli.mjs'), 'utf8');
  const setupHasRules = /huawei-agent-rules|\.mdc/.test(setup);
  emit('D4-23', ruleExists && !setupHasRules && !hasInjection,
    `rules文件存在=${ruleExists}; setup-cli 注入引用=${setupHasRules}; 全仓注入引用=${hasInjection} (预期: 文件存在但无注入→FAIL 缺陷)`);
}

console.log('\n=== probe-supp done ===');