// AI生成
// D3-S4: 场景-领券闭环 - 检查voucher_status/voucher_claim工具
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);
try {
  const results = [];
  const content = readFileSync(join(SRC, 'src', 'tools.mjs'), 'utf8');
  results.push({check:'voucher_status', pass: content.includes('voucher_status') || content.includes('voucherStatus') || content.includes('hdkitVoucherStatus')});
  results.push({check:'voucher_claim', pass: content.includes('voucher_claim') || content.includes('voucherClaim') || content.includes('hdkitVoucherClaim')});
  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({status: allPass ? 'PASS' : 'FAIL', why: allPass ? '领券闭环场景: voucher_status和voucher_claim工具均注册' : '部分失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(','), executedAt: ts(), details: results}));
} catch(e) { console.log(JSON.stringify({status:'BLOCKED', why:String(e.message).slice(0,300), executedAt: ts()})); }
