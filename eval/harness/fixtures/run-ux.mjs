// run-ux.mjs：UX 体验用例（D11）夹具批量运行器
//
// 与 run-all.mjs 的差别（三条）：
//   1. **自动发现** `d11-*.mjs` —— 新增 D11 夹具无需改清单；
//   2. **内置宿主隔离** —— 为每个夹具创建空 HOME/USERPROFILE 再运行，
//      杜绝真实凭证(~/.config/huaweicloud)、KooCLI(~/.hcloud)、码道(~/.codeartsdoer)
//      污染"未登录态"（体验用例的可判定性前提）；
//   3. **需求验收退出码语义** —— 区别于"harness 坏了"：
//        exit 0 = 全部通过（需求已实现）
//        exit 1 = NOT_IMPLEMENTED（存在需求验收未达标，属**已知缺口**，非 harness 故障）
//        exit 2 = BLOCKED（宿主/环境不满足，结果不可判定）
//
// 用法: node eval/harness/fixtures/run-ux.mjs [hdk src] [--evid <dir>]
//       hdk src 可省略 —— 依次尝试 env HUAWEICLOUD_DEVKIT_HOME / HDK_PATH / sibling ../hdk
// CI 口径：实现到位前以 continue-on-error 记录趋势（同 replay-trend），到位后提升为硬门禁。
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');

function resolveHdkSrc() {
  const srcOf = (root) => join(root, 'plugins', 'huaweicloud-core', 'src');
  for (const key of ['HUAWEICLOUD_DEVKIT_HOME', 'HDK_PATH']) {
    const val = process.env[key];
    if (val && existsSync(join(srcOf(val), 'tools.mjs'))) return { src: srcOf(val), tag: `env ${key}` };
  }
  const sibling = join(REPO_ROOT, '..', 'hdk');
  if (existsSync(join(srcOf(sibling), 'tools.mjs'))) return { src: srcOf(sibling), tag: 'sibling ../hdk' };
  return null;
}

const argv = process.argv.slice(2);
const evidIdx = argv.indexOf('--evid');
const EVID = evidIdx > -1 ? argv[evidIdx + 1] : null;
const positional = argv.filter((a, i) => !a.startsWith('--') && (evidIdx === -1 || i !== evidIdx + 1));
let hdkSrc = positional[0];
let hdkTag = 'argv';
if (!hdkSrc) {
  const r = resolveHdkSrc();
  if (!r) {
    console.error('无法定位 hdk 源码：传 <hdk src> 或设 HUAWEICLOUD_DEVKIT_HOME / HDK_PATH，或将 hdk clone 到测试仓父目录。');
    process.exit(2);
  }
  hdkSrc = r.src;
  hdkTag = r.tag;
}

const fixtures = readdirSync(__dirname).filter((f) => /^d11-.*\.mjs$/.test(f)).sort();
if (fixtures.length === 0) {
  console.error('[UX] 未发现 d11-*.mjs 夹具');
  process.exit(2);
}

// 隔离宿主：**每个夹具一个全新空 HOME**（不碰真实宿主）。
// 之所以逐夹具重建而非共用一个：夹具可能写入 S1 凭证（如 D11-41 的占位符遮蔽场景），
// 共用 HOME 会让后续夹具的前置门误判「宿主受污染」→ 夹具顺序相关的假 BLOCKED。
console.log(`[UX] hdk src = ${hdkSrc}  (${hdkTag})`);
console.log(`[UX] 隔离宿主: 每个夹具独立空 HOME/USERPROFILE（位于 ${tmpdir()}）`);
console.log(`[UX] 待运行夹具 ${fixtures.length} 个: ${fixtures.join(', ')}`);

const summary = [];
for (const f of fixtures) {
  const isoHome = mkdtempSync(join(tmpdir(), 'ux-home-'));
  const args = [join(__dirname, f), hdkSrc];
  if (EVID) args.push('--evid', EVID);
  const env = { ...process.env, HOME: isoHome, USERPROFILE: isoHome, HUAWEICLOUD_HOME: isoHome };
  const code = await new Promise((resolve) => {
    const p = spawn(process.execPath, args, { stdio: ['inherit', 'inherit', 'inherit'], env });
    p.on('close', resolve);
  });
  rmSync(isoHome, { recursive: true, force: true });
  summary.push([f, code]);
  console.log(`\n>>> ${f} exit=${code}  ===\n`);
}

console.log('===== UX 体验用例（D11）汇总 =====');
let pass = 0, notImpl = 0, blocked = 0;
for (const [f, code] of summary) {
  const tag = code === 0 ? 'PASS' : code === 2 ? 'BLOCKED(ENV)' : 'NOT_IMPLEMENTED';
  if (code === 0) pass++;
  else if (code === 2) blocked++;
  else notImpl++;
  console.log(`${tag.padEnd(16)} ${f} (exit=${code})`);
}
console.log(`\n总计: pass=${pass} not_implemented=${notImpl} blocked=${blocked} / 共 ${fixtures.length}`);
console.log('口径: NOT_IMPLEMENTED = 需求验收未达标（已知缺口，非 harness 故障）；BLOCKED = 宿主/环境不满足');
const exitCode = notImpl > 0 ? 1 : blocked > 0 ? 2 : 0;
console.log(`RESULT: ${exitCode === 0 ? 'PASS' : exitCode === 2 ? 'BLOCKED' : 'NOT_IMPLEMENTED'}`);
process.exit(exitCode);
