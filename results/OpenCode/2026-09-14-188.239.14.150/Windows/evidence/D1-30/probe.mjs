// Probe: D1-30 semver comparison correctness (FIXED: invalid string dictionary order)
import { pathToFileURL } from 'node:url';
const mod = await import(pathToFileURL('C:\\Users\\Administrator\\devkit-test\\OpenCode\\hdk\\plugins\\huaweicloud-core\\src\\update-check.mjs').href);

console.log('=== D1-30: semver Compare Correctness ===');
// Expected: invalid strings use dictionary order per spec "无效串按字典序"
const tests = [
  ['1.1.2', '1.1.1', 1],
  ['1.1.0', '1.1.0-next.9', 1],
  ['1.1.4-next.3', '1.1.4-next.3', 0],
  ['1.1.4-next.2', '1.1.4-next.3', -1],
  ['1.2.0', '1.1.9', 1],
  ['2.0.0', '1.9.9', 1],
  ['1.1.0', '1.0.9', 1],
  ['invalid', '1.0.0', 1],  // dictionary: 'i'(105) > '1'(49) => 1
  ['1.0.0', '2.0.0', -1],
  ['1.1.4-next.10', '1.1.4-next.9', 1],
  ['1.0.0', '1.0.0', 0],
  ['1.0.0-beta', '1.0.0', -1],
];
let pass = true;
for (const [a, b, expected] of tests) {
  const r = mod.semverCompare(a, b);
  const ok = r === expected;
  if (!ok) pass = false;
  console.log(`compare("${a}","${b}")=${r} expected=${expected} ${ok?'PASS':'FAIL'}`);
}
console.log(`=== VERDICT: ${pass?'PASS':'FAIL'} ===`);
