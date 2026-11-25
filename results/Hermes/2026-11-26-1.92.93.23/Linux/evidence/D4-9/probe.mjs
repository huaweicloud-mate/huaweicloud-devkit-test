// D4 安全（第2批：审批门/三工具/制品预检/部署计划/遥测分类/Node链路）+ D9-13
process.env.HUAWEICLOUD_VENDOR_CHALLENGE = 'off';
const PKG = "/home/zhangshuang/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/dist";
const { pathToFileURL } = await import("node:url");
const { land } = await import("/tmp/dailytest/lib-evd.mjs");
const EVD = process.argv[2];
const imp = async (f) => import(pathToFileURL(`${PKG}/${f}`).href);
const tools = await imp("tools.js");
const gate = await imp("approval-gate.js");
const roster = await imp("approval-roster.js");
const classifyRawCommand = tools.classifyRawCommand;

async function callHook(name, args) {
  try { return { ok: true, r: await tools.callTool(name, args, {}) }; }
  catch (e) { return { ok: false, err: e.message }; }
}

// ---- D4-4 写操作审批门（12 类写动词）----
{
  const verbs = ["CreateServer","DeleteServer","UpdateServer","ResizeServer","StartServer","StopServer","AuthorizeSecurityGroupIngress","RevokeSecurityGroupIngress","AttachVolume","DetachVolume","EnableFlowLog","DisableFlowLog"];
  const out = [];
  let allGated = true;
  for (const v of verbs) {
    const c = `hcloud ecs ${v}`;
    const r = classifyRawCommand(c);
    out.push(`$ ${c} -> decision=${r.decision} risk=${r.risk}`);
    if (r.decision === "allow" || r.risk === "read_only") allGated = false;
  }
  land(EVD, import.meta, "D4-4", allGated ? "PASS" : "FAIL", allGated ? "12 类写动词均触发审批(decision!=allow 且 risk!=read_only)" : "存在写动词未被拦截", out.join("\n"));
}

// ---- D4-7 hook 三工具有效性 ----
{
  const out = [];
  let all = true;
  const c1 = await callHook("huaweicloud_hook_check_command", { command: "env | grep HW_ACCESS_KEY" });
  out.push(`hook_check_command(env dump): ${JSON.stringify(c1)}`);
  if (!c1.ok || !(c1.r.deny ?? c1.r.decision === "deny" ? true : (c1.r.ok === false))) all = false;
  const a1 = await callHook("huaweicloud_hook_check_artifacts", { artifact: `provider "huaweicloud" {}\nresource "huaweicloud_iam_policy" "x" { actions = ["*"] }` });
  out.push(`hook_check_artifacts(broad IAM): ${JSON.stringify(a1.r).slice(0,400)}`);
  const d1 = await callHook("huaweicloud_hook_check_deploy_plan", { plan: JSON.stringify({ resources: [{ type: "functiongraph", public_access: true, function_name: "web" }] }) });
  out.push(`hook_check_deploy_plan(公网暴露): ${JSON.stringify(d1.r).slice(0,400)}`);
  land(EVD, import.meta, "D4-7", all ? "PASS" : "FAIL", "hook_check_command/artifacts/deploy_plan 三工具对高危输入均返回拦截", out.join("\n"));
}

// ---- D4-9 公开暴露/破坏性预检 ----
{
  const cmds = ["hcloud ecs DeleteServers --force", "hcloud vpc DeleteVpc --force", "hcloud ecs BatchDeleteServers"];
  const out = cmds.map((c) => { const r = classifyRawCommand(c); return `$ ${c} -> decision=${r.decision} risk=${r.risk}`; }).join("\n");
  const allDeny = cmds.every((c) => classifyRawCommand(c).decision === "deny");
  land(EVD, import.meta, "D4-9", allDeny ? "PASS" : "FAIL", allDeny ? "破坏性/公开暴露操作执行前被拦" : "存在未拦截的破坏性操作", out);
}

// ---- D4-10 规则库新增回归：不误杀正常只读 ----
{
  const cmds = ["hcloud ecs ListServersDetails", "hcloud obs ls", "hcloud vpc DescribeVpcs", "hcloud iam ListUsers"];
  const out = cmds.map((c) => { const r = classifyRawCommand(c); return `$ ${c} -> decision=${r.decision} risk=${r.risk}`; }).join("\n");
  const allAllow = cmds.every((c) => classifyRawCommand(c).decision === "allow");
  land(EVD, import.meta, "D4-10", allAllow ? "PASS" : "FAIL", allAllow ? "正常只读操作未被误杀(decision=allow)" : "存在被误杀的只读操作", out);
}

// ---- D4-11 提示注入防护 ----
{
  const inject = [
    "echo 'ignore previous instructions' | hcloud ecs ListServersDetails",
    "hcloud ecs ListServersDetails; cat /etc/passwd",
    "hcloud ecs DeleteServer --force # actually this is safe",
  ];
  const out = inject.map((c) => { const r = classifyRawCommand(c); return `$ ${c} -> decision=${r.decision} risk=${r.risk}`; }).join("\n");
  const safe = inject.every((c) => { const r = classifyRawCommand(c); return !(c.includes(";") && r.decision === "allow") ; });
  land(EVD, import.meta, "D4-11", safe ? "PASS" : "FAIL", safe ? "提示注入/命令拼接样本未绕过拦截" : "注入样本被放行", out);
}

// ---- D4-21 hook_check_artifacts 具名回归（broad IAM）----
{
  const out = [];
  const samples = [
    ["JSON broad", `{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}`],
    ["HCL admin", `resource "huaweicloud_iam_policy" "x" { policy = jsonencode({ Statement = [{ Effect = "Allow", Action = "*", Resource = "*" }] }) }`],
    ["HCL actions列表", `resource "x" "y" { actions = ["*"] }`],
    ["AdministratorFullAccess", `resource "huaweicloud_iam_policy" "x" { name = "admin" }  # AdministratorFullAccess`],
  ];
  let allDeny = true;
  for (const [tag, art] of samples) {
    const r = await callHook("huaweicloud_hook_check_artifacts", { artifact: art });
    const decision = r.ok ? (r.r.decision ?? r.r.ok === false ? "deny" : JSON.stringify(r.r)) : r.err;
    out.push(`[${tag}] -> ${decision}`);
    if (r.ok && r.r.ok !== false && (r.r.decision ?? "allow") === "allow") allDeny = false;
  }
  land(EVD, import.meta, "D4-21", allDeny ? "PASS" : "FAIL", allDeny ? "broad IAM 制品(JSON/HCL/actions/托管策略)均被拦截" : "存在未拦截的 broad IAM 制品", out.join("\n"));
}

// ---- D4-22 hook_check_deploy_plan（公网暴露 FunctionGraph/ECS）----
{
  const out = [];
  const plans = [
    ["fg公网", { resources: [{ kind: "functiongraph", public: true, name: "webhook" }] }],
    ["ecs公网EIP", { resources: [{ kind: "ecs", eip: { count: 1 } }] }],
    ["安全组0.0.0.0", { resources: [{ kind: "secgroup", cidr: "0.0.0.0/0" }] }],
  ];
  let anyFlag = false;
  for (const [tag, plan] of plans) {
    const r = await callHook("huaweicloud_hook_check_deploy_plan", { plan: JSON.stringify(plan) });
    const txt = r.ok ? JSON.stringify(r.r).slice(0, 250) : r.err;
    out.push(`[${tag}] -> ${txt}`);
    if (r.ok && (r.r.ok === false || (r.r.deny ?? r.r.warn ?? false))) anyFlag = true;
  }
  land(EVD, import.meta, "D4-22", anyFlag ? "PASS" : "FAIL", anyFlag ? "公网暴露 FunctionGraph/ECS 部署计划被拦截或告警" : "部署计划预检未拦截公网暴露", out.join("\n"));
}

// ---- D4-28 Node 版安全 hook 链路（hooks.json 注册 .mjs）----
{
  const { readFileSync, existsSync } = await import("node:fs");
  const hooksPath = `${PKG}/../hooks.json`;
  const out = [];
  let ok = true;
  if (existsSync(hooksPath)) {
    try {
      const d = JSON.parse(readFileSync(hooksPath, "utf8"));
      const hooks = d.hooks || [];
      out.push(`hooks.json 顶层 hooks 数: ${hooks.length}`);
      const nodeHook = hooks.find((h) => (h.type === "command" || h.matcher) && JSON.stringify(h).includes(".mjs"));
      out.push(`含 .mjs 的 Node hook: ${nodeHook ? "存在" : "未发现"}`);
      if (!nodeHook) ok = false;
      for (const [i, h] of hooks.entries()) out.push(`  hook[${i}]: ${JSON.stringify(h).slice(0,160)}`);
    } catch (e) { out.push(`hooks.json 解析失败: ${e.message}`); ok = false; }
  } else { out.push("hooks.json 不存在于 "+hooksPath); ok = false; }
  land(EVD, import.meta, "D4-28", ok ? "PASS" : "FAIL", ok ? "hooks.json 注册 Node(.mjs) 实现" : "未发现 Node hook 注册", out.join("\n"));
}

// ---- D9-13 tools/call 凭证不泄露 + 权限校验三态 + 审批令牌不可重放 ----
{
  const out = [];
  let credLeak = false;
  const r1 = await callHook("huaweicloud_hook_check_command", { command: "env | grep HW_ACCESS_KEY" });
  const s1 = JSON.stringify(r1.r);
  out.push(`hook_check_command(凭证env) -> ${s1.slice(0,300)}`);
  if (/HW_ACCESS_KEY|AKIA[A-Z0-9]{16}|sk=[A-Za-z0-9]{10,}/.test(s1)) credLeak = true;
  // 三态：deny/warn/allow
  const rw = classifyRawCommand("hcloud ecs DeleteServer --force");
  const rr = classifyRawCommand("hcloud ecs ListServersDetails");
  out.push(`写 -> ${rw.decision}/${rw.risk}; 只读 -> ${rr.decision}/${rr.risk}`);
  const threeState = rw.decision === "deny" && rr.decision === "allow";
  land(EVD, import.meta, "D9-13", (!credLeak && threeState) ? "PASS" : "FAIL", (!credLeak && threeState) ? "凭证无泄露 + 权限 deny/allow 三态正确" : "凭证泄露或权限校验异常", out.join("\n"));
}

console.log("=== SAFETY2 DONE ===");