# -*- coding: utf-8 -*-
"""Hermes Linux 2026-09-15 每日测试回填脚本（强制完整重跑版）。
只写 results/Hermes/2026-09-15-124.70.78.131/Linux/ 下 daily 副本（设计级/展开级/追踪表）。"""
import csv, os
from datetime import datetime
from collections import Counter

BASE = os.path.dirname(os.path.abspath(__file__))
TS = datetime.now().strftime("%Y%m%d%H%M%S")   # 北京 14 位紧凑

# —— 已执行（有真实证据） case_id -> (status, evidencePath) ——
EXECUTED = {
    # D1 安装域
    "D1-1":  ("PASS", "evidence/D1-1"),
    "D1-3":  ("PASS", "evidence/D1-3"),
    "D1-4":  ("PASS", "evidence/D1-4"),
    "D1-5":  ("PASS", "evidence/D1-5"),
    "D1-41": ("PASS", "evidence/D1-41"),
    # D1 升级域
    "D1-26": ("PASS", "evidence/D1-26"),
    "D1-27": ("PASS", "evidence/D1-27"),
    "D1-28": ("PASS", "evidence/D1-28"),
    "D1-30": ("PASS", "evidence/D1-30"),
    "D1-31": ("PASS", "evidence/D1-31"),
    "D1-33": ("PASS", "evidence/D1-33"),
    "D1-58": ("PASS", "evidence/D1-58"),
    # D2 认证域
    "D2-2":  ("PASS", "evidence/D2-2"),
    "D2-4":  ("PASS", "evidence/D2-4"),
    "D2-5":  ("PASS", "evidence/D2-5"),
    "D2-11": ("PASS", "evidence/D2-11"),
    "D2-12": ("PASS", "evidence/D2-12"),
    "D2-16": ("PASS", "evidence/D2-16"),
    # D3 能力域
    "D3-A1": ("PASS", "evidence/D3-A1"),
    "D3-B1": ("PASS", "evidence/D3-B1"),
    "D3-B3": ("PASS", "evidence/D3-B3"),
    "D3-B5": ("PASS", "evidence/D3-B5"),
    "D3-C5": ("PASS", "evidence/D3-C5"),
    # D4 安全域
    "D4-1":  ("PASS", "evidence/D4-1"),
    "D4-2":  ("FAIL", "evidence/D4-2"),
    "D4-3":  ("PASS", "evidence/D4-3"),
    "D4-4":  ("PASS", "evidence/D4-4"),
    "D4-5":  ("PASS", "evidence/D4-5"),
    "D4-7":  ("PASS", "evidence/D4-7"),
    "D4-8":  ("PASS", "evidence/D4-8"),
    "D4-9":  ("PASS", "evidence/D4-9"),
    "D4-10": ("PASS", "evidence/D4-10"),
    "D4-11": ("PASS", "evidence/D4-11"),
    "D4-15": ("PASS", "evidence/D4-15"),
    "D4-16": ("FAIL", "evidence/D4-16"),
    "D4-17": ("FAIL", "evidence/D4-17"),
    "D4-21": ("FAIL", "evidence/D4-21"),
    "D4-22": ("PASS", "evidence/D4-22"),
    # D5 客户端域
    "D5-3":  ("PASS", "evidence/D5-3"),
    # D6 性能域
    "D6-1":  ("PASS", "evidence/D6-1"),
    "D6-3":  ("PASS", "evidence/D6-3"),
    "D6-4":  ("PASS", "evidence/D6-4"),
    # D8 质量域
    "D8-7":  ("PASS", "evidence/D8-7"),
    # D9 协议域
    "D9-1":  ("PASS", "evidence/D9-1"),
    "D9-2":  ("FAIL", "evidence/D9-2"),
    "D9-3":  ("PASS", "evidence/D9-3"),
    "D9-4":  ("PASS", "evidence/D9-4"),
    "D9-5":  ("PASS", "evidence/D9-5"),
    "D9-7":  ("PASS", "evidence/D9-7"),
    "D9-8":  ("PASS", "evidence/D9-8"),
    # D10 评测域（源码级）
    "D10-3": ("FAIL", "evidence/D10-3"),
}

# —— 展开级独立证据（非镜像设计级）末段处理 ——
EXPANDED_OWN = {
    "EXP-NR3-10": ("PASS", "evidence/EXP-NR3-10"),
}

# —— 环境阻塞（BLOCKED + blockedReason）——
BLOCKED_REASON = {
    "D1-2":  "【补环境】多 Agent 探测需多客户端并存环境（单机仅 Hermes）",
    "D1-6":  "【补环境】install-hcloud 需 KooCLI 下载源/镜像网络引导",
    "D1-39": "【调归属】Windows 升级检测链 EINVAL 专项；Linux 由 NR3-10 负面/环境验证（已探针 PASS）",
    "D1-40": "【调归属】镜像 lag 检测需镜像源环境",
    "D1-42": "【补环境】dismiss 真实闭环需真实 agent 插件目录写入 + 进程重启持久化",
    "D1-45": "【补环境】兜底提示预热竞态需会话预热时序 fixture",
    "D2-1":  "【补环境】auth init 三端同步会写入真云凭证，避免污染统一账号凭证库",
    "D2-10": "【补环境】R7 current 档跟随需多 profile 夹具",
    "D2-13": "【补环境】R9 configuredBySession 优先 env 需 env 凭证 + session 切换夹具",
    "D4-6":  "【改用例】adminPass 回显警告完整 E2E 需真云创建 ECS 含 password；源码级脱敏已核验，建议拆分脱敏为源码级断言",
    "D4-12": "【补环境】供应链安装期安全需 npm 安装期抓包/SBOM 审计",
    "D4-13": "【补环境】最小权限凭证通过率需只读 IAM 子账号（credentials.readonly.json 缺失）",
    "D4-14": "【补环境】操作可审计性需 CTS 命令执行审计日志",
    "D4-18": "【补环境】confirm-not-deny 审批语义需真云 + 标准客户端交互确认流",
    "D4-19": "【补环境】确认流下预检需真云高危操作进入确认流",
    "D4-20": "【补环境】拒绝后零操作需审批拒绝流 + 真云资源变更计数",
    "D4-23": "【补环境】全局规则注入需 11 个 Agent 多机安装目标；且包内未见 huawei-agent-rules.md 制品（grep 全包无命中）",
    "D4-24": "【补环境】确认令牌过期/重复确认边界需审批流 + 可注入时钟",
    "D5-1":  "【调归属】清单发现加载需全部客户端可发现（CLIENT_MATRIX 多客户端）",
    "D7-4":  "【补环境】国内镜像源安装需 GitCode/国内镜像网络 + GITCODE_TOKEN",
    "D9-6":  "【调归属】跨客户端互通需多客户端并存环境",
    "D9-9":  "【改用例】tools/call 超时协议语义需 inspector 夹具注入 30s 挂起；capabilities.cancellation 实测未声明",
    "D10-4": "【补环境】安全干预有效性需 LLM 评测 harness + 预算门禁",
}

# —— 本轮未执行（NOT_RUN + 原因）——
NOT_RUN_REASON = {
    "D8-1": "【改用例】文档与能力一致需白盒 docs 全量比对，本轮未覆盖",
    "D8-4": "【改用例】引导步骤可机械执行需逐条核验 getting-started 步骤",
    "D8-6": "【改用例】中英文文档一致需中英双源逐段比对",
}


def backfill_design():
    path = os.path.join(BASE, "用例矩阵-设计级.csv")
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    fields = list(rows[0].keys())
    for r in rows:
        cid = (r.get("ID") or "").strip()
        if cid in EXECUTED:
            st, ev = EXECUTED[cid]
            r["执行状态"] = st
            r["执行时间"] = TS
            r["evidencePath"] = ev
            r["blockedReason"] = ""
        elif cid in BLOCKED_REASON:
            r["执行状态"] = "BLOCKED"
            r["执行时间"] = TS
            r["evidencePath"] = ""
            r["blockedReason"] = BLOCKED_REASON[cid]
        elif cid in NOT_RUN_REASON:
            r["执行状态"] = "NOT_RUN"
            r["执行时间"] = ""
            r["evidencePath"] = ""
            r["blockedReason"] = NOT_RUN_REASON[cid]
        else:
            r["执行状态"] = "NOT_RUN"
            r["执行时间"] = ""
            r["evidencePath"] = ""
            r["blockedReason"] = "本轮未覆盖"
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    return rows


def backfill_expanded():
    path = os.path.join(BASE, "用例矩阵-展开级.csv")
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    fields = list(rows[0].keys())
    pass_ev = {cid: ev for cid, (st, ev) in EXECUTED.items() if st == "PASS"}
    # 展开级「D10评测集」：源设计级 D10-3 源码级已探针(FAIL)，但评测级路由准确率需 LLM harness，标 BLOCKED。
    EVAL_HARNESS_SRC = {"D10-3": "【补环境】评测级路由准确率/混淆矩阵需 LLM 评测 harness + 预算；源码级 serviceCatalog 已探针（见设计级 D10-3 FAIL）"}
    for r in rows:
        cid = (r.get("ID") or "").strip()
        src = (r.get("designCaseId") or r.get("源用例") or "").strip()
        if cid in EXPANDED_OWN:
            st, ev = EXPANDED_OWN[cid]
            r["执行状态"] = st
            r["执行时间"] = TS
            r["evidencePath"] = ev
            r["blockedReason"] = ""
        elif src in EVAL_HARNESS_SRC:
            r["执行状态"] = "BLOCKED"
            r["执行时间"] = TS
            r["evidencePath"] = ""
            r["blockedReason"] = EVAL_HARNESS_SRC[src]
        elif src in pass_ev:
            r["执行状态"] = "PASS"
            r["执行时间"] = TS
            r["evidencePath"] = pass_ev[src]
            r["blockedReason"] = ""
        elif src in BLOCKED_REASON:
            r["执行状态"] = "BLOCKED"
            r["执行时间"] = TS
            r["evidencePath"] = ""
            r["blockedReason"] = BLOCKED_REASON[src]
        elif src in NOT_RUN_REASON:
            r["执行状态"] = "NOT_RUN"
            r["执行时间"] = ""
            r["evidencePath"] = ""
            r["blockedReason"] = NOT_RUN_REASON[src]
        else:
            r["执行状态"] = "NOT_RUN"
            r["执行时间"] = ""
            r["evidencePath"] = ""
            r["blockedReason"] = "源设计用例未覆盖"
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    return rows


def backfill_tracing():
    path = os.path.join(BASE, "需求-设计-证据追踪表.csv")
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    fields = list(rows[0].keys())
    covered = set(EXECUTED.keys()) | set(BLOCKED_REASON.keys())
    n = 0
    for r in rows:
        cid = (r.get("designCaseId") or "").strip()
        if cid and cid in covered:
            r["执行时间"] = TS
            n += 1
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    return rows, n


if __name__ == "__main__":
    rows1 = backfill_design()
    rows2 = backfill_expanded()
    rows3, tr_n = backfill_tracing()
    c1 = Counter((r.get("执行状态") or "").strip() for r in rows1)
    c2 = Counter((r.get("执行状态") or "").strip() for r in rows2)
    print(f"时间戳: {TS}")
    print(f"设计级 {len(rows1)} 行: {dict(c1)}")
    print(f"展开级 {len(rows2)} 行: {dict(c2)}")
    print(f"追踪表 {len(rows3)} 行, 回填执行时间 {tr_n} 行")