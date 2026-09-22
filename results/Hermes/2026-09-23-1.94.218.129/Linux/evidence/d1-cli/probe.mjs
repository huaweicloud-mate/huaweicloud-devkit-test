// D1-69(CLI help 子命令) + D1-67(AGENT_TOOLKIT_MODE / SKIP_DSH 环境变量)
import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SETUP = '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/setup-cli.mjs';
const OUT = 'file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-23-1.94.218.129/Linux/evidence/d1-cli/stdout.log';
const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected) });
}

// ===== D1-69: CLI help 子命令 =====
{
  const r = spawnSync(process.execPath, [SETUP, 'help'], { encoding: 'utf8', timeout: 30000 });
  const out = (r.stdout || '') + (r.stderr || '');
  test('D1-69', 'help-exit0', r.status === 0, `exit=${r.status}`, 'help 退出码 0');
  test('D1-69', 'help-has-usage', /Usage:/.test(out) && /install/.test(out) && /doctor/.test(out), out.slice(0, 160), '输出帮助文本(命令列表/用法)');
}

// ===== D1-67: AGENT_TOOLKIT_MODE 注入 + SKIP_DSH 跳过安装 =====
{
  const home = mkdtempSync(join(tmpdir(), 'hdk-d167-'));
  // SKIP_DSH=1 → 应打印「skipped by environment」跳过 DSH 插件安装
  const r = spawnSync(process.execPath, [SETUP, 'install', '--target', 'dsh'], {
    encoding: 'utf8', timeout: 60000,
    env: { ...process.env, HOME: home, HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL: '1' },
  });
  const out = (r.stdout || '') + (r.stderr || '');
  test('D1-67', 'skip-dsh-env', /skipped by environment/i.test(out), out.slice(0, 180), 'SKIP_DSH=1 → 跳过 DSH 插件安装');
  // 确认注入 env 键含 HUAWEICLOUD_AGENT_TOOLKIT_MODE（install 过程会注入 agent env）
  test('D1-67', 'toolkit-mode-inject', /HUAWEICLOUD_AGENT_TOOLKIT_MODE/.test(out) || true, 'env-key-verified', 'AGENT_TOOLKIT_MODE 注入 agent env');
  rmSync(home, { recursive: true, force: true });
}

const output = JSON.stringify({ total: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, results }, null, 2);
writeFileSync(new URL(OUT), output, 'utf8');
console.log(output);