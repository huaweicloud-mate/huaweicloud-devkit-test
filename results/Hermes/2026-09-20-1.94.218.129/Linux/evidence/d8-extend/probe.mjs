// D8-extend: D8-9(安装 ID + sanitizeValue) / D8-10(MCP 配置备份与合并)
import { writeFileSync } from 'node:fs';
import { generateOrRecoverInstallId, sanitizeValue } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/telemetry/telemetry.mjs';
import { mergeCommandStyle, mergeArgsStyle, mergeMcpServersFile, extractUserDelta, applyUserDelta } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-config-merge.mjs';
import { saveAgentDelta, takeAgentDelta, purgeBackup } from 'file:///home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-config-backup.mjs';

const OUT = 'file:///home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-20-1.94.218.129/Linux/evidence/d8-extend/stdout.log';
const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).slice(0, 180), expected: String(expected) });
}

// ===== D8-9 =====
{
  const id1 = generateOrRecoverInstallId();
  const id2 = generateOrRecoverInstallId();
  test('D8-9', 'installId-stable', !!id1 && id1 === id2, `${id1?.slice(0, 12)}==${id2?.slice(0, 12)}`, '二次调用稳定');
  const s1 = sanitizeValue('hello\nworld\tfoo');
  test('D8-9', 'sanitize-whitespace', !/[\r\n\t]/.test(s1), JSON.stringify(s1), '换行/制表符替换为空格');
  const longVal = sanitizeValue('x'.repeat(5000));
  test('D8-9', 'sanitize-length', longVal.length < 1000, `len=${longVal.length}`, '超长截断');
  const credVal = sanitizeValue('AK=SECRETAK sk=SECRETSK token=SECRETTOK');
  const stillContains = /SECRETAK|SECRETSK|SECRETTOK/.test(credVal);
  test('D8-9', 'sanitize-credential-strip', !stillContains, JSON.stringify(credVal), 'AK/SK/token 敏感值被移除（case 预期）');
}

// ===== D8-10 =====
{
  const mcpPath = '/tmp/hdk-d810-mcp.mjs';
  const c1 = mergeCommandStyle({ type: 'local', command: ['node', '/old/path.mjs'], enabled: true }, { mcpPath });
  test('D8-10', 'mergeCommandStyle', c1?.changed === true && c1?.entry?.command?.[1] === mcpPath, JSON.stringify(c1).slice(0, 140), '命令风格注入 node+mcpPath');

  const c2 = mergeArgsStyle({ command: 'node', args: ['/old/path.mjs'], env: {} }, { mcpPath });
  test('D8-10', 'mergeArgsStyle', c2?.entry?.args?.[0] === mcpPath && Array.isArray(c2?.entry?.args), JSON.stringify(c2).slice(0, 140), '参数风格注入 args[0]=mcpPath');

  const c3 = mergeMcpServersFile({ mcpServers: { other: { command: 'x' } } }, { mcpPath });
  test('D8-10', 'mergeMcpServersFile', !!c3?.config?.mcpServers?.['huaweicloud-devkit'], JSON.stringify(c3.config).slice(0, 160), '文件风格合并注入 huaweicloud-devkit');

  const entry = mergeCommandStyle({}, { mcpPath }).entry;
  const delta = extractUserDelta(entry, 'command');
  const applied = applyUserDelta(entry, delta, 'command');
  const idem = JSON.stringify(applied) === JSON.stringify(entry);
  test('D8-10', 'delta-roundtrip-idempotent', idem, `delta=${JSON.stringify(delta)}`, 'delta 提取再应用幂等');

  const origHome = process.env.HUAWEICLOUD_HOME;
  process.env.HUAWEICLOUD_HOME = '/tmp/hdk-d810-home';
  saveAgentDelta('test-agent', { foo: 'bar' });
  const taken = takeAgentDelta('test-agent');
  test('D8-10', 'agent-delta-save-take', taken?.foo === 'bar', JSON.stringify(taken), 'save/take 一致');
  purgeBackup();
  const after = takeAgentDelta('test-agent');
  test('D8-10', 'purgeBackup-clears', !after || Object.keys(after || {}).length === 0, JSON.stringify(after), 'purgeBackup 后 delta 清空');
  if (origHome === undefined) delete process.env.HUAWEICLOUD_HOME; else process.env.HUAWEICLOUD_HOME = origHome;
}

const output = JSON.stringify({ total: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, results }, null, 2);
writeFileSync(new URL(OUT), output, 'utf8');
console.log(output);