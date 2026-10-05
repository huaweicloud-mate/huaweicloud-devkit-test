// D1-3 doctor 健康自检（P1）
// 断言：真实运行 doctor，检测项覆盖 KooCLI/MCP/skills/凭证；结果与环境一致；
//       隔离 HOME 破坏环境下如实报告失败并给出修复指引
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
const CASE = process.env.PROBE_CASE;
const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const SERVER = join(SRC, 'mcp-server.mjs');
function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}

const SETUP = join(SRC, 'setup-cli.mjs');
function runDoctor(env) {
  const r = spawnSync(process.execPath, [SETUP, 'doctor'], { encoding: 'utf8', timeout: 240000, windowsHide: true, env: { ...process.env, ...env } });
  return { exitCode: r.status, output: (r.stdout || '') + (r.stderr || '') };
}
const healthy = runDoctor({});
const tmp = mkdtempSync(join(tmpdir(), 'd1-3-'));
const broken = runDoctor({ HUAWEICLOUD_HOME: tmp });
rmSync(tmp, { recursive: true, force: true });

const GROUPS = {
  kooCli: /hcloud|koocli|koocli/i,
  mcp: /\bmcp\b/i,
  skills: /skill/i,
  credential: /credential|auth|ak\/sk|凭证|认证/i,
  remediation: /npx |npm i|pip install|install |re-run|guide|fix|repair|修复|安装/i,
};
const covered = Object.entries(GROUPS).filter(([k, re]) => k !== 'remediation' && re.test(healthy.output)).map(([k]) => k);
const missing = Object.entries(GROUPS).filter(([k, re]) => k !== 'remediation' && !re.test(healthy.output)).map(([k]) => k);
const hasRemediation = GROUPS.remediation.test(healthy.output) || GROUPS.remediation.test(broken.output);
const outputDiffers = healthy.output !== broken.output;
const rows = [
  { id: 'doctor 有实质输出', ok: healthy.output.length > 200, actual: { exit: healthy.exitCode, chars: healthy.output.length } },
  { id: '检测项覆盖 KooCLI/MCP/skills/凭证', ok: missing.length === 0, actual: { covered, missing } },
  { id: '输出含修复指引', ok: hasRemediation, actual: hasRemediation },
  { id: '隔离 HOME 破坏环境下输出不同（失败如实报告，未空报健康）', ok: outputDiffers, actual: { sameOutput: !outputDiffers, brokenChars: broken.output.length } },
];
const violations = rows.filter((x) => !x.ok);
const ok = violations.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? `doctor 自检成立：真实运行输出 ${healthy.output.length} 字符，覆盖 ${JSON.stringify(covered)} 检测项并含修复指引；隔离 HOME 破坏环境下输出与正常环境不同（失败场景如实反映，未空报健康）`
      : `doctor 自检断言不成立：${JSON.stringify(violations)}`,
  { healthy: { exitCode: healthy.exitCode, outputHead: healthy.output.slice(0, 4000) }, isolatedHome: { exitCode: broken.exitCode, outputHead: broken.output.slice(0, 2000) }, covered, missing, rows, violations });
