import { existsSync, readFileSync } from 'node:fs';
const p='C:/Users/Administrator/devkit-test/OpenCode/hdk/rules/huawei-agent-rules.mdc';
console.log(existsSync(p), existsSync(p)?readFileSync(p,'utf-8').length:0);
