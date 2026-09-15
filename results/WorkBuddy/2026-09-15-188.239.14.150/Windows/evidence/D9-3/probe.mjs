import { _decorateResult } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/mcp-protocol.mjs';
const r = _decorateResult([{type:'text',text:'test'}], false);
console.log('Result structure:', JSON.stringify(r).substring(0,100));
if (r.content && Array.isArray(r.content) && r.isError === false) console.log('PASS: content array + isError correct');
else console.log('FAIL');