// verify-billing.mjs — T2 查账单 ground-truth 判定
// 判据：独立回读真实账户余额，agent 最终回答命中真实金额 + 币种
import { spawnSync } from 'node:child_process';

const [runid, region, finalAnswer] = process.argv.slice(2);

function runHcloud(args) {
  const r = spawnSync('hcloud', args, { encoding: 'utf-8', timeout: 60000 });
  const out = (r.stdout || '').trim();
  const i = out.indexOf('{');
  if (i < 0) return { json: null, raw: out, err: r.stderr || '' };
  try { return { json: JSON.parse(out.slice(i)), raw: out, err: r.stderr || '' }; }
  catch (e) { return { json: null, raw: out, err: 'parse fail: ' + e.message }; }
}

const q = runHcloud(['BSS', 'ShowCustomerAccountBalances', '--cli-region=cn-north-1']);
if (!q.json) {
  console.log(JSON.stringify({ success: false, detail: `BSS 回读失败: ${(q.err || q.raw).slice(0, 200)}` }));
  process.exit(0);
}

const amounts = (q.json.account_balances || []).map((a) => a.amount);
const debt = q.json.debt_amount ?? null;
const currency = q.json.currency || 'CNY';
const truth = amounts.find((a) => a > 0) ?? amounts[0] ?? 0;

const ans = finalAnswer || '';
const hasCurrency = /CNY|人民币|元/i.test(ans);
// 真实金额命中（允许整数/小数/带千分位）
const truthStr = String(truth);
const hitAmount = new RegExp('(?<![0-9])' + truthStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![0-9])').test(ans);
const success = hasCurrency && hitAmount;

console.log(JSON.stringify({
  success,
  detail: `真实余额=${truth} ${currency}（debt=${debt}）; agent回答${hasCurrency ? '含' : '缺'}币种、${hitAmount ? '命中' : '未命中'}金额; 摘要=${ans.replace(/\s+/g, ' ').slice(0, 120)}`,
}));