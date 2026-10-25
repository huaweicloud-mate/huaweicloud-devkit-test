// D1-67 Agent toolkit 模式与 DSH 跳过安装
import { readFileSync } from 'node:fs';
const m = readFileSync(process.argv[2],'utf8'); const s = readFileSync(process.argv[3],'utf8');
console.log('toolkit_mode:', m.includes('HUAWEICLOUD_AGENT_TOOLKIT_MODE'));
console.log('skip_dsh:', s.includes('HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL'));