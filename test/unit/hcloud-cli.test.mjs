// Layer 2 契约单测：hcloud-cli.mjs 纯函数（不触发真实 hcloud 子进程）
// 覆盖：hashArgs 稳定性、createApprovalToken/consumeApprovalToken 单进程闭环（写临时 HOME）、
// redactOutput 脱敏、extractApiError 解析、resolveStsInjectArgs 注入。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { homedir } from 'node:os';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { importHdk } from './helpers/hdk-path.mjs';

const { module: hc } = await importHdk('hcloud-cli.mjs');

test('hashArgs: 同参数稳定哈希', () => {
  assert.equal(hc.hashArgs(['ECS', 'ListServersDetails']), hc.hashArgs(['ECS', 'ListServersDetails']));
});

test('hashArgs: 参数顺序影响哈希', () => {
  assert.notEqual(hc.hashArgs(['a', 'b']), hc.hashArgs(['b', 'a']));
});

test('hashArgs: 输出 64 位十六进制', () => {
  assert.match(hc.hashArgs(['x']), /^[0-9a-f]{64}$/);
});

test('redactOutput: JSON 对象中敏感字段被脱敏', () => {
  const out = hc.redactOutput(JSON.stringify({ server: { name: 'demo' }, access_key: 'AKIA123' }));
  assert.ok(out.includes('<redacted>'));
  assert.ok(!out.includes('AKIA123'));
});

test('redactOutput: 非 JSON 文本内嵌凭证被脱敏', () => {
  const out = hc.redactOutput('AK=abc123 SK=xyz789');
  assert.ok(!out.includes('abc123'));
  assert.ok(!out.includes('xyz789'));
});

test('redactOutput: 空输入不抛错', () => {
  assert.doesNotThrow(() => hc.redactOutput(''));
  assert.doesNotThrow(() => hc.redactOutput(null));
});

test('extractApiError: 标准 error_code/error_msg JSON', () => {
  const err = hc.extractApiError('{"error_code":"Ecs.0001","error_msg":"Bad request."}');
  assert.equal(err.errorCode, 'Ecs.0001');
  assert.equal(err.errorMessage, 'Bad request.');
});

test('extractApiError: 带 KooCLI 版本前缀时剥离后解析', () => {
  const err = hc.extractApiError('ListVpcs有多个版本,默认使用该API版本v3 {"error_code":"Vpc.1234","error_msg":"nope"}');
  assert.equal(err.errorCode, 'Vpc.1234');
});

test('extractApiError: 无错误返回 null', () => {
  assert.equal(hc.extractApiError('{"servers":[]}'), null);
  assert.equal(hc.extractApiError(''), null);
});

test('resolveStsInjectArgs: 无 STS 环境时不注入，返回原始参数', () => {
  const args = hc.resolveStsInjectArgs(['ECS', 'ListServersDetails']);
  assert.ok(Array.isArray(args));
});

test('approval token 闭环：create → consume 幂等', () => {
  // 用临时 HOME 隔离，避免污染真实 approvals.json
  const tmpHome = mkdtempSync(join(tmpdir(), 'devkit-approval-'));
  const oldHome = process.env.HUAWEICLOUD_HOME;
  process.env.HUAWEICLOUD_HOME = tmpHome;
  try {
    const raw = ['ECS', 'CreateServer', '--adminPass=hunter2'];
    const token = hc.createApprovalToken(raw);
    assert.ok(token && token.length > 0);
    const entry = hc.consumeApprovalToken(token);
    assert.ok(entry, 'token 可以被消费');
    assert.equal(entry.argsHash, hc.hashArgs(raw));
    assert.ok(JSON.stringify(entry.argsRedacted).includes('<redacted>'));
    assert.ok(!JSON.stringify(entry.argsRedacted).includes('hunter2'), 'approval 文件不保存 raw secret');
    assert.equal(hc.consumeApprovalToken(token), null, '已消费 token 不可复用');
  } finally {
    if (oldHome) process.env.HUAWEICLOUD_HOME = oldHome;
    else delete process.env.HUAWEICLOUD_HOME;
    rmSync(tmpHome, { recursive: true, force: true });
  }
});