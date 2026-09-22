// AI生成
// D8-1/D8-4/D8-6 probe: documentation quality checks
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';

const HDK = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk';
const PLUGIN = join(HDK, 'plugins', 'huaweicloud-core');
const results = {};

function save(id, data) {
  const dir = join('C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-09-21-188.239.14.150/Windows/evidence', id);
  if (!existsSync(dir)) mkdirSync2(dir, {recursive:true});
  writeFileSync2(join(dir, 'evidence.json'), JSON.stringify(data, null, 2), 'utf8');
}

// ─── D8-1: Documentation completeness ───
function d8_1() {
  const ev = { caseId: 'D8-1', title: '文档与能力一致', steps: [], verdict: 'PASS', summary: '' };
  
  // Check README exists
  const readmePath = join(HDK, 'README.md');
  const readmeExists = existsSync(readmePath);
  ev.steps.push({ check: 'README.md exists', pass: readmeExists });
  
  if (readmeExists) {
    const readme = readFileSync(readmePath, 'utf8');
    
    // Check for broken internal links
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match, brokenLinks = [];
    while ((match = linkPattern.exec(readme)) !== null) {
      const link = match[2];
      if (link.startsWith('http')) continue; // skip external
      if (link.startsWith('#')) continue; // skip anchors
      const target = join(HDK, link.replace(/^\.\//, ''));
      if (!existsSync(target)) brokenLinks.push(link);
    }
    ev.steps.push({ check: 'no broken internal links', pass: brokenLinks.length === 0, brokenLinks });
    
    // Check commands mentioned in README match actual CLI commands
    const cmdPattern = /`?(huaweicloud-devkit|hcloud|npx huaweicloud-devkit)\s+(\w+)/g;
    const mentionedCmds = new Set();
    while ((match = cmdPattern.exec(readme)) !== null) mentionedCmds.add(match[2]);
    ev.steps.push({ check: 'commands in README', commands: [...mentionedCmds], pass: mentionedCmds.size > 0 });
    
    // Check for placeholder/TODO content
    const hasPlaceholder = /TODO|FIXME|PLACEHOLDER|XXX/i.test(readme);
    ev.steps.push({ check: 'no placeholder content', pass: !hasPlaceholder });
    
    // Check CHANGELOG exists
    const changelogExists = existsSync(join(HDK, 'CHANGELOG.md'));
    ev.steps.push({ check: 'CHANGELOG.md exists', pass: changelogExists });
    
    if (changelogExists) {
      const changelog = readFileSync(join(HDK, 'CHANGELOG.md'), 'utf8');
      // Check latest version in CHANGELOG matches package.json
      const pkg = JSON.parse(readFileSync(join(HDK, 'package.json'), 'utf8'));
      const clVersionMatch = changelog.match(/##\s*(\d+\.\d+\.\d+)/);
      const clVersion = clVersionMatch ? clVersionMatch[1] : null;
      ev.steps.push({ check: 'CHANGELOG latest version matches package.json', changelogVersion: clVersion, packageVersion: pkg.version, pass: clVersion === pkg.version });
    }
    
    // Check README mentions all key features
    const keyFeatures = ['MCP', 'skill', 'doctor', 'safety'];
    const missingFeatures = keyFeatures.filter(f => !readme.toLowerCase().includes(f.toLowerCase()));
    ev.steps.push({ check: 'key features mentioned', missing: missingFeatures, pass: missingFeatures.length === 0 });
  }
  
  ev.verdict = ev.steps.every(s => s.pass) ? 'PASS' : 'FAIL';
  ev.summary = `${ev.steps.filter(s=>s.pass).length}/${ev.steps.length} checks passed`;
  results['D8-1'] = ev;
  console.log(`[D8-1] ${ev.verdict} - ${ev.summary}`);
}

// ─── D8-4: Guidance steps mechanically executable ───
function d8_4() {
  const ev = { caseId: 'D8-4', title: '引导步骤可机械执行', steps: [], verdict: 'PASS', summary: '' };
  
  const skillsRoot = join(PLUGIN, 'skills');
  const rootSkills = join(HDK, 'skills');
  const skillDirs = [];
  try { for (const d of readdirSync(skillsRoot, {withFileTypes:true})) if (d.isDirectory()) skillDirs.push(join(skillsRoot, d.name)); } catch {}
  try { for (const d of readdirSync(rootSkills, {withFileTypes:true})) if (d.isDirectory()) skillDirs.push(join(rootSkills, d.name)); } catch {}
  
  let totalChecks = 0, passedChecks = 0;
  
  for (const skillDir of skillDirs) {
    const skillMd = join(skillDir, 'SKILL.md');
    if (!existsSync(skillMd)) continue;
    const content = readFileSync(skillMd, 'utf8');
    const skillName = skillDir.split(/[\\/]/).pop();
    
    // Check for ambiguous language
    const ambiguousPatterns = [
      /maybe\s+try/i, /perhaps/i, /you might/i, /could possibly/i, /might want to/i,
      /大概/, /也许/, /可能需要/, /酌情/, /视情况/
    ];
    const ambiguous = ambiguousPatterns.some(p => p.test(content));
    
    // Check for concrete commands/steps
    const hasCommands = /```|hcloud |npx |python |node |curl |huaweicloud_/.test(content);
    
    // Check for clear step numbering or workflow
    const hasSteps = /(?:^|\n)\d+\.\s|## Workflow|## Procedure|### Step/i.test(content);
    
    // Check for conditional logic (if/else) that might be ambiguous
    const hasClearConditionals = /if.*then|若.*则|如果.*那么/i.test(content);
    
    // Check no "guess" or "infer" instructions
    const hasGuessInstr = /guess|infer|推测|猜测/i.test(content);
    
    const skillPass = !ambiguous && hasCommands && hasSteps && !hasGuessInstr;
    totalChecks += 4; if (!ambiguous) passedChecks++; if (hasCommands) passedChecks++; if (hasSteps) passedChecks++; if (!hasGuessInstr) passedChecks++;
    
    ev.steps.push({ skill: skillName, ambiguous: !ambiguous, hasCommands, hasSteps, noGuess: !hasGuessInstr, pass: skillPass });
  }
  
  ev.verdict = ev.steps.every(s => s.pass) ? 'PASS' : 'FAIL';
  ev.summary = `${ev.steps.length} skills, ${ev.steps.filter(s=>s.pass).length} fully mechanical, ${passedChecks}/${totalChecks} sub-checks passed`;
  results['D8-4'] = ev;
  console.log(`[D8-4] ${ev.verdict} - ${ev.summary}`);
}

// ─── D8-6: Chinese/English doc consistency ───
function d8_6() {
  const ev = { caseId: 'D8-6', title: '中英文文档一致', steps: [], verdict: 'PASS', summary: '' };
  
  const enPath = join(HDK, 'README.md');
  const zhPath = join(HDK, 'README.zh-CN.md');
  
  const enExists = existsSync(enPath);
  const zhExists = existsSync(zhPath);
  ev.steps.push({ check: 'README.md exists', pass: enExists });
  ev.steps.push({ check: 'README.zh-CN.md exists', pass: zhExists });
  
  if (enExists && zhExists) {
    const en = readFileSync(enPath, 'utf8');
    const zh = readFileSync(zhPath, 'utf8');
    
    // Extract section headers from both
    const enHeaders = (en.match(/^#+\s+.+$/gm) || []).map(h => h.trim());
    const zhHeaders = (zh.match(/^#+\s+.+$/gm) || []).map(h => h.trim());
    ev.steps.push({ check: 'section count similar', enCount: enHeaders.length, zhCount: zhHeaders.length, pass: Math.abs(enHeaders.length - zhHeaders.length) <= 5 });
    
    // Extract commands from both
    const cmdPattern = /`?(huaweicloud-devkit|hcloud|npx)\s+[\w-]+`?/g;
    const enCmds = new Set((en.match(cmdPattern) || []));
    const zhCmds = new Set((zh.match(cmdPattern) || []));
    const cmdDiff = [...enCmds].filter(c => !zhCmds.has(c)).concat([...zhCmds].filter(c => !enCmds.has(c)));
    ev.steps.push({ check: 'commands consistent', enCmds: [...enCmds], zhCmds: [...zhCmds], diff: cmdDiff, pass: cmdDiff.length <= 2 });
    
    // Extract version numbers
    const verPattern = /\d+\.\d+\.\d+/g;
    const enVers = new Set((en.match(verPattern) || []));
    const zhVers = new Set((zh.match(verPattern) || []));
    const verDiff = [...enVers].filter(v => !zhVers.has(v)).concat([...zhVers].filter(v => !enVers.has(v)));
    ev.steps.push({ check: 'version numbers consistent', enVers: [...enVers], zhVers: [...zhVers], diff: verDiff, pass: verDiff.length <= 2 });
    
    // Check key promises present in both
    const keyPromises = ['MCP', 'skill', 'doctor', 'safety', 'Node'];
    const enMissing = keyPromises.filter(p => !en.includes(p));
    const zhMissing = keyPromises.filter(p => !zh.includes(p));
    ev.steps.push({ check: 'key promises in both', enMissing, zhMissing, pass: enMissing.length === 0 && zhMissing.length === 0 });
    
    // Check code blocks count similar
    const enCodeBlocks = (en.match(/```/g) || []).length;
    const zhCodeBlocks = (zh.match(/```/g) || []).length;
    ev.steps.push({ check: 'code blocks count similar', en: enCodeBlocks, zh: zhCodeBlocks, pass: Math.abs(enCodeBlocks - zhCodeBlocks) <= 6 });
  }
  
  ev.verdict = ev.steps.every(s => s.pass) ? 'PASS' : 'FAIL';
  ev.summary = `${ev.steps.filter(s=>s.pass).length}/${ev.steps.length} checks passed`;
  results['D8-6'] = ev;
  console.log(`[D8-6] ${ev.verdict} - ${ev.summary}`);
}

// Run all
d8_1();
d8_4();
d8_6();

// Save results
import { writeFileSync as writeFileSync2, mkdirSync as mkdirSync2 } from 'node:fs';
const EVID = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-09-21-188.239.14.150/Windows/evidence';
for (const [id, data] of Object.entries(results)) {
  save(id, data);
}

console.log('\n=== Summary ===');
for (const [id, r] of Object.entries(results)) console.log(`  ${id}: ${r.verdict} - ${r.summary}`);
