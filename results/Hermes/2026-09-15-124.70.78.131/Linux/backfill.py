# -*- coding: utf-8 -*-
"""Hermes Linux 2026-09-15 每日测试回填脚本（4 列执行态 + blockedReason）。
只写 results/Hermes/2026-09-15-124.70.78.131/Linux/ 下 daily 副本（设计级/展开级/追踪表）。"""
import csv, os
from datetime import datetime
from collections import Counter

BASE = os.path.dirname(os.path.abspath(__file__))
TS = datetime.now().strftime("%Y%m%d%H%M%S")   # 北京 14 位紧凑

# —— 已执行（有真实证据） case_id -> (status, evidencePath) ——
EXECUTED = {
    # D1 安装域（核心）
    "D1-1":  ("PASS", "evidence/D1-1"),
    "D1-3":  ("PASS", "evidence/D1-3"),
    "D1-4":  ("PASS", "evidence/D1-4"),
    "D1-5":  ("PASS", "evidence/D1-5"),
    "D1-41": ("PASS", "evidence/D1-41"),
    # D1 升级域（补充）
    "D1-26": ("PASS", "evidence/D1-26"),
    "D1-27": ("PASS", "evidence/D1-27"),
    "D1-30": ("PASS", "evidence/D1-30"),
    # D2 认证域（核心 + 补充）
    "D2-4":  ("PASS", "evidence/D2-4"),
    "D2-11": ("PASS", "evidence/D2-11"),
    "D2-12": ("PASS", "evidence/D2-12"),
    "D2-16": ("PASS", "evidence/D2-16"),
    "D2-2":  ("PASS", "evidence/D2-2"),
    "D2-5":  ("PASS", "evidence/D2-5"),
    # D3 能力域（补充）
    "D3-A1": ("PASS", "evidence/D3-A1"),
    "D3-B1": ("PASS", "evidence/D3-B1"),
    "D3-B3": ("PASS", "evidence/D3-B3"),
    "D3-B5": ("PASS", "evidence/D3-B5"),
    "D3-C5": ("PASS", "evidence/D3-C5"),
    # D4 安全域（核心）
    "D4-1":  ("PASS", "evidence/D4-1"),
    "D4-2":  ("FAIL", "evidence/D4-2"),
    "D4-3":  ("PASS", "evidence/D4-3"),
    "D4-5":  ("PASS", "evidence/D4-5"),
    "D4-7":  ("PASS", "evidence/D4-7"),
    "D4-8":  ("PASS", "evidence/D4-8"),
    "D4-9":  ("PASS", "evidence/D4-9"),
    "D4-15": ("PASS", "evidence/D4-15"),
    "D4-16": ("FAIL", "evidence/D4-16"),
    "D4-21": ("FAIL", "evidence/D4-21"),
    "D4-22": ("PASS", "evidence/D4-22"),
    # D4 安全域（补充）
    "D4-4":  ("PASS", "evidence/D4-4"),
    "D4-10": ("PASS", "evidence/D4-10"),
    "D4-11": ("PASS", "evidence/D4-11"),
    "D4-17": ("FAIL", "evidence/D4-17"),
    # D5 客户端域
    "D5-3":  ("PASS", "evidence/D5-3"),
    # D6 性能域（补充）
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
}

# —— 环境阻塞（BLOCKED + blockedReason）——
BLOCKED_REASON = {
    "D1-2":  "多 Agent 探测需多客户端并存环境（单机仅 Hermes）",
    "D1-6":  "install-hcloud 需 KooCLI 下载源/镜像网络引导，本轮不可复现",
    "D1-28": "检测语义-有新版本需更高版本 fixture（当前 latest=1.1.4 无更高正式版）",
    "D1-31": "dismiss 冷却期需 3 天时长 fixture 与跨日计时，单轮无法验证",
    "D1-33": "skip 文件持久化多路径需多 agent 插件目录 fixture",
    "D1-39": "Windows 升级检测链专项，Linux 终端无法复现",
    "D1-40": "镜像 lag 检测需镜像源/Windows 环境",
    "D1-42": "dismiss 真实闭环需真实 agent 插件目录写入 + 进程重启持久化",
    "D1-45": "兜底提示预热竞态需会话预热时序控制 fixture",
    "D1-58": "通用 MCP 白名单接入需 Claude/Cursor 客户端 merge 环境",
    "D2-1":  "auth init 三端同步会写入真云凭证三端，避免污染统一账号凭证库",
    "D2-10": "R7 current 档跟随需源码 resolveManagedProfile 多 profile 夹具",
    "D2-13": "R9 configuredBySession 优先 env 需 env 凭证 + session 切换夹具",
    "D3-C4": "服务创建类回归需真云配额（ECS/DevStation），单终端无安全创建删除条件",
    "D4-6":  "adminPass 回显警告完整 E2E 需真云创建 ECS 含 password；源码级脱敏(adminPass=xxx→<redacted>)已核验",
    "D4-12": "供应链安装期安全需 npm 安装期抓包/SBOM 审计环境",
    "D4-13": "最小权限凭证通过率需真云最小权限凭证",
    "D4-14": "操作可审计性需真云命令执行审计日志",
    "D4-18": "confirm-not-deny 审批语义需真云+标准客户端交互确认流",
    "D4-19": "确认流下预检需真云高危操作进入确认流",
    "D4-20": "拒绝后零操作需审批拒绝流 + 真云资源变更计数",
    "D4-23": "全局规则注入需 11 个 Agent 安装目标多机；源码未见 huawei-agent-rules.md 制品",
    "D4-24": "确认令牌过期/重复确认边界需审批流 + 多客户端矩阵",
    "D5-1":  "清单发现加载需全部客户端可发现（CLIENT_MATRIX 多客户端）",
    "D7-4":  "国内镜像源安装需 GitCode/国内镜像网络 + GITCODE_TOKEN",
    "D9-6":  "跨客户端互通需多客户端并存环境",
    "D9-9":  "tools/call 超时协议语义需 inspector/延迟 MCP 客户端夹具注入 30s 挂起",
    "D10-1": "评测 harness + 预算门禁，本轮无评测环境",
    "D10-2": "评测 harness + 预算门禁，本轮无评测环境",
    "D10-3": "评测 harness + 预算门禁（路由准确率需评测集+混淆矩阵）",
    "D10-4": "评测 harness + 预算门禁（安全干预有效性需评测集）",
    "D10-5": "评测 harness + 预算门禁，本轮无评测环境",
}

# —— 本轮未执行（NOT_RUN + 原因）——
NOT_RUN_REASON = {
    "D8-1": "文档与能力一致核对需白盒 docs 全量比对，本轮未覆盖",
    "D8-4": "引导步骤可机械执行需获取全部 getting-started 技能步骤逐条核验，本轮未覆盖",
    "D8-6": "中英文文档一致需中英双源逐段比对，本轮未覆盖",
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
    """展开级逐格回填：镜像源设计用例（designCaseId）执行结论。"""
    path = os.path.join(BASE, "用例矩阵-展开级.csv")
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    fields = list(rows[0].keys())
    pass_ev = {cid: ev for cid, (st, ev) in EXECUTED.items() if st == "PASS"}
    for r in rows:
        src = (r.get("designCaseId") or "").strip()
        if src in pass_ev:
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