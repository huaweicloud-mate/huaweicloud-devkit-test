// Real probe for D2-11: R3 STS token????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, existsSync, readFileSync, mkdirSync, join, tmpdir, iso } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
    const os = await import('node:os');
    const fs = await import('node:fs');
    const tmp = join(os.tmpdir(), 'hdk-iso-home-d211-' + Date.now());
    fs.mkdirSync(join(tmp, '.config', 'huaweicloud'), { recursive: true });
    const r = await mcpTool('huaweicloud_auth_switch', {
      vendorConfirmed: VC_QUOTE, mode: 'memory', action: 'persist',
      ak: 'test_ak_20char123456', sk: 'test_sk_40char_aaaaaaaaaaaaaaaaaaaaaaaa', securityToken: 'STS-TOKEN-SHOULD-NEVER-PERSIST', region: 'cn-north-4',
    }, 60000, { USERPROFILE: tmp, HOME: tmp });
    const credPath = join(tmp, '.config', 'huaweicloud', 'credentials.json');
    const onDisk = fs.existsSync(credPath) ? fs.readFileSync(credPath, 'utf8') : '';
    const tokenOnDisk = onDisk.includes('STS-TOKEN-SHOULD-NEVER-PERSIST');
    const parsed = r.parsed || {};
    const rejected = /reject|error|token/i.test(String(parsed.status || parsed.scope || r.text || ''));
    return {
      status: (!tokenOnDisk && rejected) ? 'PASS' : 'FAIL',
      why: tokenOnDisk ? 'STS token ???????????' : (rejected ? 'STS token ????????/??' : 'STS token ???????????'),
      result: { parsed, textHead: (r.text || '').slice(0, 500), tokenOnDisk, onDiskHasCreds: !!onDisk },
    };
  };
const r = await run();
console.log(JSON.stringify(r, null, 2));
