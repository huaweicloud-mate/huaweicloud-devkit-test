// run-all.mjs：批量运行 Issue #7 批次②+③ 全部夹具/harness
// 用法: node eval/harness/fixtures/run-all.mjs <hdk src> [--evid <dir>]
//
// 注意：UX 体验用例（D11，d11-*.mjs）**不列入本清单** —— 它们是「需求验收」口径，
// 未实现时期望 exit 1（NOT_IMPLEMENTED），混入本清单会让 run-all 长期恒红、丧失门禁意义。
// 请改用专用运行器：`npm run test:ux`（自动发现 d11-*.mjs + 内置宿主隔离 + 三态退出码）。
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const hdkSrc = process.argv[2];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;
if (!hdkSrc) {
  console.error('用法: node eval/harness/fixtures/run-all.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const FIXTURES = [
  // 批次② P1
  'd2-10-koocli-profile.mjs',
  'd2-13-s1-env.mjs',
  'd9-9-delay-timeout.mjs',
  'd9-10-remote-transport.mjs',
  'd9-11-ws-tunnel.mjs',
  'd9-6-cross-client.mjs',
  'exp-d5-2-1-codex-discovery.mjs',
  'exp-d5-2-3-codex-tools-enum.mjs',
  // 批次③ P2
  'd1-66-telemetry-env.mjs',
  'd1-69-cli-help.mjs',
  'd2-27-koocli-version.mjs',
  'd3-c14-sandbox-hwlink-cred.mjs',
  'd4-12-supply-chain.mjs',
  'd4-29-classify-assert.mjs',
  'd8-10-mcp-config-backup-merge.mjs',
  // Issue #16 Track A（mock 层 + 生命周期/互通夹具）
  'd9-11-ws-tunnel-lifecycle.mjs',
  'd9-6-cross-client-interop.mjs',
  'd3-c14-sandbox-cred-mock.mjs',
  // Issue #22（10 项测试侧改进项：6 新建 + 4 回填）
  'd1-40-mirror-lag.mjs',
  'd4-18-confirm-not-deny.mjs',
  'd4-19-preflight-in-confirm.mjs',
  'd8-7-retrieve-skill.mjs',
  'd9-13-credential-leak.mjs',
  'env-var-coverage.mjs',
];

const summary = [];
// 不需要 hdkSrc 参数的夹具（纯 mock 层测试）
const NO_HDKSRC = new Set(['d9-11-ws-tunnel-lifecycle.mjs']);
for (const f of FIXTURES) {
  const args = [join(__dirname, f)];
  if (!NO_HDKSRC.has(f)) args.push(hdkSrc);
  if (EVID) args.push('--evid', EVID);
  const code = await new Promise((resolve) => {
    const p = spawn(process.execPath, args, { stdio: ['inherit', 'inherit', 'inherit'] });
    p.on('close', resolve);
  });
  summary.push([f, code]);
  console.log(`\n>>> ${f} exit=${code}  ===\n`);
}

console.log('\n===== 汇总 =====');
let pass = 0, fail = 0, blocked = 0;
for (const [f, code] of summary) {
  if (code === 0) {
    pass++;
    console.log(`OK   ${f} (exit=0)`);
  } else if (code === 2) {
    blocked++;
    console.log(`BLK  ${f} (exit=${code})`);
  } else {
    fail++;
    console.log(`ERR  ${f} (exit=${code})`);
  }
}
console.log(`\n总计: pass=${pass} fail=${fail} blocked=${blocked}`);
const exitCode = fail > 0 ? 1 : (blocked > 0 ? 2 : 0);
console.log(`RESULT: ${exitCode === 0 ? 'PASS' : exitCode === 2 ? 'BLOCKED' : 'FAIL'}`);
process.exit(exitCode);