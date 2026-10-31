// probe for case D2-1
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const M = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src'; const PKG = 'C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-324f560a76ab/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit';
const rec = (status, why) => {
  const out = { status, why, executedAt: new Date().toISOString().slice(0,19).replace(/[-T:]/g,''), caseId: 'D2-1' };
  writeFileSync(__dirname + '/stdout.log', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
};
import { existsSync } from 'node:fs';
const home = process.env.USERPROFILE || 'C:/Users/Administrator';
const cred = existsSync(home + '/.config/huaweicloud/credentials.json');
const obs = existsSync(home + '/.obsutilconfig');
const koo = existsSync(home + '/.hcloud/cli-publish.json') || existsSync(home + '/.hcloud');
rec((cred && obs) ? 'PASS':'FAIL', '三端文件 KooCLI+OBS+沙箱: credentials=' + cred + ' obsutilconfig=' + obs + ' hcloudDir=' + koo);
process.exit(0);
