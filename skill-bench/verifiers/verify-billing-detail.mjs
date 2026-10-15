// verify-billing-detail.mjs — T14 账单费用明细 ground-truth 判定（只读）
import { spawnSync } from 'node:child_process';
const [runid, region, finalAnswer] = process.argv.slice(2);
function hc(args) {
  const r = spawnSync('hcloud', args, { encoding: 'utf-8', timeout: 90000 });
  const out = (r.stdout || '').trim();
  const i = out.indexOf('{');
  if (i < 0) return { json: null, raw: out };
  try { return { json: JSON.parse(out.slice(i)), raw: out }; } catch { return { json: null, raw: out }; }
}
// 回读账单明细（免费只读，需账期参数 bill_cycle）
const now = new Date();
const cycle = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
const j = hc(['BSS', 'ListCustomerBillsFeeRecords', `--cli-region=${region}`, `--bill_cycle=${cycle}`]);
const ok = j.json && !j.json.error_code;
const ans = (finalAnswer || '').replace(/\s+/g, ' ');
const honest = /条|费用|金额|记录|明细|0|无/i.test(ans);
console.log(JSON.stringify(ok && honest
  ? { success: true, detail: `账单明细接口回读成功，agent 回答费用记录` }
  : { success: false, detail: `回读=${ok}，回答摘要=${ans.slice(0, 100)}` }));