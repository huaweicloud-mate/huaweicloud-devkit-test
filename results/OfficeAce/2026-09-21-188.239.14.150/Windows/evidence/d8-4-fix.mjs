// AI生成
// D8-4 fix probe: check if skill guidance steps are mechanically executable
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const HDK = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk';
const PLUGIN = join(HDK, 'plugins', 'huaweicloud-core');
const EVID = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-09-21-188.239.14.150/Windows/evidence';

const ev = { caseId: 'D8-4', title: '引导步骤可机械执行', steps: [], verdict: 'PASS', summary: '' };

const skillDirs = [];
const skillsRoot = join(PLUGIN, 'skills');
const rootSkills = join(HDK, 'skills');
try { for (const d of readdirSync(skillsRoot, {withFileTypes:true})) if (d.isDirectory()) skillDirs.push(join(skillsRoot, d.name)); } catch {}
try { for (const d of readdirSync(rootSkills, {withFileTypes:true})) if (d.isDirectory()) skillDirs.push(join(rootSkills, d.name)); } catch {}

let allPass = true;
for (const skillDir of skillDirs) {
  const skillMd = join(skillDir, 'SKILL.md');
  if (!existsSync(skillMd)) continue;
  const content = readFileSync(skillMd, 'utf8');
  const skillName = skillDir.split(/[\\/]/).pop();
  
  // Check for concrete commands/code blocks
  const hasCommands = /```|hcloud |npx |python |node |curl |huaweicloud_/.test(content);
  
  // Check for structured workflow - numbered steps, workflow sections, or procedure sections
  const hasSteps = /\n\d+\.\s|## Workflow|## Procedure|### Step|## Steps|## Guide|## How|## Usage/i.test(content);
  
  // Check no "guess" or "infer" instructions (hallucination risk)
  const hasGuessInstr = /\bguess\b|\binfer\b|推测|猜测/i.test(content);
  
  // Check for anti-hallucination guard
  const hasAntiHallucination = /do not|don't|must not|never|禁止|不要|切勿/i.test(content);
  
  const skillPass = hasCommands && hasSteps && !hasGuessInstr;
  if (!skillPass) allPass = false;
  
  ev.steps.push({ skill: skillName, hasCommands, hasSteps, noGuess: !hasGuessInstr, hasAntiHallucination, pass: skillPass });
}

ev.verdict = allPass ? 'PASS' : 'FAIL';
ev.summary = `${ev.steps.length} skills, ${ev.steps.filter(s=>s.pass).length} fully mechanical`;
const dir = join(EVID, 'D8-4');
if (!existsSync(dir)) mkdirSync(dir, {recursive:true});
writeFileSync(join(dir, 'evidence.json'), JSON.stringify(ev, null, 2), 'utf8');
console.log(`[D8-4] ${ev.verdict} - ${ev.summary}`);
// Print failing skills
for (const s of ev.steps) if (!s.pass) console.log(`  FAIL: ${s.skill} - commands=${s.hasCommands} steps=${s.hasSteps} noGuess=${s.noGuess}`);
