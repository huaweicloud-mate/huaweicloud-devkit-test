#!/usr/bin/env node
// D1 安装域只读命令探针：doctor(D1-3) / status、version(D1-4) / install-hcloud(D1-6)
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SETUP = 'C:/Users/Administrator/devkit-test/hdk/bin/setup.cjs';
const HOME = mkdtempSync(join(tmpdir(), 'd1-'));

function run(args) {
  const r = spawnSync(process.execPath, [SETUP, ...args], { env: { ...process.env, HOME: HOME, HUAWEICLOUD_HOME: HOME }, encoding: 'utf8', timeout: 60000 });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || ''), stdout: r.stdout || '' };
}
let pass = 0, fail = 0;
function check(n, c, d = '') { if (c) { pass++; console.log(`PASS  ${n}${d ? ' | ' + d : ''}`); } else { fail++; console.log(`FAIL  ${n}${d ? ' | ' + d : ''}`); } }

// D1-3 doctor 健康自检（干净环境）
const doc = run(['doctor']);
check('D1-3 doctor 命令可执行(exit 0 或 1)', doc.code === 0 || doc.code === 1, `exit=${doc.code}`);
check('D1-3 doctor 输出含 hcloud/MCP/skills 检查项', /hcloud|MCP|skill|auth/i.test(doc.out), doc.out.slice(0, 100).replace(/\n/g, ' '));

// D1-4 status
const st = run(['status']);
check('D1-4 status 可执行', st.code === 0 || st.code === 1, `exit=${st.code}`);

// D1-4 version（打印 CLI 版本 + agent 插件版本）
const ver = run(['version']);
check('D1-4 version 输出含 v1.1.4-next.2', /1\.1\.4-next\.2/.test(ver.out), ver.out.slice(0, 80).replace(/\n/g, ' '));

// D1-6 install-hcloud（只读展示 KooCLI 安装命令）
const ih = run(['install-hcloud']);
check('D1-6 install-hcloud 只读展示安装命令', ih.code === 0 && /curl|install|下载|yum|apt/i.test(ih.out), ih.out.slice(0, 80).replace(/\n/g, ' '));

console.log(`\n=== D1 只读命令汇总: ${pass} PASS / ${fail} FAIL ===`);
rmSync(HOME, { recursive: true, force: true });
process.exit(fail === 0 ? 0 : 1);