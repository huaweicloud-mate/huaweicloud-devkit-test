// D2-10 KooCLI 多 profile 夹具：current=deploy 切换
// R7 current 档跟随 —— readKooCliProfiles/resolveManagedProfile/runHcloudConfigure
// 用法: node d2-10-koocli-profile.mjs <hdk src> [--evid <dir>]
// 输出: 控制台断言汇总 + <evid>/D2-10/stdout.txt（若 --evid 给定）
import { writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const hdkSrc = process.argv[2];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;
if (!hdkSrc) {
  console.error('用法: node d2-10-koocli-profile.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

// SUT imports
const base = new URL(`file://${hdkSrc}/auth/reconcile.mjs`);
const { readKooCliProfiles, resolveManagedProfile, runHcloudConfigure, kooCliConfigPath } = await import(base);

const tmp = join(tmpdir(), `d2-10-koocli-${Date.now()}`);
mkdirSync(tmp, { recursive: true });
const configPath = join(tmp, 'config.json');
process.env.HCLOUD_CONFIG_PATH = configPath;

const writeProfile = (current, profiles) => {
  writeFileSync(configPath, JSON.stringify({ current, profiles }, null, 2), 'utf8');
};

try {
  // ① 构造 current=deploy，双 profile
  writeProfile('deploy', [
    { name: 'deploy', accessKeyId: 'AKDEPLOY', secretAccessKey: 'SKDEPLOY' },
    { name: 'daily', accessKeyId: 'AKDAILY', secretAccessKey: 'SKDAILY' },
  ]);
  let res = readKooCliProfiles();
  rec('D2-10-profile-parse', 'readKooCliProfiles 解析 current=deploy', res.current === 'deploy' && res.profiles.length === 2,
      { current: res.current, n: res.profiles?.length }, { current: 'deploy', n: 2 });
  rec('D2-10-resolve-deploy', 'resolveManagedProfile 返回 current 档', resolveManagedProfile() === 'deploy', resolveManagedProfile(), 'deploy');

  // ② 切换 current 再解析
  writeProfile('daily', [
    { name: 'deploy', accessKeyId: 'AKDEPLOY', secretAccessKey: 'SKDEPLOY' },
    { name: 'daily', accessKeyId: 'AKDAILY', secretAccessKey: 'SKDAILY' },
  ]);
  res = readKooCliProfiles();
  rec('D2-10-switch-current', '切换 current=daily 后解析跟随', res.current === 'daily' && resolveManagedProfile() === 'daily',
      { current: res.current, profile: resolveManagedProfile() }, { current: 'daily', profile: 'daily' });

  // ③ runHcloudConfigure 构造 --cli-profile= 参数：用假 hcloud 记录 spawn 实参
  //    跨平台：使用 Node.js ESM 脚本 + HCLOUD_BIN_ARGS_JSON（SUT 原生支持）
  //    Windows 下 spawnSync(shell:false) 无法执行 .sh 文件，改用 node 二进制 + .mjs 脚本
  const argsLog = join(tmp, 'args.log');
  const fake = join(tmp, 'fake-hcloud.mjs');
  writeFileSync(
    fake,
    `import { writeFileSync } from 'node:fs';\n` +
      `writeFileSync(${JSON.stringify(argsLog)}, process.argv.slice(2).join('\\n') + '\\n');\n`,
  );
  const hcloudBinBackup = process.env.HCLOUD_BIN;
  const hcloudArgsBackup = process.env.HCLOUD_BIN_ARGS_JSON;
  process.env.HCLOUD_BIN = process.execPath;
  process.env.HCLOUD_BIN_ARGS_JSON = JSON.stringify([fake]);
  const r = runHcloudConfigure('deploy', 'AKDEPLOY', 'SKDEPLOY', 'cn-north-4');
  const captured = readFileSync(argsLog, 'utf8');
  rec('D2-10-cli-profile-arg', 'runHcloudConfigure 携带 --cli-profile=deploy', captured.includes('--cli-profile=deploy'), captured.trim(), ['--cli-profile=deploy', '...'], `spawn 成功=${r.ok}`);
  rec('D2-10-cli-ak-region', 'runHcloudConfigure 携带 --cli-access-key/--cli-region', captured.includes('--cli-access-key=AKDEPLOY') && captured.includes('--cli-region=cn-north-4'), captured.trim(), ['--cli-access-key', '--cli-region']);
  if (hcloudBinBackup === undefined) delete process.env.HCLOUD_BIN; else process.env.HCLOUD_BIN = hcloudBinBackup;
  if (hcloudArgsBackup === undefined) delete process.env.HCLOUD_BIN_ARGS_JSON; else process.env.HCLOUD_BIN_ARGS_JSON = hcloudArgsBackup;

  // ④ 非法/缺失 config → error 语义
  rmSync(configPath, { force: true });
  const missing = readKooCliProfiles();
  rec('D2-10-missing-config', '缺失 config 返回 error', missing?.error === 'KooCLI config not found', missing?.error, 'KooCLI config not found');
} finally {
  delete process.env.HCLOUD_CONFIG_PATH;
  rmSync(tmp, { recursive: true, force: true });
}

const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== D2-10 KooCLI 多 profile 夹具 ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);

if (EVID) {
  const outDir = join(EVID, 'D2-10');
  mkdirSync(outDir, { recursive: true });
  const lines = results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
  lines.push(`\n=== D2-10 KooCLI 多 profile 夹具 ===  pass=${pass} fail=${fail}`);
  lines.push(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
  writeFileSync(join(outDir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

process.exit(fail > 0 ? 1 : 0);