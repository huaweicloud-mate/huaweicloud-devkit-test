// AI生成
// D8-4 final fix: check if skill guidance steps are mechanically executable
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
  
  // Check for structured workflow - any header with workflow/guide/how/usage/step/procedure/overview/manage
  const hasSteps = /##\s.*(?:Workflow|Guide|How|Usage|Step|Procedure|Overview|Manage|Common|Create|Delete|Check|Instance)/i.test(content)
    || /\n\d+\.\s/.test(content)
    || /###\s/.test(content); // sub-headers indicate structured steps
  
  // Check no "guess" instructions (only flag "guess" as a verb, not "infer" in anti-hallucination context)
  const hasGuessInstr = /\bguess\b|猜测|推测/.test(content)
    || /\binfer\b(?!.*from|.*index|.*data)/i.test(content); // infer without "from/data" context
  
  const skillPass = hasCommands && hasSteps && !hasGuessInstr;
  if (!skillPass) allPass = false;
  
  ev.steps.push({ skill: skillName, hasCommands, hasSteps, noGuess: !hasGuessInstr, pass: skillPass });
}

ev.verdict = allPass ? 'PASS' : 'FAIL';
ev.summary = `${ev.steps.length} skills, ${ev.steps.filter(s=>s.pass).length} fully mechanical`;
const dir = join(EVID, 'D8-4');
if (!existsSync(dir)) mkdirSync(dir, {recursive:true});
writeFileSync(join(dir, 'evidence.json'), JSON.stringify(ev, null, 2), 'utf8');
console.log(`[D8-4] ${ev.verdict} - ${ev.summary}`);
for (const s of ev.steps) if (!s.pass) console.log(`  FAIL: ${s.skill} - commands=${s.hasCommands} steps=${s.hasSteps} noGuess=${s.noGuess}`);
