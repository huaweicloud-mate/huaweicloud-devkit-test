// EXP-C4-03 OBS 只读规划冒烟：list_operations + plan 只读命令
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const now = () => { const d=new Date(); const p=(n)=>String(n).padStart(2,'0'); return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; };

let helpOk = false, helpPreview = '';
try {
  const out = execSync('hcloud OBS help 2>&1', { encoding: 'utf8', timeout: 30000 });
  helpOk = out.includes('obsutil') || out.toLowerCase().includes('usage');
  helpPreview = out.slice(0, 120);
} catch (e) { helpPreview = (e.stderr || e.message || '').slice(0, 120); }

let planOk = false, planPreview = '';
try {
  const cli = await import('file:///home/zhangshuang/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/hcloud-cli.mjs');
  const plan = await cli.planHcloudCommand({ service: 'OBS', operation: 'ls', args: [] });
  planOk = !!(plan && plan.command);
  planPreview = (plan?.command || JSON.stringify(plan)).slice(0, 120);
} catch (e) { planPreview = 'ERR:' + e.message; }

const result = {
  status: (helpOk && planOk) ? 'PASS' : 'FAIL',
  why: `OBS 走 obsutil 风格（hcloud OBS help）列出操作：${helpOk ? '成功' : '失败'}；plan 只读命令：${planOk ? '成功' : '失败'}`,
  service: 'OBS', helpOk, helpPreview, planOk, planPreview, executedAt: now()
};
writeFileSync(join(__dirname, 'stdout.log'), JSON.stringify(result, null, 2));
console.log('[EXP-C4-03]', result.status);
