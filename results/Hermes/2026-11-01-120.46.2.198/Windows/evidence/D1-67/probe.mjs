// probe for case D1-67
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src'; const PKG = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit';
const rec = (status, why) => {
  const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D1-67' };
  writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
};
import { readFileSync } from 'node:fs';
const s = readFileSync(PKG + '/plugins/huaweicloud-core/src/setup-cli.mjs', 'utf8');
const mc = readFileSync(PKG + '/plugins/huaweicloud-core/src/mcp-config-merge.mjs', 'utf8');
const hcl = /HCLOUD_BIN/.test(s);
const envOk = /REQUIRED_ENV_KEYS/.test(mc) && /HUAWEICLOUD_AGENT_TOOLKIT_MODE/.test(mc);
const skipOk = /SKIP_DSH/.test(s) || /SKIP_DSH/.test(mc);
rec((hcl && envOk && skipOk) ? 'PASS':'FAIL', 'HCLOUD_BIN(setup-cli)=' + hcl + ' REQUIRED_ENV_KEYS/TOOLKIT_MODE(mcp-merge)=' + envOk + ' SKIP_DSH=' + skipOk);
process.exit(0);
