// AI生成
// D1-30: semver比对正确性 (降级检测)
// Test semverCompare with multiple inputs: equal/reverse/release>pre/invalid
import { semverCompare, semverParse } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

try {
  const tests = [];
  
  // 1. 1.1.2 > 1.1.1
  const t1 = semverCompare('1.1.2', '1.1.1');
  tests.push({ name: '1.1.2 > 1.1.1', expected: 1, actual: t1, pass: t1 > 0 });
  
  // 2. 1.1.0 > 1.1.0-next.9 (release > prerelease)
  const t2 = semverCompare('1.1.0', '1.1.0-next.9');
  tests.push({ name: '1.1.0 > 1.1.0-next.9', expected: 1, actual: t2, pass: t2 > 0 });
  
  // 3. equal = 0
  const t3 = semverCompare('1.1.2', '1.1.2');
  tests.push({ name: '1.1.2 == 1.1.2', expected: 0, actual: t3, pass: t3 === 0 });
  
  // 4. reverse: 1.1.1 < 1.1.2
  const t4 = semverCompare('1.1.1', '1.1.2');
  tests.push({ name: '1.1.1 < 1.1.2', expected: -1, actual: t4, pass: t4 < 0 });
  
  // 5. invalid string - lexical fallback
  const t5 = semverCompare('invalid', '1.0.0');
  tests.push({ name: 'invalid vs 1.0.0 (lexical)', actual: t5, pass: typeof t5 === 'number' });
  
  // 6. semverParse valid
  const p1 = semverParse('1.2.3');
  tests.push({ name: 'parse 1.2.3', actual: JSON.stringify(p1), pass: p1 && p1.major === 1 && p1.minor === 2 && p1.patch === 3 });
  
  // 7. semverParse prerelease
  const p2 = semverParse('1.2.3-beta.1');
  tests.push({ name: 'parse 1.2.3-beta.1', actual: JSON.stringify(p2), pass: p2 && p2.pre && p2.pre.length > 0 });
  
  // 8. semverParse invalid
  const p3 = semverParse('not-a-version');
  tests.push({ name: 'parse invalid', actual: JSON.stringify(p3), pass: p3 === null });
  
  const allPass = tests.every(t => t.pass);
  const status = allPass ? 'PASS' : 'FAIL';
  
  const res = {
    status,
    why: status === 'PASS'
      ? 'semverCompare/semverParse全部测试通过：大小关系、预发布、相等、无效串'
      : `部分测试失败: ${tests.filter(t => !t.pass).map(t => t.name).join(', ')}`,
    executedAt: ts(),
    tests
  };
  
  fs.writeFileSync(path.join(__dirname, 'stdout.log'), JSON.stringify(res, null, 2), 'utf8');
  console.log(JSON.stringify(res, null, 2));
} catch (e) {
  const res = { status: 'FAIL', why: `执行失败: ${e.message}`, executedAt: ts(), error: e.stack };
  fs.writeFileSync(path.join(__dirname, 'stdout.log'), JSON.stringify(res, null, 2), 'utf8');
  console.log(JSON.stringify(res, null, 2));
}
process.exit(0);
