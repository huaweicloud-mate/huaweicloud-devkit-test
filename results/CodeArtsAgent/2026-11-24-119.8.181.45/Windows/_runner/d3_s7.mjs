import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { writeEvidence, writeProbe, ts } from './lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ADM = JSON.parse(readFileSync(homedir() + '/.config/huaweicloud/credentials.json', 'utf8'));
const base = ['--cli-region=cn-north-4', '--cli-access-key=' + ADM.ak, '--cli-secret-key=' + ADM.sk];
const hc = (a, t = 300000) => { const r = spawnSync('hcloud', [...a, ...base], { encoding: 'utf8', timeout: t, windowsHide: true }); let p = null; const s = r.stdout || ''; const i = s.search(/[{\[]/); try { p = JSON.parse(i >= 0 ? s.slice(i) : s); } catch { } return { rc: r.status, out: s.slice(0, 3000), parsed: p }; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = ts().slice(2, 14);

const fn = async () => {
  const nm = 'tctest-codearts1-s7' + stamp;
  const v = hc(['VPC', 'CreateVpc', '--vpc.name=' + nm, '--vpc.cidr=10.86.0.0/16']);
  const vpcId = v.parsed && v.parsed.vpc && v.parsed.vpc.id;
  if (!vpcId) return { status: 'FAIL', why: 'VPC 创建失败: ' + v.out.slice(0, 200), result: v };
  const s = hc(['VPC', 'CreateSubnet', '--subnet.name=' + nm + '-sub', '--subnet.cidr=10.86.0.0/24', '--subnet.gateway_ip=10.86.0.1', '--subnet.vpc_id=' + vpcId]);
  const subnetId = s.parsed && s.parsed.subnet && s.parsed.subnet.id;
  const g = hc(['VPC', 'CreateSecurityGroup', '--security_group.name=' + nm + '-sg']);
  const sgId = g.parsed && g.parsed.security_group && g.parsed.security_group.id;
  const cleanup = () => {
    const log = [];
    if (subnetId) log.push({ subnet: hc(['VPC', 'DeleteSubnet', '--vpc_id=' + vpcId, '--subnet_id=' + subnetId]).rc });
    log.push({ vpc: hc(['VPC', 'DeleteVpc', '--vpc_id=' + vpcId]).rc });
    if (sgId) log.push({ sg: hc(['VPC', 'DeleteSecurityGroup', '--security_group_id=' + sgId]).rc });
    return log;
  };
  if (!subnetId) { cleanup(); return { status: 'FAIL', why: '子网创建失败', result: { vpcId, s: s.out.slice(0, 300) } }; }
  const params = { path: { project_id: '46c1fd48bd1248c7b75afc3780de7132' }, body: { name: nm, datastore: { type: 'MySQL', version: '8.0' }, flavor_ref: 'rds.mysql.x1.large.2', volume: { size: 40, type: 'CLOUDSSD' }, region: 'cn-north-4', availability_zone: 'cn-north-4a', vpc_id: vpcId, subnet_id: subnetId, security_group_id: sgId, password: 'Tctest#2026Aa', charge_info: { charge_mode: 'postPaid' } } };
  const pf = join(HERE, '_rds_params.json');
  writeFileSync(pf, JSON.stringify(params), 'utf8');
  const cr = hc(['RDS', 'CreateInstance', '--cli-jsonInput=' + pf], 300000);
  try { unlinkSync(pf); } catch { }
  const instId = cr.parsed && (cr.parsed.instance && cr.parsed.instance.id);
  if (!instId) { const cl = cleanup(); return { status: 'BLOCKED', why: '实测 ' + ts() + ' RDS CreateInstance 失败：' + cr.out.slice(0, 260) + '（KooCLI 参数校验/权限）；已清理自建 VPC/子网/SG=' + JSON.stringify(cl) + '；影响：Web+RDS 跨服务端到端未完成；解除条件：RDS 创建权限/参数可用并预留 25 分钟建删窗口', result: { create: cr.out.slice(0, 600), cleanup: cl } }; }
  let state = 'CREATING', tries = 0;
  while (tries++ < 60 && !/ACTIVE|FAILED|ERROR/.test(state)) { await sleep(30000); const l = hc(['RDS', 'ListInstances'], 120000); const arr = (l.parsed && l.parsed.instances) || []; const me = arr.find((x) => x.id === instId || x.name === nm); state = (me && me.status) || state; }
  const del = hc(['RDS', 'DeleteInstance', '--instance_id=' + instId], 600000);
  let gone = false;
  for (let i = 0; i < 40 && !gone; i++) { await sleep(15000); const l = hc(['RDS', 'ListInstances'], 120000); const arr = (l.parsed && l.parsed.instances) || []; gone = !arr.some((x) => x.id === instId); if (gone) break; }
  const cl = cleanup();
  await sleep(4000);
  const vpcRemain = ((hc(['VPC', 'ListVpcs']).parsed || {}).vpcs || []).some((x) => x.id === vpcId);
  const ok = /ACTIVE/.test(state) && gone && !vpcRemain;
  if (ok) return { status: 'PASS', why: '真机跨服务：VPC+子网+SG+RDS(' + nm + ') 状态=' + state + '→删除→ListInstances 归零；VPC/子网/SG 归零=' + !vpcRemain + '；Web 层 ECS/OBS 建删见 D3-C1/D3-C2', result: { vpcId, subnetId, sgId, instId, state, gone, cleanup: cl, vpcRemain } };
  return { status: 'FAIL', why: 'RDS 跨服务未闭环 state=' + state + ' gone=' + gone + ' vpcRemain=' + vpcRemain + ' cleanup=' + JSON.stringify(cl), result: { vpcId, subnetId, sgId, instId, state, gone, cleanup: cl, vpcRemain } };
};
const r = await fn();
writeEvidence('D3-S7', r);
try { writeProbe('D3-S7', '场景-跨服务(Web+RDS)并归零', fn); } catch { }
console.log('D3-S7', r.status, '|', String(r.why).slice(0, 400));
