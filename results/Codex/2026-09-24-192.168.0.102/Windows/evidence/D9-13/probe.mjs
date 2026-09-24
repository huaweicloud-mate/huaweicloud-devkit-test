import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const hdkSrc = process.argv[2];
const evRoot = process.argv[3];
if (!hdkSrc || !evRoot) {
  console.error('usage: node daily_p0_probes.mjs <hdk-src> <evidence-root>');
  process.exit(2);
}

const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const srcUrl = (file) => new URL(`file:///${join(hdkSrc, file).replaceAll('\\', '/')}`).href;
const results = {};

function rec(caseId, name, pass, actual, expected, detail = '') {
  (results[caseId] ||= []).push({ name, pass, actual, expected, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${caseId} ${name}`);
}

function writeCase(caseId) {
  const items = results[caseId] || [];
  const failed = items.filter((x) => !x.pass);
  const dir = join(evRoot, caseId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'probe.mjs'), readFileSync(new URL(import.meta.url)), 'utf8');
  writeFileSync(
    join(dir, 'stdout.log'),
    JSON.stringify({
      case: caseId,
      status: failed.length === 0 ? 'PASS' : 'FAIL',
      why: failed.map((x) => x.detail || `${x.name} failed`).join('; '),
      executedAt: ts,
      results: items,
    }, null, 2),
    'utf8',
  );
}

function makeServer(serverPath) {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
  });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    while (true) {
      const h = buf.indexOf('\r\n\r\n');
      if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
      if (!m) { buf = buf.slice(h + 4); continue; }
      const n = Number(m[1]);
      if (buf.length < h + 4 + n) break;
      const body = buf.slice(h + 4, h + 4 + n).toString();
      buf = buf.slice(h + 4 + n);
      try {
        const msg = JSON.parse(body);
        if (msg.id !== undefined && pending.has(msg.id)) {
          pending.get(msg.id)(msg);
          pending.delete(msg.id);
        }
      } catch {}
    }
  });
  function send(o) {
    const body = JSON.stringify(o);
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`));
    return new Promise((resolve) => pending.set(o.id, resolve));
  }
  return { child, send };
}

// D4-28: Node safety hook chain.
{
  const hookPath = join(hdkSrc, '..', 'hooks', 'huaweicloud-safety.mjs');
  const hooksJson = join(hdkSrc, '..', 'hooks', 'hooks.json');
  rec('D4-28', 'hooks-json-present', existsSync(hooksJson), hooksJson, 'exists');
  const hooksText = existsSync(hooksJson) ? readFileSync(hooksJson, 'utf8') : '';
  rec('D4-28', 'hooks-json-node-mjs', hooksText.includes('huaweicloud-safety.mjs') && hooksText.includes('node'), hooksText.slice(0, 160), 'node huaweicloud-safety.mjs');
  const payloads = [
    { command: 'echo $HW_ACCESS_KEY' },
    { cmd: 'cat ~/.config/huaweicloud/credentials.json' },
    { script: 'hcloud ECS DeleteServers --server-ids test' },
    { args: ['hcloud', 'ECS', 'DeleteServers', '--server-ids', 'test'] },
  ];
  for (const input of payloads) {
    const p = spawnSync(process.execPath, [hookPath], {
      input: JSON.stringify({ hook_event_name: 'PreToolUse', tool_input: input }),
      encoding: 'utf8',
      timeout: 5000,
    });
    let out = {};
    try { out = JSON.parse(p.stdout.trim() || '{}'); } catch {}
    rec('D4-28', `deny-${Object.keys(input)[0]}`,
      out?.hookSpecificOutput?.permissionDecision === 'deny',
      out, 'permissionDecision=deny');
  }
}

// D9-12: initialize and protocol helper baseline.
{
  const { _decorateResult, _resetHintConsumption, _isHintConsumed } = await import(srcUrl('mcp-protocol.mjs'));
  const { callTool, listSkillDirs, findSkillsRoot, runVersionCheck } = await import(srcUrl('tools.mjs'));
  const server = makeServer(join(hdkSrc, 'mcp-server.mjs'));
  const init = await server.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'daily-p0', version: '1' } } });
  const list = await server.send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  const bad = await server.send({ jsonrpc: '2.0', id: 3, method: 'tools/list', params: 'bad' });
  server.child.kill();
  rec('D9-12', 'initialize-server-info', init?.result?.serverInfo?.name === 'huaweicloud-devkit', init?.result?.serverInfo, 'huaweicloud-devkit');
  rec('D9-12', 'initialize-protocol-version', Boolean(init?.result?.protocolVersion), init?.result?.protocolVersion, 'present');
  rec('D9-12', 'tools-list-nonempty', Array.isArray(list?.result?.tools) && list.result.tools.length > 0, list?.result?.tools?.length, '>0');
  rec('D9-12', 'invalid-params-rejected', bad?.error?.code === -32602, bad?.error, '-32602');
  rec('D9-12', 'callTool-route', (await callTool('huaweicloud_service_catalog', { intent: 'ECS list' }))?.content?.length > 0, 'content', 'content');
  _resetHintConsumption();
  const decorated = _decorateResult('s1', 'huaweicloud_check_update', { content: [{ type: 'text', text: 'ok' }], _updateHint: { latestVersion: '1.1.7' } });
  rec('D9-12', 'decorate-result-side-effect', Boolean(decorated?.content) && _isHintConsumed('s1'), { decorated: Boolean(decorated?.content), consumed: _isHintConsumed('s1') }, 'decorated+consumed');
  const skillsRoot = findSkillsRoot([join(hdkSrc, '..', '..', '..', 'skills'), join(hdkSrc, '..', 'skills')]);
  rec('D9-12', 'skills-root-probe', Array.isArray(listSkillDirs(skillsRoot)) || skillsRoot === null, skillsRoot, 'valid or null');
  rec('D9-12', 'run-version-check-export', typeof runVersionCheck === 'function', typeof runVersionCheck, 'function');
}

// D9-13: no credential leak, risk and approval token lifecycle.
{
  const cred = await import(srcUrl('auth/credentials.mjs'));
  const safety = await import(srcUrl('safety-policy.mjs'));
  const risk = await import(srcUrl('risk-rule-engine.mjs'));
  const hcloud = await import(srcUrl('hcloud-cli.mjs'));
  const { callTool } = await import(srcUrl('tools.mjs'));
  cred.setRuntimeCredentials({ ak: 'AKP0SECRET123', sk: 'SKP0SECRET456', securityToken: 'TOKENP0SECRET789', region: 'cn-north-4' });
  const resolved = cred.resolveCredentialsWithRuntime({});
  rec('D9-13', 'runtime-credentials-resolve', resolved.ak === 'AKP0SECRET123' && cred.hasRuntimeCredentials(), { ak: resolved.ak, has: cred.hasRuntimeCredentials() }, 'runtime credentials');
  rec('D9-13', 'policy-load', Boolean(safety.loadPolicy()?.version), safety.loadPolicy()?.version, 'version');
  rec('D9-13', 'classify-read-allow', safety.classifyHcloudArgs(['ECS', 'ListServersDetails']).decision === 'allow', safety.classifyHcloudArgs(['ECS', 'ListServersDetails']), 'allow');
  rec('D9-13', 'classify-write-deny', safety.classifyHcloudArgs(['ECS', 'DeleteServers', '--server-ids', 'x']).decision !== 'allow', safety.classifyHcloudArgs(['ECS', 'DeleteServers', '--server-ids', 'x']), 'non-allow');
  const merged = risk.mergeRiskDecision({ decision: 'allow' }, risk.evaluateArtifacts([{ path: 'x', content: 'ak=AKP0SECRET123' }]));
  rec('D9-13', 'risk-merge-detects-secret', merged.decision !== 'allow', merged, 'non-allow');
  const token = hcloud.createApprovalToken(['ECS', 'DeleteServers', '--server-ids', 'x']);
  const first = hcloud.consumeApprovalToken(token.token);
  const second = hcloud.consumeApprovalToken(token.token);
  rec('D9-13', 'approval-token-one-shot', Boolean(first) && !second, { first: Boolean(first), second: Boolean(second), hash: hcloud.hashArgs(['ECS']) }, 'one-shot');
  const plan = hcloud.planHcloudCommand(['ECS', 'DeleteServers', '--server-ids', 'x']);
  rec('D9-13', 'plan-write-gated', plan.needsApproval === true || plan.decision !== 'allow', plan, 'gated');
  const tool = await callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'DeleteServers', '--server-ids', 'x'] });
  const toolText = JSON.stringify(tool);
  rec('D9-13', 'tools-call-no-secret-leak', !toolText.includes('AKP0SECRET123') && !toolText.includes('SKP0SECRET456') && !toolText.includes('TOKENP0SECRET789'), toolText.slice(0, 200), 'no secrets');
  cred.clearRuntimeCredentials();
  rec('D9-13', 'runtime-credentials-clear', !cred.hasRuntimeCredentials(), cred.hasRuntimeCredentials(), false);
  rec('D9-13', 'placeholder-detect', cred.isPlaceholder('<ak>') === true, cred.isPlaceholder('<ak>'), true);
  rec('D9-13', 'paths-export', Boolean(cred.globalCredentialsPath() && cred.obsConfigPath()), { global: cred.globalCredentialsPath(), obs: cred.obsConfigPath() }, 'paths');
}

for (const cid of Object.keys(results)) writeCase(cid);
