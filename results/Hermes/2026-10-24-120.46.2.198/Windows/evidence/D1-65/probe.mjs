// D1-65 调试模式环境变量
import { readFileSync } from 'node:fs';
const s = readFileSync(process.argv[2],'utf8');
console.log('DEBUG === true strict:', /HUAWEICLOUD_DEVKIT_DEBUG\s*===\s*'true'/.test(s));
console.log('debugLog guard:', s.includes('if (!DEBUG) return;'));