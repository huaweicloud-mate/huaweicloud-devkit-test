// D10-3 路由准确率+混淆矩阵：读取本次 run-eval.mjs 真实执行结果
import { readFileSync, ts } from '../../_runner/lib.mjs';
const p = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/huaweicloud-devkit-test/eval/results/eval-run-20261123212658.csv';
const txt = readFileSync(p, 'utf8');
const rows = txt.trim().split(/\r?\n/).slice(1).map((l) => l.split(','));
const hit = rows.filter((r) => r[r.length - 1] === 'HIT').length;
const miss = rows.filter((r) => r[r.length - 1] === 'MISS').length;
const na = rows.filter((r) => r[r.length - 1] === 'N/A').length;
const rate = hit / (hit + miss);
const matrix = rows.map((r) => ({ id: r[0], expected: r[2], actual: r[3], verdict: r[4] }));
const ok = rate >= 0.9;
console.log(JSON.stringify({ caseId: 'D10-3', status: ok ? 'PASS' : 'FAIL', why: '真实 harness 评测集 15 条：HIT=' + hit + ' MISS=' + miss + ' N/A=' + na + ' 准确率=' + (rate * 100).toFixed(1) + '% (阈值90%)；MISS 可定位=' + matrix.filter((x) => x.verdict === 'MISS').map((x) => x.id + '→' + x.actual.slice(0, 40)).join(';'), executedAt: ts(), result: { source: p, hit, miss, na, rate, matrix } }, null, 2));
