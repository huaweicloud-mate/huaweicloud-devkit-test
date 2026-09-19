import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const CLIFILE = '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src/setup-cli.mjs';
let PASS=0,FAIL=0;const A=(id,l,c,d='')=>{const ok=!!c;ok?PASS++:FAIL++;console.log(`[${ok?'PASS':'FAIL'}] ${id} ${l}${d?' | '+d:''}`);};
const src = readFileSync(CLIFILE,'utf8');
const skipFlag = /HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL/.test(src);
const toolkitMode = /HUAWEICLOUD_AGENT_TOOLKIT_MODE/.test(src) && /HCLOUD_BIN/.test(src);
console.log('setup-cli 含 SKIP_DSH flag:', skipFlag);
console.log('setup-cli 含 AGENT_TOOLKIT_MODE + HCLOUD_BIN env 注入:', toolkitMode);
A('D1-67','SKIP_DSH_PLUGIN_INSTALL 跳过分支存在(源码)', skipFlag);
A('D1-67','AGENT_TOOLKIT_MODE + HCLOUD_BIN env 注入存在(源码)', toolkitMode);

// 功能实测：SKIP_DSH=1 时 install 打印跳过信息
const r = spawnSync('npx', ['--yes','huaweicloud-devkit','install','--target','dsh'], {
  env:{ ...process.env, HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL:'1' },
  encoding:'utf8', timeout:120000,
});
const out = (r.stdout||'')+(r.stderr||'');
const skipped = /skipped|跳过/i.test(out);
console.log('install(SKIP_DSH=1) exit:', r.status, '| 含跳过提示:', skipped);
console.log(out.split('\n').filter(l=>/skip|跳|DSH MCP/i.test(l)).slice(0,5).join('\n'));
A('D1-67','SKIP_DSH=1 时跳过 DSH 插件安装(实测)', r.status===0 && skipped);
console.log(`\n=== 汇总: PASS=${PASS} FAIL=${FAIL} ===`);
process.exit(FAIL?1:0);
