// Real probe for D2-26: ???????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, writeFileSync, join, iso } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
  const h = iso('d226');
  const cred = await import('file:///' + DIST + '/auth/credentials.mjs');
  cred.writeGlobalCredentials({ ak: 'AK_BK_00000000000000', sk: 'SK_BK_0000000000000000000000000000', region: 'cn-north-4' }, { home: h });
  const bk = cred.backupGlobalCredentials ? cred.backupGlobalCredentials({ home: h }) : null;
  const p = join(h, '.config', 'huaweicloud', 'credentials.json');
  writeFileSync(p, JSON.stringify({ ak: 'BROKEN' }), 'utf8');
  const rs = cred.restoreGlobalCredentialsBackup ? cred.restoreGlobalCredentialsBackup({ home: h }) : null;
  const after = cred.readGlobalCredentials ? cred.readGlobalCredentials({ home: h }) : null;
  const ok = !!after && (after.ak === 'AK_BK_00000000000000' || after.accessKeyId === 'AK_BK_00000000000000');
  return { status: ok ? 'PASS' : 'FAIL', why: '??=' + JSON.stringify(bk).slice(0, 160) + ' ??? AK=' + JSON.stringify(after && (after.ak || after.accessKeyId)), result: { backup: bk, restored: after } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
