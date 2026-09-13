# -*- coding: utf-8 -*-
"""Hermes 2026-09-13 Linux 执行状态回填脚本。
只回填 results/Hermes/2026-09-13/Linux/ 下的三份 CSV 副本。
status 规则: PASS(有证据)/FAIL(根因)/NOT_RUN/BLOCKED/SPEC-MISMATCH。
"""
import csv, os, datetime

PACK = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(PACK, "用例矩阵-设计级.csv")
E = os.path.join(PACK, "用例矩阵-展开级.csv")
T = os.path.join(PACK, "需求-设计-证据追踪表.csv")

OS_NAME = "Linux"
CLIENT = "Hermes"
DATE = "2026-09-13"

# ---- 设计级执行状态（本轮实测）----
EVID = {
    "d4": "evidence/d4-security",
    "d1": "evidence/d1-upgrade",
    "d1cli": "evidence/d1-cli",
    "d2d9": "evidence/d2-d9-auth-protocol",
    "d8": "evidence/d8-skills",
}

# 缺陷根因
ROOTCAUSE = {
    "D4-2": "safety-policy.mjs classifyTextCommand() env-dump 正则 /HUAWEICLOUD|HWC_|HCLOUD|OS_/i 未覆盖 HW_ACCESS_KEY/HW_SECRET_KEY 前缀；echo $HUAWEICLOUD_ACCESS_KEY_ID 通道未被拦截（echo 不在 env/printenv 规则）。证据见 evidence/d4-security/stdout.log",
    "D4-6": "safety-policy.mjs redactString() 仅匹配 adminPass[:=]value，未覆盖 --adminPass value（空格/flag 形式，hcloud 实际用 --admin-pass 亦不匹配）。",
    "D4-10": "cloud-risk-rules.json hwc-sandbox-destructive-command 的 fork bomb 正则 ':()\\{|...' 双重转义，编译后匹配字面反斜杠，:(){ :|:& };: 永不命中（evaluateCommandRisk 返回 allow）。",
    "D4-15": "classifyTextCommand() 对命令替换 $() 混淆的凭证路径 cat ~/.hc$(echo loud)/credentials 返回 allow，credentialFilePatterns 的 \\.hcloud 正则被 $(...) 打断无法命中。",
    "D4-16": "classifyTextCommand() 未提取 sh -c \"...\" wrapper 内层命令做二次检测：sh -c \"env | grep HUAWEICLOUD\" 与 sh -c \"hcloud ecs DeleteServer\" 均返回 allow（内层 env dump / 写操作穿透）。",
    "D4-21": "risk-rule-engine.mjs hwc-iam-admin-policy 规则 Action 正则仅匹配 JSON \"Action\":\"*\"，Terraform HCL 形式 Action = [\"*\"] / effect = \"Allow\"（带引号）不命中，evaluateArtifacts 返回 allow。",
    "D9-2": "mcp-server.mjs handleMessage() 对所有异常硬编码 code:-32603，未知方法应返回 -32601 (Method not found)，源码仅含 -32603 不含 -32601。",
}
BLOCKED = {
    "D1-39": "Windows 专属用例（EINVAL 场景），Linux aarch64 环境无法复现。",
}

# 本轮 PASS（有真实证据）
PASS_DESIGN = {
    # D1
    "D1-1": EVID["d1cli"], "D1-3": EVID["d1cli"], "D1-4": EVID["d1cli"], "D1-5": EVID["d1cli"],
    "D1-27": EVID["d1"], "D1-28": EVID["d1"], "D1-30": EVID["d1"], "D1-31": EVID["d1"],
    "D1-32": EVID["d1"], "D1-34": EVID["d1"], "D1-40": EVID["d1"],
    # D2
    "D2-4": EVID["d2d9"], "D2-11": EVID["d2d9"],
    # D4
    "D4-1": EVID["d4"], "D4-3": EVID["d4"], "D4-4": EVID["d4"], "D4-5": EVID["d4"],
    "D4-7": EVID["d4"], "D4-8": EVID["d4"], "D4-9": EVID["d4"], "D4-11": EVID["d4"],
    "D4-12": EVID["d4"], "D4-13": EVID["d4"], "D4-14": EVID["d4"], "D4-17": EVID["d4"],
    "D4-20": EVID["d4"], "D4-22": EVID["d4"],
    # D8
    "D8-7": EVID["d8"],
    # D9
    "D9-1": EVID["d2d9"], "D9-3": EVID["d2d9"], "D9-4": EVID["d2d9"], "D9-8": EVID["d2d9"],
}

# 本轮 FAIL
FAIL_DESIGN = set(ROOTCAUSE.keys())

# 保留既有 SPEC-MISMATCH（契约漂移，待裁决）
SPEC_KEEP = {"D1-29", "D1-43", "D1-46", "D1-55", "D2-20", "D4-24", "D9-9"}


def backfill_design():
    rows = list(csv.DictReader(open(D, encoding="utf-8-sig")))
    stat = {"PASS": 0, "FAIL": 0, "NOT_RUN": 0, "BLOCKED": 0, "SPEC-MISMATCH": 0}
    for r in rows:
        cid = r["ID"].strip()
        if cid in PASS_DESIGN:
            r["执行状态"] = "PASS"; r["evidencePath"] = PASS_DESIGN[cid]; r["blockedReason"] = ""
            stat["PASS"] += 1
        elif cid in FAIL_DESIGN:
            r["执行状态"] = "FAIL"; r["evidencePath"] = EVID["d4"] if cid.startswith("D4") else EVID["d2d9"]
            r["blockedReason"] = ROOTCAUSE[cid]
            stat["FAIL"] += 1
        elif cid in BLOCKED:
            r["执行状态"] = "BLOCKED"; r["evidencePath"] = ""; r["blockedReason"] = BLOCKED[cid]
            stat["BLOCKED"] += 1
        elif cid in SPEC_KEEP:
            r["执行状态"] = "SPEC-MISMATCH"; r["evidencePath"] = ""; r["blockedReason"] = "契约漂移，待开发/产品裁决（历史遗留）"
            stat["SPEC-MISMATCH"] += 1
        else:
            r["执行状态"] = "NOT_RUN"; r["evidencePath"] = ""; r["blockedReason"] = ""
            stat["NOT_RUN"] += 1
    fields = list(rows[0].keys())
    with open(D, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader(); w.writerows(rows)
    print("设计级回填:", stat)


def backfill_expanded():
    rows = list(csv.DictReader(open(E, encoding="utf-8-sig")))
    # 展开级：本轮未逐终端执行客户端矩阵；仅 Hermes 安装(Hermes-D5-1)本轮实测，其余 NOT_RUN。
    n_pass = n_not = 0
    for r in rows:
        cid = r.get("expandedCaseId") or ""
        enum = (r.get("枚举对象") or "").strip()
        src = (r.get("designCaseId") or "").strip()
        # Hermes D5-1 安装：本轮 install --target hermes 实测
        if cid == "EXP-D5-8-1" or (enum == "Hermes" and src == "D5-1"):
            r["execution_status"] = "PASS"; r["evidencePath"] = EVID["d1cli"]; n_pass += 1
            continue
        r["execution_status"] = "NOT_RUN"; r["evidencePath"] = ""; n_not += 1
    fields = list(rows[0].keys())
    with open(E, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader(); w.writerows(rows)
    print(f"展开级回填: PASS={n_pass} NOT_RUN={n_not}")


def backfill_tracing():
    rows = list(csv.DictReader(open(T, encoding="utf-8-sig")))
    n_pass = n_fail = n_spec = n_not = n_block = 0
    for r in rows:
        dc = (r.get("designCaseId") or "").strip()
        if dc in PASS_DESIGN:
            r["execution_status"] = "PASS"; r["evidencePath"] = PASS_DESIGN[dc]; n_pass += 1
        elif dc in FAIL_DESIGN:
            r["execution_status"] = "FAIL"; r["evidencePath"] = EVID["d4"] if dc.startswith("D4") else EVID["d2d9"]; n_fail += 1
        elif dc in BLOCKED:
            r["execution_status"] = "BLOCKED"; r["evidencePath"] = ""; n_block += 1
        elif dc in SPEC_KEEP:
            r["execution_status"] = "SPEC-MISMATCH"; r["evidencePath"] = ""; n_spec += 1
        else:
            r["execution_status"] = "NOT_RUN"; r["evidencePath"] = ""; n_not += 1
    fields = list(rows[0].keys())
    with open(T, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader(); w.writerows(rows)
    print(f"追踪表回填: PASS={n_pass} FAIL={n_fail} SPEC={n_spec} BLOCKED={n_block} NOT_RUN={n_not}")


if __name__ == "__main__":
    backfill_design()
    backfill_expanded()
    backfill_tracing()
    print("回填完成。")