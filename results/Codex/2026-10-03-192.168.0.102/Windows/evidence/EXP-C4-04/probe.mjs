import { readFileSync } from 'node:fs';
console.log("EXP-C4-04");
console.log(readFileSync(new URL('./stdout.log', import.meta.url),'utf8'));
