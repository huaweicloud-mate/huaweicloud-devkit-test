// D3-C1 ECS lifecycle E2E — real cloud attempt with the only usable credential on this host
// (KooCLI default profile = IAM user test001). Records the actual API refusal + zero-residue check.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const EV = String.raw`C:\Users\Administrator\devkit-test\OpenCode\huaweicloud-devkit-test\results\OpenCode\2026-11-23-119.8.181.45\Windows\evidence\D3-C1`;
const CASE_ID = 'D3-C1';
const NK = (() => { const d = new Date(Date.now() + 8 * 3600 * 1000); return d.toISOString().replace(/[-:T]/g, '').slice(0, 14); })();
const NAME = 'tctest-c1-' + NK.slice(4);
const IMAGE = '9c2f377e-7f49-4fdf-b0be-c6c8d3b96fde';
const FLAVOR = 'as7.medium.2';
const SUBNET = 'ccd20f1d-04a8-4a2c-8a60-ce31cf3cb4c6';
const VPC = '8dc80872-220b-42db-8cae-25d888088121';
const AZ = 'cn-north-4a';

const hcloud = (args, timeout = 60000) => {
  const r = spawnSync(process.env.HCLOUD_BIN || 'hcloud', args, { encoding: 'utf8', timeout });
  let j = null;
  try { j = JSON.parse((r.stdout || '').trim()); } catch { j = null; }
  return { code: r.status, out: (r.stdout || '').trim(), err: (r.stderr || '').trim(), json: j };
};
const listMine = () => {
  const r = hcloud(['ECS', 'ListServersDetails', '--cli-region=cn-north-4']);
  let all = [];
  try { all = (JSON.parse((r.stdout || '').trim()).servers) || []; } catch { all = []; }
  return { ...r, allNames: all.map((s) => s.name).filter(Boolean), mine: all.map((s) => s.name).filter((n) => n === NAME) };
};

async function main() {
  const pre = listMine();
  const create = hcloud(['ECS', 'CreateServers', '--cli-region=cn-north-4',
    '--server.name=' + NAME, '--server.imageRef=' + IMAGE, '--server.flavorRef=' + FLAVOR,
    '--server.nics.1.subnet_id=' + SUBNET, '--server.root_volume.volumetype=SATA',
    '--server.root_volume.size=40', '--server.availability_zone=' + AZ, '--server.vpcid=' + VPC], 90000);
  writeFileSync(join(EV, 'create.log'), create.out + '\n' + create.err, 'utf8');
  const post = listMine();
  const text = JSON.stringify(create.json || {}) + create.out;
  const denied = /Pdp\.0001|not authorized|PolicyNotAuthorized|denied by policy|Unauthorized|APIGW\.0301/i.test(text);
const zero = post.mine.length === 0;
  const out = {
    caseId: CASE_ID,
    status: denied && zero ? 'BLOCKED' : 'FAIL',
    why: denied
      ? '真云 ECS 生命周期无法闭环：唯一可用凭证（KooCLI default = IAM 用户 test001）创建被 IAM 拒绝（Pdp.0001 ecs:cloudServers:createServers），仅支持只读；按名复检 0 台，云端零残留。解除条件：下发具备 ECS 写权限的管理员 AK/SK'
      : 'ECS 生命周期未闭环且非权限拒绝：' + text.slice(0, 200),
    executedAt: NK,
    result: {
      preList: pre.json, create: { code: create.code, apiError: create.json, out: create.out.slice(0, 400) },
      postAllNames: post.allNames, postMine: post.mine, zeroResidue: zero, denied,
    },
  };
  writeFileSync(join(EV, 'stdout.log'), JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify({ caseId: CASE_ID, status: out.status, why: out.why }));
}
main().catch((e) => {
  const out = { caseId: CASE_ID, status: 'FAIL', why: 'probe exception: ' + String(e && e.message || e), executedAt: NK };
  writeFileSync(join(EV, 'stdout.log'), JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out));
});
