import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
const hdkSrc = 'C:\\Users\\Administrator\\multica_workspaces\\vector-8988c3df7bc9\\task-fe1b399ab162\\hermes-home\\tools\\node-26.7.0-win32-x64\\node_modules\\huaweicloud-devkit\\plugins\\huaweicloud-core\\src';
const mod = await import(pathToFileURL(join(hdkSrc, 'safety-policy.mjs')).href);
const fn = mod.classifyTextCommand;

const tests = ['', '   ', '{}', '{"a":null}', 'a'.repeat(100), null, undefined, 'normal text'];
for (const t of tests) {
  try {
    const r = fn(t);
    console.log(JSON.stringify({input: String(t).slice(0,20), decision: r?.decision, reason: (r?.reason||'').slice(0,50)}));
  } catch(e) {
    console.log(JSON.stringify({input: String(t).slice(0,20), error: e.message.slice(0,50)}));
  }
}
