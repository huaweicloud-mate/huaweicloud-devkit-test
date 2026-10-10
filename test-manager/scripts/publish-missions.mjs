// publish-missions.mjs — 维护者一键发布 AI Test Manager 使命到 test-cases/missions/ 并提交。
//
// 用法:
//   node test-manager/scripts/publish-missions.mjs [--diff <range>]
//
// 前置: 已由 `node test-manager/run-plan.mjs` 生成 test-cases/missions/*.yaml（或本脚本内部生成）。
// 行为:
//   1. 若 test-cases/missions/ 不含 .yaml 则先生成（走默认 git diff main..HEAD）
//   2. git add test-cases/missions test-cases/test-strategy.md
//   3. 无变化则提示退出；有变化则 commit（消息含风险等级）+ push
// 机群各客户端 prepare_env --update 即拉到使命，init_day 自动摄入 → 广播完成。
import { execSync } from 'node:child_process';
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MISSION_DIR = join(__dirname, '..', '..', 'test-cases', 'missions');
const STRATEGY_PATH = join(__dirname, '..', '..', 'test-cases', 'test-strategy.md');

function sh(cmd, allowFail = false) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    if (allowFail) return '';
    throw e;
  }
}

// 1. 使命目录是否已有产出
const yamls = existsSync(MISSION_DIR) ? readdirSync(MISSION_DIR).filter((f) => f.endsWith('.yaml')) : [];
if (yamls.length === 0) {
  console.log('[publish] test-cases/missions/ 为空，先调用 run-plan.mjs 生成…');
  const diffArg = process.argv.indexOf('--diff') >= 0 ? ` --diff ${process.argv[process.argv.indexOf('--diff') + 1]}` : '';
  sh(`node test-manager/run-plan.mjs${diffArg}`);
}

const risk = /风险等级: \*\*(high|medium|low)\*\*/.exec(existsSync(STRATEGY_PATH) ? readFileSync(STRATEGY_PATH, 'utf-8') : '')?.[1] || 'unknown';

// 2. git add + 检查变更
sh(`git add test-cases/missions test-cases/test-strategy.md`, true);
const changed = sh(`git status --short -- test-cases/missions test-cases/test-strategy.md`, true);
if (!changed) {
  console.log('[publish] 无待提交的使命变更（可能已是最新）');
  process.exit(0);
}
console.log('[publish] 待提交:\n' + changed);

// 3. commit + push
const n = yamls.filter((f) => f.endsWith('.yaml')).length;
const msg = `test(ai-manager): publish test-strategy (risk=${risk}) + missions to test-cases/missions/`;
sh(`git commit -m "${msg}"`);
console.log('[publish] commit 完成');
sh(`git push origin main`);
console.log('[publish] 已推送，机群 prepare_env --update 后自动摄入使命');