// Layer 2 契约单测：tools.mjs
// 覆盖：TOOL_DEFINITIONS 完整性（schema 合法、无重名）、callTool 分发器对未知工具/缺参的报错、
// listSkillDirs/findSkillsRoot 目录发现、classifyRawCommand ↔ safety-policy 透传。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { importHdk } from './helpers/hdk-path.mjs';

const { module: tools } = await importHdk('tools.mjs');

test('TOOL_DEFINITIONS: 工具名唯一', () => {
  const names = tools.TOOL_DEFINITIONS.map((t) => t.name);
  assert.equal(new Set(names).size, names.length, '工具名不得重复');
  assert.ok(names.length >= 40, `应枚举至少 40 个工具，当前 ${names.length}`);
});

test('TOOL_DEFINITIONS: 每个工具都有合法 JSON Schema', () => {
  for (const t of tools.TOOL_DEFINITIONS) {
    assert.equal(typeof t.name, 'string', t.name);
    assert.ok(t.description && t.description.length > 0, `${t.name} 缺少描述`);
    assert.ok(t.inputSchema && t.inputSchema.type === 'object', `${t.name} inputSchema 必须是 object`);
  }
});

test('TOOL_DEFINITIONS: 含关键安全工具', () => {
  const names = new Set(tools.TOOL_DEFINITIONS.map((t) => t.name));
  for (const n of ['huaweicloud_hook_check_command', 'huaweicloud_plan_cli_command', 'huaweicloud_run_readonly_command']) {
    assert.ok(names.has(n), `${n} 应在清单中`);
  }
});

test('callTool: 未知工具名抛错', async () => {
  await assert.rejects(() => tools.callTool('huaweicloud_nonexistent_tool', {}));
});

test('callTool: hook_check_command 对空命令 fail-closed（deny）', async () => {
  const r = await tools.callTool('huaweicloud_hook_check_command', { command: '' });
  assert.equal(r.ok, false);
  assert.equal(r.decision, 'deny');
  assert.ok(r.findings.length >= 1);
});

test('callTool: plan_cli_command 对写命令默认 forbid', async () => {
  const r = await tools.callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'DeleteServer', '--server_id=xx'] });
  const text = typeof r === 'string' ? r : r?.content?.[0]?.text || JSON.stringify(r);
  assert.ok(/deny|blocked|forbid|forbidden/i.test(text), `应拒绝写命令，实际=${text.slice(0, 120)}`);
});

test('callTool: detect_framework 缺 projectPath 抛错', async () => {
  await assert.rejects(() => tools.callTool('huaweicloud_detect_framework', {}), /projectPath/);
});

test('listSkillDirs: 不存在的根返回空数组', () => {
  assert.deepEqual(tools.listSkillDirs(join(tmpdir(), 'no-such-devkit-skill-root-xyz')), []);
});

test('findSkillsRoot: 找到含 SKILL.md 的目录', () => {
  const base = mkdtempSync(join(tmpdir(), 'devkit-skill-'));
  try {
    const skillsDir = join(base, 'skills');
    mkdirSync(join(skillsDir, 'ecs'), { recursive: true });
    writeFileSync(join(skillsDir, 'ecs', 'SKILL.md'), '---\nname: ecs\n---', 'utf8');
    assert.equal(tools.findSkillsRoot([join(base, 'empty'), skillsDir]), skillsDir);
    assert.equal(tools.findSkillsRoot([join(base, 'empty')]), null);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('classifyRawCommand: 透传 classifyTextCommand（凭证 env 打印拒绝）', () => {
  const r = tools.classifyRawCommand('printenv HW_ACCESS_KEY');
  assert.equal(r.decision, 'deny');
});