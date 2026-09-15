# -*- coding: utf-8 -*-
"""OpenClaw/Linux 2026-09-15 每日测试执行状态回填（SUT v1.1.4 stable，gitHead 9b67256）。
补测 BLOCKED 深挖：源码级直调/确定性 harness 可跑的假阻塞一律转 PASS/FAIL，仅真·外部依赖保留 BLOCKED。
"""
import csv
import os
from collections import Counter
from datetime import datetime

PACK = os.getcwd()
DESIGN = "用例矩阵-设计级.csv"
EXPANDED = "用例矩阵-展开级.csv"
TRACING = "需求-设计-证据追踪表.csv"

TS = "20260915221000"
TS_ISO = "2026-09-15 22:10 (CST)"

def four(what_missing, impact, unblock):
    return f"实测{TS_ISO}；缺资源={what_missing}；影响={impact}；解除条件={unblock}"

RT_EVID = "evidence/d10-routing"

# 设计级 77 条（OpenClaw/Linux 预筛后）
DESIGN_STATUS = {
    # ---- D1 更新检测链：源码级直调 judgeUpdate/writeSkipState/applyUpdateHint + _decorateResult ---- 
    "D1-41": ("PASS", "evidence/d1-update-check", ""),
    "D1-42": ("PASS", "evidence/d1-update-check", ""),
    "D1-45": ("PASS", "evidence/d1-update-check", ""),
    # ---- D1 其它已测/历史 ----
    "D1-26": ("PASS", "evidence/d4-security-misc", ""),
    "D1-27": ("PASS", "evidence/d1-upgrade", ""),
    "D1-28": ("PASS", "evidence/d1-upgrade", ""),
    "D1-30": ("PASS", "evidence/d1-upgrade", ""),
    "D1-31": ("PASS", "evidence/d1-upgrade", ""),
    "D1-33": ("PASS", "evidence/d1-upgrade", ""),
    "D1-39": ("PASS", "evidence/d1-upgrade", ""),
    "D1-40": ("PASS", "evidence/d1-upgrade", ""),
    "D1-58": ("PASS", "evidence/d1-upgrade", ""),
    # ---- D1 真机生命周期：真·外部依赖（需真机安装态/多客户端/无 KooCLI 环境）----
    "D1-1": ("BLOCKED", "", four("真机 OpenClaw install --target 生命周期 + 隔离 HOME", "无法验证安装目标路径与隔离态残留", "供真机 OpenClaw CLI 安装态或注入 install 生命周期夹具")),
    "D1-2": ("BLOCKED", "", four("多客户端共存环境(claude/codex 等 detectAgent 目标)", "auto-detect 无法在单 OpenClaw 机验证", "供多客户端同机环境或 agent-detect 夹具")),
    "D1-3": ("BLOCKED", "", four("真机 doctor CLI + 人为制造组件缺失场景", "无法验证 doctor 各组件缺失分支", "供真机 doctor 或组件缺失注入夹具")),
    "D1-4": ("BLOCKED", "", four("真机 status/update CLI + 用户自定义 config 保护", "无法验证 status/update 幂等与 config 保留", "供真机 CLI 或 config 快照夹具")),
    "D1-5": ("BLOCKED", "", four("真机 uninstall + 残留扫描(Windows 文件锁优先)", "无法验证 uninstall 干净度", "供真机安装态或 uninstall 生命周期夹具")),
    "D1-6": ("BLOCKED", "", four("无 KooCLI 环境(本机 hcloud 7.2.12 已装)", "无法验证重装引导分支", "供无 KooCLI 机器或卸载 KooCLI 夹具")),
    # ---- D2 认证 ----
    "D2-1": ("BLOCKED", "", four("沙箱连接(sandbox_connect 需活沙箱)+真云三端 API 可用性验证", "源码级三端落位已 PASS，但真云 S2/S3 API 实际可用需含沙箱端三端真机", "供沙箱连接凭据与真云三端验证环境")),
    "D2-2": ("PASS", "evidence/d2-auth", ""),
    "D2-4": ("PASS", "evidence/d2-auth", ""),
    "D2-5": ("PASS", "evidence/d4-security-misc", ""),
    "D2-10": ("PASS", "evidence/d2-auth", ""),
    "D2-11": ("PASS", "evidence/d2-auth", ""),
    "D2-12": ("PASS", "evidence/d2-auth", ""),
    "D2-13": ("PASS", "evidence/d2-auth", ""),
    "D2-16": ("PASS", "evidence/d2-auth", ""),
    # ---- D3 功能 ----
    "D3-A1": ("PASS", "evidence/d3-d5-functional", ""),
    "D3-B1": ("PASS", "evidence/d4-security-misc", ""),
    "D3-B3": ("PASS", "evidence/d3-d5-functional", ""),
    "D3-B5": ("PASS", "evidence/d3-d5-functional", ""),
    "D3-C5": ("PASS", "evidence/d8-skills", ""),
    # ---- D4 安全 ----
    "D4-1": ("PASS", "evidence/d4-security-core", ""),
    "D4-2": ("FAIL", "evidence/d4-security-core", ""),
    "D4-3": ("PASS", "evidence/d4-security-core", ""),
    "D4-4": ("PASS", "evidence/d4-security-core", ""),
    "D4-5": ("PASS", "evidence/d4-security-misc", ""),
    "D4-6": ("FAIL", "evidence/d4-security-core", ""),
    "D4-7": ("FAIL", "evidence/d4-security-core", ""),
    "D4-8": ("PASS", "evidence/d4-security-misc", ""),
    "D4-9": ("PASS", "evidence/d4-security-core", ""),
    "D4-10": ("BLOCKED", "", four("规则库版本快照 + 新增规则项注入夹具", "无法验证规则库新增回归", "供规则库快照或注入夹具")),
    "D4-11": ("PASS", "evidence/d4-security-core", ""),
    "D4-12": ("BLOCKED", "", four("npm 安装供应链攻击仿真夹具(恶意依赖注入)", "无法验证供应链安装期安全防护", "供恶意依赖注入仿真环境")),
    "D4-13": ("BLOCKED", "", four("只读子账号凭证 ~/.config/huaweicloud/credentials.readonly.json 缺失", "run-as-readonly.py 无法切换只读账号，最小权限通过率无法实测", "下发 credentials.readonly.json 后重跑")),
    "D4-14": ("BLOCKED", "", four("真云 CTS 审计日志(需真实写操作产生审计记录)", "无法验证操作可审计性及 agent/人工区分", "供真云账号并执行最小写操作后查 CTS")),
    "D4-15": ("PASS", "evidence/d4-security-core", ""),
    "D4-16": ("FAIL", "evidence/d4-security-core", ""),
    "D4-17": ("PASS", "evidence/d4-security-misc", ""),
    "D4-18": ("PASS", "evidence/d4-security-core", ""),
    "D4-19": ("PASS", "evidence/d4-security-core", ""),
    "D4-20": ("PASS", "evidence/d4-security-core", ""),
    "D4-21": ("FAIL", "evidence/d4-security-core", ""),
    "D4-22": ("PASS", "evidence/d4-security-core", ""),
    "D4-23": ("FAIL", "evidence/d4-security-core", ""),
    "D4-24": ("BLOCKED", "", four("真云确认流 + 可注入时钟(审批流健壮性)", "无法验证确认令牌过期/重复确认边界", "供真云确认流或时钟注入夹具")),
    # ---- D5 ----
    "D5-1": ("PASS", "evidence/d3-d5-functional", ""),
    "D5-3": ("PASS", "evidence/d3-d5-functional", ""),
    # ---- D6 ----
    "D6-1": ("PASS", "evidence/d6-performance", ""),
    "D6-3": ("PASS", "evidence/d6-performance", ""),
    "D6-4": ("PASS", "evidence/d6-performance", ""),
    # ---- D7 ----
    "D7-4": ("PASS", "evidence/d8-docs", ""),
    # ---- D8 ----
    "D8-1": ("PASS", "evidence/d8-docs", ""),
    "D8-4": ("PASS", "evidence/d8-docs", ""),
    "D8-6": ("PASS", "evidence/d8-docs", ""),
    "D8-7": ("PASS", "evidence/d8-skills", ""),
    # ---- D9 ----
    "D9-1": ("PASS", "evidence/d9-protocol", ""),
    "D9-2": ("FAIL", "evidence/d9-protocol", ""),
    "D9-3": ("PASS", "evidence/d9-protocol", ""),
    "D9-4": ("BLOCKED", "", four("长连接断连/重连/关闭时序夹具", "无法验证协议生命周期时序", "供长连接时序注入夹具")),
    "D9-5": ("PASS", "evidence/d9-protocol", ""),
    "D9-6": ("BLOCKED", "", four("多客户端同机环境(本机仅 OpenClaw)", "无法验证跨客户端协议互通", "供多客户端同机环境或 clientInfo 变异夹具")),
    "D9-7": ("BLOCKED", "", four("多版本服务端/客户端夹具", "无法验证协议版本协商降级", "供多版本协议夹具")),
    "D9-8": ("PASS", "evidence/d4-security-misc", ""),
    "D9-9": ("BLOCKED", "", four("可注入延迟夹具 + capabilities.cancellation", "无法验证 tools/call 超时语义(-32000)与取消", "供挂起工具延迟注入夹具")),
    # ---- D10 ----
    "D10-3": ("FAIL", "evidence/d10-routing", ""),  # 中文意图路由 21.4% < 90%，同 #689
    "D10-4": ("PASS", "evidence/d4-security-misc", ""),
}

# 展开级 17 条（2 EXP-D5 + 15 EXP-E）
EXPANDED_STATUS = {
    "EXP-D5-9-1": ("PASS", "evidence/d3-d5-functional", ""),
    "EXP-D5-9-3": ("PASS", "evidence/d3-d5-functional", ""),
    # EXP-E：确定性 serviceCatalog 路由断言（eval/harness + 源码直调），未命中即 FAIL
    "EXP-E01": ("FAIL", RT_EVID, ""),
    "EXP-E02": ("FAIL", RT_EVID, ""),
    "EXP-E03": ("FAIL", RT_EVID, ""),  # OBS 期望 vs Sandbox+DevStation 实际 → 确定性 MISS
    "EXP-E04": ("FAIL", RT_EVID, ""),
    "EXP-E05": ("FAIL", RT_EVID, ""),
    "EXP-E06": ("PASS", RT_EVID, ""),
    "EXP-E07": ("FAIL", RT_EVID, ""),
    "EXP-E09": ("PASS", RT_EVID, ""),
    "EXP-E10": ("FAIL", RT_EVID, ""),
    "EXP-E11": ("FAIL", RT_EVID, ""),
    "EXP-E12": ("FAIL", RT_EVID, ""),
    "EXP-E13": ("FAIL", RT_EVID, ""),  # ELB 期望 vs 空 → 确定性 MISS
    "EXP-E14": ("FAIL", RT_EVID, ""),
    "EXP-E15": ("PASS", RT_EVID, ""),
    # E08 诊断类：真实 Agent 会话理解中文意图后才走 explain_error，run-eval.mjs 无法代理
    "EXP-E08": ("BLOCKED", "", four("真实 Agent 会话 LLM harness(ITER-004+ 待建，run-eval.mjs 无法代理诊断意图层)", "诊断类中文意图是否路由 explain_error 无法由 serviceCatalog 确定性层判定", "接入可交互真实 Agent 客户端(如 Hermes 会话级 CDP 自动化)")),
}


def ensure_cols(rows, fieldnames, wanted):
    for c in wanted:
        if c not in fieldnames:
            fieldnames.append(c)
    for r in rows:
        for c in wanted:
            r.setdefault(c, "")
    return fieldnames


def apply_design():
    with open(DESIGN, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    fields = list(rows[0].keys()) if rows else []
    fields = ensure_cols(rows, fields, ["执行状态", "执行时间", "evidencePath", "blockedReason"])
    for r in rows:
        cid = r.get("ID", "").strip()
        st, ev, br = DESIGN_STATUS.get(cid, ("BLOCKED", "", four("未在回填映射", "未执行", "补充映射后重跑")))
        r["执行状态"] = st
        r["evidencePath"] = ev
        r["执行时间"] = TS if st in ("PASS", "FAIL", "BLOCKED") else ""
        r["blockedReason"] = br if st == "BLOCKED" else ""
    with open(DESIGN, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)


def apply_expanded():
    with open(EXPANDED, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    fields = list(rows[0].keys()) if rows else []
    fields = ensure_cols(rows, fields, ["执行状态", "执行时间", "evidencePath", "blockedReason"])
    for r in rows:
        cid = r.get("ID", "").strip()
        st, ev, br = EXPANDED_STATUS.get(cid, ("BLOCKED", "", four("环境阻塞未执行", "未执行", "补充映射后重跑")))
        r["执行状态"] = st
        r["evidencePath"] = ev
        r["执行时间"] = TS if st in ("PASS", "FAIL", "BLOCKED") else ""
        r["blockedReason"] = br if st == "BLOCKED" else ""
    with open(EXPANDED, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)


def apply_tracing():
    with open(TRACING, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    fields = list(rows[0].keys()) if rows else []
    fields = ensure_cols(rows, fields, ["执行时间"])
    for r in rows:
        dc = r.get("designCaseId", "").strip()
        if dc in DESIGN_STATUS and DESIGN_STATUS[dc][0] in ("PASS", "FAIL", "BLOCKED"):
            r["执行时间"] = TS
        else:
            r["执行时间"] = ""
    with open(TRACING, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)


if __name__ == "__main__":
    apply_design()
    apply_expanded()
    apply_tracing()
    c1 = Counter(r["执行状态"] for r in csv.DictReader(open(DESIGN, encoding="utf-8-sig")))
    print("设计级状态汇总:", dict(c1))
    c2 = Counter(r["执行状态"] for r in csv.DictReader(open(EXPANDED, encoding="utf-8-sig")))
    print("展开级状态汇总:", dict(c2))
    print("执行时间戳:", TS, "（北京时间）", TS_ISO)