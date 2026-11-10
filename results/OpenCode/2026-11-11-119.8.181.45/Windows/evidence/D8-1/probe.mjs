import { existsSync } from 'node:fs';
const m = await import('file://C:\Users\Administrator\devkit-test\OpenCode\hdk\plugins\huaweicloud-core\src/tools.mjs');
const d=m.listSkillDirs('C:\Users\Administrator\.config\opencode\skills');
console.log(d.length, d.every(n=>existsSync('C:\Users\Administrator\.config\opencode\skills/'+n+'/SKILL.md')));
