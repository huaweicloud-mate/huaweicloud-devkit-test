// 收尾① FunctionGraph 残留清理 + 归零验证 (真云)
// 残留来源: 09-23 会话 D3-S6 实测建函数 hdk-s6-fn-12798086 后删除失败(approval token 过期)
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const EVID = process.env.EVID_DIR || dirname(fileURLToPath(import.meta.url));
const REGION = 'cn-north-4';

function sh(args) {
  const r = spawnSync('hcloud', args, { encoding: 'utf8', timeout: 120000 });
  return (r.stdout || '') + (r.stderr || '');
}

const out = [];
out.push('=== 收尾① FunctionGraph 残留清理 + 归零验证 ===');

// ① 盘点残留
const before = sh(['FunctionGraph', 'ListFunctions', `--cli-region=${REGION}`, '--cli-output=json']);
out.push(`[1] 清理前 ListFunctions:`);
out.push(before.slice(0, 800));

let deleted = 0;
let remaining = [];

try {
  const j = JSON.parse(before);
  const fns = j.functions || [];
  for (const f of fns) {
    const urn = f.func_urn || '';
    const name = f.func_name || '';
    // 只删本次测试相关残留 (hdk-s6-* / hdk1-s6-* / test-d3-s6-*)，禁删他人/既有资源
    if (/^(hdk-s6-|hdk1-s6-|test-d3-s6-|hdk-s6-timer-)/.test(name)) {
      const del = sh(['FunctionGraph', 'DeleteFunction', `--function_urn=${urn}`, `--cli-region=${REGION}`]);
      const ok = /success|\{\}|null|204/i.test(del);
      out.push(`[DEL] ${name} -> ${ok ? '已删除' : '删除结果: ' + del.slice(0, 200)}`);
      if (ok) deleted++;
      else remaining.push(name);
    } else {
      out.push(`[SKIP] 非本次测试残留, 保留: ${name}`);
    }
  }
} catch (e) {
  out.push(`[解析失败] ${e.message}; 原始输出: ${before.slice(0, 400)}`);
}

// ② 归零验证
const after = sh(['FunctionGraph', 'ListFunctions', `--cli-region=${REGION}`, '--cli-output=json']);
let zero = false;
try {
  const j2 = JSON.parse(after);
  const fns2 = j2.functions || [];
  const remainTest = fns2.filter(f => /^(hdk-s6-|hdk1-s6-|test-d3-s6-)/.test(f.func_name || ''));
  zero = remainTest.length === 0;
  out.push(`[2] 清理后本次测试残留函数数 = ${remainTest.length}; 归零=${zero}`);
  out.push(`    残留列表: ${remainTest.map(f => f.func_name).join(',') || '(空)'}`);
} catch (e) {
  out.push(`[2] 归零验证解析失败: ${e.message}`);
}

const ok = zero;
out.push('');
out.push(`RESULT: deleted=${deleted} remaining=${remaining.join(',') || '无'} zero=${zero} => ${ok ? 'PASS' : 'FAIL'}`);

const d = join(EVID, '_cleanup-fg');
mkdirSync(d, { recursive: true });
writeFileSync(join(d, 'stdout.log'), JSON.stringify({ status: ok ? 'PASS' : 'FAIL', deleted, remaining, zero, executedAt: new Date().toISOString() }, null, 2), 'utf8');
console.log(out.join('\n'));