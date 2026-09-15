# -*- coding: utf-8 -*-
"""DSH/Linux 2026-09-15 daily 执行回填：设计级/展开级回填执行状态+时间+证据，追踪表回填执行时间。"""
import csv, os
from datetime import datetime, timezone, timedelta

BASE = os.path.dirname(os.path.abspath(__file__))
TS = datetime.now(timezone(timedelta(hours=8))).strftime("%Y%m%d%H%M%S")

# ---- 设计级：ID -> (状态, evidencePath, blockedReason) ----
DESIGN = {
    "D1-1": ("PASS", "evidence/install", ""), "D1-2": ("PASS", "evidence/install", ""),
    "D1-3": ("PASS", "evidence/cli", ""), "D1-4": ("PASS", "evidence/cli", ""),
    "D1-6": ("PASS", "evidence/cli", ""),
    "D1-26": ("PASS", "evidence/update", ""), "D1-27": ("PASS", "evidence/update", ""),
    "D1-28": ("PASS", "evidence/update", ""), "D1-30": ("PASS", "evidence/update", ""),
    "D1-31": ("PASS", "evidence/update", ""), "D1-33": ("PASS", "evidence/update", ""),
    "D1-40": ("PASS", "evidence/update", ""), "D1-58": ("PASS", "evidence/install", ""),
    "D2-1": ("PASS", "evidence/admin", ""), "D2-5": ("PASS", "evidence/auth", ""),
    "D2-10": ("PASS", "evidence/auth", ""), "D2-11": ("PASS", "evidence/auth", ""),
    "D2-12": ("PASS", "evidence/auth", ""), "D2-13": ("PASS", "evidence/auth", ""),
    "D2-16": ("PASS", "evidence/auth", ""),
    "D3-A1": ("PASS", "evidence/func", ""), "D3-B1": ("PASS", "evidence/func", ""),
    "D3-B3": ("PASS", "evidence/cli", ""), "D3-B5": ("PASS", "evidence/func", ""),
    "D3-C5": ("PASS", "evidence/func", ""),
    "D4-1": ("PASS", "evidence/security", ""), "D4-4": ("PASS", "evidence/security", ""),
    "D4-5": ("PASS", "evidence/security", ""), "D4-6": ("PASS", "evidence/security", ""),
    "D4-7": ("PASS", "evidence/security", ""), "D4-9": ("PASS", "evidence/security", ""),
    "D4-21": ("PASS", "evidence/security", ""), "D4-22": ("PASS", "evidence/security", ""),
    "D5-1": ("PASS", "evidence/install", ""), "D5-3": ("PASS", "evidence/protocol", ""),
    "D6-1": ("PASS", "evidence/perf", ""), "D6-3": ("PASS", "evidence/perf", ""),
    "D6-4": ("PASS", "evidence/perf", ""),
    "D8-7": ("PASS", "evidence/func", ""), "D8-6": ("PASS", "evidence/doc", ""),
    "D9-1": ("PASS", "evidence/protocol", ""), "D9-3": ("PASS", "evidence/protocol", ""),
    "D9-4": ("PASS", "evidence/protocol", ""), "D9-7": ("PASS", "evidence/perf", ""),
    "D9-8": ("PASS", "evidence/protocol", ""),
    "D2-4": ("FAIL", "evidence/security", ""),
    "D4-2": ("FAIL", "evidence/security", ""), "D4-3": ("FAIL", "evidence/security", ""),
    "D4-15": ("FAIL", "evidence/security", ""), "D4-16": ("FAIL", "evidence/security", ""),
    "D4-17": ("FAIL", "evidence/security", ""), "D4-23": ("FAIL", "evidence/install", ""),
    "D8-1": ("FAIL", "evidence/doc", ""), "D9-2": ("FAIL", "evidence/protocol", ""),
    "D10-3": ("FAIL", "evidence/routing", ""),
    "D1-5": ("BLOCKED", "", "真实卸载+各客户端残留扫描(Hermes config/plugins/npx缓存/Windows文件锁)，本机共享环境卸载会破坏其它客户端"),
    "D1-39": ("BLOCKED", "", "Windows 专属(EINVAL 升级检测链)用例，本机 Linux；由 NR3 终端矩阵负面/环境验证归口"),
    "D1-41": ("BLOCKED", "", "需隔离 MCP 进程 + 可控 npm registry 四态注入夹具，本轮无该夹具"),
    "D1-42": ("BLOCKED", "", "需隔离 MCP 进程 + 有可用更新注入 + dismiss 跨进程重启复查，受真实 registry 状态依赖"),
    "D1-45": ("BLOCKED", "", "需隔离 MCP 进程 + 注入 update_available 捕捉提醒时序竞态，本轮无夹具"),
    "D2-2": ("BLOCKED", "", "需构造三端×就绪/未就绪 8 组合；KooCLI 未安装态无法本机 hermetic 构造(本机 hcloud 已装)"),
    "D4-8": ("BLOCKED", "", "Python hook 判定路径为 Windows PowerShell(hdk-secrets.ps1)，本机 Linux 仅 Node MCP 路径"),
    "D4-10": ("BLOCKED", "", "需向规则库新增自定义规则后重跑 D4 基线回归，本轮未做规则库变更"),
    "D4-11": ("BLOCKED", "", "需在检索返回内容植入指令并观察真实 Agent 行为，无法函数级断言"),
    "D4-12": ("BLOCKED", "", "需 postinstall 审计+依赖锁定+pack 一致+SBOM 产出(缺 SBOM 工具链)"),
    "D4-13": ("BLOCKED", "", "缺只读 IAM 子账号凭证 credentials.readonly.json(本机仅管理员账号)"),
    "D4-14": ("BLOCKED", "", "需真云执行命令后查 CTS 审计并区分 agent/人工，需真云写操作"),
    "D4-18": ("BLOCKED", "", "需真云写操作+交互确认对话框，headless 无交互 UI"),
    "D4-19": ("BLOCKED", "", "需真云写操作+确认流 preflight 观察，需交互确认流"),
    "D4-20": ("BLOCKED", "", "需真云确认流选拒绝后核查资源变更与执行痕迹，需真云+交互"),
    "D4-24": ("BLOCKED", "", "需真云写操作+可注入时钟(令牌 TTL 加速)，本机无该环境"),
    "D9-5": ("BLOCKED", "", "需 stdio 大payload/断连恢复夹具并核对纯协议通道，本轮无夹具"),
    "D9-6": ("BLOCKED", "", "需 MCP Inspector + ≥3 真实客户端互通冒烟，本机仅 DSH"),
    "D9-9": ("BLOCKED", "", "需可注入延迟的 MCP 客户端夹具(30s 挂起+取消)，本轮无夹具"),
    "D7-4": ("BLOCKED", "", "需国内网络+华为云 npm 镜像源安装验证，本机网络/镜像不可控"),
    "D8-4": ("BLOCKED", "", "需逐 SKILL.md 评审步骤可机械执行性(人工评审类)"),
    "D10-4": ("BLOCKED", "", "需真实 Agent 交互观察高危请求是否走 plan→审批流；DSH 自身即被测 Agent"),
}

# ---- 展开级：ID -> (状态, evidencePath, blockedReason) ----
EXPANDED = {
    "EXP-D5-6-1": ("PASS", "evidence/install", ""), "EXP-D5-6-3": ("PASS", "evidence/protocol", ""),
    "EXP-E01": ("FAIL", "evidence/routing", ""), "EXP-E02": ("FAIL", "evidence/routing", ""),
    "EXP-E03": ("FAIL", "evidence/routing", ""), "EXP-E04": ("FAIL", "evidence/routing", ""),
    "EXP-E05": ("FAIL", "evidence/routing", ""), "EXP-E06": ("PASS", "evidence/routing", ""),
    "EXP-E07": ("FAIL", "evidence/routing", ""), "EXP-E08": ("FAIL", "evidence/routing", ""),
    "EXP-E09": ("PASS", "evidence/routing", ""), "EXP-E10": ("FAIL", "evidence/routing", ""),
    "EXP-E11": ("FAIL", "evidence/routing", ""), "EXP-E12": ("FAIL", "evidence/routing", ""),
    "EXP-E13": ("FAIL", "evidence/routing", ""), "EXP-E14": ("FAIL", "evidence/routing", ""),
    "EXP-E15": ("PASS", "evidence/routing", ""),
}


def backfill_matrix(kind, mapping):
    path = os.path.join(BASE, f"用例矩阵-{kind}.csv")
    if not os.path.isfile(path):
        print("缺文件:", path); return
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    fields = list(rows[0].keys())
    n = 0
    for r in rows:
        cid = (r.get("ID") or "").strip()
        if cid in mapping:
            status, ev, reason = mapping[cid]
            r["执行状态"] = status
            r["执行时间"] = TS
            r["evidencePath"] = ev
            if "blockedReason" in fields:
                r["blockedReason"] = reason if status == "BLOCKED" else ""
            n += 1
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader(); w.writerows(rows)
    print(f"{kind}: 回填 {n}/{len(rows)} 行 (TS={TS})")


def backfill_tracing(executed_ids):
    path = os.path.join(BASE, "需求-设计-证据追踪表.csv")
    if not os.path.isfile(path):
        print("缺文件:", path); return
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    fields = list(rows[0].keys())
    n = 0
    for r in rows:
        dcid = (r.get("designCaseId") or "").strip()
        ecid = (r.get("expandedCaseId") or "").strip()
        if dcid in executed_ids or ecid in executed_ids:
            r["执行时间"] = TS
            n += 1
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader(); w.writerows(rows)
    print(f"追踪表: 回填 {n}/{len(rows)} 行")


if __name__ == "__main__":
    backfill_matrix("设计级", DESIGN)
    backfill_matrix("展开级", EXPANDED)
    executed_design = {k for k, v in DESIGN.items() if v[0] in ("PASS", "FAIL")}
    executed_exp = {k for k, v in EXPANDED.items() if v[0] in ("PASS", "FAIL")}
    backfill_tracing(executed_design | executed_exp)
    print("回填完成 TS =", TS)