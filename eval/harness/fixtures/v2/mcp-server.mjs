/**
 * v2 shim：mcp-server.mjs → 可 spawn 入口桥接
 *
 * v1 探针（d9-6 / d9-10 / protocol-probe）通过 `spawn(process.execPath, [<hdkSrc>/mcp-server.mjs])`
 * 启动 MCP server 走 stdio。v2 的入口是 `dist/mcp-server.js`（package.json bin 的
 * `huaweicloud-devkit-mcp`），且它是独立可执行体（import 会进入 MCP 主循环挂起），
 * 故本 shim 用 spawnSync 把它当子进程起、透传 argv 与 stdio。
 *
 * 用法（跑 v2 时把 hdkSrc 指向本 shim 目录，探针的 join(hdkSrc,'mcp-server.mjs') 命中原文件，
 * 实际 spawn 的是子进程透传到 dist/mcp-server.js）：
 *   V2_DIST=<v2>/plugins/huaweicloud-core/dist node <探针> eval/harness/fixtures/v2 --evid <dir>
 */
import { v2dist } from './_loader.mjs';
import { spawnSync } from 'node:child_process';

const entry = `${v2dist()}/mcp-server.js`;
const argv = process.argv.slice(2);
// spawnSync 同步透传：inherit 让子进程直接接管父进程的 stdin/stdout/stderr，
// 使 JSON-RPC 帧原样流经 MCP 客户端（探针）<-> dist/mcp-server.js。
const r = spawnSync(process.execPath, [entry, ...argv], {
  stdio: 'inherit',
  env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: process.env.HUAWEICLOUD_AGENT_TOOLKIT_MODE || 'local' },
});

if (r.error) {
  process.stderr.write(`[v2shim:mcp-server] spawn 失败: ${r.error.message}\n`);
  process.exit(1);
}
process.exit(r.status ?? 0);