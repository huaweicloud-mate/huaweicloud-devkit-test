// D3 功能/目录路由 + D10 评测 + EXP-C4/EXP-E 探针 —— v2.0.0-next.6 修正版
// 修正：读取 callTool 原始返回对象（非 content[0].text）；list_operations 取 command 字段；
// detect_framework 用 projectPath；D10-4 规则库路径为 safety/rules（dist 的上级）。
process.env.HUAWEICLOUD_VENDOR_CHALLENGE = 'off';
const PKG = "/home/zhangshuang/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/dist";
const { pathToFileURL } = await import("node:url");
const { readFileSync } = await import("node:fs");
const { join, dirname } = await import("node:path");
const { fileURLToPath } = await import("node:url");
const { land } = await import("/tmp/dailytest/lib-evd.mjs");
const EVD = process.argv[2];
const tools = await import(pathToFileURL(PKG + "/tools.js").href);

const VC = { vendorConfirmed: "用户要在华为云上部署应用" };
async function sc(intent) {
  const r = await tools.callTool("huaweicloud_service_catalog", { intent, ...VC }, { sessionId: `cat-${Math.random()}` });
  return { svcs: Array.isArray(r.recommendedServices) ? r.recommendedServices : [], skills: Array.isArray(r.recommendedSkills) ? r.recommendedSkills : [] };
}

const csvDir = "/home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/eval/prompts";
const raw = readFileSync(join(csvDir, "eval-set-v2.csv"), "utf-8").replace(/^\uFEFF/, "");
const lines = raw.trim().split(/\r?\n/);
const hdr = lines[0].split(",").map((s) => s.trim());
const rows = lines.slice(1).map((l) => { const v = l.split(","); const o = {}; hdr.forEach((h, i) => o[h] = (v[i] || "").trim()); return o; });

const EXPECT = {
  'EXP-E01': ['ECS'], 'EXP-E02': ['ECS'], 'EXP-E03': ['OBS'], 'EXP-E04': ['EIP'],
  'EXP-E05': ['RDS'], 'EXP-E06': ['DCS'], 'EXP-E07': ['CBR'], 'EXP-E08': null,
  'EXP-E09': ['CCE'], 'EXP-E10': ['FunctionGraph'], 'EXP-E11': ['BSS'], 'EXP-E12': ['CES'],
  'EXP-E13': ['ELB'], 'EXP-E14': ['IAM'], 'EXP-E15': ['Incentive Voucher'],
};

let hit = 0, miss = 0, na = 0;
for (const r of rows) {
  const id = r.id;
  let rsc;
  try { rsc = await sc(r.prompt); } catch (e) { rsc = { svcs: [`THREW ${e.message}`], skills: [] }; }
  const expect = EXPECT[id];
  let verdict, status, why;
  if (expect === null) { verdict = "N/A"; na++; status = "PASS"; why = "E08 诊断类无服务路由预期（N/A）"; }
  else {
    verdict = expect.some((s) => rsc.svcs.some((x) => x.includes(s))) ? "HIT" : "MISS";
    verdict === "HIT" ? hit++ : miss++;
    status = verdict === "HIT" ? "PASS" : "FAIL";
    why = verdict === "HIT" ? `命中 ${expect.join("/")}` : `未命中（期望 ${expect.join("/")}，实际 ${rsc.svcs.join("|")}）`;
  }
  land(EVD, import.meta, id, status, why, `intent: ${r.prompt}\n实际 recommendedServices: ${JSON.stringify(rsc.svcs)}\n实际 recommendedSkills: ${JSON.stringify(rsc.skills)}`);
}
const denom = hit + miss;
const acc = denom ? (hit / denom * 100).toFixed(1) : "N/A";
land(EVD, import.meta, "D10-3", denom && miss === 0 ? "PASS" : "FAIL", `serviceCatalog 中文意图路由准确率 ${acc}% (HIT=${hit} MISS=${miss} N/A=${na})`, `修正后：调用 callTool 原始返回，按 EXPECT 精确名匹配。`);
console.log(`EXP-E 路由: HIT=${hit} MISS=${miss} N/A=${na} 准确率=${acc}%`);

// EXP-C4 22 服务只读规划冒烟
const SVC = [["EXP-C4-01","ECS"],["EXP-C4-02","VPC"],["EXP-C4-03","OBS"],["EXP-C4-04","RDS"],["EXP-C4-05","GaussDB"],["EXP-C4-06","CCE"],["EXP-C4-07","FunctionGraph"],["EXP-C4-08","IAM"],["EXP-C4-09","CTS"],["EXP-C4-10","CES"],["EXP-C4-11","DDS"],["EXP-C4-12","DCS"],["EXP-C4-13","SMN"],["EXP-C4-14","DMS"],["EXP-C4-15","WAF"],["EXP-C4-16","CDN"],["EXP-C4-17","ModelArts"],["EXP-C4-18","DEW"],["EXP-C4-19","CBR"],["EXP-C4-20","EVS"],["EXP-C4-21","EIP"],["EXP-C4-22","ELB"]];
for (const [cid, svc] of SVC) {
  let route = "未知";
  try {
    const r = await tools.callTool("huaweicloud_list_operations", { service: svc, ...VC }, { sessionId: `c4-${cid}` });
    route = typeof r.command === 'string' ? `command(${r.command})` : JSON.stringify(r).slice(0, 80);
  } catch (e) { route = `THREW ${e.message}`; }
  const routable = !/THREW/.test(route);
  land(EVD, import.meta, cid, routable ? "PASS" : "FAIL", routable ? `${svc} 只读规划路由可执行` : `${svc} 路由异常`, `list_operations(${svc}) -> ${route}`);
}

// D3-A1 skill 检索完整性
{
  let skills = [];
  try { const r = await tools.callTool("huaweicloud_list_skills", {}, { sessionId: `a1-${Math.random()}` }); skills = Array.isArray(r.skills) ? r.skills : []; } catch (e) { skills = []; }
  land(EVD, import.meta, "D3-A1", skills.length > 0 ? "PASS" : "FAIL", skills.length > 0 ? `skill 检索返回 ${skills.length} 个技能` : "skill 检索返回空", JSON.stringify(skills).slice(0, 300));
}

// D3-B1 list_operations 规范名（返回 command 即路由成功）
{
  let cmd = "";
  try { const r = await tools.callTool("huaweicloud_list_operations", { service: "ECS", ...VC }, { sessionId: `b1-${Math.random()}` }); cmd = typeof r.command === 'string' ? r.command : ''; } catch (e) { cmd = ''; }
  land(EVD, import.meta, "D3-B1", cmd.trim().length > 0 ? "PASS" : "FAIL", cmd.trim().length > 0 ? `list_operations(ECS) 返回规范 command: ${cmd}` : "未返回规范 command", cmd.slice(0, 300));
}

// D3-B5 detect_framework 识别（参数名 projectPath）
{
  let out = "";
  try { const r = await tools.callTool("huaweicloud_detect_framework", { projectPath: "/tmp" }, { sessionId: `b5-${Math.random()}` }); out = JSON.stringify(r).slice(0, 300); } catch (e) { out = `THREW ${e.message}`; }
  const ok = !/THREW/.test(out);
  land(EVD, import.meta, "D3-B5", ok ? "PASS" : "FAIL", ok ? "detect_framework 可执行并返回识别结果" : out, out);
}

// D10-4 安全干预-静态规则层（规则库位于 safety/rules，dist 的上级目录）
{
  let ruleCount = -1, denyCount = -1, warnCount = -1;
  try {
    const rulesPath = join(PKG, "..", "safety", "rules", "cloud-risk-rules.json");
    const d = JSON.parse(readFileSync(rulesPath, "utf8"));
    const arr = Array.isArray(d) ? d : (d.rules || []);
    ruleCount = arr.length;
    denyCount = arr.filter((x) => x.severity === "deny").length;
    warnCount = arr.filter((x) => x.severity === "warn").length;
    land(EVD, import.meta, "D10-4", ruleCount > 0 ? "PASS" : "FAIL", `规则库加载 ${ruleCount} 条 (deny=${denyCount} warn=${warnCount})`, `rulesPath=${rulesPath}`);
  } catch (e) {
    land(EVD, import.meta, "D10-4", "FAIL", `规则库加载异常: ${e.message}`, "");
  }
}

console.log("=== CATALOG(v2修正版) DONE ===");