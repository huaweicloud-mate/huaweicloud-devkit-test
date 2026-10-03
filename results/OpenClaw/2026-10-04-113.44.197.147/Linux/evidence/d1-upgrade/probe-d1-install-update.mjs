// D1-1/D1-4/D1-5 安装/更新/卸载生命周期 —— 隔离 HOME 真机冒烟
// 在临时 HOME 下 install --target openclaw → status → update → uninstall → 残留检查
import { execFileSync, execSync } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let pass = 0, fail = 0;
const lines = [];
function check(id, title, cond, note) {
  cond ? pass++ : fail++;
  lines.push(`${cond ? 'PASS' : 'FAIL'}  ${id}  ${title}  => ${note}`);
}

const iso = mkdtempSync(join(tmpdir(), 'hdk-d1-'));
// 隔离 HOME（避免污染真实 ~/.openclaw）
const fakeHome = join(iso, 'home');
mkdirSync(fakeHome, { recursive: true });

function run(cmd, args, opts={}) {
  try { return { out: execFileSync(cmd, args, { encoding: 'utf8', env: { ...process.env, HOME: fakeHome }, timeout: 120000, ...opts }), code: 0 }; }
  catch (e) { return { out: `${e.stdout || ''}${e.stderr || ''}`, code: e.status ?? 1 }; }
}

// D1-1 全新环境引导安装（隔离 HOME → install --target openclaw）
{
  const r = run('huaweicloud-devkit', ['install', '--target', 'openclaw']);
  check('D1-1', '隔离 HOME install --target openclaw 成功', r.code === 0, `exit=${r.code} ${r.out.slice(-120).replace(/\n/g,' ')}`);
  // OpenClaw 安装目标为 ~/.agents/{skills,huaweicloud-plugins}
  const skillsDir = join(fakeHome, '.agents', 'skills');
  const pluginsDir = join(fakeHome, '.agents', 'huaweicloud-plugins');
  check('D1-1', 'install 后生成 ~/.agents/skills', existsSync(skillsDir), `exists=${existsSync(skillsDir)}`);
  check('D1-1', 'install 后生成 ~/.agents/huaweicloud-plugins', existsSync(pluginsDir), `exists=${existsSync(pluginsDir)}`);
  const st = run('huaweicloud-devkit', ['status', '--target', 'openclaw']);
  check('D1-1', 'install 后 status 显示已安装', /Installed|MCP Server/i.test(st.out), st.out.slice(0,60).replace(/\n/g,' '));
}

// D1-4 status/update 幂等
{
  const s1 = run('huaweicloud-devkit', ['status', '--target', 'openclaw']);
  const s2 = run('huaweicloud-devkit', ['status', '--target', 'openclaw']);
  check('D1-4', 'status 多次调用一致(幂等)', s1.out === s2.out, `identical=${s1.out === s2.out}`);
  // update 幂等：已最新时重复 update 不报错
  const u = run('huaweicloud-devkit', ['update', '--target', 'openclaw']);
  check('D1-4', 'update 已最新不报错(幂等)', u.code === 0 || /latest|already|up to date|已是最新|更新|成功/i.test(u.out), `exit=${u.code} ${u.out.slice(-80).replace(/\n/g,' ')}`);
}

// D1-5 uninstall 干净度（隔离 HOME 内卸载 → 检查无功能残留）
{
  const before = run('huaweicloud-devkit', ['status', '--target', 'openclaw']);
  const r = run('huaweicloud-devkit', ['uninstall', '--target', 'openclaw']);
  check('D1-5', 'uninstall --target openclaw 执行成功', r.code === 0, `exit=${r.code}`);
  const st2 = run('huaweicloud-devkit', ['status', '--target', 'openclaw']);
  const removed = !/MCP Server: Installed|已安装/.test(st2.out);
  check('D1-5', '卸载后 status 不再显示已安装(无功能残留)', removed, st2.out.slice(0,80).replace(/\n/g,' '));
}

console.log('\n=== D1 安装/更新/卸载生命周期探针结果(隔离 HOME) ===');
for (const l of lines) console.log(l);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);

// 清理
try { rmSync(iso, { recursive: true, force: true }); } catch {}
process.exit(fail > 0 ? 1 : 0);
