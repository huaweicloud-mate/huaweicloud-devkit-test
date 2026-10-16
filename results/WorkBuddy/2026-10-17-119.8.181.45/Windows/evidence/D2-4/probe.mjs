import { writeFileSync } from 'node:fs';

const caseId = 'D2-4';
const executedAt = '20261017052400';

try {
  // D2-4: Credential redaction — AK mid-section shown, SK never complete, no plaintext
  // RED LINE case ④: must construct real attack input (lowercase ak= redaction)
  const { redactSecrets } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');

  // Test 1: object with ak/sk/securityToken → all redacted (key-name based)
  const creds = {
    ak: 'HPUAN1ROXXXXXXXX',
    sk: 'SK1234567890abcdefghijklmnop',
    securityToken: 'STS.TOKEN.1234567890abcdef',
    region: 'cn-north-4',
  };
  const redactedObj = redactSecrets(creds);
  const akRedacted = redactedObj.ak === '<redacted>';
  const skRedacted = redactedObj.sk === '<redacted>';
  const tokenRedacted = redactedObj.securityToken === '<redacted>';

  // Test 2: RED LINE — lowercase "ak=" in command string (attack vector)
  // hcloud CLI uses --ak= / --sk= flags (lowercase). redactString regex only
  // matches uppercase AK=/SK= → lowercase leaks plaintext.
  const cmd1 = 'hcloud configure set --ak=HPUAN1ROXXXXXXXX --sk=SK1234567890abcdefghijklmnop';
  const redactedCmd1 = redactSecrets(cmd1);
  const cmd1NoPlaintext = !redactedCmd1.includes('HPUAN1ROXXXXXXXX') && !redactedCmd1.includes('SK1234567890abcdefghijklmnop');

  // Test 3: uppercase AK=/SK= pattern (works)
  const cmd2 = 'echo AK=HPUAN1ROXXXXXXXX SK=SK1234567890abcdefghijklmnop';
  const redactedCmd2 = redactSecrets(cmd2);
  const cmd2NoPlaintext = !redactedCmd2.includes('HPUAN1ROXXXXXXXX') && !redactedCmd2.includes('SK1234567890abcdefghijklmnop');

  // Test 4: access_key= / secret_key= pattern (works)
  const cmd3 = 'export access_key=HPUAN1ROXXXXXXXX secret_key=SK1234567890abcdefghijklmnop';
  const redactedCmd3 = redactSecrets(cmd3);
  const cmd3NoPlaintext = !redactedCmd3.includes('HPUAN1ROXXXXXXXX') && !redactedCmd3.includes('SK1234567890abcdefghijklmnop');

  // Object redaction works (isSecretKeyName catches ak/sk keys), but string
  // redaction misses lowercase ak=/sk= (regex only matches uppercase AK/SK).
  // Root cause: safety-policy.mjs:45 — regex /(AK|SK)\s*[:=]\s*(...)/g lacks case-insensitive flag
  const status = (akRedacted && skRedacted && tokenRedacted && cmd1NoPlaintext && cmd2NoPlaintext && cmd3NoPlaintext) ? 'PASS' : 'FAIL';
  const whyText = status === 'PASS'
    ? 'All credential patterns redacted'
    : 'Object key redaction works (ak=' + akRedacted + ', sk=' + skRedacted + ', token=' + tokenRedacted + '); BUT string redaction FAILS on lowercase ak=/sk=: cmd1 redacted=' + cmd1NoPlaintext + ' (LEAKS plaintext). Root cause: safety-policy.mjs:45 regex only matches uppercase AK=/SK=, not lowercase ak=/sk= used by hcloud CLI flags --ak= --sk=. Uppercase AK= works (' + cmd2NoPlaintext + '), access_key= works (' + cmd3NoPlaintext + ').';
  const output = {
    caseId,
    status,
    why: whyText,
    executedAt,
    result: {
      redactedObj,
      cmd1: { original: cmd1, redacted: redactedCmd1, noPlaintext: cmd1NoPlaintext, issue: 'lowercase ak= not redacted (regex missing i flag)' },
      cmd2: { original: cmd2, redacted: redactedCmd2, noPlaintext: cmd2NoPlaintext },
      cmd3: { original: cmd3, redacted: redactedCmd3, noPlaintext: cmd3NoPlaintext },
      rootCause: 'safety-policy.mjs:45 - regex /(AK|SK)\\s*[:=]\\s*(value)/g lacks i flag, only matches uppercase AK/SK',
    },
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
