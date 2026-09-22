import fs from 'node:fs';
import path from 'node:path';

const repo = 'C:/Users/Administrator/Documents/Codex/2026-09-22/huaweicloud-devkit-devkit-test-clone-git-2/work/devkit-test/codex/hdk';
const hookConfig = path.join(repo, 'plugins', 'huaweicloud-core', 'hooks', 'hooks.json');
const nodeHook = path.join(repo, 'plugins', 'huaweicloud-core', 'hooks', 'huaweicloud-safety.mjs');
const configText = fs.readFileSync(hookConfig, 'utf8');
const result = {
  status: fs.existsSync(nodeHook) && /huaweicloud-safety\.mjs/.test(configText) && /\bnode\b/.test(configText) ? 'PASS' : 'FAIL',
  executedAt: new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14),
  assertion: 'hooks.json invokes the Node safety hook and the target module exists',
  actual: {
    hookConfig,
    nodeHook,
    nodeHookExists: fs.existsSync(nodeHook),
    configHasNodeHook: /huaweicloud-safety\.mjs/.test(configText),
    configUsesNode: /\bnode\b/.test(configText),
  },
};
fs.writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
