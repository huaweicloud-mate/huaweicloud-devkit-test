#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
const SRC = '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src';
const { classifyTextCommand } = await import(pathToFileURL(SRC + '/safety-policy.mjs').href);
const cases = [
  ['kms DecryptData', 'hcloud kms DecryptData --key-id x --cipher-text y'],
  ['kms DecryptDatakey', 'hcloud kms DecryptDatakey --key-id x'],
  ['csms ShowSecretVersion(对照)', 'hcloud csms ShowSecretVersion --secret-name x'],
  ['csms GetSecretValue(对照)', 'hcloud csms GetSecretValue --secret-id x'],
];
for (const [label, cmd] of cases) {
  const r = classifyTextCommand(cmd);
  console.log(`${r.decision === 'deny' ? 'OK' : 'FAIL'} ${label}: decision=${r.decision} risk=${r.risk}`);
}
