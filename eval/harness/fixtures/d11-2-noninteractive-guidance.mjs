// D11-2 未登录·非交互会话引导（P1）—— 可执行载体
//
// 判据（CSV::预期结果）：
//   exitCode==1 且 stderr 同时含 "creds-import.json" 与 "huaweicloud_auth_switch"
//   且提示文本含中文字符 且不含 "Non-interactive session detected." 英文原文
//
// 做法：spawn 目标源码的 CLI（`node <hdk src>/setup-cli.mjs auth init`），stdio 走管道
// （非 TTY）→ 命中非交互分支；HOME/HUAWEICLOUD_HOME 指向空目录，不碰真实凭证。
// 口径：需求验收（UX-R1 未登录引导的 CLI 侧）。实现前预期 FAIL。
// 用法: node d11-2-noninteractive-guidance.mjs <hdk src> [--evid <dir>]
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { blocked, contaminatedHost, finish, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-2';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-2-noninteractive-guidance.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const contam = contaminatedHost();
console.log(`[HOST] ${contam.length ? 'CONTAMINATED' : 'CLEAN'}${contam.length ? ' :: ' + contam.join(', ') : ''}`);
if (contam.length) blocked(CASE_ID, `宿主未隔离：${contam.join(', ')}`, evid);

const tmp = join(tmpdir(), `d11-2-${Date.now()}`);
mkdirSync(tmp, { recursive: true });

const env = { ...process.env, HUAWEICLOUD_HOME: tmp };
for (const k of ['HW_ACCESS_KEY', 'HW_SECRET_KEY', 'HW_SECURITY_TOKEN', 'HW_REGION', 'HUAWEICLOUD_REGION']) {
  delete env[k];
}

const cli = join(hdkSrc, 'setup-cli.mjs');
const r = await new Promise((resolve) => {
  const p = spawn(process.execPath, [cli, 'auth', 'init'], { env, stdio: ['pipe', 'pipe', 'pipe'] });
  let out = '';
  let errOut = '';
  p.stdout.on('data', (d) => { out += d.toString(); });
  p.stderr.on('data', (d) => { errOut += d.toString(); });
  p.on('close', (code) => resolve({ code, out, errOut }));
  p.stdin.end();
});

const all = `${r.out}\n${r.errOut}`;
const ZH = /[\u4e00-\u9fff]/;
const strip = (s) => s.replace(/\u001b\[[0-9;]*m/g, '').replace(/\s+/g, ' ').trim();

rec('D11-2-exit', '非交互会话下退出码为 1', r.code === 1, r.code, 1);
rec('D11-2-mention-import', '提示含 creds-import.json（给 Agent 的导入通道）',
  all.includes('creds-import.json'), strip(all).slice(0, 160), '含 creds-import.json');
rec('D11-2-mention-switch', '提示含 huaweicloud_auth_switch（会话内切换工具名）',
  all.includes('huaweicloud_auth_switch'), all.includes('huaweicloud_auth_switch') ? 'present' : 'missing',
  '含 huaweicloud_auth_switch');
rec('D11-2-zh', '提示文本含中文字符（面向用户可读）', ZH.test(strip(all)), strip(all).slice(0, 120), '含中文字符');
rec('D11-2-no-en', '不出现英文原文 "Non-interactive session detected."（反断言）',
  !all.includes('Non-interactive session detected.'), strip(all).slice(0, 120),
  '不含该英文整句');

rmSync(tmp, { recursive: true, force: true });
finish(CASE_ID, evid, '口径: 需求验收（UX-R1 CLI 侧）；FAIL = 需求未实现，非 harness 问题');
