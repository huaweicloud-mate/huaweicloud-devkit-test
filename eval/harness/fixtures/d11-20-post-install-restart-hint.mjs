// D11-20 安装/更新后「需重启会话」会话内提示（P2）—— 可执行载体（各客户端环境）
//
// 判据（CSV::预期结果）：doctor 输出含「本会话未加载插件」或「需重启」判定项且为中文，
//   与 README「安装后重启会话」表述一致。
// 指引来源：cmdDoctor(setup-cli.mjs:3987) + README 安装说明
//
// 做法：隔离 HOME 下 spawn `node <hdk src>/setup-cli.mjs doctor`（非 TTY，不写真实环境），
//   核对「重启会话」类判定项是否中文、是否与 README 表述一致。
// 真机口径：本夹具可在任意装机运行；真机批次覆盖各客户端（不同 CLI 安装形态）。
// 用法: node d11-20-post-install-restart-hint.mjs <hdk src> [--evid <dir>]
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { finish, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-20';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-20-post-install-restart-hint.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const iso = isolateHome('d11-20');
const cli = join(hdkSrc, 'setup-cli.mjs');
const out = await new Promise((resolve) => {
  const p = spawn(process.execPath, [cli, 'doctor'], { env: { ...process.env, HOME: iso.dir, USERPROFILE: iso.dir, HUAWEICLOUD_HOME: iso.dir }, stdio: ['pipe', 'pipe', 'pipe'] });
  let s = '';
  p.stdout.on('data', (d) => { s += d.toString(); });
  p.stderr.on('data', (d) => { s += d.toString(); });
  p.on('close', (code) => resolve({ code, text: s.replace(/\u001b\[[0-9;]*m/g, '') }));
});

const ZH = /[\u4e00-\u9fff]/;
const restartLine = (out.text.split(/\r?\n/).find((l) => /restart|重启|重新加载|本会话/.test(l)) || '').trim();

rec('D11-20-restart-item-zh', 'doctor 给出「需重启会话 / 本会话未加载插件」判定项且为中文',
  ZH.test(restartLine) && /重启|重新加载|未加载/.test(restartLine),
  { 判定行: restartLine.slice(0, 120) || '（未找到该类判定项）' }, '中文「需重启/未加载」判定项');
rec('D11-20-readme-consistent', '与 README「安装后重启会话」表述一致',
  (() => {
    let readme = '';
    for (const cand of ['README.md', '../README.md', '../../README.md']) {
      const p = join(hdkSrc, cand);
      if (existsSync(p)) { readme = readFileSync(p, 'utf8'); break; }
    }
    return /重启(会话|客户端|agent)|restart\s+(the\s+)?session/i.test(readme) && ZH.test(restartLine);
  })(),
  { 判定行: restartLine.slice(0, 90) }, 'README 与 doctor 两侧均以中文表述一致');
rec('D11-20-no-en-only', '不以英文整句作为唯一重启提示（反断言）',
  !/Fix failures above, then restart your session\./.test(out.text) || ZH.test(restartLine),
  { 英文原文存在: /Fix failures above, then restart your session\./.test(out.text) }, '英文原文不得是唯一提示');
rec('D11-20-doctor-ran', 'doctor 可执行（基线对照）', out.code === 0, { exit: out.code }, 0);

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R8 安装后会话提示）；FAIL = 提示未中文化/未与 README 对齐，非 harness 问题');
