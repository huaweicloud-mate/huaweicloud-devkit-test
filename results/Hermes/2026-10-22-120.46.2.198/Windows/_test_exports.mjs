import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
const hdkSrc = 'C:\\Users\\Administrator\\multica_workspaces\\vector-8988c3df7bc9\\task-fe1b399ab162\\hermes-home\\tools\\node-26.7.0-win32-x64\\node_modules\\huaweicloud-devkit\\plugins\\huaweicloud-core\\src';
const mod = await import(pathToFileURL(join(hdkSrc, 'safety-policy.mjs')).href);
const allKeys = Object.keys(mod).sort();
console.log('safety-policy exports:', JSON.stringify(allKeys));
const redactFns = allKeys.filter(k => k.toLowerCase().includes('redact'));
console.log('redact fns:', JSON.stringify(redactFns));
// Also check risk-rule-engine
const rre = await import(pathToFileURL(join(hdkSrc, 'risk-rule-engine.mjs')).href);
console.log('risk-rule-engine exports:', JSON.stringify(Object.keys(rre).sort()));
