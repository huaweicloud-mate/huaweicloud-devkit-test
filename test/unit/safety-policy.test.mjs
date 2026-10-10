// Layer 2 契约单测：safety-policy.mjs
// 覆盖 plan §Layer 2 目标：redactSecrets 边界（嵌套/数组/非敏感键/值内嵌）、
// classifyHcloudArgs 命令分类（read/write/secret/local/空）、classifyTextCommand 凭证门禁。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importHdk } from './helpers/hdk-path.mjs';

const { module: sp } = await importHdk('safety-policy.mjs');

test('redactSecrets: 递归脱敏对象中的敏感键', () => {
  const out = sp.redactSecrets({
    ak: 'AKIAEXAMPLE',
    access_key: 'x',
    sk: 'SECRET',
    username: 'admin',
    nested: { password: 'p' },
    arr: [{ token: 't' }],
  });
  assert.equal(out.ak, '<redacted>');
  assert.equal(out.access_key, '<redacted>');
  assert.equal(out.sk, '<redacted>');
  assert.equal(out.username, 'admin');
  assert.equal(out.nested.password, '<redacted>');
  assert.equal(out.arr[0].token, '<redacted>');
});

test('redactSecrets: 值内嵌凭证的字符串同样被脱敏', () => {
  const out = sp.redactSecrets('hcloud ECS CreateServer --adminPass=hunter2');
  assert.ok(out.includes('--adminPass=<redacted>'));
  assert.ok(!out.includes('hunter2'));
});

test('redactSecrets: AK:SK 冒号形式被脱敏', () => {
  const out = sp.redactSecrets('AK=abc123 SK=xyz789');
  assert.ok(!/abc123/.test(out));
  assert.ok(!/xyz789/.test(out));
  assert.ok(out.includes('<redacted>'));
});

test('redactSecrets: 非敏感值原样保留', () => {
  assert.equal(sp.redactSecrets('hello world'), 'hello world');
  assert.equal(sp.redactSecrets(42), 42);
  assert.equal(sp.redactSecrets(null), null);
});

test('classifyHcloudArgs: 空命令拒绝', () => {
  assert.equal(sp.classifyHcloudArgs([]).decision, 'deny');
  assert.equal(sp.classifyHcloudArgs(['']).decision, 'deny');
});

test('classifyHcloudArgs: 写操作默认拦截', () => {
  for (const args of [
    ['ECS', 'DeleteServer', '--server_id=xx'],
    ['ECS', 'CreateServer', '--name=x'],
    ['VPC', 'DeleteVpc'],
  ]) {
    assert.equal(sp.classifyHcloudArgs(args).decision, 'deny', JSON.stringify(args));
    assert.equal(sp.classifyHcloudArgs(args).risk, 'write', JSON.stringify(args));
  }
});

test('classifyHcloudArgs: 只读操作放行', () => {
  const r = sp.classifyHcloudArgs(['ECS', 'ListServersDetails', '--limit=10']);
  assert.equal(r.decision, 'allow');
  assert.equal(r.risk, 'read_only');
});

test('classifyHcloudArgs: 审批通过后写操作放行', () => {
  const r = sp.classifyHcloudArgs(['ECS', 'CreateServer'], { allowWrites: true });
  assert.equal(r.decision, 'allow');
  assert.equal(r.risk, 'write');
});

test('classifyHcloudArgs: 本地元数据命令放行', () => {
  for (const args of [
    ['--help'],
    ['help'],
    ['-h'],
    ['--version'],
  ]) {
    assert.equal(sp.classifyHcloudArgs(args).decision, 'allow', JSON.stringify(args));
  }
});

test('classifyHcloudArgs: 凭证读取被阻断', () => {
  const r = sp.classifyHcloudArgs(['CSMS', 'ShowSecretVersion', '--secret_name=x']);
  assert.equal(r.decision, 'deny');
  assert.equal(r.risk, 'secret');
});

test('classifyHcloudArgs: OBS 写操作拦截 / 读操作放行', () => {
  assert.equal(sp.classifyHcloudArgs(['obs', 'cp', 'a', 'b']).decision, 'deny');
  assert.equal(sp.classifyHcloudArgs(['OBS', 'ls']).decision, 'allow');
});

test('classifyHcloudArgs: shell 包裹的写命令仍拦截', () => {
  const r = sp.classifyHcloudArgs(['sh', '-c', 'hcloud ECS DeleteServer --server_id=xx']);
  assert.equal(r.decision, 'deny');
});

test('classifyTextCommand: env 凭证打印被阻断', () => {
  assert.equal(sp.classifyTextCommand('printenv HW_ACCESS_KEY').decision, 'deny');
  assert.equal(sp.classifyTextCommand('env | grep HWC_ACCESS_KEY').decision, 'deny');
});

test('classifyTextCommand: 凭证文件读取被阻断', () => {
  assert.equal(sp.classifyTextCommand('cat ~/.hcloud/config.json').decision, 'deny');
  assert.equal(sp.classifyTextCommand('cat ~/.huaweicloud/credentials.json').decision, 'deny');
});

test('classifyTextCommand: 非华为云命令走原始命令风险规则', () => {
  const r = sp.classifyTextCommand('npm run build');
  assert.ok(['allow', 'deny', 'warn'].includes(r.decision));
});

test('assertAllowed: deny 时抛错，allow 时返回原结果', () => {
  assert.throws(() => sp.assertAllowed(sp.classifyHcloudArgs(['ECS', 'DeleteServer'])));
  const ok = sp.classifyHcloudArgs(['ECS', 'ListServersDetails']);
  assert.equal(sp.assertAllowed(ok), ok);
});