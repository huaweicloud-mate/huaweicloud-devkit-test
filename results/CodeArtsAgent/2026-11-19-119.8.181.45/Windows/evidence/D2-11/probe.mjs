// Real probe for D2-11: R3 STS token????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const os = await import('node:os');
  const fs = await import('node:fs');
  const tmp = (await import('node:path')).join(os.tmpdir(), 'hdk-iso-home-d211b-' + Date.now());
  fs.mkdirSync((await import('node:path')).join(tmp, '.config', 'huaweicloud'), { recursive: true });
  const r = await mcpTool('huaweicloud_auth_switch', {
    vendorConfirmed: VC_QUOTE, mode: 'memory', action: 'persist',
    ak: 'test_ak_20char123456', sk: 'test_sk_40char_aaaaaaaaaaaaaaaaaaaaaaaa',
    securityToken: 'STS-TOKEN-SHOULD-NEVER-PERSIST', region: 'cn-north-4',
  }, 60000, { USERPROFILE: tmp, HOME: tmp });
  const credPath = (await import('node:path')).join(tmp, '.config', 'huaweicloud', 'credentials.json');
  const onDisk = fs.existsSync(credPath) ? fs.readFileSync(credPath, 'utf8') : '';
  const tokenOnDisk = onDisk.includes('STS-TOKEN-SHOULD-NEVER-PERSIST');
  const refused = /cannot be persisted|R3/i.test(r.text || '');
  return {
    status: (!tokenOnDisk && refused) ? 'PASS' : 'FAIL',
    why: tokenOnDisk ? 'STS token ???????????' : 'persist+securityToken ????????: ' + (r.text || '').trim().slice(0, 120) + '???? HOME ????????',
    result: { textHead: r.text, tokenOnDisk, onDiskHasCreds: !!onDisk, credPathExists: fs.existsSync(credPath) },
  };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
