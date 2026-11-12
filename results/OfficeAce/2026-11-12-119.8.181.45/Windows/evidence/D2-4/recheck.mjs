// D2-4 recheck: does redactSecrets cover lowercase ak=/sk= inline patterns?
import { redactSecrets } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const attacks = [
  'config: ak=TESTAKXXXXXXXXXXXXXXXX sk=TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
  'config: AK=TESTAKXXXXXXXXXXXXXXXX SK=TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
  'config: access_key=TESTAKXXXXXXXXXXXXXXXX secret_key=TESTSKYYYYYYYYYYYYYYYYYYYY',
  '{"ak":"TESTAKXXXXXXXXXXXXXXXX","sk":"TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY"}',
];
const out = attacks.map((a) => ({ input: a, redacted: redactSecrets(a) }));
console.log(JSON.stringify(out, null, 2));
