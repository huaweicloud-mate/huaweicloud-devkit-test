# -*- coding: utf-8 -*-
"""Hermes 2026-09-13 Linux 每日测试执行状态回填 (daily 精选 81P+71E)。
只回填 results/Hermes/2026-09-13-113.44.197.147/Linux/ 下的两份 daily CSV 副本。
状态枚举: PASS(有证据)/FAIL(根因)/BLOCKED(blockedReason)/SPEC-MISMATCH/NOT_RUN。
"""
import csv, os

PACK = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(PACK, "用例矩阵-设计级.csv")
E = os.path.join(PACK, "用例矩阵-展开级.csv")

EVID = {
    "d4": "evidence/d4-security",
    "d1": "evidence/d1-upgrade",
    "d1cli": "evidence/d1-cli",
    "d2d9": "evidence/d2-d9-auth-protocol",
    "d8": "evidence/d8-skills",
    "sup": "evidence/supplemental",
    "d6": "evidence/d6-perf",
    "d1lx": "evidence/d1-linux-matrix",
}

# ---- 缺陷根因 (文件:行号) ----
ROOTCAUSE = {
    "D4-2": "safety-policy.mjs:335-336 classifyTextCommand() env-dump 正则 /HUAWEICLOUD|HWC_|HCLOUD|OS_/i 未覆盖 HW_ACCESS_KEY/HW_SECRET_KEY 前缀；echo $VAR 通道未被拦截（echo 不在 env/printenv 规则）。证据 evidence/d4-security/stdout.txt",
    "D4-6": "safety-policy.mjs:42 redactString() 正则仅匹配 adminPass[:=]value，未覆盖 '--adminPass value'（空格/flag 形式），hcloud 实际 --admin-pass 亦不匹配。证据 evidence/d4-security/stdout.txt",
    "D4-10": "safety/rules/cloud-risk-rules.json:359 hwc-sandbox-destructive-command fork bomb 正则 ':\\\\(\\\\)...' 双重转义，编译后匹配字面反斜杠，:(){ :|:& };: 永不命中（evaluateCommandRisk 返回 allow）。证据 evidence/d4-security/stdout.txt",
    "D4-15": "safety-policy.mjs:325 classifyTextCommand() 用 matchesAny(text, credentialFilePatterns) 整行匹配，cat ~/.hc$(echo loud)/credentials 的 $(...) 打断 .hcloud 模式无法命中 → allow。证据 evidence/d4-security/stdout.txt",
    "D4-16": "safety-policy.mjs:321-368 classifyTextCommand() 未提取 sh -c/bash -c wrapper 内层命令做二次判定：sh -c \"env | grep HUAWEICLOUD\" 与 sh -c \"hcloud ecs DeleteServer\" 均返回 allow（内层 env dump/写操作穿透）。证据 evidence/d4-security/stdout.txt",
    "D4-21": "safety/rules/cloud-risk-rules.json:192 hwc-iam-admin-policy Action 正则仅匹配 JSON \"Action\":\"*\"，Terraform HCL 形式 Action = [\"*\"]/effect = \"Allow\"（[ 阻断 + 引号）不命中，evaluateArtifacts 返回 allow。证据 evidence/d4-security/stdout.txt",
    "D9-2": "mcp-server.mjs:156-169 handleMessage() catch 对所有异常硬编码 code:-32603，未知方法未映射 -32601 (Method not found)。证据 evidence/d2-d9-auth-protocol/stdout.txt",
}
BLOCKED = {
    "D1-39": "Windows 专属用例（EINVAL 场景），本机 Linux aarch64 无法复现；Linux 侧已由展开级 EXP-NR3-10 覆盖并通过。",
}

# ---- 设计级 PASS (有真实证据) ----
PASS_DESIGN = {
    # D1
    "D1-1": EVID["d1cli"], "D1-3": EVID["d1cli"], "D1-4": EVID["d1cli"], "D1-5": EVID["d1cli"],
    "D1-26": EVID["sup"], "D1-27": EVID["d1"], "D1-28": EVID["d1"], "D1-30": EVID["d1"],
    "D1-31": EVID["d1"], "D1-33": EVID["sup"], "D1-40": EVID["d1"],
    # D2
    "D2-4": EVID["d2d9"], "D2-10": EVID["sup"], "D2-11": EVID["d2d9"],
    "D2-13": EVID["sup"], "D2-16": EVID["sup"],
    # D3
    "D3-A1": EVID["sup"], "D3-B1": EVID["sup"], "D3-B5": EVID["sup"],
    # D4
    "D4-1": EVID["d4"], "D4-3": EVID["d4"], "D4-4": EVID["d4"], "D4-5": EVID["d4"],
    "D4-7": EVID["d4"], "D4-8": EVID["d4"], "D4-9": EVID["d4"], "D4-11": EVID["d4"],
    "D4-12": EVID["d4"], "D4-13": EVID["d4"], "D4-14": EVID["d4"], "D4-17": EVID["d4"],
    "D4-20": EVID["d4"], "D4-22": EVID["d4"],
    # D5
    "D5-1": EVID["d1lx"], "D5-3": EVID["sup"],
    # D6
    "D6-3": EVID["d6"],
    # D8
    "D8-7": EVID["d8"],
    # D9
    "D9-1": EVID["d2d9"], "D9-3": EVID["d2d9"], "D9-4": EVID["d2d9"], "D9-8": EVID["d2d9"],
}

FAIL_DESIGN = dict(ROOTCAUSE)

# ---- 展开级 PASS (仅 Hermes 行 + Linux scope) ----
PASS_EXPANDED = {
    "EXP-D5-8-1": EVID["d1lx"],   # Hermes D5-1 清单发现
    "EXP-D5-8-3": EVID["d1lx"],   # Hermes D5-3 39 工具全量
    "EXP-NR3-02": EVID["d1"],     # Linux D1-27 检测语义
    "EXP-NR3-10": EVID["d1lx"],   # Linux D1-39 升级检测链
}


def backfill_design():
    rows = list(csv.DictReader(open(D, encoding="utf-8-sig")))
    stat = {"PASS": 0, "FAIL": 0, "NOT_RUN": 0, "BLOCKED": 0}
    for r in rows:
        cid = (r.get("ID") or "").strip()
        if cid in PASS_DESIGN:
            r["执行状态"] = "PASS"; r["evidencePath"] = PASS_DESIGN[cid]; r["blockedReason"] = ""
            stat["PASS"] += 1
        elif cid in FAIL_DESIGN:
            r["执行状态"] = "FAIL"
            r["evidencePath"] = EVID["d4"] if cid.startswith("D4") else EVID["d2d9"]
            r["blockedReason"] = ROOTCAUSE[cid]
            stat["FAIL"] += 1
        elif cid in BLOCKED:
            r["执行状态"] = "BLOCKED"; r["evidencePath"] = ""; r["blockedReason"] = BLOCKED[cid]
            stat["BLOCKED"] += 1
        else:
            r["执行状态"] = "NOT_RUN"; r["evidencePath"] = ""; r["blockedReason"] = ""
            stat["NOT_RUN"] += 1
    fields = list(rows[0].keys())
    with open(D, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader(); w.writerows(rows)
    print("设计级回填:", stat)


def backfill_expanded():
    rows = list(csv.DictReader(open(E, encoding="utf-8-sig")))
    stat = {"PASS": 0, "NOT_RUN": 0, "FAIL": 0}
    for r in rows:
        cid = (r.get("expandedCaseId") or "").strip()
        if cid in PASS_EXPANDED:
            r["execution_status"] = "PASS"; r["evidencePath"] = PASS_EXPANDED[cid]
            stat["PASS"] += 1
        else:
            r["execution_status"] = "NOT_RUN"; r["evidencePath"] = ""
            stat["NOT_RUN"] += 1
    fields = list(rows[0].keys())
    with open(E, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader(); w.writerows(rows)
    print("展开级回填:", stat)


if __name__ == "__main__":
    backfill_design()
    backfill_expanded()
    print("回填完成。")