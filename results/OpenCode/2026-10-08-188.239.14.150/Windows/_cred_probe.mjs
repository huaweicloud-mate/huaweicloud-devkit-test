import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk';
const proto = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/mcp-protocol.mjs');
const r = await proto.dispatch('tools/call', { name: 'huaweicloud_voucher_status', arguments: {} }, { sessionId: 'cred-probe' });
console.log(JSON.stringify(r).slice(0, 800));
