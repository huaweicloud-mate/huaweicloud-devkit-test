import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const SRC = process.argv[2];
const S = (f) => join(SRC, f);
let okAll = true;
function ck(id,n,cond,d=''){ console.log((cond?'PASS':'FAIL')+' | '+id+' | '+n+(d?' | '+d:'')); if(!cond) okAll=false; }

// D2-13 R9 configuredBySession 优先 env
{
  const C = await import(pathToFileURL(S('auth/credentials.mjs')).href);
  const iso = mkdtempSync(join(tmpdir(), 'r9-'));
  const cfg = join(iso, '.config', 'huaweicloud'); mkdirSync(cfg, {recursive:true});
  const credPath = join(cfg, 'credentials.json');
  writeFileSync(credPath, JSON.stringify({ ak:'S1_AK', sk:'S1_SK', region:'cn-north-4', configuredBySession: true }));
  process.env.HUAWEICLOUD_HOME = iso;
  process.env.HW_ACCESS_KEY = 'ENV_AK'; process.env.HW_SECRET_KEY = 'ENV_SK';
  delete process.env.HW_SECURITY_TOKEN;
  const r1 = C.resolveCredentials({});
  const s1wins = r1.ak === 'S1_AK';
  console.log(`[D2-13] configuredBySession=true 且三元组缺时 => ak前4=${String(r1.ak).slice(0,4)} (期望 S1)`);
  ck('D2-13', 'configuredBySession 标记时 S1 优先', r1.ak === 'S1_AK');
  writeFileSync(credPath, JSON.stringify({ ak:'S1_AK', sk:'S1_SK', region:'cn-north-4', configuredBySession: false }));
  const r2 = C.resolveCredentials({});
  console.log(`[D2-13] 清除标记后 => ak前4=${String(r2.ak).slice(0,4)} (期望 env 或回退)`);
  ck('D2-13', '清除标记后 env 兜底(非 S1)', r2.ak !== 'S1_AK');
  delete process.env.HW_ACCESS_KEY; delete process.env.HW_SECRET_KEY; delete process.env.HUAWEICLOUD_HOME;
  rmSync(iso, {recursive:true, force:true});
}

// D2-10 R7 current 档跟随
{
  const RC = await import(pathToFileURL(S('auth/reconcile.mjs')).href);
  const prof = RC.resolveManagedProfile ? RC.resolveManagedProfile() : null;
  console.log(`[D2-10] resolveManagedProfile => ${JSON.stringify(prof)}`);
  ck('D2-10', 'resolveManagedProfile 可调用并返回 current 档', typeof prof === 'string' || (prof && typeof prof === 'object'));
}

// D4-19 确认流下预检仍生效
{
  const RE = await import(pathToFileURL(S('risk-rule-engine.mjs')).href);
  const r = RE.evaluateCommandRisk('hcloud ecs DeleteServers --force');
  console.log(`[D4-19] DeleteServers => decision=${r.decision} findings=${(r.findings||[]).map(f=>f.ruleId).join(',')}`);
  ck('D4-19', '预检对 DeleteServers 产生拦截/告警', r.decision === 'deny' || r.decision === 'warn');
}

// D4-24 确认令牌一次性消费
{
  const HC = await import(pathToFileURL(S('hcloud-cli.mjs')).href);
  const TTL = typeof HC.APPROVAL_TTL_MS !== 'undefined' ? HC.APPROVAL_TTL_MS : null;
  console.log(`[D4-24] APPROVAL_TTL_MS=${TTL}`);
  ck('D4-24', 'APPROVAL_TTL_MS 已定义(5min)', TTL === 300000 || TTL === 5*60*1000);
  ck('D4-24', 'consumeApprovalToken 存在(一次性消费)', typeof HC.consumeApprovalToken === 'function');
}

// D3-C14 沙箱 HDKit 凭证参数校验
{
  const HK = await import(pathToFileURL(S('sandbox/hdkitservice-api.mjs')).href);
  try {
    await HK.hdkitCredentials(undefined, undefined);
    ck('D3-C14', '缺 sessionId+devStageId 抛错', false, '未抛错');
  } catch(e) {
    ck('D3-C14', '缺 sessionId+devStageId 抛错', /session_id.*required|required/i.test(e.message), e.message.slice(0,60));
  }
  ck('D3-C14', 'hdkitConnect 透传 source/env(签名存在)', typeof HK.hdkitConnect === 'function' && typeof HK.hdkitCredentials === 'function');
}

console.log(`=== supplement2 总判定: ${okAll ? 'ALL PASS' : 'HAS FAIL'} ===`);
