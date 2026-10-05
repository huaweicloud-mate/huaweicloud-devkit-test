// D1-39 Windows 升级检测链可用性（P0 / OS_MATRIX / Windows 专属）
// 断言：Windows 下 queryDistTagsSync / queryDistTags 真实可用（返回可解析 dist-tags），
//       不得 EINVAL 静默失败、不得「返回 null 但无任何显式失败信号」
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const CASE = 'D1-39';
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

const npmVersion = spawnSync('npm', ['--version'], { encoding: 'utf8', shell: true }).stdout.trim();
const npmView = spawnSync('npm', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'],
  { encoding: 'utf8', shell: true, timeout: 90000 });

const runs = {};
let anyEINVAL = false;

try {
  const t0 = Date.now();
  const sync = uc.queryDistTagsSync({ timeoutMs: 45000 });
  runs.queryDistTagsSync = { ms: Date.now() - t0, result: sync };
  if (/EINVAL/i.test(JSON.stringify(sync))) anyEINVAL = true;
} catch (e) {
  runs.queryDistTagsSync = { error: e.message };
  if (/EINVAL/i.test(e.message)) anyEINVAL = true;
}

try {
  const t0 = Date.now();
  const a = await uc.queryDistTags({ timeoutMs: 45000 });
  runs.queryDistTags = { ms: Date.now() - t0, result: a };
  if (/EINVAL/i.test(JSON.stringify(a))) anyEINVAL = true;
} catch (e) {
  runs.queryDistTags = { error: e.message };
  if (/EINVAL/i.test(e.message)) anyEINVAL = true;
}

const usable = (r) => !!(r && typeof r === 'object' && (r.latest || r.next));
const chainUsable = usable(runs.queryDistTagsSync && runs.queryDistTagsSync.result)
  && usable(runs.queryDistTags && runs.queryDistTags.result);

// 直接验证解析函数：真实 npm 输出是否可被 parseDistTagsOutput 消费
let parsed = null;
let parseErr = null;
try {
  parsed = uc.parseDistTagsOutput(npmView.stdout);
} catch (e) {
  parseErr = e.message;
}

const ok = process.platform === 'win32' && chainUsable && !anyEINVAL;
finish(ok ? 'PASS' : 'FAIL',
  ok
    ? 'Windows 下 queryDistTagsSync/queryDistTags 均返回可解析 dist-tags，检测链真实可用'
    : `检测链在 Windows 上不可用：platform=${process.platform} sync=${JSON.stringify(runs.queryDistTagsSync && runs.queryDistTagsSync.result)} async=${JSON.stringify(runs.queryDistTags && runs.queryDistTags.result)} EINVAL=${anyEINVAL}；npm ${npmVersion} 实际输出=${(npmView.stdout || '').trim().slice(0, 200)} 解析结果=${JSON.stringify(parsed)}${parseErr ? ' err=' + parseErr : ''}`,
  {
    npmVersion,
    rawNpmViewStdout: (npmView.stdout || '').trim(),
    rawNpmViewExit: npmView.status,
    parseDistTagsOutputResult: parsed,
    runs,
    judgeUpdateRoundTrip: (() => {
      try {
        const cur = uc.readInstalledVersion();
        return { current: cur, judge: uc.judgeUpdate(cur, { latest: '1.1.7', next: '1.1.8-next.1' }, null) };
      } catch (e) { return { error: e.message }; }
    })(),
    rootCause: ok ? null
      : `plugins/huaweicloud-core/src/update-check.mjs:86 parseDistTagsOutput() 对 JSON.parse 结果做 Array.isArray(parsed) 早退返回 null；npm>=9 的 \`npm view <pkg> dist-tags --json\` 输出为数组形态 [{"latest":...}]，导致整条检测链恒返回 null、check_update 恒为 result=check_failed（静默失败）`,
  });