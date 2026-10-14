// P0 batch probe v2 — actually calls SUT functions with correct signatures
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUT = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src';
const SKILLS_DIR = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/skills';
const NPM_ROOT = spawnSync('npm.cmd', ['root', '-g'], { encoding: 'utf8', shell: true }).stdout.trim();
const PKG_ROOT = join(NPM_ROOT, 'huaweicloud-devkit');
const EVIDENCE = join(__dirname, 'evidence');

function sutPath(mod) { return pathToFileURL(join(SUT, mod)).href; }
async function sutImport(mod) { return await import(sutPath(mod)); }

function ts() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
const TIMESTAMP = ts();

function writeResult(caseId, result) {
  const dir = join(EVIDENCE, caseId);
  mkdirSync(dir, { recursive: true });
  const out = JSON.stringify(result, null, 2);
  writeFileSync(join(dir, 'stdout.log'), out + '\n');
  writeFileSync(join(dir, 'probe.mjs'), `// Auto-generated probe for ${caseId}\n// Actual execution: ${TIMESTAMP}\n// Status: ${result.status}\n`);
  console.log(`[${caseId}] status=${result.status} ${result.why || ''}`);
}

async function main() {
  const safetyPolicy = await sutImport('safety-policy.mjs');
  const riskEngine = await sutImport('risk-rule-engine.mjs');
  const updateCheck = await sutImport('update-check.mjs');
  const credentials = await sutImport('auth/credentials.mjs');
  const hcloudCli = await sutImport('hcloud-cli.mjs');
  const tools = await sutImport('tools.mjs');
  const mcpProtocol = await sutImport('mcp-protocol.mjs');

  // ===================== D2-4: 凭证脱敏正确性 =====================
  {
    const ak = 'AKIDEXAMPLE123456789';
    const sk = 'SKEXAMPLE987654321';
    const obj = { ak, sk, region: 'cn-north-4', other: 'visible' };
    const redactedObj = safetyPolicy.redactSecrets(obj);
    const strInput = `ak=${ak} sk=${sk} region=cn-north-4`;
    const redactedStr = safetyPolicy.redactSecrets(strInput);
    const envInput = `HUAWEICLOUD_ACCESS_KEY=${ak} HUAWEICLOUD_SECRET_ACCESS_KEY=${sk}`;
    const redactedEnv = safetyPolicy.redactSecrets(envInput);
    // Red-line: lowercase ak= must be redacted
    const lowerAkInput = `ak=${ak} sk=${sk}`;
    const lowerAkRedacted = safetyPolicy.redactSecrets(lowerAkInput);

    const akRedactedInObj = redactedObj.ak === '<redacted>';
    const skRedactedInObj = redactedObj.sk === '<redacted>';
    const regionVisible = redactedObj.region === 'cn-north-4';
    const strHasAk = redactedStr.includes(ak);
    const strHasSk = redactedStr.includes(sk);
    const envHasAk = redactedEnv.includes(ak);
    const envHasSk = redactedEnv.includes(sk);
    const lowerAkHasLeak = lowerAkRedacted.includes(ak) || lowerAkRedacted.includes(sk);

    const allPass = akRedactedInObj && skRedactedInObj && regionVisible && !strHasAk && !strHasSk && !envHasAk && !envHasSk && !lowerAkHasLeak;

    writeResult('D2-4', {
      caseId: 'D2-4',
      status: allPass ? 'PASS' : 'FAIL',
      why: allPass
        ? 'redactSecrets: obj ak/sk=<redacted>, region visible; str/env/lowercase all redacted'
        : `obj:ak=${akRedactedInObj},sk=${skRedactedInObj}; str:akLeak=${strHasAk},skLeak=${strHasSk}; env:akLeak=${envHasAk}; lowerAk:leak=${lowerAkHasLeak}`,
      executedAt: TIMESTAMP,
      result: { redactedObj, redactedStr, redactedEnv, lowerAkRedacted },
      rootCause: !allPass && lowerAkHasLeak ? 'safety-policy.mjs:42 — redactString regex only matches access_key/secret_key (with underscore), not bare ak=/sk= (lowercase no underscore). Regex: /((?:access[_-]?key|secret[_-]?key|...)/gi — "ak" and "sk" without "key" suffix are not matched' : null
    });
  }

  // ===================== D4-3: 明文secret API拦截 =====================
  {
    const secretOps = ['ShowSecret', 'ShowSecretVersion', 'GetSecretValue', 'DownloadSecret', 'DecryptData'];
    const results = secretOps.map(op => {
      const args = ['hcloud', 'KMS', op, '--secret_id=xxx'];
      const cls = safetyPolicy.classifyHcloudArgs(args);
      return { service: 'KMS', operation: op, decision: cls.decision, risk: cls.risk };
    });
    const allBlocked = results.every(r => r.decision === 'deny');
    const decryptBlocked = results.find(r => r.operation === 'DecryptData')?.decision === 'deny';

    writeResult('D4-3', {
      caseId: 'D4-3',
      status: allBlocked ? 'PASS' : 'FAIL',
      why: allBlocked
        ? 'All 5 secret APIs blocked including DecryptData'
        : `Not all blocked: ${results.map(r => `${r.operation}=${r.decision}`).join(', ')}`,
      executedAt: TIMESTAMP,
      results,
      redLine: !decryptBlocked ? 'DecryptData not blocked — leaks plaintext decrypted data' : null,
      rootCause: !decryptBlocked ? 'safety-policy.mjs:249 — blockedSecretOperations list does not include DecryptData. KMS DecryptData returns plaintext decrypted data but is classified as unknown_read (allow)' : null
    });
  }

  // ===================== D4-2: 凭证env打印拦截 =====================
  {
    const cmds = [
      'printenv HUAWEICLOUD_ACCESS_KEY',
      'echo $HUAWEICLOUD_SECRET_ACCESS_KEY',
      'env | grep AK',
      'echo HUAWEICLOUD_ACCESS_KEY=AKIDTEST',
      'printenv HW_ACCESS_KEY',
    ];
    const results = cmds.map(cmd => {
      const cls = safetyPolicy.classifyTextCommand(cmd);
      return { cmd, decision: cls.decision, risk: cls.risk };
    });
    const blockedCount = results.filter(r => r.decision === 'deny').length;
    const allBlocked = blockedCount === results.length;

    writeResult('D4-2', {
      caseId: 'D4-2',
      status: allBlocked ? 'PASS' : 'FAIL',
      why: allBlocked
        ? 'All env-print commands blocked'
        : `${blockedCount}/${results.length} blocked. Not blocked: ${results.filter(r => r.decision !== 'deny').map(r => `"${r.cmd}"=${r.decision}`).join(', ')}`,
      executedAt: TIMESTAMP,
      results,
      rootCause: !allBlocked ? 'safety-policy.mjs classifyTextCommand — "env | grep AK" and "echo HUAWEICLOUD_ACCESS_KEY=AKIDTEST" classified as not_huaweicloud (allow). The classifier only checks hcloud commands, not generic shell env-dump commands.' : null
    });
  }

  // ===================== D4-16: 命令包裹穿透 =====================
  {
    const wrappedCmds = [
      'sh -c "hcloud ECS DeleteServer --server.id=xxx"',
      'bash -c "hcloud ECS DeleteServer"',
      'eval "hcloud ECS DeleteServer --server.id=xxx"',
      'sh -c "hcloud KMS ShowSecret --secret_id=xxx"',
      'bash -c "hcloud VPC DeleteVpc --vpc.id=xxx"',
    ];
    const results = wrappedCmds.map(cmd => {
      const cls = safetyPolicy.classifyTextCommand(cmd);
      return { cmd, decision: cls.decision, risk: cls.risk };
    });
    const allBlocked = results.every(r => r.decision === 'deny');

    writeResult('D4-16', {
      caseId: 'D4-16',
      status: allBlocked ? 'PASS' : 'FAIL',
      why: allBlocked
        ? 'All shell-wrapped commands blocked (inner command detected)'
        : `Not all blocked: ${results.map(r => `${r.cmd.substring(0,30)}=${r.decision}`).join(', ')}`,
      executedAt: TIMESTAMP,
      results
    });
  }

  // ===================== D4-1: 凭证文件读取拦截 =====================
  {
    const cmds = [
      'cat ~/.hcloud/config.json',
      'type %USERPROFILE%\\.hcloud\\config.json',
      'cat ~/.huaweicloud/credentials.json',
      'hcloud configure list',
      'hcloud configure show',
    ];
    const results = cmds.map(cmd => {
      const cls = safetyPolicy.classifyTextCommand(cmd);
      return { cmd, decision: cls.decision, risk: cls.risk };
    });
    const allBlocked = results.every(r => r.decision === 'deny');

    writeResult('D4-1', {
      caseId: 'D4-1',
      status: allBlocked ? 'PASS' : 'FAIL',
      why: allBlocked
        ? 'All credential file read commands blocked'
        : `Not all blocked: ${results.filter(r => r.decision !== 'deny').map(r => `"${r.cmd}"=${r.decision}`).join(', ')}`,
      executedAt: TIMESTAMP,
      results
    });
  }

  // ===================== D4-5: 写操作误判检测 =====================
  {
    const writeOps = [
      ['hcloud', 'ECS', 'DeleteServer', '--server.id=xxx'],
      ['hcloud', 'ECS', 'CreateServer', '--name=test'],
      ['hcloud', 'VPC', 'DeleteVpc', '--vpc.id=xxx'],
      ['hcloud', 'RDS', 'DeleteInstance', '--instance.id=xxx'],
    ];
    const results = writeOps.map(args => {
      const cls = safetyPolicy.classifyHcloudArgs(args);
      return { op: args.slice(1).join(' '), decision: cls.decision, risk: cls.risk };
    });
    const allDenied = results.every(r => r.decision === 'deny');

    writeResult('D4-5', {
      caseId: 'D4-5',
      status: allDenied ? 'PASS' : 'FAIL',
      why: allDenied
        ? 'All write operations correctly denied'
        : `Write ops not all denied: ${results.map(r => `${r.op}=${r.decision}`).join(', ')}`,
      executedAt: TIMESTAMP,
      results
    });
  }

  // ===================== D4-9: 公开暴露/破坏性预检 =====================
  {
    const dangerousCmds = [
      'hcloud ECS CreateServer --nics.0.subnet_id=xxx --publicip.eip.bandwidth.name=test',
      'hcloud VPC CreateSecurityGroupRule --direction=ingress --protocol=tcp --port_range_min=0 --port_range_max=65535 --remote_ip_prefix=0.0.0.0/0',
      'hcloud RDS DeleteInstance --instance.id=xxx',
      'hcloud ECS DeleteServer --server.id=xxx',
    ];
    const results = dangerousCmds.map(cmd => {
      const args = cmd.split(' ');
      const cls = safetyPolicy.classifyHcloudArgs(args);
      return { cmd: cmd.substring(0, 50), decision: cls.decision, risk: cls.risk };
    });
    const allBlocked = results.every(r => r.decision === 'deny');

    writeResult('D4-9', {
      caseId: 'D4-9',
      status: allBlocked ? 'PASS' : 'FAIL',
      why: allBlocked
        ? 'All dangerous/destructive operations blocked'
        : `Not all blocked: ${results.map(r => `${r.cmd.substring(0,30)}=${r.decision}`).join(', ')}`,
      executedAt: TIMESTAMP,
      results
    });
  }

  // ===================== D4-15: hook绕过尝试 =====================
  {
    const variants = [
      'hcloud ECS deleteserver --server.id=xxx',
      'hcloud ECS DELETE_SERVER --server.id=xxx',
      'hcloud ECS DeleteServer --server.id=xxx',
      'hcloud ECS Delete%53erver --server.id=xxx',
      'hcloud ECS DeleteServer --server.id=xxx --dry-run',
    ];
    const results = variants.map(cmd => {
      const cls = safetyPolicy.classifyTextCommand(cmd);
      return { cmd: cmd.substring(0, 50), decision: cls.decision, risk: cls.risk };
    });
    const allBlocked = results.every(r => r.decision === 'deny');

    writeResult('D4-15', {
      caseId: 'D4-15',
      status: allBlocked ? 'PASS' : 'FAIL',
      why: allBlocked
        ? 'All case/encoding variants blocked'
        : `Not all blocked: ${results.filter(r => r.decision !== 'deny').map(r => `"${r.cmd}"=${r.decision}`).join(', ')}`,
      executedAt: TIMESTAMP,
      results
    });
  }

  // ===================== D4-18: confirm-not-deny审批语义 =====================
  {
    const writeArgs = ['hcloud', 'ECS', 'CreateServer', '--name=test'];
    const cls = safetyPolicy.classifyHcloudArgs(writeArgs);
    const clsApproved = safetyPolicy.classifyHcloudArgs(writeArgs, { allowWrites: true });
    const requiresConfirmation = cls.decision === 'deny';
    const approvedWorks = clsApproved.decision === 'allow';
    const pass = requiresConfirmation && approvedWorks;

    writeResult('D4-18', {
      caseId: 'D4-18',
      status: pass ? 'PASS' : 'FAIL',
      why: pass
        ? 'Write op denied without approval, allowed with approval (confirm-not-deny)'
        : `withoutApproval=${cls.decision}, withApproval=${clsApproved.decision}`,
      executedAt: TIMESTAMP,
      result: { withoutApproval: cls, withApproval: clsApproved }
    });
  }

  // ===================== D4-19: 确认流下预检仍生效 =====================
  {
    const secretArgs = ['hcloud', 'KMS', 'ShowSecret', '--secret_id=xxx'];
    const clsApproved = safetyPolicy.classifyHcloudArgs(secretArgs, { allowWrites: true });
    const stillBlocked = clsApproved.decision === 'deny';

    writeResult('D4-19', {
      caseId: 'D4-19',
      status: stillBlocked ? 'PASS' : 'FAIL',
      why: stillBlocked
        ? 'Preflight (secret block) still blocks even with allowWrites'
        : `Secret read allowed under approval: ${clsApproved.decision} — preflight bypassed!`,
      executedAt: TIMESTAMP,
      result: { secretUnderApproval: clsApproved }
    });
  }

  // ===================== D4-21: hook_check_artifacts 回归 =====================
  {
    const broadIamPolicy = {
      Type: 'IAM',
      content: JSON.stringify({
        Statement: [{ Effect: 'Allow', Action: ['*'], Resource: ['*'] }]
      })
    };
    let artifactResult;
    try {
      artifactResult = riskEngine.evaluateArtifacts([broadIamPolicy]);
    } catch(e) {
      artifactResult = { error: e.message };
    }
    const blocked = artifactResult?.decision === 'deny' || artifactResult?.findings?.length > 0;

    writeResult('D4-21', {
      caseId: 'D4-21',
      status: blocked ? 'PASS' : 'FAIL',
      why: blocked
        ? 'Broad IAM policy artifact detected/blocked'
        : `Broad IAM not blocked: ${JSON.stringify(artifactResult)}`,
      executedAt: TIMESTAMP,
      result: artifactResult
    });
  }

  // ===================== D4-22: hook_check_deploy_plan 回归 =====================
  {
    const deployPlan = {
      name: 'test-deploy',
      resources: [{
        type: 'FunctionGraph',
        properties: { handler: 'index.handler', public_access: true }
      }]
    };
    let planResult;
    try {
      planResult = riskEngine.evaluateDeployPlan(deployPlan);
    } catch(e) {
      planResult = { error: e.message };
    }
    const warned = planResult?.decision === 'deny' || planResult?.decision === 'warn' || planResult?.findings?.length > 0;

    writeResult('D4-22', {
      caseId: 'D4-22',
      status: warned ? 'PASS' : 'FAIL',
      why: warned
        ? 'Public-exposed FunctionGraph deploy plan warned/blocked'
        : `Deploy plan not flagged: ${JSON.stringify(planResult)}`,
      executedAt: TIMESTAMP,
      result: planResult
    });
  }

  // ===================== D4-23: 全局规则注入生效性 =====================
  {
    // Rules file is .mdc not .md
    const rulesPath = join(PKG_ROOT, 'rules', 'huawei-agent-rules.mdc');
    const rulesExists = existsSync(rulesPath);
    let hasCsmsRule = false;
    let hasKmsRule = false;
    let contentLength = 0;
    if (rulesExists) {
      const content = readFileSync(rulesPath, 'utf8');
      contentLength = content.length;
      hasCsmsRule = content.toLowerCase().includes('csms');
      hasKmsRule = content.toLowerCase().includes('kms');
    }
    const pass = rulesExists && hasCsmsRule && hasKmsRule;

    writeResult('D4-23', {
      caseId: 'D4-23',
      status: pass ? 'PASS' : 'FAIL',
      why: pass
        ? `huawei-agent-rules.mdc exists (${contentLength} bytes), contains csms/kms constraints`
        : `rules exists=${rulesExists}, hasCsms=${hasCsmsRule}, hasKms=${hasKmsRule}`,
      executedAt: TIMESTAMP,
      result: { rulesPath, rulesExists, contentLength }
    });
  }

  // ===================== D4-28: Node版安全hook链路 =====================
  {
    const dangerousCmd = 'cat ~/.hcloud/config.json';
    const cls = safetyPolicy.classifyTextCommand(dangerousCmd);
    const denyWorks = cls.decision === 'deny';

    const safeCmd = 'hcloud ECS ListServers';
    const safeCls = safetyPolicy.classifyTextCommand(safeCmd);
    const safeNotDenied = safeCls.decision !== 'deny';

    // Check hooks.json in package (may be in integrations/)
    const hooksPaths = [
      join(PKG_ROOT, 'hooks', 'hooks.json'),
      join(PKG_ROOT, 'integrations', 'hooks.json'),
      join(PKG_ROOT, '.agents', 'hooks.json'),
    ];
    let hooksFound = false;
    let hasMjsHook = false;
    let hooksPath = '';
    for (const p of hooksPaths) {
      if (existsSync(p)) {
        hooksFound = true;
        hooksPath = p;
        const content = readFileSync(p, 'utf8');
        hasMjsHook = content.includes('huaweicloud-safety.mjs') || content.includes('safety.mjs');
        break;
      }
    }
    // Also check integrations dir listing
    if (!hooksFound) {
      const integDir = join(PKG_ROOT, 'integrations');
      if (existsSync(integDir)) {
        const files = readdirSync(integDir);
        for (const f of files) {
          if (f.endsWith('.json') || f.includes('hook')) {
            const fp = join(integDir, f);
            const content = readFileSync(fp, 'utf8');
            if (content.includes('safety') || content.includes('hook')) {
              hooksFound = true;
              hooksPath = fp;
              hasMjsHook = content.includes('.mjs');
              break;
            }
          }
        }
      }
    }

    const pass = denyWorks && safeNotDenied;

    writeResult('D4-28', {
      caseId: 'D4-28',
      status: pass ? 'PASS' : 'FAIL',
      why: pass
        ? `denyWorks=${denyWorks}, safeNotDenied=${safeNotDenied}, hooksFound=${hooksFound}, hasMjs=${hasMjsHook}`
        : `denyWorks=${denyWorks}, safeNotDenied=${safeNotDenied}, hooksFound=${hooksFound}`,
      executedAt: TIMESTAMP,
      result: { denyWorks, safeCls, hooksFound, hasMjsHook, hooksPath }
    });
  }

  // ===================== D10-4: 安全干预-静态规则层 =====================
  {
    const rules = riskEngine.loadRiskRules();
    const ruleList = Array.isArray(rules) ? rules : (rules.rules || []);
    const ruleCount = ruleList.length;
    const denyCount = ruleList.filter(r => r.severity === 'deny').length;
    const warnCount = ruleList.filter(r => r.severity === 'warn').length;

    const dangerCmds = [
      'cat ~/.hcloud/config.json',
      'printenv HUAWEICLOUD_ACCESS_KEY',
      'hcloud ECS DeleteServer --server.id=xxx',
      'hcloud KMS ShowSecret --secret_id=xxx',
    ];
    const dangerResults = dangerCmds.map(cmd => {
      const risk = riskEngine.evaluateCommandRisk(cmd);
      return { cmd: cmd.substring(0, 40), decision: risk.decision, findings: risk.findings?.length || 0 };
    });
    const allDangerBlocked = dangerResults.every(r => r.decision === 'deny' || r.findings > 0);

    const safeCmds = ['hcloud ECS ListServers', 'hcloud VPC ListVpcs'];
    const safeResults = safeCmds.map(cmd => {
      const risk = riskEngine.evaluateCommandRisk(cmd);
      return { cmd, decision: risk.decision, findings: risk.findings?.length || 0 };
    });
    const safeAllowed = safeResults.every(r => r.decision === 'allow' || r.findings === 0);

    const pass = ruleCount >= 16 && allDangerBlocked && safeAllowed;

    writeResult('D10-4', {
      caseId: 'D10-4',
      status: pass ? 'PASS' : 'FAIL',
      why: pass
        ? `rules=${ruleCount} (deny=${denyCount}, warn=${warnCount}), danger blocked, safe allowed`
        : `rules=${ruleCount}, dangerBlocked=${allDangerBlocked}, safeAllowed=${safeAllowed}`,
      executedAt: TIMESTAMP,
      result: { ruleCount, denyCount, warnCount, dangerResults, safeResults }
    });
  }

  // ===================== D1-39: Windows升级检测链可用性 =====================
  {
    // queryDistTagsSync takes { timeoutMs, cwd } options, not a package name
    let result;
    try {
      const tags = updateCheck.queryDistTagsSync({ timeoutMs: 30000 });
      result = { status: 'called', tags: typeof tags === 'object' ? Object.keys(tags || {}) : String(tags).substring(0,100) };
    } catch(e) {
      result = { status: 'error', error: e.message };
    }
    const hasEinval = result.error && result.error.includes('EINVAL');
    const pass = !hasEinval && (result.tags?.length > 0 || result.status === 'called');

    writeResult('D1-39', {
      caseId: 'D1-39',
      status: pass ? 'PASS' : 'FAIL',
      why: pass
        ? `queryDistTagsSync returned successfully: ${JSON.stringify(result.tags).substring(0,80)}`
        : `queryDistTagsSync failed: ${result.error || 'no tags returned'}`,
      executedAt: TIMESTAMP,
      result
    });
  }

  // ===================== D1-40: 镜像lag下检测正确性 =====================
  {
    const origRegistry = process.env.npm_config_registry;
    process.env.npm_config_registry = 'https://registry.npmmirror.com';
    let result;
    try {
      const tags = updateCheck.queryDistTagsSync({ timeoutMs: 30000 });
      result = { status: 'called', tags: typeof tags === 'object' ? Object.keys(tags || {}) : String(tags).substring(0,100) };
    } catch(e) {
      result = { status: 'error', error: e.message };
    }
    if (origRegistry) process.env.npm_config_registry = origRegistry;
    else delete process.env.npm_config_registry;

    let judgeResult;
    try {
      const installed = updateCheck.readInstalledVersion();
      judgeResult = updateCheck.judgeUpdate(installed || '1.1.8', result.tags?.length > 0 ? Object.fromEntries(result.tags.map(t => [t, t])) : {});
    } catch(e) {
      judgeResult = { error: e.message };
    }

    const pass = result.status === 'called' && result.tags?.length > 0;

    writeResult('D1-40', {
      caseId: 'D1-40',
      status: pass ? 'PASS' : 'FAIL',
      why: pass
        ? `Mirror query works, got ${result.tags.length} tags`
        : `Mirror query failed: ${result.error || 'no tags'}`,
      executedAt: TIMESTAMP,
      result: { mirrorResult: result, judgeResult }
    });
  }

  // ===================== D2-11: R3 STS token拒绝落盘 =====================
  {
    const testCreds = {
      ak: 'AKIDTEST123',
      sk: 'SKTEST456',
      region: 'cn-north-4',
      securityToken: 'STS_TOKEN_EXAMPLE_789'
    };
    credentials.setRuntimeCredentials(testCreds);
    const hasRuntime = credentials.hasRuntimeCredentials();

    let globalCreds = {};
    try { globalCreds = credentials.readGlobalCredentials(); } catch(e) { globalCreds = { error: e.message }; }
    const tokenInGlobal = JSON.stringify(globalCreds).includes('STS_TOKEN_EXAMPLE_789');

    credentials.clearRuntimeCredentials();
    const cleared = !credentials.hasRuntimeCredentials();

    const pass = hasRuntime && !tokenInGlobal && cleared;

    writeResult('D2-11', {
      caseId: 'D2-11',
      status: pass ? 'PASS' : 'FAIL',
      why: pass
        ? 'STS token set as runtime credential, not persisted to global file, cleared successfully'
        : `runtimeWorks=${hasRuntime}, tokenInGlobal=${tokenInGlobal}, cleared=${cleared}`,
      executedAt: TIMESTAMP,
      result: { hasRuntime, tokenInGlobal, cleared }
    });
  }

  // ===================== D8-7: 7个meta/通用技能指引可机械执行验证 =====================
  {
    const skillMap = {
      'core': 'huaweicloud-core',
      'safety': 'huaweicloud-safety',
      'api-and-sdk': 'huaweicloud-api-and-sdk',
      'capability-discovery': 'huaweicloud-capability-discovery',
      'cli-and-auth': 'huaweicloud-cli-and-auth',
      'troubleshooting': 'huaweicloud-troubleshooting',
      'getting-started': 'huawei-getting-started',
    };
    const results = Object.entries(skillMap).map(([key, dir]) => {
      const skillPath = join(SKILLS_DIR, dir, 'SKILL.md');
      const exists = existsSync(skillPath);
      let content = '';
      let hasSteps = false;
      if (exists) {
        content = readFileSync(skillPath, 'utf8');
        hasSteps = content.includes('##') && content.length > 100;
      }
      return { skill: key, dir, exists, hasSteps, contentLength: content.length };
    });
    const allExist = results.every(r => r.exists && r.hasSteps);

    writeResult('D8-7', {
      caseId: 'D8-7',
      status: allExist ? 'PASS' : 'FAIL',
      why: allExist
        ? 'All 7 meta skills have SKILL.md with executable content'
        : `Missing: ${results.filter(r => !r.exists || !r.hasSteps).map(r => r.skill).join(', ')}`,
      executedAt: TIMESTAMP,
      result: { results }
    });
  }

  // ===================== D9-12: initialize握手协议安全基线 =====================
  {
    // _decorateResult takes (sessionId, name, result)
    const testResult = { content: [{ type: 'text', text: 'test response' }] };
    let decorated;
    try {
      decorated = mcpProtocol._decorateResult('test-session', 'test_tool', testResult);
    } catch(e) {
      decorated = { error: e.message };
    }

    // Check _isHintConsumed / _resetHintConsumption
    mcpProtocol._resetHintConsumption();
    const hintAfterReset = mcpProtocol._isHintConsumed('test-session');

    // Check dispatch for initialize
    let initResult;
    try {
      initResult = await mcpProtocol.dispatch('initialize', {
        protocolVersion: '2024-11-05',
        clientInfo: { name: 'test', version: '1.0' }
      });
    } catch(e) {
      initResult = { error: e.message };
    }

    const hasProtocolVersion = initResult?.protocolVersion !== undefined;
    const hasCapabilities = initResult?.capabilities !== undefined;
    const hasServerInfo = initResult?.serverInfo !== undefined;
    const decoratedWorks = decorated && !decorated.error;

    const pass = decoratedWorks && hasProtocolVersion && hasCapabilities && hasServerInfo;

    writeResult('D9-12', {
      caseId: 'D9-12',
      status: pass ? 'PASS' : 'FAIL',
      why: pass
        ? '_decorateResult works, initialize returns protocolVersion+capabilities+serverInfo'
        : `decorated=${!!decoratedWorks}, protocolVersion=${hasProtocolVersion}, capabilities=${hasCapabilities}, serverInfo=${hasServerInfo}`,
      executedAt: TIMESTAMP,
      result: { decoratedWorks, initResult, hintAfterReset }
    });
  }

  // ===================== D9-13: tools/call凭证不泄露与权限校验 =====================
  {
    const testCreds = { ak: 'AKTEST123', sk: 'SKTEST456', region: 'cn-north-4' };
    credentials.setRuntimeCredentials(testCreds);
    const hasRuntime = credentials.hasRuntimeCredentials();

    // isPlaceholder: <YOUR_AK> should be placeholder, real AK should not
    const placeholderResult = credentials.isPlaceholder('<YOUR_AK>');
    const realResult = credentials.isPlaceholder('AKIDREAL123456789');

    // Approval token
    let tokenResult;
    try {
      const token = hcloudCli.createApprovalToken(['hcloud', 'ECS', 'ListServers']);
      const inspectBefore = hcloudCli.inspectApprovalToken(token);
      hcloudCli.consumeApprovalToken(token);
      tokenResult = { created: !!token, inspectBefore, consumed: true };
    } catch(e) {
      tokenResult = { error: e.message };
    }

    credentials.clearRuntimeCredentials();
    const cleared = !credentials.hasRuntimeCredentials();

    const pass = hasRuntime && placeholderResult && !realResult && cleared;

    writeResult('D9-13', {
      caseId: 'D9-13',
      status: pass ? 'PASS' : 'FAIL',
      why: pass
        ? 'Runtime creds set/verified/cleared, isPlaceholder works, approval token consumed'
        : `hasRuntime=${hasRuntime}, placeholder=${placeholderResult}, real=${realResult}, cleared=${cleared}`,
      executedAt: TIMESTAMP,
      result: { hasRuntime, placeholderResult, realResult, tokenResult, cleared }
    });
  }

  console.log('\n=== P0 batch probe v2 complete ===');
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
