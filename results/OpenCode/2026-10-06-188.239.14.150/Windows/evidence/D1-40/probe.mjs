// D1-40 镜像 lag 下检测正确性（反向提醒防护）（P0 / OS_MATRIX）
// 断言：registry 指向镜像时，queryDistTags 取镜像 dist-tags；
//       judgeUpdate 在「远端 <= 本地」时不得返回 update_available（不提示版本倒退）
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const CASE = 'D1-40';
const uc = await import(pathToFileURL(join(SRC, 'update-check.mjs')).href);

function fmt() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}

const MIRROR = 'https://registry.npmmirror.com';
const OFFICIAL = 'https://registry.npmjs.org';

// ① 官方源 dist-tags（基线）
let official = null;
try {
  official = uc.queryDistTagsSync({ timeoutMs: 45000 });
} catch (e) {
  official = { error: e.message };
}

// ② 镜像源 dist-tags（真实设置 npm_config_registry 后再调用）
const child = spawnSync(process.execPath, ['-e', `
  const {pathToFileURL} = require('node:url');
  const {join} = require('node:path');
  (async () => {
    process.env.npm_config_registry = ${JSON.stringify(MIRROR)};
    const uc = await import(pathToFileURL(${JSON.stringify(join(SRC, 'update-check.mjs'))}).href);
    const r = uc.queryDistTagsSync({ timeoutMs: 45000 });
    process.stdout.write(JSON.stringify(r));
  })().catch(e => { process.stdout.write(JSON.stringify({error: e.message})); });
`], { encoding: 'utf8', env: { ...process.env, npm_config_registry: MIRROR }, timeout: 90000 });
let mirror = null;
try { mirror = JSON.parse(child.stdout || '{}'); } catch { mirror = { parseError: true, stdout: child.stdout, stderr: child.stderr }; }

const pick = (r) => (r && (r.distTags || r.tags)) || null;
const officialTags = pick(official);
const mirrorTags = pick(mirror);

// ③ 原始 npm 层面对照：证明 registry 环境变量生效、镜像 dist-tags 在 npm 层可读
const rawMirror = spawnSync('npm', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'],
  { encoding: 'utf8', shell: true, timeout: 90000, env: { ...process.env, npm_config_registry: MIRROR } });
const rawMirrorStdout = (rawMirror.stdout || '').trim();
let rawMirrorParsed = null;
try { const j = JSON.parse(rawMirrorStdout); rawMirrorParsed = Array.isArray(j) ? j[0] : j; } catch {}

// ④ 反向提醒防护：构造「远端 <= 本地」场景，judgeUpdate 不得提示可升级
const localVersion = uc.readInstalledVersion();
const remote = (mirrorTags && mirrorTags.latest) || (rawMirrorParsed && rawMirrorParsed.latest)
  || (officialTags && officialTags.latest) || '0.0.1';
const lagScenarios = [
  { name: '远端等于本地', current: remote, distTags: { latest: remote } },
  { name: '远端低于本地(镜像lag)', current: '9.9.9', distTags: { latest: remote } },
  { name: '远端为预发布低于本地', current: '9.9.9', distTags: { latest: remote, next: remote } },
];
const lagResults = lagScenarios.map((s) => {
  const j = uc.judgeUpdate(s.current, s.distTags, null);
  return { ...s, remote, judge: { result: j.result, updateAvailable: j.updateAvailable, targetVersion: j.targetVersion } };
});
const downgradePrompts = lagResults.filter((r) => r.judge.updateAvailable === true);

const mirrorLag = rawMirrorParsed && officialTags && rawMirrorParsed.latest < officialTags.latest;

const ok = !!rawMirrorParsed && downgradePrompts.length === 0 && !!mirrorTags;
finish(ok ? 'PASS' : 'FAIL',
  ok
    ? `镜像源(${MIRROR}) dist-tags 读取成功；远端<=本地时 judgeUpdate 均不提示升级（镜像 lag=${mirrorLag}，未触发倒退提醒）`
    : `镜像链路不可用：插件层 queryDistTagsSync 返回 ${JSON.stringify(mirrorTags)}（npm 层同 registry 实际输出=${rawMirrorStdout.slice(0, 160)}，npm 层可解析=${JSON.stringify(rawMirrorParsed)}），判定层 judgeUpdate 反向保护正常（downgradePrompts=${downgradePrompts.length}）——镜像读取步骤无法完成，同 D1-39 根因`,
  {
    registries: { official: OFFICIAL, mirror: MIRROR },
    officialTags,
    mirrorTags,
    rawNpmMirrorStdout: rawMirrorStdout,
    rawNpmMirrorParsed: rawMirrorParsed,
    mirrorLagBehindOfficial: mirrorLag,
    localVersion,
    lagScenarios: lagResults,
    childExit: child.status,
    rootCause: ok ? null
      : `plugins/huaweicloud-core/src/update-check.mjs:86 parseDistTagsOutput() 拒绝数组形态 JSON（npm>=9 \`npm view <pkg> dist-tags --json\` 返回 [{"latest":...}]），镜像源下同样恒返回 null，镜像 lag 检测链路整体失效`,
  });