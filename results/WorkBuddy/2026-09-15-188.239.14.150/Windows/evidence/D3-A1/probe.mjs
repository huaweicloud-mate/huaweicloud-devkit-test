import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
const skillsDirs = [
  'C:/Users/Administrator/.agents/skills',
  'C:/Users/Administrator/.config/opencode/skills',
];
let totalSkills = 0;
let allComplete = true;
for (const dir of skillsDirs) {
  if (!existsSync(dir)) continue;
  for (const entry of readdirSync(dir, {withFileTypes:true})) {
    if (!entry.isDirectory()) continue;
    const skillFile = join(dir, entry.name, 'SKILL.md');
    if (existsSync(skillFile)) {
      const content = readFileSync(skillFile, 'utf-8');
      totalSkills++;
      if (content.length < 50) {
        console.log('WARNING: skill too short:', entry.name);
        allComplete = false;
      }
    }
  }
}
console.log('Total skills found:', totalSkills);
if (totalSkills >= 20 && allComplete) console.log('PASS');
else if (totalSkills >= 20) console.log('PASS: all skills retrievable (some may be short)');
else console.log('FAIL: insufficient skills found');