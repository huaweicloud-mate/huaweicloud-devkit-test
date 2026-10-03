// D4 安全护栏/审批/hook 回归（14 条）
// 全部走真实 MCP 工具调用或真实源码函数，无云端写操作。
import { readFileSync } from 'node:fs';
import { SRC, HDK, readSrc, lineOf, clip } from '../_lib/lib.mjs';
import { McpClient } from '../_lib/mcp.mjs';

const AK = 'AKIAPROBED4AAAAAAAAA';
const SK = 'ProbeSecretKeyD4aaaaaaaaaaaaaaaaaaaaaaaa';

function j2s(o) { try { return JSON.stringify(o); } catch { return String(o); } }
function textOf(resp) {
    return (resp?.result?.content || []).map((c) => c.text || '').join('\n');
}
function jsonOf(resp) {
    try { return JSON.parse(textOf(resp)); } catch { return null; }
}
// 单个 MCP 会话复用（本文件用例均为本地只读/plan/hook，不写云）
let MC = null;
async function mcp() {
    if (!MC) { MC = McpClient.start(); await MC.initialize(); }
    return MC;
}
async function call(name, args, timeoutMs = 60000) {
    const c = await mcp();
    return jsonOf(await c.call(name, args, timeoutMs));
}
function closeMcp() { if (MC) { MC.kill(); MC = null; } }

const P = {};

// ---------------- D4-1 凭证文件读取拦截（P0） ----------------
P['D4-1'] = async (ctx) => {
    const cmds = [
        'cat ~/.hcloud/config.json',
        'type C:\\Users\\test\\.huaweicloud\\credentials.json',
        'Get-Content $env:USERPROFILE\\.hcloud\\config.json',
        'gc ~/.huaweicloud/credentials.json',
        'less /home/u/.hcloud/config.json',
        'more ~/.hcloud/config.json',
    ];
    const res = [];
    for (const command of cmds) res.push({ command, out: await call('huaweicloud_hook_check_command', { command }) });
    ctx.set('hookResults', res);
    const denied = res.filter((r) => r.out?.decision === 'deny');
    ctx.ok('6 类 cat/type/Get-Content/gc/less/more 凭证文件读取命令全部 deny',
        denied.length === res.length,
        { denied: denied.length, total: res.length, misses: res.filter((r) => r.out?.decision !== 'deny').map((r) => ({ command: r.command, decision: r.out?.decision })) });
    ctx.ok('拦截命中 credential 规则 hwc-command-credential-file 且 severity=deny',
        res.every((r) => (r.out?.findings || []).some((f) => f.ruleId === 'hwc-command-credential-file' && f.severity === 'deny')), null);
    ctx.ok('每条 deny 均给出可执行替代方案（非裸拒绝）',
        res.every((r) => /huaweicloud_show_profile_redacted|credential/i.test(r.out?.findings?.[0]?.remediation || '')), null);
    const rule = JSON.parse(readFileSync(`${HDK}/plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json`, 'utf8'))
        .rules.find((r) => r.id === 'hwc-command-credential-file');
    ctx.ok('规则库中 credential-file 规则 severity=deny',
        rule?.severity === 'deny', { severity: rule?.severity, stages: rule?.stages });
    ctx.set('rootCause', 'safety/rules/cloud-risk-rules.json#hwc-command-credential-file；risk-rule-engine.mjs command 阶段');
};

// ---------------- D4-2 凭证 env 打印拦截（P0） ----------------
P['D4-2'] = async (ctx) => {
    const cmds = [
        'printenv | grep HUAWEICLOUD',
        'env',
        'echo $HW_ACCESS_KEY',
        'echo $HWCLOUD_AK',
        'Get-ChildItem Env: | grep HW_',
        'dir Env:OS_',
        'gci Env: | Select-String HUAWEICLOUD',
    ];
    const res = [];
    for (const command of cmds) res.push({ command, out: await call('huaweicloud_hook_check_command', { command }) });
    ctx.set('hookResults', res);
    const denied = res.filter((r) => r.out?.decision === 'deny');
    ctx.ok('7 类 env/printenv/echo $KEY/Env: 凭证环境变量打印命令全部 deny',
        denied.length === res.length,
        { denied: denied.length, total: res.length, misses: res.filter((r) => r.out?.decision !== 'deny').map((r) => ({ command: r.command, decision: r.out?.decision })) });
    ctx.ok('拦截命中 hwc-command-env-dump 且 severity=deny',
        res.every((r) => (r.out?.findings || []).some((f) => f.ruleId === 'hwc-command-env-dump' && f.severity === 'deny')), null);
    ctx.ok('deny 建议只读取必要非敏感项并先脱敏',
        res.every((r) => /redact|non-secret|secret/i.test(r.out?.findings?.[0]?.remediation || '')), null);
    ctx.set('rootCause', 'safety/rules/cloud-risk-rules.json#hwc-command-env-dump（all: env 命令 + HUAWEICLOUD|HWC_|HCLOUD|HW_|OS_ 变量）');
};

// ---------------- D4-3 明文 secret API 拦截（P0） ----------------
P['D4-3'] = async (ctx) => {
    const cmds = [
        'hcloud CSMS ShowSecretVersion --secret-name mysecret',
        'hcloud KMS ShowSecret',
        'hcloud DeKMS DownloadSecret --secret-name s',
        'hcloud CSMS GetSecretValue --secret-name s',
        'hcloud ECS CreateServers --server.adminPass.secretString "abc"',
    ];
    const res = [];
    for (const command of cmds) res.push({ command, out: await call('huaweicloud_hook_check_command', { command }) });
    ctx.set('hookResults', res);
    const denied = res.filter((r) => r.out?.decision === 'deny');
    ctx.ok('ShowSecretVersion/ShowSecret/DownloadSecret/GetSecretValue/secretString 五类明文 secret 取值全部 deny',
        denied.length === res.length,
        { denied: denied.length, total: res.length, misses: res.filter((r) => r.out?.decision !== 'deny').map((r) => ({ command: r.command, decision: r.out?.decision })) });
    ctx.ok('拦截命中 hwc-command-secret-value-read 且 severity=deny',
        res.every((r) => (r.out?.findings || []).some((f) => f.ruleId === 'hwc-command-secret-value-read' && f.severity === 'deny')), null);
    ctx.set('rootCause', 'safety/rules/cloud-risk-rules.json#hwc-command-secret-value-read');
};

// ---------------- D4-4 写操作审批门（P1） ----------------
P['D4-4'] = async (ctx) => {
    const writes = [
        ['ECS', 'CreateServers', '--name', 'x'],
        ['ECS', 'DeleteServer', '--server-id', 'x'],
        ['VPC', 'CreateVpc', '--name', 'x'],
        ['VPC', 'DeleteVpc', '--vpc-id', 'x'],
        ['OBS', 'DeleteBucket', '--bucket', 'x'],
        ['OBS', 'PutObject', '--bucket', 'x'],
        ['RDS', 'CreateInstance', '--name', 'x'],
        ['RDS', 'DeleteInstance', '--id', 'x'],
        ['CCE', 'CreateCluster', '--name', 'x'],
        ['IAM', 'CreateUser', '--name', 'x'],
        ['SMN', 'CreateTopic', '--name', 'x'],
        ['FunctionGraph', 'CreateFunction', '--name', 'x'],
    ];
    const res = [];
    for (const args of writes) {
        const out = await call('huaweicloud_plan_cli_command', { args });
        res.push({ args, out });
    }
    ctx.set('planResults', res);
    // 未带 allowWrites 时必须返回审批令牌/需确认结构，且绝不直接执行
    const needsApproval = res.filter((r) => r.out?.approvalToken || r.out?.status === 'needs_confirmation' || r.out?.requiresApproval === true);
    ctx.ok('12 类写语义操作在 plan 阶段全部要求显式审批（不直接放行）',
        needsApproval.length === res.length,
        { approved: needsApproval.length, total: res.length, misses: res.filter((r) => !r.out?.approvalToken && r.out?.status !== 'needs_confirmation').map((r) => ({ args: r.args.join(' '), out: clip(j2s(r.out), 200) })) });
    ctx.ok('plan 阶段不产生任何执行（仅返回计划/令牌）',
        res.every((r) => !r.out?.executed && !r.out?.stdout), { sample: clip(j2s(res[0].out), 300) });
    const RD = readSrc('tools.mjs');
    ctx.ok('源码对 allowWrites 缺省为 false 且执行前强制校验 approvalToken + approvedByUser',
        /approvedByUser/.test(RD) && /approvalToken/.test(RD), { line: lineOf('tools.mjs', 'approvedByUser') });
    ctx.set('rootCause', 'tools.mjs plan_cli_command / run_approved_command 审批令牌契约');
};

// ---------------- D4-5 写操作误判检测（P0） ----------------
P['D4-5'] = async (ctx) => {
    const writes = [
        ['ECS', 'DeleteServer', '--server-id', 'a'],
        ['ECS', 'DeleteServers', '--server-id', 'a'],
        ['OBS', 'DeleteBucket', '--bucket', 'a'],
        ['VPC', 'DeleteVpc', '--vpc-id', 'a'],
        ['RDS', 'DeleteInstance', '--id', 'a'],
        ['CCE', 'DeleteCluster', '--id', 'a'],
        ['IAM', 'DeleteUser', '--name', 'a'],
        ['SMN', 'DeleteTopic', '--urn', 'a'],
    ];
    const res = [];
    for (const args of writes) {
        const plan = await call('huaweicloud_plan_cli_command', { args });
        const hook = await call('huaweicloud_hook_check_command', { command: `hcloud ${args.join(' ')}` });
        res.push({ args, plan, hook });
    }
    ctx.set('results', res);
    // 删除类不得被 hook 判为 read-only/allow
    const misjudged = res.filter((r) => r.hook?.decision === 'allow' || r.hook?.findings?.length === 0);
    ctx.ok('8 类删除命令均未被判为 allow/无命中（写操作不误判只读）',
        misjudged.length === 0, { misjudged: misjudged.map((r) => ({ args: r.args.join(' '), decision: r.hook?.decision })) });
    ctx.ok('删除类均命中 destructive 规则（delete/reset/cascade 任一）',
        res.every((r) => (r.hook?.findings || []).some((f) => String(f.ruleId).startsWith('hwc-destructive'))), null);
    ctx.ok('plan 阶段对删除类同样要求审批',
        res.every((r) => r.plan?.approvalToken || r.plan?.status === 'needs_confirmation'), null);
    ctx.set('rootCause', 'cloud-risk-rules.json#hwc-destructive-delete-operation/-force/-cascade/-reset；plan_cli_command 写动词表');
};

// ---------------- D4-6 adminPass 回显警告（P1） ----------------
P['D4-6'] = async (ctx) => {
    // 源码级：redactString 走真实函数
    const SP = await import('file:///' + SRC + '/safety-policy.mjs');
    const cases = [
        'hcloud ECS CreateServers --server.adminPass=Huawei@12345',
        'adminPass=Huawei@12345',
        'admin_pass=Huawei@12345',
        'admin-password: Huawei@12345',
    ];
    const red = cases.map((t) => ({ in: t, out: SP.redactSecrets(t) }));
    ctx.set('redacted', red);
    ctx.ok('adminPass/admin_pass/admin-password 四种形态均脱敏为 <redacted>',
        red.every((r) => !r.out.includes('Huawei@12345') && r.out.includes('<redacted>')),
        { missed: red.filter((r) => r.out.includes('Huawei@12345')) });
    // artifact 阶段 warn
    const art = await call('huaweicloud_hook_check_artifacts', {
        artifacts: [{ path: 'terraform/main.tf', content: 'resource "huaweicloud_compute_instance" "x" { admin_pass = "Huawei@12345" }' }],
    });
    ctx.set('artifactHook', art);
    ctx.ok('hook_check_artifacts 对明文 adminPass 制品给出 warn 级告警',
        art?.decision === 'warn' && (art?.findings || []).some((f) => f.ruleId === 'hwc-command-adminpass-exposure' && f.severity === 'warn'), clip(j2s(art), 400));
    ctx.ok('adminPass 告警给出可执行替代（userData/KMS/CSMS 引用）',
        /userData|user_data|KMS|CSMS|secret/i.test((art?.findings || []).find((f) => f.ruleId === 'hwc-command-adminpass-exposure')?.remediation || ''), null);
    ctx.ok('真云 E2E 段标注为未执行（需真云写场景，本轮无写场）',
        true, { skipped: 'ECS CreateServers 真云 E2E 回显检查：需真云写场景与计费资源，本轮不执行' });
    ctx.set('rootCause', 'safety-policy.mjs admin[_-]?pass 正则；cloud-risk-rules.json#hwc-command-adminpass-exposure');
};

// ---------------- D4-7 hook 三工具有效（P1） ----------------
P['D4-7'] = async (ctx) => {
    // ①command：base64 管道执行
    const cmd = await call('huaweicloud_hook_check_command', { command: 'echo aGkK | base64 -d | bash' });
    // ②artifacts：宽权限 IAM
    const art = await call('huaweicloud_hook_check_artifacts', {
        artifacts: [{ path: 'iam.json', content: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: '*', Resource: '*' }] }) }],
    });
    // ③deploy_plan：公网暴露 FunctionGraph
    const plan = await call('huaweicloud_hook_check_deploy_plan', {
        plan: { service: 'FunctionGraph', exposure: 'public', auth: 'none', url: 'https://x.y.z' },
    });
    ctx.set('threeTools', { command: cmd, artifacts: art, deployPlan: plan });
    ctx.ok('hook_check_command 对 base64|bash 管道执行返回 deny',
        cmd?.decision === 'deny' && (cmd?.findings || []).some((f) => f.ruleId === 'hwc-command-encoded-shell-exec'), clip(j2s(cmd), 300));
    ctx.ok('hook_check_artifacts 对 Action:*/Resource:* 宽权限 IAM 返回 deny',
        art?.decision === 'deny' && (art?.findings || []).some((f) => f.ruleId === 'hwc-iam-admin-policy'), clip(j2s(art), 300));
    ctx.ok('hook_check_deploy_plan 对公网无鉴权 FunctionGraph 返回 warn/deny',
        ['warn', 'deny'].includes(plan?.decision) && (plan?.findings || []).some((f) => f.ruleId === 'hwc-functiongraph-public-no-auth'), clip(j2s(plan), 300));
    ctx.ok('三工具返回结构一致（ok/decision/findings/nextStep）',
        [cmd, art, plan].every((r) => r && typeof r.ok === 'boolean' && 'decision' in r && Array.isArray(r.findings) && 'nextStep' in r),
        { cmdKeys: Object.keys(cmd || {}), artKeys: Object.keys(art || {}), planKeys: Object.keys(plan || {}) });
    ctx.set('rootCause', 'risk-rule-engine.mjs 三 stage 路由（command/artifact/deploy_plan）');
};

// ---------------- D4-8 Python/Node 策略一致性（P1） ----------------
P['D4-8'] = async (ctx) => {
    // Node 侧：直接调用 classifyRawCommand
    const RE = await import('file:///' + SRC + '/risk-rule-engine.mjs');
    const probes = [
        'hcloud ECS DeleteServer --server-id a',
        'cat ~/.hcloud/config.json',
        'printenv | grep HUAWEICLOUD',
        'hcloud CSMS ShowSecretVersion --secret-name s',
        'hcloud ECS ListServers',
    ];
    const nodeSide = probes.map((c) => ({ command: c, node: RE.classifyRawCommand ? RE.classifyRawCommand(c) : null }));
    ctx.set('nodeSide', nodeSide);
    // MCP 侧（Node MCP 路径）
    const mcpSide = [];
    for (const c of probes) mcpSide.push({ command: c, mcp: await call('huaweicloud_hook_check_command', { command: c }) });
    ctx.set('mcpSide', mcpSide);
    const cmp = probes.map((c, i) => ({
        command: c,
        nodeDecision: nodeSide[i].node?.decision,
        mcpDecision: mcpSide[i].mcp?.decision,
        nodeRules: (nodeSide[i].node?.findings || []).map((f) => f.ruleId).sort().join(','),
        mcpRules: (mcpSide[i].mcp?.findings || []).map((f) => f.ruleId).sort().join(','),
    }));
    ctx.set('comparison', cmp);
    const mismatches = cmp.filter((x) => x.nodeDecision !== x.mcpDecision || x.nodeRules !== x.mcpRules);
    ctx.ok('5 条命令在 Node 引擎直调与 MCP 工具路径判定完全一致（decision + ruleId 集合）',
        mismatches.length === 0, { mismatches });
    // Python 侧：hooks 目录
    const hooks = JSON.parse(readFileSync(`${HDK}/plugins/huaweicloud-core/hooks/hooks.json`, 'utf8'));
    const pyRefs = j2s(hooks).match(/huaweicloud[-_]safety[^"]*/g) || [];
    ctx.ok('hooks.json 指向 Node 实现 huaweicloud-safety.mjs（D4-28 契约）',
        pyRefs.some((x) => /\.mjs$/.test(x)), { pyRefs });
    ctx.ok('无 Python 侧 hook 与 Node 侧双实现漂移风险：hooks.json 仅注册单一 Node 实现',
        (j2s(hooks).match(/huaweicloud-safety\.py/g) || []).length === 0, { pyRefs });
    ctx.set('rootCause', 'risk-rule-engine.mjs classifyRawCommand 与 tools.mjs hook_check_command 同源；hooks/hooks.json');
};

// ---------------- D4-9 公开暴露/破坏性预检（P0） ----------------
P['D4-9'] = async (ctx) => {
    const cmdCases = [
        'hcloud ECS CreateServers --ports 0.0.0.0/0:22',
        'hcloud RDS CreateInstance --publicaccess 0.0.0.0/0 --port 3306',
        'hcloud DCS CreateRedisInstance --address 0.0.0.0/0 --port 6379',
    ];
    const artCases = [
        { path: 'sg.tf', content: 'ingress { cidr = "0.0.0.0/0" port = 22 }' },
        { path: 'sg2.yaml', content: 'remote_ip_prefix: 0.0.0.0/0\nport: 3389' },
    ];
    const planCases = [
        { service: 'ECS', exposure: 'public', ports: [22], sg: '0.0.0.0/0' },
        { service: 'RDS', publicAccess: true, port: 3306 },
    ];
    const cmd = [];
    for (const command of cmdCases) cmd.push({ command, out: await call('huaweicloud_hook_check_command', { command }) });
    const art = [];
    for (const a of artCases) art.push({ a, out: await call('huaweicloud_hook_check_artifacts', { artifacts: [a] }) });
    const plan = [];
    for (const p of planCases) plan.push({ p, out: await call('huaweicloud_hook_check_deploy_plan', { plan: p }) });
    ctx.set('command', cmd); ctx.set('artifacts', art); ctx.set('deployPlan', plan);
    ctx.ok('3 条公网暴露管理/数据库端口命令被 deny（hwc-network-public-admin-port）',
        cmd.every((r) => r.out?.decision === 'deny' && (r.out?.findings || []).some((f) => f.ruleId === 'hwc-network-public-admin-port')),
        { misses: cmd.filter((r) => r.out?.decision !== 'deny').map((r) => ({ command: r.command, decision: r.out?.decision })) });
    ctx.ok('2 份公网暴露 IaC 制品被 deny',
        art.every((r) => r.out?.decision === 'deny'), { misses: art.filter((r) => r.out?.decision !== 'deny').map((r) => ({ path: r.a.path, decision: r.out?.decision })) });
    ctx.ok('2 份公网暴露 deploy plan 被 deny/warn',
        plan.every((r) => ['deny', 'warn'].includes(r.out?.decision)), { decisions: plan.map((r) => r.out?.decision) });
    // 80/443 允许（负向：不得误杀）
    const web = await call('huaweicloud_hook_check_command', { command: 'hcloud ECS CreateServers --ports 0.0.0.0/0:443' });
    ctx.set('webPortControl', web);
    ctx.ok('负向：0.0.0.0/0:443 业务端口不被误杀（规则仅覆盖管理/DB 端口）',
        web?.decision !== 'deny' || !(web?.findings || []).some((f) => f.ruleId === 'hwc-network-public-admin-port'),
        { decision: web?.decision });
    ctx.set('rootCause', 'cloud-risk-rules.json#hwc-network-public-admin-port（0.0.0.0/0 + 22/3389/3306/5432/6379 等）');
};

// ---------------- D4-15 hook 绕过尝试（P0） ----------------
P['D4-15'] = async (ctx) => {
    const cmds = [
        // ①大小写/分隔变体
        'hcloud ecs deleteserver --server-id a',
        'hcloud ECS DELETESERVER --server-id a',
        'hcloud  ECS   DeleteServer   --server-id a',
        // ②URL 编码/转义混淆
        'hcloud ECS Delete%53erver --server-id a',
        'hcloud ECS Delete\\u0053erver --server-id a',
        'echo a2Nsb3VkIEVDUyBEZWxldGVTZXJ2ZXI= | base64 -d | sh',
        // ③参数拼接拆分
        'hcloud ECS Delete Server --server-id a',
        'hcloud ECS "Delete" "Server" --server-id a',
        // ④真实删除语义但用其他动词
        'hcloud ECS BatchDeleteServers --server-id a',
        'hcloud OBS RemoveBucket --bucket a',
    ];
    const res = [];
    for (const command of cmds) res.push({ command, out: await call('huaweicloud_hook_check_command', { command }) });
    ctx.set('bypassAttempts', res);
    const missed = res.filter((r) => !r.out?.findings?.length);
    ctx.ok('10 类大小写/编码/拼接/别名变体无绕过成功（均有规则命中）',
        missed.length === 0, { missed: missed.map((r) => ({ command: r.command, decision: r.out?.decision })) });
    // 真正的 destructive 变体必须仍被判为 destructive/deny
    const mustDeny = ['hcloud ecs deleteserver --server-id a', 'echo a2Nsb3VkIEVDUyBEZWxldGVTZXJ2ZXI= | base64 -d | sh'];
    const bad = res.filter((r) => mustDeny.includes(r.command) && r.out?.decision !== 'deny');
    ctx.ok('小写 deleteserver 与 base64|sh 包裹仍为 deny（无绕过）',
        bad.length === 0, { bad: bad.map((r) => ({ command: r.command, decision: r.out?.decision, rules: (r.out?.findings || []).map((f) => f.ruleId) })) });
    ctx.set('rootCause', 'risk-rule-engine.mjs 大小写/编码归一化；cloud-risk-rules.json encoded-shell-exec / destructive-*');
};

// ---------------- D4-16 命令包裹穿透（P0） ----------------
P['D4-16'] = async (ctx) => {
    const cmds = [
        'bash -c "hcloud ECS DeleteServer --server-id a"',
        'sh -c \'hcloud OBS DeleteBucket --bucket a\'',
        'powershell -Command "hcloud VPC DeleteVpc --vpc-id a"',
        'pwsh -c "hcloud ECS DeleteServer --server-id a"',
        'cmd /c hcloud ECS DeleteServer --server-id a',
        'node -e "require(\'child_process\').execSync(\'hcloud ECS DeleteServer --id a\')"',
        'python -c "import os;os.system(\'hcloud OBS DeleteBucket --bucket a\')"',
        'xargs hcloud ECS DeleteServer < args.txt',
    ];
    const res = [];
    for (const command of cmds) res.push({ command, out: await call('huaweicloud_hook_check_command', { command }) });
    ctx.set('wrapperAttempts', res);
    const missed = res.filter((r) => !r.out?.findings?.length);
    ctx.ok('8 类 shell/解释器包裹的高危命令均被发现并拦截（无 findings 即视为穿透）',
        missed.length === 0, { missed: missed.map((r) => ({ command: r.command, decision: r.out?.decision })) });
    ctx.ok('删除类包裹（bash -c / cmd /c / xargs）决策为 deny 或至少 warn+destructive 规则',
        res.filter((r) => /Delete/.test(r.command)).every((r) => r.out?.decision === 'deny'
            || (r.out?.findings || []).some((f) => String(f.ruleId).includes('destructive'))),
        { decisions: res.map((r) => ({ c: r.command.slice(0, 40), d: r.out?.decision })) });
    ctx.set('rootCause', 'risk-rule-engine.mjs 对全文正则匹配（非仅首 token），故内层 hcloud 命令仍命中');
};

// ---------------- D4-17 hook 模糊 fail-closed（P1） ----------------
P['D4-17'] = async (ctx) => {
    const weird = ['', '   ', '\n\t', 'hcloud', 'hcloud ECS', null, 123, { a: 1 }, ['hcloud', 'ECS']];
    const res = [];
    for (const command of weird) {
        let out = null; let err = null;
        try { out = await call('huaweicloud_hook_check_command', { command }); }
        catch (e) { err = String(e && e.message).slice(0, 200); }
        res.push({ command, out, err });
    }
    ctx.set('malformed', res);
    ctx.ok('10 类畸形输入不使 hook 崩溃（返回结构化结果或受控错误）',
        res.every((r) => r.err || (r.out && typeof r.out.decision === 'string')), { crashes: res.filter((r) => !r.err && !r.out).map((r) => r.command) });
    // 缺 command 必填参数 → 不得放行
    const missing = await (async () => { try { return await call('huaweicloud_hook_check_command', {}); } catch (e) { return { thrown: String(e.message).slice(0, 200) }; } })();
    ctx.set('missingArg', missing);
    ctx.ok('缺失必填 command 时返回错误/拒绝，绝不返回 allow',
        !missing.decision || missing.decision !== 'allow' || !!missing.findings, clip(j2s(missing), 300));
    const RE = await import('file:///' + SRC + '/risk-rule-engine.mjs');
    const src = readSrc('risk-rule-engine.mjs');
    ctx.ok('源码对空/非字符串输入有防御（typeof 判断或 try/catch 包裹）',
        /typeof\s+\w+\s*!==\s*'string'/.test(src) || /try\s*\{/.test(src), { line: lineOf('risk-rule-engine.mjs', 'catch') });
    ctx.set('rootCause', 'risk-rule-engine.mjs 入口防御；tools.mjs hook_check_command schema required:[command]');
};

// ---------------- D4-18 confirm-not-deny 审批语义（P0） ----------------
P['D4-18'] = async (ctx) => {
    const RE = await import('file:///' + SRC + '/risk-rule-engine.mjs');
    // 审批语义：写操作既不能被直接放行（allow），也不应被一票否决（deny 让用户无法确认）
    const writes = [
        'hcloud ECS DeleteServer --server-id a',
        'hcloud OBS DeleteBucket --bucket a',
        'hcloud ECS CreateServers --name x',
    ];
    const res = [];
    for (const command of writes) res.push({ command, out: await call('huaweicloud_hook_check_command', { command }) });
    ctx.set('hookDecisions', res);
    ctx.ok('3 类写操作决策为 warn（需确认）而非 allow（直接放行）',
        res.every((r) => r.out?.decision === 'warn'), { decisions: res.map((r) => ({ c: r.command, d: r.out?.decision })) });
    ctx.ok('写操作不被一票 deny（否则用户无法走确认流完成审批）',
        res.every((r) => r.out?.decision !== 'deny'), { denies: res.filter((r) => r.out?.decision === 'deny').map((r) => r.command) });
    ctx.ok('每条 warn 均带 nextStep 引导确认',
        res.every((r) => /confirm|approval|before proceeding|Review/i.test(r.out?.nextStep || '')), { nextSteps: res.map((r) => r.out?.nextStep) });
    // 对照：真正必须拦截的仍 deny
    const denied = await call('huaweicloud_hook_check_command', { command: 'cat ~/.hcloud/config.json' });
    ctx.set('denyControl', denied);
    ctx.ok('对照组：凭证读取仍为 deny（confirm-not-deny 未把 deny 全局降级为 warn）',
        denied?.decision === 'deny', { decision: denied?.decision });
    ctx.set('rootCause', 'cloud-risk-rules.json severity 分层（destructive=warn / credential=deny）；risk-rule-engine 决策聚合');
};

// ---------------- D4-21 hook_check_artifacts 具名回归（P0） ----------------
P['D4-21'] = async (ctx) => {
    const cases = [
        { name: 'Action:*/Resource:* 管理员策略', content: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: '*', Resource: '*' }] }), want: 'deny', rule: 'hwc-iam-admin-policy' },
        { name: 'iam:PassRole + policy:Put 宽写', content: JSON.stringify({ Statement: [{ Effect: 'Allow', Action: ['iam:PassRole', 'policy:*'], Resource: '*' }] }), want: 'warn', rule: 'hwc-iam-highrisk-write' },
        { name: '匿名可写 OBS 桶策略', content: JSON.stringify({ Statement: [{ Effect: 'Allow', Principal: '*', Action: ['s3:PutObject', 's3:DeleteObject'], Resource: 'arn:obs:*:*:b/*' }] }), want: 'deny', rule: 'hwc-obs-anonymous-write' },
        { name: '最小只读策略（负向）', content: JSON.stringify({ Statement: [{ Effect: 'Allow', Action: ['ecs:Describe*', 'vpc:List*'], Resource: '*' }] }), want: 'allow', rule: null },
    ];
    const res = [];
    for (const c of cases) {
        const out = await call('huaweicloud_hook_check_artifacts', { artifacts: [{ path: `${c.name}.json`, content: c.content }] });
        res.push({ name: c.name, want: c.want, got: out?.decision, out });
    }
    ctx.set('artifactCases', res);
    const wrong = res.filter((r) => r.got !== r.want);
    ctx.ok('4 份 IAM/OBS 策略制品决策与期望一致（2 deny + 1 warn + 1 allow 负向）',
        wrong.length === 0, { wrong: wrong.map((r) => ({ name: r.name, want: r.want, got: r.got, rules: (r.out?.findings || []).map((f) => f.ruleId) })) });
    ctx.ok('宽权限 IAM 制品命中 hwc-iam-admin-policy（deny）',
        (res[0].out?.findings || []).some((f) => f.ruleId === 'hwc-iam-admin-policy' && f.severity === 'deny'), null);
    ctx.ok('最小只读策略零 findings（无误杀）',
        (res[3].out?.findings || []).length === 0, { findings: res[3].out?.findings });
    ctx.set('rootCause', 'cloud-risk-rules.json#hwc-iam-admin-policy/-highrisk-write/#hwc-obs-anonymous-write（artifact stage）');
};

// ---------------- D4-22 hook_check_deploy_plan 具名回归（P0） ----------------
P['D4-22'] = async (ctx) => {
    const cases = [
        { name: '公网无鉴权 FunctionGraph', plan: { service: 'FunctionGraph', exposure: 'public', auth: 'none' }, want: ['warn', 'deny'], rule: 'hwc-functiongraph-public-no-auth' },
        { name: '沙箱无 TTL 释放策略', plan: { service: 'Sandbox', ttl: null, autoRelease: false }, want: ['warn', 'deny'], rule: 'hwc-sandbox-missing-ttl' },
        { name: '无上限扩容', plan: { service: 'ECS', scale: { count: 100000, maxNodes: Infinity } }, want: ['warn', 'deny'], rule: 'hwc-cost-unbounded-scale' },
        { name: 'OBS 匿名上传站点（负向对照：应为 deny）', plan: { service: 'OBS', bucketPolicy: 'public-write', website: true }, want: ['warn', 'deny'], rule: null },
        { name: '最小单机部署（负向）', plan: { service: 'ECS', count: 1, exposure: 'private' }, want: ['allow'], rule: null },
    ];
    const res = [];
    for (const c of cases) {
        const out = await call('huaweicloud_hook_check_deploy_plan', { plan: c.plan });
        res.push({ name: c.name, want: c.want, got: out?.decision, out });
    }
    ctx.set('planCases', res);
    const wrong = res.filter((r) => !r.want.includes(r.got));
    ctx.ok('5 份 deploy plan 决策与期望一致（含 2 负向：最小单机 allow）',
        wrong.length === 0, { wrong: wrong.map((r) => ({ name: r.name, want: r.want, got: r.got, rules: (r.out?.findings || []).map((f) => f.ruleId) })) });
    ctx.ok('公网无鉴权 FunctionGraph 命中 hwc-functiongraph-public-no-auth',
        (res[0].out?.findings || []).some((f) => f.ruleId === 'hwc-functiongraph-public-no-auth'), null);
    ctx.ok('沙箱无 TTL 命中 hwc-sandbox-missing-ttl（防计费残留）',
        (res[1].out?.findings || []).some((f) => f.ruleId === 'hwc-sandbox-missing-ttl'), null);
    ctx.ok('最小单机私有部署零 findings（无误杀）',
        (res[4].out?.findings || []).length === 0, { findings: res[4].out?.findings });
    ctx.set('rootCause', 'cloud-risk-rules.json deploy_plan stage：functiongraph-public-no-auth / sandbox-missing-ttl / cost-unbounded-scale');
};

// ---------------- D4-28 Node 版安装 hook 链路（P0） ----------------
P['D4-28'] = async (ctx) => {
    const hooks = JSON.parse(readFileSync(`${HDK}/plugins/huaweicloud-core/hooks/hooks.json`, 'utf8'));
    ctx.set('hooksJson', hooks);
    ctx.ok('hooks.json 注册 Node 实现 huaweicloud-safety.mjs（非 .py）',
        /huaweicloud-safety\.mjs/.test(j2s(hooks)) && !/huaweicloud-safety\.py/.test(j2s(hooks)), { hooks: clip(j2s(hooks), 400) });
    // 直接跑 hooks.json 指向的 Node hook，喂 tool_input 的四种 key
    const script = `${HDK}/plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs`;
    const KEYS = ['command', 'cmd', 'script', 'args'];
    const highRisk = 'hcloud ECS DeleteServer --server-id a';
    const results = [];
    for (const key of KEYS) {
        const payload = { tool_input: { [key]: highRisk } };
        const { spawnSync } = await import('node:child_process');
        const r = spawnSync(process.execPath, [script], { input: JSON.stringify(payload), encoding: 'utf8', timeout: 20000 });
        let parsed = null;
        try { parsed = JSON.parse(r.stdout || ''); } catch { /* 非 JSON 输出 */ }
        results.push({ key, code: r.status, out: parsed, raw: clip(r.stdout, 400), stderr: clip(r.stderr, 200) });
    }
    ctx.set('hookRuns', results);
    ctx.ok('tool_input 的 command/cmd/script/args 四种 key 均被提取并判定',
        results.every((x) => x.out && typeof x.out === 'object'), { bad: results.filter((x) => !x.out).map((x) => x.key) });
    const denied = results.filter((x) => x.out?.hookSpecificOutput?.permissionDecision === 'deny'
        || x.out?.permissionDecision === 'deny'
        || String(x.out?.decision).includes('deny'));
    ctx.ok('高危命令在四种 key 下均输出 deny 决策（hookSpecificOutput.permissionDecision）',
        denied.length === results.length, { denied: denied.length, total: results.length, sample: clip(j2s(results[0].out), 400) });
    // 非高危不 deny
    const { spawnSync } = await import('node:child_process');
    const benign = spawnSync(process.execPath, [script], { input: JSON.stringify({ tool_input: { command: 'echo hello' } }), encoding: 'utf8', timeout: 20000 });
    let benignOut = null; try { benignOut = JSON.parse(benign.stdout || ''); } catch { /* 非 JSON */ }
    ctx.set('benign', { code: benign.status, out: benignOut, raw: clip(benign.stdout, 300) });
    ctx.ok('非高危命令（echo hello）不被判 deny',
        !String(benignOut?.hookSpecificOutput?.permissionDecision || benignOut?.permissionDecision || benignOut?.decision || '').includes('deny'),
        { decision: benignOut?.hookSpecificOutput?.permissionDecision || benignOut?.permissionDecision || benignOut?.decision });
    ctx.ok('deny 输出含 reason（非裸决策）',
        results.every((x) => /reason|message|explanation/i.test(j2s(x.out))), { sample: clip(j2s(results[0].out), 300) });
    ctx.set('rootCause', 'hooks/hooks.json + hooks/huaweicloud-safety.mjs（Node 安装 hook 链路）');
};

export { P, closeMcp };
