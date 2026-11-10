// D1-70 CLI 真机探针
import { spawnSync } from 'node:child_process';
const r = spawnSync('node', ['C:/Users/Administrator/multica_workspaces/vector-8988c3df7bc9/task-aa791fe63935/hermes-home/tools/node-26.7.0-win32-x64/node_modules/huaweicloud-devkit/bin/setup.cjs', '--help'], { encoding:'utf8' });
console.log(r.stdout || r.stderr);
