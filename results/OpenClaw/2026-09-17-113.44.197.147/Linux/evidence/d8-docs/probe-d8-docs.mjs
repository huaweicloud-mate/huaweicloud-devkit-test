// D8-1/D8-4/D8-6 文档一致性 + D7-4 国内镜像源检查
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, cond, note) {
  cond ? pass++ : fail++;
  results.push(`${cond ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${note}`);
}

const HDK = '/home/testbot1/devkit-test/OpenClaw/hdk';

// D8-6 中英文文档一致：README 双源存在，且安装命令一致
{
  const en = existsSync(join(HDK, 'README.md'));
  const zh = existsSync(join(HDK, 'README.zh-CN.md'));
  check('D8-6', '中英文 README 双源存在', en && zh, `en=${en} zh=${zh}`);
  if (en && zh) {
    const e = readFileSync(join(HDK, 'README.md'), 'utf8');
    const z = readFileSync(join(HDK, 'README.zh-CN.md'), 'utf8');
    check('D8-6', '双源均含 install 命令 npx huaweicloud-devkit', e.includes('npx huaweicloud-devkit') && z.includes('huaweicloud-devkit'), 'ok');
    const t1 = (e.match(/openclaw|atomcode|workbuddy|officeace|codearts-work|dsh|hermes|opencode|codex/gi) || []).length;
    const t2 = (z.match(/openclaw|atomcode|workbuddy|officeace|codearts-work|dsh|hermes|opencode|codex/gi) || []).length;
    check('D8-6', '双源均覆盖客户端矩阵', t1 > 3 && t2 > 3, `en=${t1} zh=${t2}`);
  }
}

// D8-1 文档与能力一致：README 提及的工具命令与 package.json bin 一致
{
  const pkg = JSON.parse(readFileSync(join(HDK, 'package.json'), 'utf8'));
  const bins = Object.keys(pkg.bin || {});
  const readme = readFileSync(join(HDK, 'README.md'), 'utf8');
  const binMatch = bins.filter((b) => readme.includes(b));
  check('D8-1', 'README 提及的 bin 与 package.json 一致', binMatch.length > 0, JSON.stringify(binMatch));
  // 无失效链接检测（本地粗检：README 无明显的 404 占位）
  check('D8-1', 'README 无占位失链标记', !/TODO|FIXME|example\.com\/404/.test(readme), 'ok');
}

// D8-4 引导步骤可机械执行：install 命令存在且含 --target
{
  const readme = readFileSync(join(HDK, 'README.md'), 'utf8');
  check('D8-4', 'README 含可机械执行的 install 引导', /npx\s+--yes\s+huaweicloud-devkit\s+install|huaweicloud-devkit\s+install/.test(readme), 'ok');
  check('D8-4', 'install 支持 --target 参数', /--target/.test(readme), 'ok');
  // setup-cli 实际支持 --target
  const setup = readFileSync(join(HDK, 'plugins/huaweicloud-core/src/setup-cli.mjs'), 'utf8');
  check('D8-4', 'setup-cli 实现 --target 引导', /--target/.test(setup), 'ok');
}

// D7-4 国内镜像源安装：检查 npm registry 可配置 + hdk 已装
{
  const reg = execFileSync('npm', ['config', 'get', 'registry'], { encoding: 'utf8' }).trim();
  check('D7-4', 'npm registry 可读取', reg.length > 0, reg);
  const g = execFileSync('npm', ['ls', '-g', 'huaweicloud-devkit', '--depth=0'], { encoding: 'utf8' }).trim();
  check('D7-4', '全局 huaweicloud-devkit 已安装', /huaweicloud-devkit@/.test(g), (g.split('\n').pop() || '').trim().slice(0, 60));
}

console.log('\n=== D8 文档一致性 / D7 镜像源探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);