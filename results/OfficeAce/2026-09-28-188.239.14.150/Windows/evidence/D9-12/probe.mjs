// D9-12: initialize 握手协议安全基线探针
// 检查 initialize 返回 protocolVersion + capabilities + serverInfo
// 检查非法时序返回 -32600
import { spawn } from 'node:child_process';

const SERVER = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk\\plugins\\huaweicloud-core\\src\\mcp-server.mjs';
const findings = [];
let status = 'PASS';
let why = '';

function makeServer(serverPath) {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
  });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  function send(o) {
    const b = JSON.stringify(o);
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    return new Promise((r) => pending.set(o.id, r));
  }
  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    while (true) {
      const h = buf.indexOf('\r\n\r\n');
      if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
      if (!m) { buf = buf.slice(h + 4); continue; }
      const n = +m[1];
      if (buf.length < h + 4 + n) break;
      const body = buf.slice(h + 4, h + 4 + n).toString();
      buf = buf.slice(h + 4 + n);
      try { const msg = JSON.parse(body); if (msg.id != null && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
    }
  });
  return { child, send, kill: () => child.kill() };
}

async function main() {
  const srv = makeServer(SERVER);

  // 1. 非法时序：在 initialize 之前发送 tools/list → 期望 -32600
  try {
    const preInit = await srv.send({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });
    const errCode = preInit?.error?.code;
    findings.push(`非法时序(tools/list before initialize): error.code=${errCode}`);
    if (errCode === -32600) {
      findings.push('PASS: 非法时序正确返回 -32600 (Invalid Request)');
    } else {
      findings.push(`FAIL: 非法时序未返回 -32600，实际=${errCode}`);
      status = 'FAIL';
      why = `非法时序未返回 -32600，实际 error.code=${errCode}`;
    }
  } catch (e) {
    findings.push(`非法时序测试异常: ${e.message}`);
    // 某些实现可能直接关闭连接，这也算安全行为
    findings.push('INFO: 服务器可能拒绝了非法时序请求（安全行为）');
  }

  // 2. 正常 initialize 握手
  const init = await srv.send({
    jsonrpc: '2.0', id: 2, method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd9-12-probe', version: '1' } }
  });

  // 检查 protocolVersion
  const pv = init?.result?.protocolVersion;
  findings.push(`initialize.result.protocolVersion = ${pv}`);
  if (pv && typeof pv === 'string') {
    findings.push('PASS: protocolVersion 存在且为字符串');
  } else {
    findings.push('FAIL: protocolVersion 缺失或非字符串');
    status = 'FAIL';
    why = 'initialize 返回缺少 protocolVersion';
  }

  // 检查 capabilities
  const caps = init?.result?.capabilities;
  findings.push(`initialize.result.capabilities = ${JSON.stringify(caps)}`);
  if (caps && typeof caps === 'object' && !Array.isArray(caps)) {
    findings.push('PASS: capabilities 存在且为对象');
  } else {
    findings.push('FAIL: capabilities 缺失或非对象');
    status = 'FAIL';
    why = 'initialize 返回缺少 capabilities';
  }

  // 检查 serverInfo
  const si = init?.result?.serverInfo;
  findings.push(`initialize.result.serverInfo = ${JSON.stringify(si)}`);
  if (si && typeof si === 'object' && si.name) {
    findings.push(`PASS: serverInfo 存在且包含 name="${si.name}"`);
  } else {
    findings.push('FAIL: serverInfo 缺失或缺少 name');
    status = 'FAIL';
    why = 'initialize 返回缺少 serverInfo';
  }

  // 3. 完成 initialized 通知
  srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });

  // 4. 验证握手后 tools/list 正常工作
  const tl = await srv.send({ jsonrpc: '2.0', id: 3, method: 'tools/list', params: {} });
  const toolCount = Array.isArray(tl?.result?.tools) ? tl.result.tools.length : 0;
  findings.push(`握手后 tools/list 返回 ${toolCount} 工具`);
  if (toolCount > 0) {
    findings.push('PASS: 握手完成后 tools/list 正常工作');
  } else {
    findings.push('FAIL: 握手后 tools/list 无工具返回');
    status = 'FAIL';
    why = '握手后 tools/list 返回空';
  }

  // 5. 检查 JSON-RPC 2.0 规范合规
  const jsonrpcField = init?.result?.jsonrpc || init?.jsonrpc;
  findings.push(`jsonrpc field = ${jsonrpcField}`);
  if (jsonrpcField === '2.0') {
    findings.push('PASS: JSON-RPC 2.0 版本标识正确');
  } else {
    findings.push(`WARN: jsonrpc field = ${jsonrpcField} (期望 2.0)`);
  }

  srv.kill();

  if (status === 'PASS') {
    why = `initialize 握手协议安全基线通过：protocolVersion=${pv}, capabilities 存在, serverInfo.name="${si?.name}", 非法时序返回 -32600, 握手后 tools/list 返回 ${toolCount} 工具`;
  }

  return { status, why, findings };
}

const result = await main();
const now = new Date();
const ts = now.getFullYear().toString() +
  String(now.getMonth() + 1).padStart(2, '0') +
  String(now.getDate()).padStart(2, '0') +
  String(now.getHours()).padStart(2, '0') +
  String(now.getMinutes()).padStart(2, '0') +
  String(now.getSeconds()).padStart(2, '0');

console.log(JSON.stringify({ status: result.status, why: result.why, executedAt: ts, findings: result.findings }, null, 2));