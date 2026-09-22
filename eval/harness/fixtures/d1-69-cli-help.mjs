// D1-69 CLI help 子命令夹具
// 独立子进程执行 huaweicloud-devkit help / --help / -h / 未知子命令
// 采集退出码 + 输出格式（BANNER / Commands / Usage / Options）
// 用法: node d1-69-cli-help.mjs <hdk src> [--evid <dir>]
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const hdkSrc = process.argv[2];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;
if (!hdkSrc) {
  console.error('用法: node d1-69-cli-help.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

// Use npx huaweicloud-devkit for help subcommand (independent process)
// Fallback: node setup-cli.mjs directly (same main() entry)
function runCli(args, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const child = spawn('npx', ['huaweicloud-devkit', ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: timeoutMs,
      env: { ...process.env, CI: 'true' },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('close', (code) => resolve({ code, stdout, stderr }));
    child.on('error', (err) => resolve({ code: -1, stdout, stderr: err.message }));
  });
}

// ① help → exit 0 + BANNER + Commands
{
  const r = await runCli(['help']);
  const hasBanner = r.stdout.includes('HuaweiCloud') || r.stdout.includes('DevKit');
  const hasCommands = r.stdout.includes('Commands:') || r.stdout.includes('install');
  rec('D1-69-help-exit0', 'help 子命令退出码 0', r.code === 0, r.code, 0,
      `stderr=${r.stderr.slice(0, 100)}`);
  rec('D1-69-help-banner', 'help 输出含 BANNER', hasBanner, hasBanner, true,
      `stdout len=${r.stdout.length}`);
  rec('D1-69-help-commands', 'help 输出含 Commands 列表', hasCommands, hasCommands, true);
}

// ② --help → exit 0
{
  const r = await runCli(['--help']);
  rec('D1-69-dash-help-exit0', '--help 退出码 0', r.code === 0, r.code, 0);
  const hasUsage = r.stdout.includes('Usage:') || r.stdout.includes('Commands:');
  rec('D1-69-dash-help-content', '--help 输出含 Usage',
      hasUsage, hasUsage, true, `len=${r.stdout.length}`);
}

// ③ -h → exit 0
{
  const r = await runCli(['-h']);
  rec('D1-69-short-h-exit0', '-h 退出码 0', r.code === 0, r.code, 0);
}

// ④ 无参数（默认 → help）→ exit 0
{
  const r = await runCli([]);
  rec('D1-69-no-arg-default-help', '无参数默认 help 退出码 0', r.code === 0, r.code, 0,
      `stdout len=${r.stdout.length}`);
}

// ⑤ --version → exit 0 + 版本输出
{
  const r = await runCli(['--version']);
  const hasVersion = /\d+\.\d+\.\d+/.test(r.stdout);
  rec('D1-69-version-exit0', '--version 退出码 0', r.code === 0, r.code, 0);
  rec('D1-69-version-output', '--version 输出含版本号', hasVersion, hasVersion, true,
      `stdout=${r.stdout.slice(0, 200)}`);
}

// ⑥ 未知子命令 → 落入 default → help（exit 0，不 crash）
{
  const r = await runCli(['nonexistent-cmd-xyz']);
  rec('D1-69-unknown-cmd-no-crash', '未知子命令不 crash（落入 help）', r.code === 0, r.code, 0,
      `stdout len=${r.stdout.length}`);
  const hasHelp = r.stdout.includes('Commands:') || r.stdout.includes('Usage');
  rec('D1-69-unknown-cmd-help', '未知子命令输出 help 内容',
      hasHelp, hasHelp, true);
}

const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== D1-69 CLI help 子命令夹具 ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);

if (EVID) {
  const outDir = join(EVID, 'D1-69');
  mkdirSync(outDir, { recursive: true });
  const lines = results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
  lines.push(`\n=== D1-69 CLI help 子命令夹具 ===  pass=${pass} fail=${fail}`);
  lines.push(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
  writeFileSync(join(outDir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

process.exit(fail > 0 ? 1 : 0);
