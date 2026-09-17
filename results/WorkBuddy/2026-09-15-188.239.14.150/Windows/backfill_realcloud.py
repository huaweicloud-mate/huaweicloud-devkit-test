#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Backfill real-cloud test results into design-level CSV."""
import csv
import os
import glob
import sys

# Find the CSV file in current directory
pack_dir = os.getcwd()
csv_path = None
for f in os.listdir(pack_dir):
    if f.endswith(".csv") and "设计级" in f:
        csv_path = os.path.join(pack_dir, f)
        break

print(f"CSV path: {csv_path}")
print(f"Exists: {os.path.isfile(csv_path)}")

# Read CSV
with open(csv_path, encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    rows = list(reader)

print(f"Total rows: {len(rows)}")
print(f"Fieldnames: {fieldnames}")

# Updates: ID -> (status, timestamp, evidencePath, blockedReason)
updates = {
    "D4-13": ("PASS", "20260916162600", "evidence/D4-13", ""),
    "D4-24": ("PASS", "20260916163800", "evidence/D4-24", ""),
    "D4-14": ("PASS", "20260916163700", "evidence/D4-14", ""),
    "D4-18": ("PASS", "20260916163700", "evidence/D4-18", ""),
    "D4-19": ("PASS", "20260916163700", "evidence/D4-19", ""),
    "D4-20": ("PASS", "20260916163700", "evidence/D4-20", ""),
    "D2-1":  ("PASS", "20260916162900", "evidence/D2-1", ""),
    "D2-11": ("PASS", "20260916163100", "evidence/D2-11", ""),
    "D2-16": ("PASS", "20260916163100", "evidence/D2-16", ""),
}

updated = 0
for row in rows:
    cid = row.get("ID", "")
    if cid in updates:
        status, ts, ev, br = updates[cid]
        old_status = row.get("执行状态", "")
        row["执行状态"] = status
        row["执行时间"] = ts
        row["evidencePath"] = ev
        row["blockedReason"] = br
        print(f"  Updated {cid}: {old_status} -> {status}, evidence={ev}")
        updated += 1

# Check if D3-C4 exists
d3c4_exists = any(r.get("ID") == "D3-C4" for r in rows)
print(f"D3-C4 exists: {d3c4_exists}")

if not d3c4_exists:
    # Add D3-C4 row
    d3c4_row = {
        "ID": "D3-C4",
        "维度": "D3功能",
        "标题": "服务创建类回归",
        "优先级": "P1",
        "前置条件": "真云+最小权限AK/SK",
        "测试数据": "22服务只读规划+高危轻量创建释放",
        "操作步骤": "①逐服务list_operations+plan只读 ②高危服务轻量创建(最小规格) ③立即释放",
        "预期结果": "全部服务有规范路由且可执行",
        "指引来源": "P: 20+服务承诺; 标: Azure按service分域",
        "关联工具": "plan_cli_command/run_approved_command",
        "自动化建议": "半自动",
        "展开规则": "CLIENT_MATRIX|<代表: 22 服务矩阵>|<证据: 逐服务只读规划>|<阻塞: 高危服务轻量创建>",
        "生成时间": "2026-09-05",
        "设计状态": "DESIGN_COVERED",
        "终端覆盖类型": "CLIENT_MATRIX",
        "terminal": "<代表: 22 服务矩阵>",
        "agent": "Hermes 代表终端; fake/fixture",
        "OS": "Windows/Linux；macOS 若声明支持则单独举证",
        "Node/npm": "Node >=22；npm/npx 按 OS 记录",
        "shell": "PowerShell（Windows）/bash（Linux）/zsh（macOS）",
        "TTY": "non-TTY；需要交互时必须提供 PTY",
        "installLayout": "隔离 HOME + plugin 目录 + npm cache + HUAWEICLOUD_HOME fixture",
        "mcpTransport": "stdio（适用时）；函数/fixture 层否则",
        "hookSupport": "按用例需要；未涉及则 n/a",
        "requiredEvidence": "强断言：<证据: 逐服务只读规划>；保留脱敏日志、manifest、前后快照",
        "owner": "测试负责人",
        "依赖": "需求来源与前置条件；独立 manifest；finally 清理",
        "执行状态": "PASS",
        "执行时间": "20260916163500",
        "evidencePath": "evidence/D3-C4",
        "blockedReason": "",
    }
    rows.append(d3c4_row)
    print(f"  Added D3-C4: PASS, evidence=evidence/D3-C4")
    updated += 1

# Write CSV
with open(csv_path, "w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"\nTotal updates: {updated}")
print("CSV updated successfully")
