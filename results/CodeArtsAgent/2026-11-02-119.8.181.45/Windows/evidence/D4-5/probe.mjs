import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const results = {};
try {
  const hdkPath = process.env.USERPROFILE + '/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
  const fileUrl = pathToFileURL(hdkPath).href;
  const sp = await import(fileUrl);
  const w = sp.classifyHcloudArgs ? sp.classifyHcloudArgs(['ECS', 'DeleteServer', '--server_id=test']) : { risk: 'unknown' };
  const isWrite = w.risk === 'write' || w.decision === 'deny';
  results['D4-5'] = { status: isWrite ? 'PASS' : 'FAIL', risk: w.risk, decision: w.decision, why: `classify DeleteServer as write=${isWrite}` };
} catch(e) { results['D4-5'] = { status: 'BLOCKED', why: e.message }; }
writeFileSync('./stdout.log', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
