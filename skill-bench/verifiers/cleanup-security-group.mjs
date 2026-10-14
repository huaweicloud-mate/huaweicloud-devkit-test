// cleanup-security-group.mjs — T3 归零：删除安全组
import { spawnSync } from 'node:child_process';

const [runid, region] = process.argv.slice(2);
const name = `devkit-bench-${runid}`;

function runHcloud(args) {
  const r = spawnSync('hcloud', args, { encoding: 'utf-8', timeout: 60000 });
  const out = (r.stdout || '').trim();
  const i = out.indexOf('{');
  if (i < 0) return { json: null, raw: out, err: r.stderr || '' };
  try { return { json: JSON.parse(out.slice(i)), raw: out, err: r.stderr || '' }; }
  catch (e) { return { json: null, raw: out, err: 'parse fail' }; }
}

const l = runHcloud(['VPC', 'ListSecurityGroups', `--cli-region=${region}`]);
const sg = l.json ? (l.json.security_groups || []).find((g) => g.name === name) : null;
if (!sg) {
  console.log(JSON.stringify({ success: true, detail: `安全组 ${name} 不存在（无残留）` }));
  process.exit(0);
}
const d = runHcloud(['VPC', 'DeleteSecurityGroup', `--cli-region=${region}`, `--security_group_id=${sg.id}`]);
console.log(JSON.stringify({
  success: d.json !== null || !d.err,
  detail: `DeleteSecurityGroup ${name}(id=${sg.id.slice(0, 8)}…) → ${(d.err || d.raw).trim().slice(0, 120) || '(空输出)'}`,
}));