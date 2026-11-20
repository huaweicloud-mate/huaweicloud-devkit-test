// EXP-D5-5-1 / EXP-D5-5-3 : WorkBuddy client matrix.
// Real execution: read the installed WorkBuddy plugin payload on disk AND perform a live
// MCP initialize + tools/list handshake against that same installed server.
import { spawn } from 'node:child_process';
import { writeFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const MCP_PATH = 'C:/Users/Administrator/.workbuddy/huaweicloud-plugins/src/mcp-server.mjs';
const PLUGIN_ROOT = 'C:/Users/Administrator/.workbuddy/huaweicloud-plugins';
const CASE_ID = process.env.HDK_CASE_ID || 'EXP-D5-5-1';
const MANIFEST_CANDIDATES = [
  join(PLUGIN_ROOT, 'package.json'),
  join(PLUGIN_ROOT, '.workbuddy-plugin', 'plugin.json'),
  join(PLUGIN_ROOT, 'plugin.json'),
];

function readJson(p) {
  try { return JSON.parse(readFileSync(p, 'utf8').replace(/^\uFEFF/, '')); } catch { return null; }
}

function mcpSession() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [MCP_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
    });
    let buf = Buffer.alloc(0);
    const out = [];
    let sent = 0;
    let done = false;
    const finish = () => { if (done) return; done = true; try { child.stdin.end(); } catch {} try { child.kill(); } catch {} resolve(out); };
    child.stdout.on('data', (d) => {
      buf = Buffer.concat([buf, d]);
      for (;;) {
        const h = buf.indexOf('\r\n\r\n');
        if (h < 0) break;
        const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
        if (!m) { buf = buf.slice(h + 4); continue; }
        const n = +m[1];
        if (buf.length < h + 4 + n) break;
        const body = buf.slice(h + 4, h + 4 + n).toString();
        buf = buf.slice(h + 4 + n);
        try { out.push(JSON.parse(body)); } catch {}
        if (sent >= 2 && out.some((o) => o.id === 2)) setTimeout(finish, 300);
      }
    });
    child.stderr.on('data', () => {});
    const wr = (o) => { const b = JSON.stringify(o); child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`)); };
    setTimeout(() => { wr({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'workbuddy-d5', version: '1.0' } } }); sent = 1; }, 400);
    setTimeout(() => { wr({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }); sent = 2; }, 1800);
    setTimeout(finish, 15000);
  });
}

const out = {
  caseId: CASE_ID, status: 'FAIL', executedAt: '', sut: '', os: 'win32', agent: 'WorkBuddy',
  assertions: [], failures: [],
};
const now = new Date();
const p2 = (n) => String(n).padStart(2, '0');
out.executedAt = `${now.getFullYear()}${p2(now.getMonth() + 1)}${p2(now.getDate())}${p2(now.getHours())}${p2(now.getMinutes())}${p2(now.getSeconds())}`;

try {
  const manifestPath = MANIFEST_CANDIDATES.find((p) => existsSync(p)) || null;
  const manifest = manifestPath ? readJson(manifestPath) : null;
  const srcFiles = existsSync(join(PLUGIN_ROOT, 'src')) ? readdirSync(join(PLUGIN_ROOT, 'src')) : [];
  out.manifestPath = manifestPath;
  out.manifestName = manifest?.name || null;
  out.manifestVersion = manifest?.version || null;
  out.mcpServerPresent = existsSync(MCP_PATH);
  out.srcFileCount = srcFiles.length;

  const msgs = await mcpSession();
  const initMsg = msgs.find((m) => m.id === 1);
  const listMsg = msgs.find((m) => m.id === 2);
  const tools = listMsg?.result?.tools || [];
  out.serverInfo = initMsg?.result?.serverInfo || null;
  out.protocolVersion = initMsg?.result?.protocolVersion || null;
  out.toolCount = tools.length;

  const badSchema = tools.filter((t) => !t.inputSchema || t.inputSchema.type !== 'object');
  const noDesc = tools.filter((t) => !t.description || !String(t.description).trim());
  const huaweicloudTools = tools.filter((t) => /^huaweicloud_/.test(t.name));
  out.huaweicloudToolCount = huaweicloudTools.length;
  out.badSchemaTools = badSchema.map((t) => t.name);
  out.toolsWithoutDescription = noDesc.map((t) => t.name);
  out.sampleTools = tools.slice(0, 5).map((t) => t.name);

  const assertManifest = !!manifestPath && out.mcpServerPresent && out.srcFileCount > 0;
  const assertInit = !!initMsg?.result?.serverInfo && !!out.protocolVersion;

  if (CASE_ID === 'EXP-D5-5-1') {
    out.assertions = [
      { name: 'plugin manifest discoverable on disk', ok: assertManifest, actual: `manifestPath=${manifestPath} name=${out.manifestName} version=${out.manifestVersion} mcpServerPresent=${out.mcpServerPresent} srcFiles=${out.srcFileCount}` },
      { name: 'MCP initialize returns serverInfo + protocolVersion', ok: assertInit, actual: `server=${JSON.stringify(out.serverInfo)} protocol=${out.protocolVersion}` },
    ];
  } else {
    out.assertions = [
      { name: 'tools/list enumerates >=40 tools', ok: out.toolCount >= 40, actual: `toolCount=${out.toolCount}` },
      { name: 'every tool exposes inputSchema.type=object', ok: badSchema.length === 0, actual: `badSchema=${badSchema.length} ${JSON.stringify(badSchema.slice(0, 8))}` },
      { name: 'every tool has non-empty description', ok: noDesc.length === 0, actual: `missingDescription=${noDesc.length}` },
      { name: 'huaweicloud_* tools fully reachable (>=40 baseline)', ok: out.huaweicloudToolCount >= 40, actual: `huaweicloudToolCount=${out.huaweicloudToolCount}` },
    ];
  }
  out.failures = out.assertions.filter((a) => !a.ok).map((a) => a.name);
  out.status = out.failures.length === 0 ? 'PASS' : 'FAIL';
  out.why = out.status === 'PASS'
    ? (CASE_ID === 'EXP-D5-5-1'
      ? `installed WorkBuddy plugin manifest readable at ${manifestPath} (${out.manifestName} v${out.manifestVersion}); live MCP initialize returned ${out.serverInfo?.name}@${out.serverInfo?.version} protocol=${out.protocolVersion}`
      : `live tools/list returned ${out.toolCount} tools (${out.huaweicloudToolCount} huaweicloud_*), all with object inputSchema and description`)
    : 'failed: ' + out.failures.join('; ');
} catch (e) {
  out.status = 'FAIL';
  out.why = 'Probe error: ' + e.message;
  out.error = e.stack;
}
writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify({ caseId: out.caseId, status: out.status, toolCount: out.toolCount, why: out.why }, null, 2));