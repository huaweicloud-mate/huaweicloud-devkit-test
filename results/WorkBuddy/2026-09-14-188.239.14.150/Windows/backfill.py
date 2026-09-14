# -*- coding: utf-8 -*-
"""回填设计级 CSV 执行状态 + evidencePath — WorkBuddy v1.1.4-next.6 (2026-09-14)"""
import csv, os

CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "用例矩阵-设计级.csv")
EVIDENCE_BASE = "evidence"

# 测试结果映射 (case_id → (status, evidence_path))
RESULTS = {
    # === P0 安全核心 ===
    "D4-1":  ("PASS", f"{EVIDENCE_BASE}/d4-security-core/probe-p0-security.mjs"),
    "D4-2":  ("FAIL", f"{EVIDENCE_BASE}/d4-security-core/probe-p0-security.mjs"),
    "D4-3":  ("PASS", f"{EVIDENCE_BASE}/d4-security-core/probe-p0-security.mjs"),
    "D4-5":  ("PASS", f"{EVIDENCE_BASE}/d4-security-core/probe-p0-security.mjs"),
    "D4-9":  ("PASS", f"{EVIDENCE_BASE}/d4-security-core/probe-p0-security.mjs"),
    "D4-15": ("PASS", f"{EVIDENCE_BASE}/d4-security-core/probe-p0-security.mjs"),
    "D4-16": ("FAIL", f"{EVIDENCE_BASE}/d4-security-core/probe-p0-security.mjs"),
    "D4-18": ("PASS", f"{EVIDENCE_BASE}/d4-security-core/probe-p0-security.mjs"),
    "D4-19": ("PASS", f"{EVIDENCE_BASE}/d4-security-core/probe-p0-security.mjs"),
    "D4-20": ("PASS", f"{EVIDENCE_BASE}/d4-security-core/probe-p0-security.mjs"),
    "D4-21": ("PASS", f"{EVIDENCE_BASE}/d4-security-core/probe-p0-security.mjs"),
    "D4-22": ("PASS", f"{EVIDENCE_BASE}/d4-security-core/probe-p0-security.mjs"),
    "D4-23": ("FAIL", f"{EVIDENCE_BASE}/d4-security-core/probe-p0-security.mjs"),

    # === D2 认证 (P0) ===
    "D2-4":  ("PASS", f"{EVIDENCE_BASE}/d4-security-core/probe-p0-security.mjs"),
    "D2-11": ("PASS", f"{EVIDENCE_BASE}/d4-security-core/probe-p0-security.mjs"),

    # === D10 评测 (P0) ===
    "D10-4": ("PASS", f"{EVIDENCE_BASE}/d4-security-core/probe-p0-security.mjs"),

    # === D8 文档质量 (P0) ===
    "D8-7":  ("PASS", f"{EVIDENCE_BASE}/d4-security-core/probe-p0-security.mjs"),

    # === D1 升级检测 (P0) ===
    "D1-39": ("PASS", f"{EVIDENCE_BASE}/d1-upgrade/probe-p0-upgrade.mjs"),
    "D1-40": ("PASS", f"{EVIDENCE_BASE}/d1-upgrade/probe-p0-upgrade.mjs"),

    # === D1 升级检测 (P1) ===
    "D1-26": ("PASS", f"{EVIDENCE_BASE}/d1-upgrade/probe-p0-upgrade.mjs"),
    "D1-27": ("PASS", f"{EVIDENCE_BASE}/d1-upgrade/probe-p0-upgrade.mjs"),
    "D1-28": ("PASS", f"{EVIDENCE_BASE}/d1-upgrade/probe-p0-upgrade.mjs"),
    "D1-30": ("PASS", f"{EVIDENCE_BASE}/d1-upgrade/probe-p0-upgrade.mjs"),
    "D1-31": ("PASS", f"{EVIDENCE_BASE}/d1-upgrade/probe-p0-upgrade.mjs"),
    "D1-33": ("PASS", f"{EVIDENCE_BASE}/d1-upgrade/probe-p0-upgrade.mjs"),
    "D1-41": ("PASS", f"{EVIDENCE_BASE}/d1-upgrade/probe-p0-upgrade.mjs"),
    "D1-42": ("PASS", f"{EVIDENCE_BASE}/d1-upgrade/probe-p0-upgrade.mjs"),
    "D1-45": ("PASS", f"{EVIDENCE_BASE}/d1-upgrade/probe-p0-upgrade.mjs"),
    "D1-58": ("BLOCKED", ""),

    # === D1 安装 (P1) ===
    "D1-1":  ("BLOCKED", ""),
    "D1-2":  ("NOT_RUN", ""),
    "D1-3":  ("PASS", f"{EVIDENCE_BASE}/d2-d3-auth-func/probe-d2-d3-auth-func.mjs"),
    "D1-4":  ("PASS", f"{EVIDENCE_BASE}/d2-d3-auth-func/probe-d2-d3-auth-func.mjs"),
    "D1-5":  ("BLOCKED", ""),
    "D1-6":  ("PASS", f"{EVIDENCE_BASE}/d2-d3-auth-func/probe-d2-d3-auth-func.mjs"),

    # === D2 认证 (P1/P2) ===
    "D2-1":  ("PASS", f"{EVIDENCE_BASE}/d2-d3-auth-func/probe-d2-d3-auth-func.mjs"),
    "D2-2":  ("PASS", f"{EVIDENCE_BASE}/d2-d3-auth-func/probe-d2-d3-auth-func.mjs"),
    "D2-5":  ("PASS", f"{EVIDENCE_BASE}/d2-d3-auth-func/probe-d2-d3-auth-func.mjs"),
    "D2-10": ("PASS", f"{EVIDENCE_BASE}/d2-d3-auth-func/probe-d2-d3-auth-func.mjs"),
    "D2-12": ("PASS", f"{EVIDENCE_BASE}/d2-d3-auth-func/probe-d2-d3-auth-func.mjs"),
    "D2-13": ("PASS", f"{EVIDENCE_BASE}/d2-d3-auth-func/probe-d2-d3-auth-func.mjs"),
    "D2-16": ("PASS", f"{EVIDENCE_BASE}/d2-d3-auth-func/probe-d2-d3-auth-func.mjs"),

    # === D3 功能 (P1/P2) ===
    "D3-A1": ("PASS", f"{EVIDENCE_BASE}/d2-d3-auth-func/probe-d2-d3-auth-func.mjs"),
    "D3-B1": ("PASS", f"{EVIDENCE_BASE}/d2-d3-auth-func/probe-d2-d3-auth-func.mjs"),
    "D3-B3": ("PASS", f"{EVIDENCE_BASE}/d2-d3-auth-func/probe-d2-d3-auth-func.mjs"),
    "D3-B5": ("PASS", f"{EVIDENCE_BASE}/d2-d3-auth-func/probe-d2-d3-auth-func.mjs"),
    "D3-C4": ("PASS", f"{EVIDENCE_BASE}/d2-d3-auth-func/probe-d2-d3-auth-func.mjs"),
    "D3-C5": ("PASS", f"{EVIDENCE_BASE}/d2-d3-auth-func/probe-d2-d3-auth-func.mjs"),

    # === D4 安全 (P1/P2) ===
    "D4-4":  ("PASS", f"{EVIDENCE_BASE}/d4-security-core/probe-p0-security.mjs"),
    "D4-6":  ("NOT_RUN", ""),
    "D4-7":  ("PASS", f"{EVIDENCE_BASE}/d4-security-core/probe-p0-security.mjs"),
    "D4-8":  ("NOT_RUN", ""),
    "D4-10": ("NOT_RUN", ""),
    "D4-11": ("NOT_RUN", ""),
    "D4-12": ("NOT_RUN", ""),
    "D4-13": ("NOT_RUN", ""),
    "D4-14": ("NOT_RUN", ""),
    "D4-17": ("NOT_RUN", ""),
    "D4-24": ("NOT_RUN", ""),

    # === D5 客户端 (P1) ===
    "D5-1":  ("FAIL", f"{EVIDENCE_BASE}/d5-static/probe-d5-d9-static.mjs"),
    "D5-3":  ("SPEC-MISMATCH", f"{EVIDENCE_BASE}/d5-static/probe-d5-d9-static.mjs"),

    # === D6 性能 (P1/P2) ===
    "D6-1":  ("PASS", f"{EVIDENCE_BASE}/d5-static/probe-d5-d9-static.mjs"),
    "D6-3":  ("PASS", f"{EVIDENCE_BASE}/d5-static/probe-d5-d9-static.mjs"),
    "D6-4":  ("PASS", f"{EVIDENCE_BASE}/d5-static/probe-d5-d9-static.mjs"),

    # === D7 兼容 (P2) ===
    "D7-4":  ("PASS", f"{EVIDENCE_BASE}/d5-static/probe-d5-d9-static.mjs"),

    # === D8 文档质量 (P1/P2) ===
    "D8-1":  ("PASS", f"{EVIDENCE_BASE}/d5-static/probe-d5-d9-static.mjs"),
    "D8-4":  ("PASS", f"{EVIDENCE_BASE}/d5-static/probe-d5-d9-static.mjs"),
    "D8-6":  ("PASS", f"{EVIDENCE_BASE}/d5-static/probe-d5-d9-static.mjs"),

    # === D9 协议 (P1) ===
    "D9-1":  ("PASS", f"{EVIDENCE_BASE}/d5-static/probe-d5-d9-static.mjs"),
    "D9-2":  ("FAIL", f"{EVIDENCE_BASE}/d9-robust/probe-d9-robust-source.mjs"),
    "D9-3":  ("PASS", f"{EVIDENCE_BASE}/d5-static/probe-d5-d9-static.mjs"),
    "D9-4":  ("PASS", f"{EVIDENCE_BASE}/d5-static/probe-d5-d9-static.mjs"),
    "D9-5":  ("PASS", f"{EVIDENCE_BASE}/d9-robust/probe-d9-robust-source.mjs"),
    "D9-6":  ("NOT_RUN", ""),
    "D9-7":  ("PASS", f"{EVIDENCE_BASE}/d9-robust/probe-d9-robust-source.mjs"),
    "D9-8":  ("BLOCKED", ""),
    "D9-9":  ("BLOCKED", ""),

    # === D10 评测 (P1) ===
    "D10-1": ("NOT_RUN", ""),
    "D10-2": ("NOT_RUN", ""),
    "D10-3": ("NOT_RUN", ""),
    "D10-5": ("NOT_RUN", ""),
}

# Read CSV
with open(CSV_PATH, encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)
    fields = reader.fieldnames
    rows = list(reader)

# Backfill
filled = 0
for row in rows:
    cid = row["ID"]
    if cid in RESULTS:
        status, evi = RESULTS[cid]
        row["执行状态"] = status
        row["evidencePath"] = evi
        filled += 1
    else:
        row["执行状态"] = "NOT_RUN"
        row["evidencePath"] = ""

# Write back
with open(CSV_PATH, "w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    writer.writerows(rows)

print(f"Backfilled {filled}/{len(rows)} cases")

# Summary
from collections import Counter
status_counts = Counter(row["执行状态"] for row in rows)
for s, c in sorted(status_counts.items()):
    print(f"  {s}: {c}")
