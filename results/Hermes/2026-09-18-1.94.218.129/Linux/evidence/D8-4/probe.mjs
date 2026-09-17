// D8-4 (P1): 引导步骤可机械执行 — 断言 INSTALL.md 随 npm 包发布（可被 install 引导机械执行）。
// 实测：已安装全局包 node_modules/huaweicloud-devkit 缺 INSTALL.md（源码 hdk 有，但未随包发布）。
import { existsSync } from 'node:fs';
import { writeFileSync } from 'node:fs';

const PKG = '/home/testbot3/nodejs/lib/node_modules/huaweicloud-devkit';
const SRC = '/home/testbot3/devkit-test/Hermes/hdk';
const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual), expected: String(expected) });
}

test('D8-4', 'src-has-installmd', existsSync(SRC + '/INSTALL.md'), '源码 hdk/INSTALL.md 存在', '存在');
test('D8-4', 'pkg-has-installmd', existsSync(PKG + '/INSTALL.md'), '已装包 INSTALL.md ' + (existsSync(PKG + '/INSTALL.md') ? '存在' : '缺失'), '随 npm 包发布（存在）');
test('D8-4', 'pkg-has-readme', existsSync(PKG + '/README.md'), '已装包 README.md ' + (existsSync(PKG + '/README.md') ? '存在' : '缺失'), '存在');

const passed = results.filter(r => r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed: results.length - passed, results }, null, 2);
writeFileSync(new URL('file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-18-1.94.218.129/Linux/evidence/D8-4/stdout.log'), output, 'utf8');
console.log(output);