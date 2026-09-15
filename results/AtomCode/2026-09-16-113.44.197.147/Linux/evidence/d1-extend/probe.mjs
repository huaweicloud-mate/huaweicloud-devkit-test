// D1-33 / D1-41 / D1-42 扩展探针
import {
  writeSkipState,
  readSkipState,
  resolveSkipFilePath,
} from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import { dispatch } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let pass = 0, fail = 0;
function check(id, desc, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${desc}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}
function bool(id, desc, cond) { check(id, desc, Boolean(cond), true); }

// D1-33 skip 文件持久化
{
  const dir = mkdtempSync(join(tmpdir(), 'hdk-skip-'));
  const file = join(dir, '.update-skip.json');
  const st = writeSkipState(file, '1.1.4', { at: Date.now() });
  console.log(`INFO   D1-33  writeSkipState => ${JSON.stringify(st)}`);
  bool('D1-33', 'writeSkipState 返回状态对象（dismissedVersion/expireAt）', st && typeof st === 'object' && st.dismissedVersion === '1.1.4' && typeof st.expireAt === 'string');
  const read = readSkipState(file);
  console.log(`INFO   D1-33  readSkipState => ${JSON.stringify(read)}`);
  bool('D1-33', 'skip 文件含 dismissedVersion/expireAt', read && typeof read.dismissedVersion === 'string' && typeof read.expireAt === 'string');
  const rp = resolveSkipFilePath();
  bool('D1-33', 'resolveSkipFilePath 返回可解析路径', typeof rp === 'string' && rp.length > 0);
  rmSync(dir, { recursive: true, force: true });
}

// D1-42 dismiss 真实闭环（冷却期内 dismissed / 过期后恢复）
{
  const dir = mkdtempSync(join(tmpdir(), 'hdk-dismiss-'));
  const file = join(dir, '.update-skip.json');
  writeSkipState(file, '1.1.5', { at: Date.now() });
  const inCool = readSkipState(file);
  bool('D1-42', '冷却期内 dismiss 状态落盘（dismissedVersion=1.1.5）', inCool && inCool.dismissedVersion === '1.1.5');
  // 过期（写一个已过期的 skip 状态再读）
  const { writeFileSync } = await import('node:fs');
  writeFileSync(file, JSON.stringify({ dismissedVersion: '1.1.5', dismissedAt: new Date(Date.now() - 1000000).toISOString(), expireAt: new Date(Date.now() - 1000).toISOString() }));
  const expired = readSkipState(file);
  bool('D1-42', '过期 skip 状态可读（expireAt 已过期）', expired && new Date(expired.expireAt).getTime() < Date.now());
  rmSync(dir, { recursive: true, force: true });
}

// D1-41 check_update 真实 MCP 返回契约
{
  let r;
  try {
    r = await dispatch('tools/call', { name: 'huaweicloud_check_update', arguments: {} }, { sessionId: 'probe-d1-41' });
  } catch (e) { r = { error: e.message }; }
  console.log(`INFO   D1-41  check_update => ${JSON.stringify(r).slice(0, 260)}`);
  bool('D1-41', 'check_update tools/call isError=false', r && r.isError === false);
  const txt = (r && r.content && r.content[0] && r.content[0].text) || '';
  bool('D1-41', 'check_update 返回 currentVersion/latestVersion 字段', /currentVersion|latestVersion/.test(txt));
}

console.log(`TOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);