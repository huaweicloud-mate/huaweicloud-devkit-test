// Real probe for D8-7: 7 ? meta/?????????????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const skills = ['huaweicloud-core', 'huaweicloud-safety', 'huaweicloud-api-and-sdk', 'huaweicloud-capability-discovery', 'huaweicloud-cli-and-auth', 'huaweicloud-troubleshooting', 'huawei-getting-started'];
  const root = PKG + '/plugins/huaweicloud-core/skills';
  const out = [];
  for (const s of skills) {
    const file = path.join(root, s, 'SKILL.md');
    const exists = fs.existsSync(file);
    const body = exists ? fs.readFileSync(file, 'utf8') : '';
    const r = await mcpTool('huaweicloud_retrieve_skill', { name: s }, 45000);
    const mech = /hcloud\s+|huaweicloud_\w+|npx huaweicloud-devkit/.test(body);
    const hasSteps = /(^|\n)#{1,4}\s|\n\d+\.\s/.test(body);
    out.push({ skill: s, fileExists: exists, bytes: body.length, retrieveOk: !!(r.parsed && r.parsed.ok), mechanicalRefs: mech, hasSteps });
  }
  const ok = out.every((x) => x.fileExists && x.bytes > 500 && x.retrieveOk && (x.mechanicalRefs || x.hasSteps));
  return {
    status: ok ? 'PASS' : 'FAIL',
    why: ok ? '7 ? meta/????????? retrieve?????????' : '??????/????/?????: ' + JSON.stringify(out.filter((x) => !(x.fileExists && x.retrieveOk && x.bytes > 500))),
    result: { skills: out },
  };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));
