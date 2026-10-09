import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const HDK = 'C:/Users/Administrator/devkit-test/OpenCode/hdk';
const proto = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/mcp-protocol.mjs');
const home = process.env.USERPROFILE || process.env.HOME;
const admin = JSON.parse(readFileSync(join(home, '.config/huaweicloud/credentials.json'), 'utf8'));
const ro = JSON.parse(readFileSync(join(home, '.config/huaweicloud/credentials.readonly.json'), 'utf8'));

async function tryInit(label, ak, sk, region) {
  try {
    const r = await proto.dispatch('tools/call', { name: 'huaweicloud_auth_init', arguments: { ak, sk, region } }, { sessionId: 'credcheck-' + label });
    console.log(label + ': ' + JSON.stringify(r).slice(0, 500));
  } catch (e) {
    console.log(label + ' threw: ' + e.message);
  }
}
await tryInit('admin', admin.ak, admin.sk, admin.region);
await tryInit('readonly', ro.ak, ro.sk, ro.region);
