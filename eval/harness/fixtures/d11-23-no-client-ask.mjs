// D11-23 未检测到客户端时的交互询问可读性（P2）—— 可执行载体（各客户端环境）
//
// 判据（CSV::预期结果）：TTY 询问文案为中文且含三条可选路径（指定 target / 全部安装 / 通用 MCP 接入）与支持列表；
//   non-TTY 以中文报错并列出全部 --target 取值。
//
// 本载体覆盖可判定的 non-TTY 侧（TTY 询问文案需真机交互捕获，由真机批次补证，见头注结尾）：
//   spawn `install`（无 --target，非 TTY，隔离 HOME）→ 不产生安装副作用，只读报错文案。
// 用法: node d11-23-no-client-ask.mjs <hdk src> [--evid <dir>]
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { finish, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-23';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-23-no-client-ask.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const iso = isolateHome('d11-23');
const cli = join(hdkSrc, 'setup-cli.mjs');
const out = await new Promise((resolve) => {
  const p = spawn(process.execPath, [cli, 'install'], { env: { ...process.env, HOME: iso.dir, USERPROFILE: iso.dir, HUAWEICLOUD_HOME: iso.dir }, stdio: ['pipe', 'pipe', 'pipe'] });
  let s = '';
  p.stdout.on('data', (d) => { s += d.toString(); });
  p.stderr.on('data', (d) => { s += d.toString(); });
  p.on('close', (code) => resolve({ code, text: s.replace(/\u001b\[[0-9;]*m/g, '') }));
  p.stdin.end();
});

// 支持的 target 取值真源：从源码里抽取（install --target 的候选）
const src = readFileSync(cli, 'utf8');
const targetSet = [...new Set((src.match(/'(codex-desktop|codex|hermes|officeace|codearts[a-z-]*|opencode|dsh|all)'/g) || []).map((s) => s.replace(/'/g, '')))];
const listed = targetSet.filter((t) => out.text.includes(t));

const ZH = /[\u4e00-\u9fff]/;
rec('D11-23-nontty-zh', 'non-TTY 报错为中文', ZH.test(out.text),
  out.text.split(/\r?\n/).find((l) => /target|非交互|Cannot prompt|Multiple agents/.test(l))?.trim().slice(0, 130) || out.text.slice(0, 130),
  '含中文字符');
rec('D11-23-lists-targets', 'non-TTY 报错列出全部 --target 取值（而非只给一个示例）',
  targetSet.length > 0 && listed.length === targetSet.length,
  { 源码候选: targetSet, 报错中列出: listed }, `列出全部 ${targetSet.length} 个取值`);
rec('D11-23-three-paths-zh', '提供三条可选路径的中文说明（指定 target / 全部安装 / 通用 MCP 接入）',
  ZH.test(out.text) && /指定|全部安装|通用/.test(out.text) && /target|MCP/i.test(out.text),
  out.text.split(/\r?\n/).filter((l) => /1\)|2\)|3\)|target|MCP/.test(l)).slice(0, 3).map((l) => l.trim().slice(0, 70)),
  '三条路径且中文');
rec('D11-23-no-en-only', '不以英文整句作为唯一报错（反断言）',
  !/Cannot prompt in a non-interactive shell/.test(out.text) || ZH.test(out.text),
  { 英文原文存在: /Cannot prompt in a non-interactive shell/.test(out.text) }, '英文原文不得是唯一提示');

iso.restore();
finish(CASE_ID, evid,
  '口径: 需求验收（UX-R8）；本载体覆盖 non-TTY 侧；TTY 询问文案需真机交互捕获（真机批次补证）');
