// D1-58 通用 MCP 白名单接入 merge 语义源码级探针（Hermes Linux 每日回归）
// 直调 mcp-config-merge.mjs 导出的纯函数，核对「白名单合并幂等 / 唯一 entry / 保其它键」语义。
// 安装菜单 configureMCPAgent 层的「.bak 备份 / 坏 JSON 零写入 / skipping」由源码复核（见文末）。
import { pathToFileURL } from 'node:url';

const SRC = process.argv[2];
const M = await import(pathToFileURL(`${SRC}/mcp-config-merge.mjs`).href);

function ok(name, cond) {
  console.log(`${cond ? 'PASS' : 'FAIL'}: ${name}`);
}

// 1) mergeMcpServersFile：空配置 → 创建唯一 entry
let out = M.mergeMcpServersFile({}, { mcpPath: '/p/mcp-server.mjs' });
ok('mergeMcpServersFile 空配置创建 entry', out.config.mcpServers['huaweicloud-devkit']?.args?.[0] === '/p/mcp-server.mjs');
ok('mergeMcpServersFile 唯一 key(changed=true)', out.changed === true);

// 2) 再 merge 一次 → 幂等（changed=false，无重复 key）
const out2 = M.mergeMcpServersFile(out.config, { mcpPath: '/p/mcp-server.mjs' });
ok('重复 merge 幂等(changed=false)', out2.changed === false);
ok('重复 merge 后仍唯一 entry', Object.keys(out2.config.mcpServers).length === 1 && out2.config.mcpServers['huaweicloud-devkit'] !== undefined);

// 3) 保其它键：预置用户自定义键 + 另一个 mcp server
const pre = { mcpServers: { 'another-server': { command: 'npx', args: ['x'] } }, extraTopKey: 'keep-me' };
const out3 = M.mergeMcpServersFile(pre, { mcpPath: '/p/mcp-server.mjs' });
ok('merge 后保留其它 mcpServer 键', out3.config.mcpServers['another-server'] !== undefined);
ok('merge 后保留顶层其它键', out3.config.extraTopKey === 'keep-me');
ok('merge 后 huaweicloud-devkit 唯一(共2个server)', Object.keys(out3.config.mcpServers).length === 2);

// 4) mergeCommandStyle（command style，保 user args 2+）
let c = M.mergeCommandStyle({ type: 'local', command: ['node', '/p/mcp-server.mjs', '--extra', '--flag'], enabled: true }, { mcpPath: '/p/mcp-server.mjs' });
ok('command style 保 user extra args', Array.isArray(c.entry.command) && c.entry.command.slice(2).join(',') === '--extra,--flag');
ok('command style 重复 merge 幂等', M.mergeCommandStyle(c.entry, { mcpPath: '/p/mcp-server.mjs' }).changed === false);

// 5) mergeArgsStyle（args style，保 user args + 用户自定义 env）
let a = M.mergeArgsStyle({ command: 'node', args: ['/old/mcp.mjs', '--user'], env: { MY_KEY: 'val' } }, { mcpPath: '/p/mcp-server.mjs', env: { HCLOUD_BIN: 'hcloud' } });
ok('args style 保 user extra args', Array.isArray(a.entry.args) && a.entry.args.slice(1).join(',') === '--user');
ok('args style 保用户自定义 env(MY_KEY)', a.entry.env?.MY_KEY === 'val');
ok('args style 补 required env(HCLOUD_BIN)', a.entry.env?.HCLOUD_BIN === 'hcloud');

console.log('=== 源码复核（configureMCPAgent，setup-cli.mjs:3257-3280）===');
console.log('- 已在配置时：读取→JSON.parse 失败则打 is not valid JSON; leaving it untouched 并 return false（零写入）');
console.log('- 已配置时：mcpServers.huaweicloud-devkit already configured; skipping（不重复 .bak，幂等）');
console.log('- 未配置且目标文件存在时：先 copyFileSync 到 .bak 再写（保留原文件备份）');
console.log('- 写入仅新增 mcpServers[\'huaweicloud-devkit\'] = {...MCP_ENTRY}，不覆盖其它键');
console.log('=== DONE ===');