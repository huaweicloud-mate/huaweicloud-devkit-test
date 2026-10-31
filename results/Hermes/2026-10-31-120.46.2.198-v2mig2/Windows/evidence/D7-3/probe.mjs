// D7-3 Windows better-sqlite3缺口 补测探针 (Hermes, v2.0.0 @ fcfe047f)
// 验证: ①Windows跑npm test ②记录失败面 ③better-sqlite3原生模块安装/加载缺口
// 运行前需: cd <hdk>; npm ci; npm run build
// 全量跑: node --experimental-test-module-mocks --test "test/*.test.ts" (已落盘 npm-test-output.txt)
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const HDK = resolve('.');
const results = {};

// [1] better-sqlite3 是否仍在依赖树
const pkg = JSON.parse(readFileSync(resolve(HDK, 'package.json'), 'utf8'));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
results.betterSqlite3InPkg = Object.keys(deps).includes('better-sqlite3');
results.betterSqlite3InNodeModules = existsSync(resolve(HDK, 'node_modules/better-sqlite3'));

// [2] node:sqlite (替代方案) 是否可用
const sqlite = spawnSync('node', ['-e', "const {DatabaseSync}=require('node:sqlite'); const db=new DatabaseSync(':memory:'); db.exec('CREATE TABLE t(a)'); console.log('ok')"], { encoding: 'utf8', timeout: 10000 });
results.nodeSqliteOk = (sqlite.stdout || '').includes('ok');

// [3] npm test 失败面统计 (读已落盘的 npm-test-output.txt)
const testOut = resolve(HDK, 'npm-test-output.txt');
let summary = null;
if (existsSync(testOut)) {
  const txt = readFileSync(testOut, 'utf8');
  const g = (p) => { const m = txt.match(new RegExp('ℹ ' + p + ' (\\d+)')); return m ? Number(m[1]) : null; };
  summary = { tests: g('tests'), pass: g('pass'), fail: g('fail'), skipped: g('skipped') };
  results.npmTestSummary = summary;
  results.nodespawnUnknown = (txt.match(/code: 'UNKNOWN'/g) || []).length;
  results.epermCount = (txt.match(/EPERM/g) || []).length;
  results.cryptoX509Oom = /Assertion failed: \(x509\)/.test(txt);
  results.realAgentWinOutOfScope = /win32 is out of scope for the real-agent layer/.test(txt);
}
results.betterSqlite3Resolved = !results.betterSqlite3InPkg && !results.betterSqlite3InNodeModules && results.nodeSqliteOk;
results.status = (summary && summary.fail === 0) ? 'PASS' : 'FAIL';
results.executedAt = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
console.log(JSON.stringify(results, null, 2));
writeFileSync('d7-3-results.json', JSON.stringify(results, null, 2));