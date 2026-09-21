// run-all.mjs：批量运行 Issue #7 批次② 全部夹具/harness
// 用法: node eval/harness/fixtures/run-all.mjs <hdk src> [--evid <dir>]
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
  'd2-10-koocli-profile.mjs',
  'd2-13-s1-env.mjs',
  'd9-9-delay-timeout.mjs',
  'd9-10-remote-transport.mjs',
  'd9-11-ws-tunnel.mjs',
  'd9-6-cross-client.mjs',
  'exp-d5-2-1-codex-discovery.mjs',
  'exp-d5-2-3-codex-tools-enum.mjs',
];

const summary = [];
for (const f of FIXTURES) {
  const args = [join(__dirname, f), hdkSrc];
  if (EVID) args.push('--evid', EVID);
  const code = await new Promise((resolve) => {
    const p = spawn(process.execPath, args, { stdio: ['inherit', 'inherit', 'inherit'] });
    p.on('close', resolve);
  });
  summary.push([f, code]);
  console.log(`\n>>> ${f} exit=${code}  ===\n`);
}

console.log('\n===== 汇总 =====');
let blocked = 0, pass = 0, fail = 0;
for (const [f, code] of summary) {
  console.log(`${code === 0 ? 'OK ' : 'ERR'}  ${f} (exit=${code})`);
}
process.exit(0);