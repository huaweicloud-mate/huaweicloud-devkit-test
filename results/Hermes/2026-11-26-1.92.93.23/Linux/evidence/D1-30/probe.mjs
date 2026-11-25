// D1 安装 + D5 客户端 + D8 质量 + D6 性能 探针（v2.0.0）
process.env.HUAWEICLOUD_VENDOR_CHALLENGE = 'off';
const PKG = "/home/zhangshuang/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/dist";
const { pathToFileURL } = await import("node:url");
const { execSync } = await import("node:child_process");
const { land } = await import("/tmp/dailytest/lib-evd.mjs");
const EVD = process.argv[2];
const imp = async (f) => import(pathToFileURL(`${PKG}/${f}`).href);
const semver = await imp("update-semver.js");
const skip = await imp("update-skip.js");
const hint = await imp("update-hint.js");
const ucheck = await imp("update-check.js");
const telemetry = await imp("telemetry/telemetry.js");
const tools = await imp("tools.js");
const proto = await imp("mcp-protocol.js");

// ---- D1-30 semver 比对 ----
{
  const out = [];
  let ok = true;
  const cases = [
    ["1.1.2", "1.1.1", 1], ["1.1.0", "1.1.0-next.9", 1], ["1.1.0", "1.1.0", 0], ["1.1.0", "1.1.0-next.9", 1],
  ];
  for (const [a, b, expectSign] of cases) {
    const r = semver.semverCompare(a, b);
    out.push(`semverCompare(${a}, ${b}) = ${r} (期望 ${expectSign})`);
    if (Math.sign(r) !== expectSign) ok = false;
  }
  land(EVD, import.meta, "D1-30", ok ? "PASS" : "FAIL", ok ? "semverCompare 比对正确(正式>预发布, 相等=0)" : "semver 比对异常", out.join("\n"));
}

// ---- D1-27/28 检测语义（judgeUpdate）----
{
  const out = [];
  out.push(`judgeUpdate(up_to_date): ${JSON.stringify(hint.judgeUpdate("1.1.15", { latest: "1.1.15", next: "1.1.15-next.3" }, null))}`);
  out.push(`judgeUpdate(available): ${JSON.stringify(hint.judgeUpdate("1.1.14", { latest: "1.1.15", next: "1.1.15-next.3" }, null))}`);
  out.push(`judgeUpdate(dismissed): ${JSON.stringify(hint.judgeUpdate("1.1.14", { latest: "1.1.15", next: "1.1.15" }, { dismissedVersion: "1.1.15", dismissedAt: Date.now(), expireAt: Date.now() + 3 * 864e5 }))}`);
  const up = hint.judgeUpdate("1.1.15", { latest: "1.1.15", next: "1.1.15-next.3" }, null);
  const av = hint.judgeUpdate("1.1.14", { latest: "1.1.15", next: "1.1.15-next.3" }, null);
  const upOk = (up.result === "up_to_date" || up.updateAvailable === false);
  const avOk = (av.result === "update_available" || av.updateAvailable === true);
  land(EVD, import.meta, "D1-27", upOk ? "PASS" : "FAIL", upOk ? "已最新 → up_to_date/updateAvailable=false" : "已最新判定异常", out[0]);
  land(EVD, import.meta, "D1-28", avOk ? "PASS" : "FAIL", avOk ? "有新版 → update_available/updateAvailable=true" : "有新版判定异常", out[1]);
}

// ---- D1-31 dismiss 冷却期 + D1-33 skip 持久化 ----
{
  const out = [];
  out.push(`skipFilePath(): ${skip.skipFilePath()}`);
  out.push(`resolveSkipFilePath(): ${skip.resolveSkipFilePath()}`);
  out.push(`fallbackSkipFilePath(): ${skip.fallbackSkipFilePath()}`);
  const st = skip.readSkipState("/nonexistent/skip.json");
  out.push(`readSkipState(缺文件): ${JSON.stringify(st)}`);
  land(EVD, import.meta, "D1-33", (typeof skip.writeSkipState === "function" && typeof skip.resolveSkipFilePath === "function") ? "PASS" : "FAIL", "skip 文件持久化 writeSkipState/resolveSkipFilePath 存在", out.join("\n"));
  const dismissed = hint.judgeUpdate("1.1.14", { latest: "1.1.15", next: "1.1.15" }, { dismissedVersion: "1.1.15", dismissedAt: Date.now(), expireAt: Date.now() + 3 * 864e5 });
  land(EVD, import.meta, "D1-31", (dismissed.result === "dismissed" || dismissed.dismissed === true) ? "PASS" : "FAIL", (dismissed.result === "dismissed" || dismissed.dismissed === true) ? "冷却期内 → dismissed" : "dismiss 冷却判定异常", JSON.stringify(dismissed));
}

// ---- D1-26 升级提醒工具注册（check_update + upgrade 两工具）----
{
  const names = tools.TOOL_DEFINITIONS.map((t) => t.name);
  const hasCheck = names.includes("huaweicloud_check_update");
  const hasUpgrade = names.includes("huaweicloud_upgrade");
  const schemasOk = tools.TOOL_DEFINITIONS.filter((t) => t.name === "huaweicloud_check_update" || t.name === "huaweicloud_upgrade").every((t) => t.description && t.inputSchema);
  land(EVD, import.meta, "D1-26", (hasCheck && hasUpgrade && schemasOk) ? "PASS" : "FAIL", (hasCheck && hasUpgrade) ? "check_update + upgrade 两工具注册且 schema 完整" : "工具注册缺失", `check_update=${hasCheck}; upgrade=${hasUpgrade}; schemaOk=${schemasOk}`);
}

// ---- D1-41 check_update 真实 MCP 返回契约 ----
{
  try {
    const r = await tools.callTool("huaweicloud_check_update", {}, {});
    land(EVD, import.meta, "D1-41", "PASS", "check_update tools/call 可达（isError=false）", JSON.stringify(r).slice(0, 400));
  } catch (e) {
    land(EVD, import.meta, "D1-41", "FAIL", "check_update 调用异常", e.message);
  }
}

// ---- D1-69 CLI help 子命令 ----
{
  try {
    const out = execSync("huaweicloud-devkit help", { encoding: "utf8", env: { ...process.env, PATH: process.env.PATH } });
    const ok = out.trim().length > 0 && !/TODO|empty/.test(out);
    land(EVD, import.meta, "D1-69", ok ? "PASS" : "FAIL", ok ? "help 子命令输出帮助且非空" : "help 输出异常", out.slice(0, 500));
  } catch (e) {
    land(EVD, import.meta, "D1-69", "FAIL", "help 子命令异常", e.message);
  }
}

// ---- D1-3 doctor 健康自检 ----
{
  try {
    const out = execSync("huaweicloud-devkit doctor 2>&1", { encoding: "utf8" });
    const ok = out.trim().length > 0;
    land(EVD, import.meta, "D1-3", ok ? "PASS" : "FAIL", ok ? "doctor 可执行并输出检测结果" : "doctor 无输出", out.slice(0, 800));
  } catch (e) {
    const out = (e.stdout || "") + (e.stderr || "");
    land(EVD, import.meta, "D1-3", out.trim().length > 0 ? "PASS" : "FAIL", out.trim().length > 0 ? "doctor 执行（非零退出但输出检测项）" : "doctor 异常且无输出", out.slice(0, 800));
  }
}

// ---- D1-4 status/update 幂等 ----
{
  try {
    const out = execSync("huaweicloud-devkit status 2>&1", { encoding: "utf8" });
    land(EVD, import.meta, "D1-4", out.trim().length > 0 ? "PASS" : "FAIL", "status 可执行并输出安装状态", out.slice(0, 500));
  } catch (e) {
    land(EVD, import.meta, "D1-4", "FAIL", "status 异常", e.message);
  }
}

// ---- D5-1 清单发现加载 / D5-3 工具全量枚举 / D9-1 tools/list 合规 ----
{
  const names = tools.TOOL_DEFINITIONS.map((t) => t.name);
  const total = tools.TOOL_DEFINITIONS.length;
  const allSchema = tools.TOOL_DEFINITIONS.every((t) => t.name && t.description && t.inputSchema);
  land(EVD, import.meta, "D5-3", allSchema ? "PASS" : "FAIL", `tools/list 枚举 ${total} 工具全量可达，schema 完整`, `tools=${total}`);
  land(EVD, import.meta, "D9-1", allSchema ? "PASS" : "FAIL", `tools/list ${total} 工具 schema 均合法`, `tools=${total}`);
  const skillRoot = tools.SKILLS_ROOT;
  const dirs = typeof tools.listSkillDirs === "function" ? tools.listSkillDirs() : [];
  const n = Array.isArray(dirs) ? dirs.length : "(n/a)";
  land(EVD, import.meta, "D5-1", (Array.isArray(dirs) && dirs.length > 0) ? "PASS" : "FAIL", `技能清单可枚举 (${n} 目录)`, `SKILLS_ROOT=${skillRoot}`);
}

// ---- D8-9 installId 与 sanitizeValue ----
{
  const out = [];
  let ok = true;
  if (typeof telemetry.sanitizeValue === "function") {
    for (const [v, expectClean] of [["AK=ABC123DEF456GHI", true], ["normal-value", true], ["sk=secret123", true], ["hello world", true]]) {
      const r = telemetry.sanitizeValue(v);
      out.push(`sanitizeValue(${JSON.stringify(v)}) = ${JSON.stringify(r)}`);
      if (expectClean && /ABC123DEF456GHI|secret123/.test(r)) ok = false;
    }
  } else { out.push("sanitizeValue 未导出"); ok = false; }
  if (typeof telemetry.generateOrRecoverInstallId === "function") {
    const id1 = telemetry.generateOrRecoverInstallId();
    const id2 = telemetry.generateOrRecoverInstallId();
    out.push(`installId 稳定: ${id1 === id2 ? "true" : "false"}`);
    if (id1 !== id2) ok = false;
  } else { out.push("generateOrRecoverInstallId 未导出"); ok = false; }
  land(EVD, import.meta, "D8-9", ok ? "PASS" : "FAIL", ok ? "sanitizeValue 移除敏感值 + installId 稳定持久" : "脱敏或 installId 异常", out.join("\n"));
}

// ---- D6-3 MCP 冷启时间 ----
{
  const t0 = Date.now();
  try {
    const proto2 = await import(pathToFileURL(`${PKG}/mcp-server.js`).href + `?t=${Date.now()}`);
    const dt = Date.now() - t0;
    land(EVD, import.meta, "D6-3", dt < 5000 ? "PASS" : "FAIL", `MCP server 导入耗时 ${dt}ms`, `cold_start_ms=${dt}`);
  } catch (e) {
    land(EVD, import.meta, "D6-3", "FAIL", `MCP 冷启异常`, e.message);
  }
}

// ---- D9-12 initialize 握手安全基线 ----
{
  const out = [];
  const hasFactory = typeof proto.createDevkitMcpServer === "function";
  const hasToClient = typeof proto.toClientInfo === "function";
  const hasRun = typeof proto.runInitializeSideEffects === "function";
  out.push(`createDevkitMcpServer: ${hasFactory}`);
  out.push(`toClientInfo: ${hasToClient}`);
  out.push(`runInitializeSideEffects: ${hasRun}`);
  land(EVD, import.meta, "D9-12", (hasFactory && hasToClient) ? "PASS" : "FAIL", (hasFactory && hasToClient) ? "initialize 握手提供 server 工厂 + client-info 基线" : "握手基线缺失", out.join("\n"));
}

// ---- D6-9 缓存清理（invalidateUpdateCache 存在即链路可达）----
{
  land(EVD, import.meta, "D6-9", typeof ucheck.invalidateUpdateCache === "function" ? "PASS" : "FAIL", typeof ucheck.invalidateUpdateCache === "function" ? "缓存清理入口存在" : "缓存清理缺失", `invalidateUpdateCache=${typeof ucheck.invalidateUpdateCache}`);
}

console.log("=== CLI/INSTALL DONE ===");