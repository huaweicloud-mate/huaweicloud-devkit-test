// D8-10 MCP 配置备份与合并夹具
// mcp-config-backup: mcpBackupFilePath / readAgentDelta / saveAgentDelta / takeAgentDelta / purgeBackup
// mcp-config-merge: mergeCommandStyle / mergeArgsStyle / mergeMcpServersFile / extractUserDelta / applyUserDelta
// 三风格（command / args / file）合并 + purgeBackup 逻辑
// 用法: node d8-10-mcp-config-backup-merge.mjs <hdk src> [--evid <dir>]
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';

const hdkSrc = process.argv[2];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;
if (!hdkSrc) {
  console.error('用法: node d8-10-mcp-config-backup-merge.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

const backup = await import(new URL(`file://${hdkSrc}/mcp-config-backup.mjs`));
const merge = await import(new URL(`file://${hdkSrc}/mcp-config-merge.mjs`));

const tmp = join(tmpdir(), `d8-10-mcp-${Date.now()}`);
mkdirSync(tmp, { recursive: true });
const backupFile = join(tmp, 'devkit-mcp-backup.json');
const mcpPath = '/opt/huaweicloud-devkit/plugins/huaweicloud-core/src/mcp-server.mjs';

try {
  // === 备份模块 ===

  // ① mcpBackupFilePath 路径正确
  {
    const path = backup.mcpBackupFilePath(tmp);
    rec('D8-10-backup-path', 'mcpBackupFilePath 路径',
        path === join(tmp, '.config', 'huaweicloud', 'devkit-mcp-backup.json'),
        path, join(tmp, '.config', 'huaweicloud', 'devkit-mcp-backup.json'));
  }

  // ② saveAgentDelta → readAgentDelta 往返
  {
    const delta = { commandExtra: ['--debug'], env: { MY_VAR: 'val' }, timeout: 600000 };
    backup.saveAgentDelta('codex', delta, backupFile);
    const read = backup.readAgentDelta('codex', backupFile);
    rec('D8-10-save-read-delta', 'saveAgentDelta → readAgentDelta 往返',
        read.commandExtra?.[0] === '--debug' && read.env?.MY_VAR === 'val' && read.timeout === 600000,
        { cmd: read.commandExtra, env: read.env, timeout: read.timeout },
        { cmd: ['--debug'], env: { MY_VAR: 'val' }, timeout: 600000 });
  }

  // ③ takeAgentDelta 取走后删除（take-once 语义）
  {
    const taken = backup.takeAgentDelta('codex', backupFile);
    const after = backup.readAgentDelta('codex', backupFile);
    rec('D8-10-take-once', 'takeAgentDelta 取走后 readAgentDelta 返回 null',
        taken !== null && after === null,
        { taken: !!taken, after }, { taken: true, after: null });
  }

  // ④ purgeBackup 删除整个文件
  {
    backup.saveAgentDelta('hermes', { env: { X: '1' } }, backupFile);
    const purged = backup.purgeBackup(backupFile);
    rec('D8-10-purge-deletes', 'purgeBackup 删除文件',
        purged && !existsSync(backupFile), { purged, exists: existsSync(backupFile) },
        { purged: true, exists: false });
  }

  // ⑤ purgeBackup 文件不存在时返回 false（不崩溃）
  {
    const purged = backup.purgeBackup(backupFile);
    rec('D8-10-purge-no-file', 'purgeBackup 文件不存在不崩溃',
        purged === false, purged, false);
  }

  // === 合并模块 — 三风格 ===

  // ⑥ mergeCommandStyle（OpenCode 风格：command 数组）
  {
    const existing = { type: 'local', command: ['node', '/old/path.mjs', '--user-arg'], enabled: true, timeout: 100000 };
    const { entry, changed } = merge.mergeCommandStyle(existing, { mcpPath, defaultTimeout: 300000 });
    rec('D8-10-merge-command-style', 'mergeCommandStyle 保留用户参数 + 更新路径',
        entry.command[0] === 'node' && entry.command[1] === mcpPath && entry.command[2] === '--user-arg' &&
        entry.timeout === 100000, // 用户 timeout 保留
        { cmd: entry.command, timeout: entry.timeout, changed },
        { cmd: ['node', mcpPath, '--user-arg'], timeout: 100000, changed: true });
  }

  // ⑦ mergeArgsStyle（VS Code 风格：args 数组 + env）
  {
    const existing = { type: 'stdio', command: 'node', args: ['/old/path.mjs'], env: { MY_VAR: 'val' } };
    const { entry, changed } = merge.mergeArgsStyle(existing, { mcpPath, env: { REQUIRED_ENV: '1' }, defaultTimeout: 300000 });
    rec('D8-10-merge-args-style', 'mergeArgsStyle 保留 env + 注入 required',
        entry.args[0] === mcpPath && entry.env.MY_VAR === 'val' && entry.env.REQUIRED_ENV === '1',
        { args: entry.args, env: entry.env, changed },
        { args: [mcpPath], env: { MY_VAR: 'val', REQUIRED_ENV: '1' }, changed: true });
  }

  // ⑧ mergeMcpServersFile（mcpServers 文件风格）
  {
    const config = { mcpServers: { 'huaweicloud-devkit': { command: 'node', args: ['/old.mjs'] } } };
    const { entry, config: next, changed } = merge.mergeMcpServersFile(config, { mcpPath, env: {} });
    rec('D8-10-merge-file-style', 'mergeMcpServersFile 合并 mcpServers',
        entry.args[0] === mcpPath && next.mcpServers['huaweicloud-devkit'].args[0] === mcpPath,
        { entryArgs: entry.args, configHas: !!next.mcpServers['huaweicloud-devkit'], changed },
        { entryArgs: [mcpPath], configHas: true, changed: true });
  }

  // ⑨ extractUserDelta → applyUserDelta 往返（command 风格）
  {
    const entry = { type: 'local', command: ['node', mcpPath, '--user-flag'], env: { MY_VAR: 'x' }, timeout: 500000 };
    const delta = merge.extractUserDelta(entry, 'command');
    const fresh = { type: 'local', command: ['node', mcpPath], enabled: true, timeout: 300000 };
    const restored = merge.applyUserDelta(fresh, delta, 'command');
    rec('D8-10-extract-apply-command', 'extractUserDelta→applyUserDelta 往返（command）',
        restored.command.includes('--user-flag') && restored.env?.MY_VAR === 'x' && restored.timeout === 500000,
        { cmd: restored.command, env: restored.env, timeout: restored.timeout },
        { cmd: ['node', mcpPath, '--user-flag'], env: { MY_VAR: 'x' }, timeout: 500000 });
  }

  // ⑩ extractUserDelta → applyUserDelta 往返（args 风格）
  {
    const entry = { command: 'node', args: [mcpPath, '--arg1'], env: { K: 'v' }, enabled: false };
    const delta = merge.extractUserDelta(entry, 'args');
    const fresh = { command: 'node', args: [mcpPath], enabled: true, timeout: 300000 };
    const restored = merge.applyUserDelta(fresh, delta, 'args');
    rec('D8-10-extract-apply-args', 'extractUserDelta→applyUserDelta 往返（args）',
        restored.args.includes('--arg1') && restored.env?.K === 'v' && restored.enabled === false,
        { args: restored.args, env: restored.env, enabled: restored.enabled },
        { args: [mcpPath, '--arg1'], env: { K: 'v' }, enabled: false });
  }

  // ⑪ mergeEnv 不覆盖用户已设值
  {
    const existing = { type: 'stdio', command: 'node', args: ['/old.mjs'], env: { REQUIRED_ENV: 'user-override' } };
    const { entry } = merge.mergeArgsStyle(existing, { mcpPath, env: { REQUIRED_ENV: 'installer-default' } });
    rec('D8-10-merge-env-no-overwrite', 'mergeEnv 不覆盖用户已设值',
        entry.env.REQUIRED_ENV === 'user-override',
        entry.env.REQUIRED_ENV, 'user-override');
  }

  // ⑫ REQUIRED_ENV_KEYS 不被备份（HUAWEICLOUD_AGENT_TOOLKIT_MODE / HCLOUD_BIN）
  {
    const entry = { type: 'local', command: ['node', mcpPath], env: { HUAWEICLOUD_AGENT_TOOLKIT_MODE: '1', HCLOUD_BIN: '/bin/hcloud', MY_VAR: 'keep' } };
    const delta = merge.extractUserDelta(entry, 'command');
    const envKeys = delta.env ? Object.keys(delta.env) : [];
    rec('D8-10-required-env-excluded', 'REQUIRED_ENV_KEYS 不被备份',
        !envKeys.includes('HUAWEICLOUD_AGENT_TOOLKIT_MODE') && !envKeys.includes('HCLOUD_BIN') && envKeys.includes('MY_VAR'),
        envKeys, ['MY_VAR']);
  }

} finally {
  rmSync(tmp, { recursive: true, force: true });
}

const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== D8-10 MCP 配置备份与合并夹具 ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);

if (EVID) {
  const outDir = join(EVID, 'D8-10');
  mkdirSync(outDir, { recursive: true });
  const lines = results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
  lines.push(`\n=== D8-10 MCP 配置备份与合并夹具 ===  pass=${pass} fail=${fail}`);
  lines.push(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
  writeFileSync(join(outDir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

process.exit(fail > 0 ? 1 : 0);
