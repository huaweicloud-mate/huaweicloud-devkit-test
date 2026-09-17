import { semverCompare } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/update-check.mjs';
const tests = [
  ['1.1.2','1.1.1',1], ['1.1.0','1.1.0-next.9',1], ['1.1.4','1.1.4',0],
  ['1.1.3','1.1.4',-1], ['invalid','1.1.4',1], // 'i' > '1' lexicographically
];
let ok = true;
for (const [a,b,expected] of tests) {
  const r = semverCompare(a,b);
  const match = (r > 0 && expected > 0) || (r < 0 && expected < 0) || (r === 0 && expected === 0);
  console.log(a+' vs '+b+' => '+r+' (expected '+expected+') '+(match?'OK':'MISMATCH'));
  if (!match) ok = false;
}
if (ok) console.log('PASS'); else console.log('FAIL');