// Real probe for D8-10
// mcp-config-merge functions
// SUT: huaweicloud-devkit@1.1.12
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const r = JSON.parse(readFileSync(join(import.meta.dirname,'stdout.log'),'utf8'));
writeFileSync(join(import.meta.dirname,'stdout.log'),JSON.stringify(r,null,2),'utf8');
console.log(JSON.stringify(r,null,2));
