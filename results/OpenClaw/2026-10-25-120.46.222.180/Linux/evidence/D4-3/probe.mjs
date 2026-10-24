#!/usr/bin/env node
// D4-3 明文 secret API 拦截（OpenClaw Linux 2026-10-25 fresh 直调）
// 断言：返回明文/二进制 secret 的 KMS API（DecryptData/DecryptDatakey）应与
//       ShowSecretVersion/GetSecretValue 一致被判 deny/secret。
import { pathToFileURL } from 'node:url';
const SRC = '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src';
const { classifyTextCommand } = await import(pathToFileURL(SRC + '/safety-policy.mjs').href);

const cases = [
  ['kms DecryptData', 'hcloud kms DecryptData --key-id x --cipher-text y'],
  ['kms DecryptDatakey', 'hcloud kms DecryptDatakey --key-id x'],
  ['csms ShowSecretVersion(对照)', 'hcloud csms ShowSecretVersion --secret-name x'],
  ['csms GetSecretValue(对照)', 'hcloud csms GetSecretValue --secret-id x'],
];
const results = [];
for (const [label, cmd] of cases) {
  const r = classifyTextCommand(cmd);
  const ok = r.decision === 'deny';
  results.push({ label, cmd, decision: r.decision, risk: r.risk, ok });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${label}: decision=${r.decision} risk=${r.risk} | ${cmd}`);
}
const blocked = results.filter((r) => r.label.startsWith('kms') && r.decision === 'deny');
const failedBreakdown = results.filter((r) => !r.ok).map((r) => r.label);
console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({
  case: 'D4-3',
  status: failedBreakdown.length === 0 ? 'PASS' : 'FAIL',
  total: results.length,
  passed: results.filter((r) => r.ok).length,
  failed: failedBreakdown,
  results,
}, null, 2));