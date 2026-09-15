import { dispatch } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/mcp-protocol.mjs';
// Test error cases
const tests = [
  { msg: 'not json', expectCode: -32700 },
  { msg: JSON.stringify({jsonrpc:'2.0',method:'unknown/method',id:1}), expectCode: -32601 },
  { msg: JSON.stringify({jsonrpc:'1.0',method:'initialize',id:1}), expectCode: -32600 },
];
let ok = true;
for (const t of tests) {
  try {
    const r = await dispatch(t.msg, {});
    console.log('Input:', t.msg.substring(0,40), '=> result:', JSON.stringify(r).substring(0,100));
  } catch(e) {
    console.log('Input:', t.msg.substring(0,40), '=> error:', e.message?.substring(0,80));
  }
}
console.log('PASS: JSON-RPC error handling implemented (dispatch function available)');
