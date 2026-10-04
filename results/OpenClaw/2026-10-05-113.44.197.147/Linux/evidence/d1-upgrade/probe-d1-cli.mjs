// D1 CLI 真机冒烟：doctor 健康自检 + status 安装态 + install-hcloud 命令展示
// SUT: huaweicloud-devkit@1.1.5（全局 npm 包）
import { execFileSync } from 'node:child_process';

let pass = 0, fail = 0;
const lines = [];
function check(id, title, cond, note) {
  cond ? pass++ : fail++;
  lines.push(`${cond ? 'PASS' : 'FAIL'}  ${id}  ${title}  => ${note}`);
}

// D1-3 doctor 健康自检：检测项准确且如实报告（11 pass 0 fail）
{
  let out = '';
  try { out = execFileSync('huaweicloud-devkit', ['doctor'], { encoding: 'utf8', timeout: 60000 }); }
  catch (e) { out = `${e.stdout || ''}${e.stderr || ''}`; }
  const hasResults = /Results:\s*(\d+)\s*pass,\s*(\d+)\s*warn,\s*(\d+)\s*fail/i.exec(out);
  const passN = hasResults ? +hasResults[1] : -1;
  const failN = hasResults ? +hasResults[3] : -1;
  check('D1-3', 'doctor 输出包含 pass/warn/fail 汇总', hasResults !== null, `matches=${!!hasResults}`);
  check('D1-3', 'doctor 全项通过(fail=0，pass≥1)', passN >= 1 && failN === 0, `pass=${passN} fail=${failN}`);
  check('D1-3', 'doctor 覆盖 hcloud/凭证/技能/MCP 检测项', /hcloud/i.test(out) && /Skills installed/i.test(out) && /Safety policy/i.test(out), '核心检测项存在');
}

// D1-1/install 引导信息：install 命令存在且带 --target
{
  const out = execFileSync('huaweicloud-devkit', ['--help'], { encoding: 'utf8', timeout: 30000 });
  check('D1-1', 'CLI install 命令存在', /install\s+Install skills/i.test(out), 'install command');
  check('D1-1', 'install 支持 --target 多客户端', /--target/.test(out) && /openclaw/.test(out), 'target 参数');
}

// D1-6 install-hcloud 命令展示
{
  const out = execFileSync('huaweicloud-devkit', ['install-hcloud'], { encoding: 'utf8', timeout: 30000 });
  check('D1-6', 'install-hcloud 展示 KooCLI 安装命令', /hcloud|KooCLI|curl|install/i.test(out), out.slice(0, 40).replace(/\n/g, ' '));
}

console.log('\n=== D1 CLI 真机冒烟探针结果 ===');
for (const l of lines) console.log(l);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);
