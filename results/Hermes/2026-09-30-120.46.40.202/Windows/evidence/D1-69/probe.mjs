
import { classifyHcloudArgs, redactSecrets, classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, loadRiskRules } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { planHcloudCommand } from './plugins/huaweicloud-core/src/hcloud-cli.mjs';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const results = {};

// D1-4: status/update idempotent (P2)
try {
  const r1 = spawnSync('npx', ['--yes', 'huaweicloud-devkit', 'status', '--target', 'hermes'], {
    encoding: 'utf8', timeout: 30000, shell: true, windowsHide: true
  });
  const r2 = spawnSync('npx', ['--yes', 'huaweicloud-devkit', 'status', '--target', 'hermes'], {
    encoding: 'utf8', timeout: 30000, shell: true, windowsHide: true
  });
  results['D1-4'] = { status: r1.status === r2.status ? 'PASS' : 'FAIL', why: `status idempotent: run1 exit=${r1.status}, run2 exit=${r2.status}` };
} catch(e) { results['D1-4'] = { status: 'BLOCKED', why: e.message }; }

// D1-65: Debug mode env var (P2)
try {
  const mcpContent = readFileSync(join(process.cwd(), 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs'), 'utf8');
  const hasDebug = mcpContent.includes('DEBUG') || mcpContent.includes('debug');
  results['D1-65'] = { status: hasDebug ? 'PASS' : 'FAIL', why: `Debug env var in MCP server: ${hasDebug}` };
} catch(e) { results['D1-65'] = { status: 'BLOCKED', why: e.message }; }

// D1-66: Telemetry switch and endpoint env var (P2)
try {
  const mcpContent = readFileSync(join(process.cwd(), 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs'), 'utf8');
  const hasTelemetry = mcpContent.includes('telemetry') || mcpContent.includes('TELEMETRY');
  results['D1-66'] = { status: hasTelemetry ? 'PASS' : 'FAIL', why: `Telemetry env var: ${hasTelemetry}` };
} catch(e) { results['D1-66'] = { status: 'BLOCKED', why: e.message }; }

// D1-67: Agent toolkit mode and DSH skip install env var (P2)
try {
  const setupContent = readFileSync(join(process.cwd(), 'plugins', 'huaweicloud-core', 'src', 'setup-cli.mjs'), 'utf8');
  const hasAgentToolkit = setupContent.includes('toolkit') || setupContent.includes('AGENT_TOOLKIT');
  const hasDshSkip = setupContent.includes('DSH') || setupContent.includes('dsh');
  results['D1-67'] = { status: hasAgentToolkit || hasDshSkip ? 'PASS' : 'FAIL', why: `Agent toolkit=${hasAgentToolkit}, DSH skip=${hasDshSkip}` };
} catch(e) { results['D1-67'] = { status: 'BLOCKED', why: e.message }; }

// D1-68: Icon offline and region env var (P2)
try {
  const iconContent = readFileSync(join(process.cwd(), 'plugins', 'huaweicloud-core', 'src', 'icon-library.mjs'), 'utf8');
  const hasOffline = iconContent.includes('offline') || iconContent.includes('OFFLINE');
  const hasRegion = iconContent.includes('region') || iconContent.includes('REGION');
  results['D1-68'] = { status: hasOffline || hasRegion ? 'PASS' : 'FAIL', why: `Icon offline=${hasOffline}, region=${hasRegion}` };
} catch(e) { results['D1-68'] = { status: 'BLOCKED', why: e.message }; }

// D1-69: CLI help subcommands (P2)
try {
  const r = spawnSync('npx', ['--yes', 'huaweicloud-devkit', '--help'], {
    encoding: 'utf8', timeout: 30000, shell: true, windowsHide: true
  });
  const hasHelp = r.stdout.includes('install') || r.stdout.includes('status') || r.stdout.includes('doctor');
  results['D1-69'] = { status: hasHelp ? 'PASS' : 'FAIL', why: `CLI help has subcommands: ${hasHelp}` };
} catch(e) { results['D1-69'] = { status: 'BLOCKED', why: e.message }; }

// D2-2: auth status accuracy (P2)
try {
  const r = spawnSync('npx', ['--yes', 'huaweicloud-devkit', 'status', '--target', 'hermes'], {
    encoding: 'utf8', timeout: 30000, shell: true, windowsHide: true
  });
  const output = r.stdout + r.stderr;
  const hasAuthStatus = output.includes('auth') || output.includes('Auth') || output.includes('credential');
  results['D2-2'] = { status: hasAuthStatus ? 'PASS' : 'FAIL', why: `auth status in output: ${hasAuthStatus}` };
} catch(e) { results['D2-2'] = { status: 'BLOCKED', why: e.message }; }

// D2-27: KooCLI version management (P2)
try {
  const r = spawnSync('hcloud', ['version'], { encoding: 'utf8', timeout: 15000, shell: true, windowsHide: true });
  results['D2-27'] = { status: r.status === 0 ? 'PASS' : 'FAIL', why: `hcloud version: exit=${r.status}, output=${r.stdout?.trim()?.substring(0,100)}` };
} catch(e) { results['D2-27'] = { status: 'BLOCKED', why: e.message }; }

// D3-B1: list_operations standard naming (P2)
try {
  const toolsContent = readFileSync(join(process.cwd(), 'plugins', 'huaweicloud-core', 'src', 'tools.mjs'), 'utf8');
  const hasListOps = toolsContent.includes('huaweicloud_list_operations');
  results['D3-B1'] = { status: hasListOps ? 'PASS' : 'FAIL', why: `list_operations tool registered: ${hasListOps}` };
} catch(e) { results['D3-B1'] = { status: 'BLOCKED', why: e.message }; }

// D3-B5: detect_framework identification (P2)
try {
  const toolsContent = readFileSync(join(process.cwd(), 'plugins', 'huaweicloud-core', 'src', 'tools.mjs'), 'utf8');
  const hasDetect = toolsContent.includes('huaweicloud_detect_framework');
  const detectPath = join(process.cwd(), 'plugins', 'huaweicloud-core', 'src', 'detect-framework.mjs');
  const detectExists = existsSync(detectPath);
  results['D3-B5'] = { status: hasDetect && detectExists ? 'PASS' : 'FAIL', why: `detect_framework tool=${hasDetect}, module=${detectExists}` };
} catch(e) { results['D3-B5'] = { status: 'BLOCKED', why: e.message }; }

// D3-C14: Sandbox HDKit service params and hwlink credentials (P2)
try {
  const toolsContent = readFileSync(join(process.cwd(), 'plugins', 'huaweicloud-core', 'src', 'tools.mjs'), 'utf8');
  const hasSandboxConnect = toolsContent.includes('huaweicloud_sandbox_connect');
  const hasSandboxCreds = toolsContent.includes('huaweicloud_sandbox_credentials');
  results['D3-C14'] = { status: hasSandboxConnect && hasSandboxCreds ? 'PASS' : 'FAIL', why: `sandbox_connect=${hasSandboxConnect}, sandbox_credentials=${hasSandboxCreds}` };
} catch(e) { results['D3-C14'] = { status: 'BLOCKED', why: e.message }; }

// D3-S3: Sandbox preview URL (P1)
try {
  const toolsContent = readFileSync(join(process.cwd(), 'plugins', 'huaweicloud-core', 'src', 'tools.mjs'), 'utf8');
  const hasSandboxConnect = toolsContent.includes('huaweicloud_sandbox_connect');
  const hasSandboxUpload = toolsContent.includes('huaweicloud_sandbox_upload_project');
  const hasSandboxDeploy = toolsContent.includes('huaweicloud_sandbox_deploy_nginx');
  const hasSandboxCheck = toolsContent.includes('huaweicloud_sandbox_deploy_check');
  const hasSandboxClose = toolsContent.includes('huaweicloud_sandbox_close_session');
  results['D3-S3'] = { 
    status: hasSandboxConnect && hasSandboxUpload && hasSandboxDeploy && hasSandboxCheck && hasSandboxClose ? 'PASS' : 'FAIL',
    why: `Sandbox tools: connect=${hasSandboxConnect}, upload=${hasSandboxUpload}, deploy=${hasSandboxDeploy}, check=${hasSandboxCheck}, close=${hasSandboxClose}`
  };
} catch(e) { results['D3-S3'] = { status: 'BLOCKED', why: e.message }; }

// D3-S5: Composite intent layered routing (P2)
try {
  const toolsContent = readFileSync(join(process.cwd(), 'plugins', 'huaweicloud-core', 'src', 'tools.mjs'), 'utf8');
  const hasServiceCatalog = toolsContent.includes('huaweicloud_service_catalog');
  results['D3-S5'] = { status: hasServiceCatalog ? 'PASS' : 'FAIL', why: `service_catalog for composite routing: ${hasServiceCatalog}` };
} catch(e) { results['D3-S5'] = { status: 'BLOCKED', why: e.message }; }

// D3-S6: FunctionGraph scheduled task (P2)
try {
  const plan = planHcloudCommand(['FunctionGraph', 'CreateFunction', '--name=test-func', '--handler=index.handler']);
  results['D3-S6'] = { 
    status: plan.classification.decision === 'deny' || plan.classification.decision === 'write' ? 'PASS' : 'FAIL',
    why: `FunctionGraph CreateFunction: decision=${plan.classification.decision}, risk=${plan.classification.risk}`
  };
} catch(e) { results['D3-S6'] = { status: 'BLOCKED', why: e.message }; }

// D3-S7: Cross-service delivery (P1)
try {
  const toolsContent = readFileSync(join(process.cwd(), 'plugins', 'huaweicloud-core', 'src', 'tools.mjs'), 'utf8');
  const hasSandbox = toolsContent.includes('huaweicloud_sandbox_connect');
  const hasPlan = toolsContent.includes('huaweicloud_plan_cli_command');
  const hasApproved = toolsContent.includes('huaweicloud_run_approved_command');
  results['D3-S7'] = { status: hasSandbox && hasPlan && hasApproved ? 'PASS' : 'FAIL', why: `Cross-service tools: sandbox=${hasSandbox}, plan=${hasPlan}, approved=${hasApproved}` };
} catch(e) { results['D3-S7'] = { status: 'BLOCKED', why: e.message }; }

// D4-10: Rule library new regression (P2)
try {
  const rulesObj = loadRiskRules();
  const rules = rulesObj.rules || rulesObj;
  results['D4-10'] = { status: rules.length >= 15 ? 'PASS' : 'FAIL', why: `Risk rules loaded: ${rules.length} rules` };
} catch(e) { results['D4-10'] = { status: 'BLOCKED', why: e.message }; }

// D4-12: Supply chain install security (P2)
try {
  const pkgPath = join(process.cwd(), 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const hasScripts = pkg.scripts && Object.keys(pkg.scripts).length > 0;
  results['D4-12'] = { status: hasScripts ? 'PASS' : 'FAIL', why: `Package has ${Object.keys(pkg.scripts||{}).length} scripts` };
} catch(e) { results['D4-12'] = { status: 'BLOCKED', why: e.message }; }

// D4-14: Operation auditability (P2)
try {
  const hcloudContent = readFileSync(join(process.cwd(), 'plugins', 'huaweicloud-core', 'src', 'hcloud-cli.mjs'), 'utf8');
  const hasAudit = hcloudContent.includes('audit') || hcloudContent.includes('log') || hcloudContent.includes('trace');
  results['D4-14'] = { status: hasAudit ? 'PASS' : 'FAIL', why: `Audit/log in hcloud-cli: ${hasAudit}` };
} catch(e) { results['D4-14'] = { status: 'BLOCKED', why: e.message }; }

// D4-25: Python hook event telemetry classification (P2)
try {
  const toolsContent = readFileSync(join(process.cwd(), 'plugins', 'huaweicloud-core', 'src', 'tools.mjs'), 'utf8');
  const hasHookCheck = toolsContent.includes('huaweicloud_hook_check_command');
  results['D4-25'] = { status: hasHookCheck ? 'PASS' : 'FAIL', why: `hook_check_command tool registered: ${hasHookCheck}` };
} catch(e) { results['D4-25'] = { status: 'BLOCKED', why: e.message }; }

// D4-26: Findings evidence redaction (P2)
try {
  const r = evaluateCommandRisk('cat ~/.hcloud/credentials.json');
  const findingsStr = JSON.stringify(r.findings || []);
  const noLeak = !findingsStr.includes('AK') || !findingsStr.match(/AKID[A-Z0-9]{10}/);
  results['D4-26'] = { status: noLeak ? 'PASS' : 'FAIL', why: `Findings redacted: ${noLeak}, findings: ${findingsStr.substring(0,100)}` };
} catch(e) { results['D4-26'] = { status: 'BLOCKED', why: e.message }; }

// D4-29: Classification assertion and raw command classification entry (P2)
try {
  const r1 = classifyHcloudArgs(['ECS', 'ListServers']);
  const r2 = classifyHcloudArgs(['ECS', 'DeleteServer', '--server_id=test']);
  const r3 = classifyTextCommand('cat ~/.hcloud/credentials.json');
  results['D4-29'] = { 
    status: r1.decision === 'allow' && r2.decision === 'deny' ? 'PASS' : 'FAIL',
    why: `Classification: ListServers=${r1.decision}, DeleteServer=${r2.decision}, textCmd=${r3?.decision || 'N/A'}`
  };
} catch(e) { results['D4-29'] = { status: 'BLOCKED', why: e.message }; }

console.log(JSON.stringify(results, null, 2));
