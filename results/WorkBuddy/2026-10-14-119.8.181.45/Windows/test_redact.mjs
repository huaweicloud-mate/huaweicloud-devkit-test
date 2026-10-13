import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const SUT = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src';
const sutPath = pathToFileURL(join(SUT, 'safety-policy.mjs')).href;

const m = await import(sutPath);
const ak = 'AKIDEXAMPLE123456789';
const sk = 'SKEXAMPLE987654321';
const strInput = 'ak=' + ak + ' sk=' + sk;
const result = m.redactSecrets(strInput);
console.log('Input:', strInput);
console.log('Output:', result);
console.log('AK leaked:', result.includes(ak));
console.log('SK leaked:', result.includes(sk));

// Also test with AK= uppercase
const strInput2 = 'AK=' + ak + ' SK=' + sk;
const result2 = m.redactSecrets(strInput2);
console.log('Uppercase Output:', result2);
console.log('AK leaked (upper):', result2.includes(ak));
