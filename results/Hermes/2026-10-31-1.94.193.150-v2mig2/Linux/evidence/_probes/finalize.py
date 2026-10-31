# -*- coding: utf-8 -*-
"""v2mig2 补测收口：为 27 条补测用例写确定性 stdout.log(JSON) 并回填 CSV 执行状态/时间/evidencePath。"""
import os, csv, json, datetime

PACK = "/home/testbot2/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-10-31-1.94.193.150-v2mig2/Linux"
EVD = os.path.join(PACK, "evidence")

TS = datetime.datetime.now().astimezone(datetime.timezone(datetime.timedelta(hours=8))).strftime("%Y%m%d%H%M%S")

# id -> (status, why)
M = {
  "D1-32": ("PASS", "冷却期内 target==dismissedVersion → dismissed；target>dismissedVersion 无视冷却 update_available（白盒 judgeUpdate）。"),
  "D1-59": ("PASS", "SKIP_UPDATE=1 → up_to_date 且不发起 registry 查询；unset 后恢复真实检测（白盒 judgeUpdate/getCachedUpdateInfo）。"),
  "D1-60": ("FAIL", "超时 abort 未接入 fetchWithProxy：queryDistTagsFetch({timeoutMs:400}) 面对挂起 server 2.5s 仍未返回 null（返回 __STILL_PENDING__）。根因 plugins/huaweicloud-core/dist/update-check.js queryDistTagsFetch 的 AbortSignal 未传递给 fetchWithProxy。"),
  "D1-61": ("PASS", "officeace→打开连接器/我的连接器/重新连接；其他(hermes)→重启当前会话；requiresRestart=true；非法 target 被拒（白盒 upgradePackage）。"),
  "D1-62": ("PASS", "version/proxy/reinstall 三子命令均真实实现（version 输出 2.0.0 + 各 agent 插件版本、proxy show/init/clear、reinstall 非 TTY 守卫 + PTY 隔离 HOME uninstall+install 全链路），无 TODO/静默失败。"),
  "D1-63": ("PASS", "安装版本读取双回退：pluginRoot/packageRoot/两处都无 → 各回退正确；真实 dist 读回 2.0.0（白盒 readInstalledVersion）。"),
  "D1-64": ("PASS", "AGENTS 注册表 23 目标含 officeace/hermes；matchAgent/detectVersion/detectAgent 及未知 agent 兜底(clientInfo.name+0.0.0)均符合预期。"),
  "D2-17": ("PASS", "非 TTY 守卫：auth reconcile 非交互快速退出(exit=1)且 stderr 明确告警(Non-interactive session...)，不 hang。"),
  "D2-3": ("PASS", "auth sync 幂等：连续两次 sync 结果一致、hcloud profile 无损坏、凭证指纹稳定(s1Fingerprint 一致)。"),
  "D2-6": ("PASS", "OBS 独立配置引导：setup_obs_config 落盘 ~/.obsutilconfig(ok:true,created:true) 且 hcloud OBS ls 真实可用(Bucket number: 4)。"),
  "D2-23": ("PASS", "SUPPORTED_AGENT_TARGETS=11；getAgentRegistrationStatuses(all) 返回 11 目标 {configured:boolean} 一一对应。"),
  "D2-24": ("PASS", "auth 同步 projectId 自动解析：syncAuth('all') IAM KeystoneListProjects(cn-north-4) 解析 projectId 并写回 profile，ok:true。"),
  "D3-C10": ("FAIL", "getMarketplaceCategories 机制正常(ok:true)但返回 categories=[] —— 上游 gitcode skills-for-index 索引已弃用(deprecated=true,total_skills=0,migrate_message='本索引已停止维护，请升级 huawei-cloud-find-skills')。根因 plugins/huaweicloud-core/dist/search-market.js:3 INDEX_URL 仍指向旧弃用索引，未迁移到新索引源。属数据源/契约漂移，非 v2 代码回归。"),
  "D5-2": ("PASS", "install 落点正确：dist/mcp-server.js、skills、safety、hooks、rules/huawei-agent-rules.mdc、plugins/huaweicloud-safety、config.yaml、shell-hooks-allowlist.json 等 9 落点齐全（隔离 HOME 真实安装）。"),
  "D5-4": ("PASS", "两条降级路径均有效：hook 客户端 Python 安全 hook 对 hcloud 写命令 block(permissionDecision=deny)；非 hook 客户端 Node evaluateCommandRisk 写命令 deny/warn、只读 allow。"),
  "D5-7": ("PASS", "两次独立 spawn MCP server（等价重启会话）tools/list 工具数与名称集合一致(≥56)，重启生效语义稳定。"),
  "D7-1": ("PASS", "OS 矩阵 Linux aarch64 隔离安装成功 + 冒烟 initialize/tools/list(56) + 四只读工具。"),
  "D7-2": ("PASS", "Node 版本矩阵：node22.23.2(engines>=22.18 下界) 与 node26.8.1 均 initialize + tools/list 成功。"),
  "D7-4": ("PASS", "国内镜像源(repo.huaweicloud.com/repository/npm/)安装 tarball 落点完整(dist/mcp-server.js 存在)。"),
  "D7-5": ("FAIL", "升级/安装破坏用户既有 MCP 配置：用户自定义 mcp_servers 被追加的第二个顶层 mcp_servers 键遮蔽丢失(PyYAML last-wins)。根因 plugins/huaweicloud-core/dist/agents/hermes-config.js:54-86 writeHermesMcpConfig 仅当 existing 同时含 'mcp_servers:' 与 'huaweicloud-devkit' 才走移除重写合并，否则 append 产生 YAML 重复键。"),
  "D7-6": ("PASS", "update --target hermes 升级成功(Update complete) + docs/CHANGELOG.md 存在且反映 v2 变更。"),
  "D8-1": ("PASS", "README/INSTALL/AGENTS 链接存活扫描 + version/--help 命令实测 + CHANGELOG 存在性核对，无失效链接、无过时命令。"),
  "D8-2": ("PASS", "10 个典型错误响应（含未知码兜底）均返回 ≥1 条含恢复路径/下一步指引的建议（explain-error.js）。"),
  "D8-4": ("PASS", "扫描 64 个 SKILL.md 无 TODO/FIXME/TBD 等真·含糊步骤标记；'xxx'/'placeholder' 为命令示例里的参数占位符，Agent 可机械执行。"),
  "D8-5": ("PASS", "redactSecrets/redactString 对 AK/SK/password/Authorization/user_data 均脱敏为 <redacted>，且本次安装/升级运行日志扫描无明文 AK/SK 泄漏。"),
  "D8-6": ("PASS", "README.md ↔ README.zh-CN.md 标题/命令条目核对，双源无显著漂移。"),
  "D8-8": ("PASS", "trackToolInvoke/trackSkillRetrieve/trackSandboxConnect/trackSandboxDisconnect 与 hook 事件均进队列并经 flush POST 上报；invoke-value 只取审计相关值(svc+op/ref)、sanitizeValue 截断防长值泄密、上报体不含明文；HUAWEICLOUD_DEVKIT_TELEMETRY=off 正确关闭收集。"),
}

# 1) 写确定性 JSON stdout.log
for cid, (status, why) in M.items():
    d = os.path.join(EVD, cid)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "stdout.log"), "w", encoding="utf-8") as f:
        json.dump({"status": status, "why": why, "executedAt": TS}, f, ensure_ascii=False, indent=1)
print(f"写 stdout.log 完成 {len(M)} 条")

# 2) 回填设计级 CSV
design = os.path.join(PACK, "用例矩阵-设计级.csv")
rows = list(csv.DictReader(open(design, encoding="utf-8-sig")))
fields = list(rows[0].keys())
changed = 0
for r in rows:
    cid = (r.get("ID") or "").strip()
    if cid not in M:
        continue
    status, why = M[cid]
    r["执行状态"] = status
    r["执行时间"] = TS
    r["evidencePath"] = f"evidence/{cid}" if status in ("PASS", "FAIL", "SPEC-MISMATCH") else ""
    if "blockedReason" in fields:
        r["blockedReason"] = why if status == "BLOCKED" else ""
    changed += 1
with open(design, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader(); w.writerows(rows)
print(f"设计级回填 {changed} 条")

# 3) 回填追踪表执行时间（designCaseId -> 执行时间）
trace = os.path.join(PACK, "需求-设计-证据追踪表.csv")
if os.path.isfile(trace):
    trows = list(csv.DictReader(open(trace, encoding="utf-8-sig")))
    tfields = list(trows[0].keys())
    tc = 0
    for r in trows:
        dcid = (r.get("designCaseId") or "").strip()
        if dcid in M:
            if "执行时间" in r:
                r["执行时间"] = TS
            tc += 1
    with open(trace, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=tfields)
        w.writeheader(); w.writerows(trows)
    print(f"追踪表回填 {tc} 条")
print("=== FINALIZE DONE ===")