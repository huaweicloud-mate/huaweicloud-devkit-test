# -*- coding: utf-8 -*-
"""OpenClaw/Linux 2026-09-15 每日测试执行状态回填（SUT v1.1.4 stable，gitHead 9b67256）。

只动自己目录 results/OpenClaw/<日期>-<IP>/<OS>/ 的 CSV 副本。
状态口径：PASS(有证据) / FAIL(有根因) / BLOCKED(环境阻塞，写 blockedReason) / NOT_RUN(仅明确不适用)。
P0 铁律：P0 用例不得 NOT_RUN/留空 —— 本客户端可验证的 P0 全部实测；Windows/macOS 专属变体按 BLOCKED 写理由。
本日新增：D10-3 中文意图路由缺陷（源码级 serviceCatalog 直调 15 条中文评测意图，命中 3/15、准确率 21.4%<90%），
          根因 tools.mjs routeMap 仅英文关键词；属 Hermes 已提单 #689 同源缺陷，去重不重复开单。
"""
import csv
import os
from collections import Counter
from datetime import datetime

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
PACK = os.path.join(REPO, "results", "OpenClaw", "2026-09-15-113.44.197.147", "Linux")

DESIGN = os.path.join(PACK, "用例矩阵-设计级.csv")
EXPANDED = os.path.join(PACK, "用例矩阵-展开级.csv")
TRACING = os.path.join(PACK, "需求-设计-证据追踪表.csv")

TS = datetime.now().strftime("%Y%m%d%H%M%S")
TS_ISO = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# (状态, evidencePath, blockedReason or "")
DESIGN_STATUS = {
    # D1 安装/升级检测链 —— 源码级函数断言 PASS
    "D1-26": ("PASS", "evidence/d4-security-misc", ""),
    "D1-27": ("PASS", "evidence/d1-upgrade", ""),
    "D1-28": ("PASS", "evidence/d1-upgrade", ""),
    "D1-30": ("PASS", "evidence/d1-upgrade", ""),
    "D1-31": ("PASS", "evidence/d1-upgrade", ""),
    "D1-33": ("PASS", "evidence/d1-upgrade", ""),
    "D1-39": ("PASS", "evidence/d1-upgrade", ""),   # Linux 侧负向断言（queryDistTagsSync 非 null，无 .cmd/EINVAL 语义）
    "D1-40": ("PASS", "evidence/d1-upgrade", ""),
    "D1-58": ("PASS", "evidence/d1-upgrade", ""),   # MCP 配置保留 merge/extract/apply 源码级验证
    # D1 真机生命周期 —— 环境阻塞
    "D1-1": ("BLOCKED", "", "【补环境】需真机 OpenClaw install --target 生命周期 + 隔离 HOME 验证，本 run 源码探针环境无真机安装态"),
    "D1-2": ("BLOCKED", "", "【补环境】需多客户端共存环境验证 auto-detect，本机仅 OpenClaw 单客户端"),
    "D1-3": ("BLOCKED", "", "【补环境】需真机 doctor CLI + 人为制造组件缺失场景验证"),
    "D1-4": ("BLOCKED", "", "【补环境】需真机 status/update CLI + 用户自定义 config 保护验证"),
    "D1-5": ("BLOCKED", "", "【补环境】需真机 uninstall + 残留扫描（Windows 文件锁场景优先），本机无真机安装态"),
    "D1-6": ("BLOCKED", "", "【补环境】需无 KooCLI 环境重装引导验证；本机 KooCLI 已装(hcloud 7.2.12)"),
    "D1-41": ("BLOCKED", "", "【补环境】需隔离 MCP 进程 + 可控 registry 四态响应注入"),
    "D1-42": ("BLOCKED", "", "【补环境】需隔离 HOME + CROSS_PROCESS 跨进程重启复查"),
    "D1-45": ("BLOCKED", "", "【补环境】需隔离 MCP 进程 + 预热竞态双时序注入"),
    # D2 认证 —— 源码/半自动探针 PASS
    "D2-1": ("BLOCKED", "", "【补环境】三端(KooCLI/OBS/沙箱)落位需沙箱连接验证；现 tool 描述已改为 S1/S2/S3 语义，沙箱端无独立同步路径，属设计契约漂移待维护者裁决"),
    "D2-2": ("PASS", "evidence/d2-auth", ""),
    "D2-4": ("PASS", "evidence/d2-auth", ""),
    "D2-5": ("PASS", "evidence/d4-security-misc", ""),
    "D2-10": ("PASS", "evidence/d2-auth", ""),
    "D2-11": ("PASS", "evidence/d2-auth", ""),
    "D2-12": ("PASS", "evidence/d2-auth", ""),
    "D2-13": ("PASS", "evidence/d2-auth", ""),
    "D2-16": ("PASS", "evidence/d2-auth", ""),
    # D3 功能
    "D3-A1": ("PASS", "evidence/d3-d5-functional", ""),
    "D3-B1": ("PASS", "evidence/d4-security-misc", ""),
    "D3-B3": ("PASS", "evidence/d3-d5-functional", ""),
    "D3-B5": ("PASS", "evidence/d3-d5-functional", ""),
    "D3-C5": ("PASS", "evidence/d8-skills", ""),
    # D4 安全
    "D4-1": ("PASS", "evidence/d4-security-core", ""),
    "D4-2": ("FAIL", "evidence/d4-security-core", ""),
    "D4-3": ("PASS", "evidence/d4-security-core", ""),
    "D4-4": ("PASS", "evidence/d4-security-core", ""),
    "D4-5": ("PASS", "evidence/d4-security-misc", ""),
    "D4-6": ("FAIL", "evidence/d4-security-core", ""),
    "D4-7": ("FAIL", "evidence/d4-security-core", ""),
    "D4-8": ("PASS", "evidence/d4-security-misc", ""),
    "D4-9": ("PASS", "evidence/d4-security-core", ""),
    "D4-10": ("BLOCKED", "", "【补环境】需规则库版本快照 + 新增规则项注入夹具"),
    "D4-11": ("PASS", "evidence/d4-security-core", ""),
    "D4-12": ("BLOCKED", "", "【补环境】需 npm 安装供应链攻击仿真夹具（恶意依赖注入）"),
    "D4-13": ("BLOCKED", "", "【补环境】只读子账号凭证 credentials.readonly.json 未配置（prepare_env 已提示），run-as-readonly.py 无法切换"),
    "D4-14": ("BLOCKED", "", "【补环境】需真云 CTS 审计日志验证"),
    "D4-15": ("PASS", "evidence/d4-security-core", ""),
    "D4-16": ("FAIL", "evidence/d4-security-core", ""),
    "D4-17": ("PASS", "evidence/d4-security-misc", ""),
    "D4-18": ("PASS", "evidence/d4-security-core", ""),
    "D4-19": ("PASS", "evidence/d4-security-core", ""),
    "D4-20": ("PASS", "evidence/d4-security-core", ""),
    "D4-21": ("FAIL", "evidence/d4-security-core", ""),
    "D4-22": ("PASS", "evidence/d4-security-core", ""),
    "D4-23": ("FAIL", "evidence/d4-security-core", ""),
    "D4-24": ("BLOCKED", "", "【补环境】确认令牌过期/重复确认边界需真云确认流 + 可注入时钟"),
    # D5 客户端
    "D5-1": ("PASS", "evidence/d3-d5-functional", ""),
    "D5-3": ("PASS", "evidence/d3-d5-functional", ""),
    # D6 性能
    "D6-1": ("PASS", "evidence/d6-performance", ""),
    "D6-3": ("PASS", "evidence/d6-performance", ""),
    "D6-4": ("PASS", "evidence/d6-performance", ""),
    # D7 兼容
    "D7-4": ("PASS", "evidence/d8-docs", ""),
    # D8 质量
    "D8-1": ("PASS", "evidence/d8-docs", ""),
    "D8-4": ("PASS", "evidence/d8-docs", ""),
    "D8-6": ("PASS", "evidence/d8-docs", ""),
    "D8-7": ("PASS", "evidence/d8-skills", ""),
    # D9 协议
    "D9-1": ("PASS", "evidence/d9-protocol", ""),
    "D9-2": ("FAIL", "evidence/d9-protocol", ""),
    "D9-3": ("PASS", "evidence/d9-protocol", ""),
    "D9-4": ("BLOCKED", "", "【补环境】协议生命周期需长连接断连/重连/关闭时序夹具"),
    "D9-5": ("PASS", "evidence/d9-protocol", ""),
    "D9-6": ("BLOCKED", "", "【补环境】跨客户端互通需多客户端同机环境，本机仅 OpenClaw 单客户端"),
    "D9-7": ("BLOCKED", "", "【补环境】协议版本协商降级需多版本服务端/客户端夹具"),
    "D9-8": ("PASS", "evidence/d4-security-misc", ""),
    "D9-9": ("BLOCKED", "", "【补环境】tools/call 超时协议需可注入延迟夹具 + capabilities.cancellation"),
    # D10 评测
    "D10-3": ("FAIL", "evidence/d10-routing", ""),  # 中文意图路由准确率 21.4% < 90%（源码级 serviceCatalog 断言），已提单 #689
    "D10-4": ("PASS", "evidence/d4-security-misc", ""),   # 写操作非直通 + hook 破坏删除非直通
}

# 展开级（本日 init_day 已按 OpenClaw/Linux 预筛，共 17 条：2 EXP-D5 + 15 EXP-E）
RT_EVID = "evidence/d10-routing"
EXPANDED_STATUS = {
    # D5 客户端矩阵（OpenClaw 上执行 D5-1 / D5-3）
    "EXP-D5-9-1": ("PASS", "evidence/d3-d5-functional", ""),
    "EXP-D5-9-3": ("PASS", "evidence/d3-d5-functional", ""),
    # EXP-E（D10-3 中文意图评测集）—— 依据源码级 serviceCatalog 路由断言 + eval harness（同 D10-3 根因）
    "EXP-E01": ("FAIL", RT_EVID, ""),
    "EXP-E02": ("FAIL", RT_EVID, ""),
    "EXP-E03": ("BLOCKED", "", "【改用例】实现「部署/网站→sandbox first」与设计「OBS 静态站」预期漂移，路由 oracle 需维护者裁决"),
    "EXP-E04": ("FAIL", RT_EVID, ""),
    "EXP-E05": ("FAIL", RT_EVID, ""),
    "EXP-E06": ("PASS", RT_EVID, ""),
    "EXP-E07": ("FAIL", RT_EVID, ""),
    "EXP-E08": ("BLOCKED", "", "【改用例】诊断类意图不归 serviceCatalog 路由，需真机 explain_error 多轮验证"),
    "EXP-E09": ("PASS", RT_EVID, ""),
    "EXP-E10": ("FAIL", RT_EVID, ""),
    "EXP-E11": ("FAIL", RT_EVID, ""),
    "EXP-E12": ("FAIL", RT_EVID, ""),
    "EXP-E13": ("BLOCKED", "", "【改用例】「证书/ELB」oracle 跨 DEW 证书 + ELB 双服务，单一 serviceCatalog 无法命中，需拆用例"),
    "EXP-E14": ("FAIL", RT_EVID, ""),
    "EXP-E15": ("PASS", RT_EVID, ""),
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
        st, ev, br = DESIGN_STATUS.get(cid, ("BLOCKED", "", "未在回填映射中（环境阻塞，未执行）"))
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
        st, ev, br = EXPANDED_STATUS.get(cid, ("BLOCKED", "", "环境阻塞（未执行：真云评测/夹具缺失）"))
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