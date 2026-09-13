#!/usr/bin/env node
// 补充探针：Hermes 客户端矩阵展开级用例（EXP-D5-8-1/8-3 + EXP-NR3-04）
// 输出 @@CASE <id>@@ ... @@END@@ 供 split_evidence.py 拆分。
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const SRC = '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const tools = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
const update = await import(pathToFileURL(join(SRC, 'update-check.mjs')).href);

function log(id, cond, detail) { console.log(`${cond ? 'PASS' : 'FAIL'}  ${id}  ${detail}`); }

console.log('@@CASE EXP-D5-8-1@@');
{
  // Hermes 客户端清单发现加载（源 D5-1）
  const integ = '/home/testbot3/nodejs/lib/node_modules/huaweicloud-devkit/integrations';
  let hermesManifest = false, name = '';
  try {
    const p = join(integ, 'hermes', 'manifest.yaml');
    if (existsSync(p)) {
      const m = readFileSync(p, 'utf8');
      hermesManifest = true;
      const nm = m.match(/name:\s*(\S+)/);
      name = nm ? nm[1] : '';
    }
  } catch (e) {}
  log('EXP-D5-8-1', hermesManifest, `Hermes manifest 已发现（integrations/hermes/manifest.yaml 存在，name=${name}）`);
}
console.log('@@END@@');

console.log('@@CASE EXP-D5-8-3@@');
{
  // Hermes 客户端工具全量枚举（源 D5-3）
  const n = tools.TOOL_DEFINITIONS.length;
  log('EXP-D5-8-3', n === 39, `39 工具枚举（预期 39，实际 ${n}）`);
}
console.log('@@END@@');

console.log('@@CASE EXP-NR3-04@@');
{
  // Linux OS_MATRIX dismiss 真实闭环（源 D1-42）
  const file = join(tmpdir(), 'hdk-exp-nr3-04.json');
  const state = update.writeSkipState(file, '1.1.3', { at: Date.now(), days: 3 });
  const j1 = update.judgeUpdate('1.1.2', { latest: '1.1.3' }, state, Date.now());
  const back = update.readSkipState(file);
  const j2 = update.judgeUpdate('1.1.2', { latest: '1.1.3' }, back, Date.now());
  log('EXP-NR3-04', j1.result === 'dismissed' && j2.result === 'dismissed' && back.dismissedVersion === '1.1.3',
    `dismiss 闭环跨调用持久化 => j1=${j1.result} j2=${j2.result} back.version=${back.dismissedVersion}`);
  rmSync(file, { force: true });
}
console.log('@@END@@');

console.log('\n===== EXP 补充汇总结束 =====');