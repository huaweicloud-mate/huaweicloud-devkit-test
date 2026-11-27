import { mcpTool, writeEvidence, writeProbe, VC_QUOTE, PKG } from './lib.mjs';

const d211 = async () => {
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

const d87 = async () => {
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

for (const [id, title, fn] of [['D2-11', 'R3 STS token????', d211], ['D8-7', '7 ? meta/?????????????', d87]]) {
  let r;
  try { r = await fn(); } catch (e) { r = { status: 'FAIL', why: 'probe exception: ' + e.message, result: { stack: String(e.stack).slice(0, 600) } }; }
  writeEvidence(id, r);
  writeProbe(id, title, fn);
  console.log(id, r.status, String(r.why).slice(0, 220));
}
