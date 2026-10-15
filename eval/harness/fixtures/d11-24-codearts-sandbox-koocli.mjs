// D11-24 码道沙箱阻断 KooCLI 的指引可读性（P2）—— 可执行载体（码道环境）
//
// 判据（CSV::预期结果）：输出含中文说明「码道沙箱模式阻止 KooCLI 运行」且给出可执行恢复路径
//   （码道外终端安装 / 设置→对话流→智能体→终端命令运行模式→自动运行）；关闭沙箱后 KooCLI 可运行。
//
// 真机口径：本用例只在「码道（CodeArts 桌面/IDE）环境」成立——本载体先探测码道环境，
//   不在码道环境（无 ~/.codeartsdoer / ~/.codeartswork / CODEARTS_* 环境变量）即判 BLOCKED（exit 2，不计 PASS/FAIL），
//   由真机批次在码道客户端（testbot5-win-CodeArtsIDE / CodeArtsSpace 等）执行。
// 用法: node d11-24-codearts-sandbox-koocli.mjs <hdk src> [--evid <dir>]
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { blocked, finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-24';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-24-codearts-sandbox-koocli.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

// 码道环境探测（在隔离 HOME 之前做，否则会把码道目录一起隔离掉）
const isCodeArts =
  ["CODEARTS_AK", "CODEARTS_CLI_AK", "CODEARTS_SK", "CODEARTS_CLI_SK"].some((k) => process.env[k]) ||
  existsSync(join(homedir(), '.codeartsdoer')) ||
  existsSync(join(homedir(), '.codeartswork'));

if (!isCodeArts) {
  blocked(CASE_ID,
    '需码道（CodeArts）环境：未探测到 ~/.codeartsdoer / ~/.codeartswork / CODEARTS_* 变量；'
    + '请由码道客户端机器（如 testbot5-win-CodeArtsIDE）在真机执行本用例',
    evid);
}

const iso = isolateHome('d11-24');
const { callTool } = await importHdk(hdkSrc, 'tools.mjs');
let outText = '';
try {
  const r = await callTool('huaweicloud_check_cli', {});
  outText = JSON.stringify(r ?? {});
} catch (e) {
  outText = String(e?.message ?? e);
}

const ZH = /[\u4e00-\u9fff]/;
rec('D11-24-sandbox-block-zh', '输出含中文说明「码道沙箱模式阻止 KooCLI 运行」',
  ZH.test(outText) && /码道|沙箱/.test(outText) && /阻止|受限|无法运行|不允许/.test(outText),
  outText.slice(0, 150), '中文「码道沙箱阻止 KooCLI」说明');
rec('D11-24-recovery-path', '给出可执行恢复路径（码道外终端安装 / 终端命令运行模式设为自动运行）',
  /码道外|外部终端|终端命令运行模式|自动运行/.test(outText), outText.slice(0, 150), '含恢复路径');
rec('D11-24-actionable', '恢复路径唯一且可执行（非纯说明性文字）',
  /npx huaweicloud-devkit install-hcloud|hcloud|设置/.test(outText), outText.slice(0, 150), '含可执行动作');

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R13 码道环境）；FAIL = 指引未中文/缺恢复路径，非 harness 问题');
