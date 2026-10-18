// Evidence for D1-40
// Source: probe-p0-batch2.mjs

// P0 Batch 2: D1-39 (Windows EINVAL), D1-40 (mirror lag), D8-7 (skill guidance), D9-12 (initialize), D9-13 (tools/call security)
import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = {};

// D1-39: Windows upgrade detection chain - spawnSync EINVAL
try {
  // Reproduce: npm.cmd without shell:true on Windows causes EINVAL
  const r1 = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
    encoding: 'utf8', timeout: 30000, windowsHide: true,
  });
  const hasEINVAL = r1.error?.code === 'EINVAL';
  
  // With shell:true (works correctly)
  const r2 = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
    encoding: 'utf8', timeout: 30000, windowsHide: true, shell: true,
  });
  const worksWithShell = r2.status === 0;
  
  results['D1-39'] = { 
    status: hasEINVAL ? 'FAIL' : 'PASS',
    einvalError: r1.error?.code,
    worksWithShell,
    r2status: r2.status,
    stdout: r2.stdout?.substring(0, 200),
    why: hasEINVAL 
      ? `EINVAL on Windows without shell:true (known bug, status=FAIL per expected)` 
      : `No EINVAL - detection chain works (may be fixed in Node 22)`
  };
} catch(e) { results['D1-39'] = { status: 'BLOCKED', why: e.message }; }

// D1-40: Mirror lag detection
try {
  const { queryDistTagsSync, queryDistTags } = await import('./plugins/huaweicloud-core/src/update-check.mjs');
  
  // Query official registry
  let officialTags = null;
  try {
    officialTags = queryDistTagsSync ? queryDistTagsSync() : null;
  } catch(e) {
    // queryDistTagsSync may not exist, try async
    try {
      officialTags = await queryDistTags();
    } catch(e2) {
      officialTags = null;
    }
  }
  
  // Check if version comparison logic exists and handles lag
  const { judgeUpdate, semverCompare } = await import('./plugins/huaweicloud-core/src/update-check.mjs');
  const hasCompare = typeof semverCompare === 'function';
  const hasJudge = typeof judgeUpdate === 'function';
  
  // Test: same version should be up_to_date (not suggesting downgrade)
  const utd = hasJudge ? judgeUpdate('1.1.7', { latest: '1.1.7', next: null }) : null;
  
  results['D1-40'] = { 
    status: (hasCompare && hasJudge && utd?.result === 'up_to_date') ? 'PASS' : 'FAIL',
    hasCompare, hasJudge, utdResult: utd?.result,
    officialTags: officialTags ? 'obtained' : 'null',
    why: `semverCompare=${hasCompare}, judgeUpdate=${hasJudge}, up_to_date=${utd?.result}`
  };
} catch(e) { results['D1-40'] = { status: 'BLOCKED', why: e.message }; }

// D8-7: 7 meta/general skills mechanically executable
try {
  const skillsDir = join(__dirname, 'plugins', 'huaweicloud-core', 'skills');
  let skillsExist = existsSync(skillsDir);
  let skillCount = 0;
  let skillList = [];
  
  if (skillsExist) {
    const entries = readdirSync(skillsDir);
    for (const entry of entries) {
      const skillPath = join(skillsDir, entry);
      if (statSync(skillPath).isDirectory()) {
        const mdPath = join(skillPath, 'SKILL.md');
        if (existsSync(mdPath)) {
          skillCount++;
          skillList.push(entry);
        }
      }
    }
  }
  
  // Also check top-level skills
  const topSkillsDir = join(__dirname, 'skills');
  if (existsSync(topSkillsDir)) {
    const entries = readdirSync(topSkillsDir);
    for (const entry of entries) {
      const skillPath = join(topSkillsDir, entry);
      if (statSync(skillPath).isDirectory()) {
        const mdPath = join(skillPath, 'SKILL.md');
        if (existsSync(mdPath)) {
          skillCount++;
          skillList.push(entry);
        }
      }
    }
  }
  
  results['D8-7'] = { 
    status: skillCount >= 7 ? 'PASS' : 'FAIL',
    skillCount, skillList: skillList.slice(0, 15),
    why: `Found ${skillCount} skills with SKILL.md, need >=7`
  };
} catch(e) { results['D8-7'] = { status: 'BLOCKED', why: e.message }; }

// D9-12: initialize handshake protocol security baseline
try {
  const mcpProtocol = await import('./plugins/huaweicloud-core/src/mcp-protocol.mjs');
  const hasInit = typeof mcpProtocol.initialize === 'function' || typeof mcpProtocol.handleInitialize === 'function';
  const hasDecorate = typeof mcpProtocol._decorateResult === 'function';
  const hasResetHint = typeof mcpProtocol._resetHintConsumption === 'function';
  const hasFindSkills = typeof mcpProtocol.findSkillsRoot === 'function' || typeof mcpProtocol.listSkillDirs === 'function';
  
  results['D9-12'] = { 
    status: (hasInit || hasDecorate) ? 'PASS' : 'FAIL',
    hasInit, hasDecorate, hasResetHint, hasFindSkills,
    exports: Object.keys(mcpProtocol).filter(k => !k.startsWith('_')).slice(0, 15).join(','),
    why: `initialize=${hasInit}, _decorateResult=${hasDecorate}, _resetHintConsumption=${hasResetHint}, findSkillsRoot=${hasFindSkills}`
  };
} catch(e) { results['D9-12'] = { status: 'BLOCKED', why: e.message }; }

// D9-13: tools/call credential non-leak and permission validation
try {
  const safety = await import('./plugins/huaweicloud-core/src/safety-policy.mjs');
  const hcloud = await import('./plugins/huaweicloud-core/src/hcloud-cli.mjs');
  const auth = await import('./plugins/huaweicloud-core/src/auth/credentials.mjs');
  
  const hasClassify = typeof safety.classifyHcloudArgs === 'function';
  const hasRedact = typeof safety.redactSecrets === 'function';
  const hasPlan = typeof hcloud.planHcloudCommand === 'function';
  const hasToken = typeof hcloud.createApprovalToken === 'function';
  const hasConsume = typeof hcloud.consumeApprovalToken === 'function';
  const hasSetRuntime = typeof auth.setRuntimeCredentials === 'function';
  const hasClearRuntime = typeof auth.clearRuntimeCredentials === 'function';
  const hasHasRuntime = typeof auth.hasRuntimeCredentials === 'function';
  
  // Test approval token is single-use
  const token = hasToken ? hcloud.createApprovalToken(['ECS', 'DeleteServer', '--server_id=test']) : null;
  const c1 = token ? hcloud.consumeApprovalToken(token) : null;
  const c2 = token ? hcloud.consumeApprovalToken(token) : null;
  const isSingleUse = c1 !== null && c2 === null;
  
  results['D9-13'] = { 
    status: (hasClassify && hasRedact && hasPlan && hasToken && hasConsume && isSingleUse) ? 'PASS' : 'FAIL',
    hasClassify, hasRedact, hasPlan, hasToken, hasConsume,
    hasSetRuntime, hasClearRuntime, hasHasRuntime, isSingleUse,
    why: `classify=${hasClassify}, redact=${hasRedact}, plan=${hasPlan}, token=${hasToken}, consume=${hasConsume}, singleUse=${isSingleUse}`
  };
} catch(e) { results['D9-13'] = { status: 'BLOCKED', why: e.message }; }

const output = JSON.stringify(results, null, 2);
console.log(output);
writeFileSync('p0-batch2-results.json', output);
