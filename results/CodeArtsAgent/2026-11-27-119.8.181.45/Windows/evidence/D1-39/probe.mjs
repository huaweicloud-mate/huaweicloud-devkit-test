// Real probe for D1-39: Windows ????????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, spawnSync } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
    const fs = await import('node:fs');
    const ur = await import('file:///' + DIST + '/update-check.mjs');
    const syncRes = ur.queryDistTagsSync();
    const fetchRes = await ur.queryDistTagsFetch();
    const syncOk = !!(syncRes && (syncRes.latest || syncRes.next));
    return {
      status: syncOk ? 'PASS' : 'FAIL',
      why: syncOk ? 'queryDistTagsSync ?? dist-tags' : 'queryDistTagsSync ?? null?npm view dist-tags ??? JSON ???parseDistTagsOutput/toDistTags ??????check_update ?? check_failed?fetch ????',
      result: { syncRes, fetchRes, npmRaw: (await import('node:child_process')).spawnSync('npm.cmd view huaweicloud-devkit dist-tags --json', { encoding: 'utf8', shell: true, timeout: 15000 }).stdout.slice(0, 200) },
    };
  };
const r = await run();
console.log(JSON.stringify(r, null, 2));
