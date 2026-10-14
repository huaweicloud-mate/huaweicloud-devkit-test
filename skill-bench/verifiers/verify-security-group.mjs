// verify-security-group.mjs — T3 配置安全组 ground-truth 判定
// 判据：安全组 devkit-bench-<runid> 存在 + 存在入方向(ingress)放行 80 端口的规则
import { spawnSync } from 'node:child_process';

const [runid, region, finalAnswer] = process.argv.slice(2);
const name = `devkit-bench-${runid}`;

function runHcloud(args) {
  const r = spawnSync('hcloud', args, { encoding: 'utf-8', timeout: 60000 });
  const out = (r.stdout || '').trim();
  const i = out.indexOf('{');
  if (i < 0) return { json: null, raw: out, err: r.stderr || '' };
  try { return { json: JSON.parse(out.slice(i)), raw: out, err: r.stderr || '' }; }
  catch (e) { return { json: null, raw: out, err: 'parse fail: ' + e.message }; }
}

// 1) 找安全组
const l1 = runHcloud(['VPC', 'ListSecurityGroups', `--cli-region=${region}`]);
if (!l1.json) {
  console.log(JSON.stringify({ success: false, detail: `ListSecurityGroups 失败: ${(l1.err || l1.raw).slice(0, 200)}` }));
  process.exit(0);
}
const sg = (l1.json.security_groups || []).find((g) => g.name === name);
if (!sg) {
  console.log(JSON.stringify({ success: false, detail: `未找到安全组 ${name}（agent 可能未创建）` }));
  process.exit(0);
}

// 2) 找入方向 80 端口规则（默认规则不含 80，只有显式添加才有）
const l2 = runHcloud(['VPC', 'ListSecurityGroupRules', `--cli-region=${region}`, `--security_group_id.1=${sg.id}`]);
const rules = l2.json ? (l2.json.security_group_rules || []) : [];
const ingress80 = rules.some((r) =>
  r.direction === 'ingress' && /80/.test(String(r.multiport || r.port_range_min || r.port_range_max || '')));

console.log(JSON.stringify({
  success: !!sg && ingress80,
  detail: `安全组 ${name} 存在(id=${sg.id.slice(0, 8)}…), 规则共 ${rules.length} 条, 入向80端口规则=${ingress80 ? '有' : '无'}${l2.json ? '' : '（规则查询失败）'}`,
}));