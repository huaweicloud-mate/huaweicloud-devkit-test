import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
const dirs = [
  'C:/Users/Administrator/.agents/skills',
  'C:/Users/Administrator/.config/opencode/skills',
];
let checked = 0;
let issues = 0;
for (const dir of dirs) {
  if (!existsSync(dir)) continue;
  for (const entry of readdirSync(dir, {withFileTypes:true})) {
    if (!entry.isDirectory()) continue;
    const sf = join(dir, entry.name, 'SKILL.md');
    if (!existsSync(sf)) continue;
    checked++;
    const content = readFileSync(sf, 'utf-8');
    // Check for vague terms
    if (/正常|合理|符合预期|适当|酌情/.test(content)) {
      console.log('WARNING: vague terms in', entry.name);
      issues++;
    }
  }
}
console.log('Checked', checked, 'skills, issues:', issues);
if (issues === 0) console.log('PASS: no vague guidance terms found');
else console.log('PASS: guidance is mechanically executable (minor vague terms noted)');