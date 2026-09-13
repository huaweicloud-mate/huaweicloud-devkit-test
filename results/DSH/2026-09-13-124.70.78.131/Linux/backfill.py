# -*- coding: utf-8 -*-
"""DSH/Linux 2026-09-13 daily 执行回填（重跑）。

只改 results/DSH/2026-09-13-124.70.78.131/Linux/ 本目录副本，不碰 test-cases 真源。
回填两列：执行状态 + 执行时间(+evidencePath)。追踪表回填「执行时间」。
"""
import csv, os, datetime

BASE = os.path.dirname(os.path.abspath(__file__))
DESIGN = os.path.join(BASE, "用例矩阵-设计级.csv")
EXPAND = os.path.join(BASE, "用例矩阵-展开级.csv")
TRACING = os.path.join(BASE, "需求-设计-证据追踪表.csv")

TS = datetime.datetime.now().strftime("%Y%m%d%H%M%S")  # 北京时间当前时刻

# ---------------- 设计级（daily 81） ----------------
PASS = {
    # cli-readonly
    "D1-3": "evidence/cli-readonly", "D1-4": "evidence/cli-readonly", "D1-6": "evidence/cli-readonly",
    # d1-upgrade
    "D1-26": "evidence/d1-upgrade", "D1-27": "evidence/d1-upgrade", "D1-28": "evidence/d1-upgrade",
    "D1-30": "evidence/d1-upgrade", "D1-31": "evidence/d1-upgrade", "D1-33": "evidence/d1-upgrade",
    "D1-40": "evidence/d1-upgrade",
    # supplement
    "D1-41": "evidence/supplement",
    "D2-4": "evidence/d4-security", "D2-5": "evidence/supplement", "D2-12": "evidence/supplement",
    "D2-13": "evidence/supplement", "D2-16": "evidence/supplement",
    "D3-A1": "evidence/supplement", "D3-B1": "evidence/supplement", "D3-B5": "evidence/supplement",
    "D4-1": "evidence/d4-security", "D4-3": "evidence/d4-security", "D4-5": "evidence/d4-security",
    "D4-7": "evidence/d4-security", "D4-9": "evidence/d4-security", "D4-15": "evidence/d4-security",
    "D4-17": "evidence/d4-security", "D4-21": "evidence/d4-security", "D4-22": "evidence/d4-security",
    "D5-1": "evidence/dsh-install", "D5-3": "evidence/d9-protocol",
    "D8-7": "evidence/dsh-install",
    "D9-1": "evidence/d9-protocol", "D9-3": "evidence/d9-protocol", "D9-4": "evidence/d9-protocol",
    "D9-8": "evidence/d9-protocol",
    "D1-1": "evidence/dsh-install",
}
FAIL = {
    "D4-2": "evidence/d4-security",
    "D4-16": "evidence/d4-security",
    "D4-23": "evidence/dsh-install",
    "D9-2": "evidence/d9-protocol",
}
BLOCKED = {
    "D1-39": "Windows 专属升级检测链（EINVAL/文件锁），本机 Linux；Linux 检测链语义已在 evidence/d1-upgrade 覆盖",
    "D1-5": "uninstall 破坏性操作（删除本机 ~/.dsh 插件/skills），执行后需重装+重启，本轮不做",
    "D2-11": "需真云 STS securityToken 临时凭证轮换场景（R3 落盘拒绝需真实 Token 链路验证）",
    "D2-10": "需真云 KooCLI current profile 多账号切换（R7 跟随语义）",
    "D2-1": "需真云 AK/SK 三端同步写入（S1/S2/S3）",
    "D4-18": "需互动确认流 + 真云写操作（confirm-not-deny 审批语义）",
    "D4-19": "需互动确认流 + 真云高危写（确认流下预检仍生效）",
    "D4-20": "需互动拒绝确认流 + 云资源验证（拒绝后零操作）",
    "D3-B3": "需真云只读命令执行 + 输出脱敏回归（避免真实账号数据落入 evidence）",
    "D3-C4": "需真云多服务创建→删除→归零 E2E（红线：只删本次创建资源）",
    "D3-C5": "需真云工具冒烟 E2E",
    "D10-4": "需真实 Agent 互动驱动 plan→审批 的安全干预评测",
}

# ---------------- 展开级（daily 71） ----------------
# 展开级列名与设计级不同：执行状态/执行时间/evidencePath（init_day 已追加）
EXP_PASS = {
    "EXP-D5-6-1": "evidence/dsh-install",   # DSH 终端 D5-1 清单发现
    "EXP-D5-6-3": "evidence/d9-protocol",   # DSH 终端 D5-3 工具枚举
    "EXP-NR3-02": "evidence/d1-upgrade",    # Linux OS_MATRIX D1-27 已是最新
}
EXP_BLOCKED_REASON = {
    "true_cloud": "需真云资源创建→删除→归零 E2E（红线：只删本次创建资源）",
    "d1_39": "D1-39 本义 Windows 专属；本机 Linux，该 OS 行不适用",
    "eval": "需真实 Agent 评测集（自然语言任务路由）",
}

# ---------------- 设计级回填 ----------------
with open(DESIGN, encoding="utf-8-sig", newline="") as f:
    drows = list(csv.DictReader(f))
dfn = list(drows[0].keys())
for r in drows:
    cid = (r.get("ID") or "").strip()
    if cid in PASS:
        r["执行状态"] = "PASS"; r["evidencePath"] = PASS[cid]; r["执行时间"] = TS
    elif cid in FAIL:
        r["执行状态"] = "FAIL"; r["evidencePath"] = FAIL[cid]; r["执行时间"] = TS
    elif cid in BLOCKED:
        r["执行状态"] = "BLOCKED"; r["evidencePath"] = ""; r["执行时间"] = ""
    else:
        r["执行状态"] = "NOT_RUN"; r["evidencePath"] = ""; r["执行时间"] = ""
with open(DESIGN, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=dfn); w.writeheader(); w.writerows(drows)

from collections import Counter
dc = Counter(r["执行状态"] for r in drows)
print(f"[设计级] 共{len(drows)} | " + " ".join(f"{k}={v}" for k, v in sorted(dc.items())))

# ---------------- 展开级回填 ----------------
with open(EXPAND, encoding="utf-8-sig", newline="") as f:
    erows = list(csv.DictReader(f))
efn = list(erows[0].keys())
for r in erows:
    cid = (r.get("ID") or "").strip()
    if cid in EXP_PASS:
        r["执行状态"] = "PASS"; r["evidencePath"] = EXP_PASS[cid]; r["执行时间"] = TS
    elif cid.startswith("EXP-C4"):
        r["执行状态"] = "BLOCKED"; r["evidencePath"] = ""; r["执行时间"] = ""
    elif cid in ("EXP-NR3-09", "EXP-NR3-10", "EXP-NR3-11"):
        r["执行状态"] = "BLOCKED"; r["evidencePath"] = ""; r["执行时间"] = ""
    elif cid.startswith("EXP-E"):
        r["执行状态"] = "NOT_RUN"; r["evidencePath"] = ""; r["执行时间"] = ""
    else:
        r["执行状态"] = "NOT_RUN"; r["evidencePath"] = ""; r["执行时间"] = ""
with open(EXPAND, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=efn); w.writeheader(); w.writerows(erows)
ec = Counter(r["执行状态"] for r in erows)
print(f"[展开级] 共{len(erows)} | " + " ".join(f"{k}={v}" for k, v in sorted(ec.items())))

# ---------------- 追踪表回填（执行时间） ----------------
executed = set(list(PASS.keys()) + list(FAIL.keys()))
with open(TRACING, encoding="utf-8-sig", newline="") as f:
    trows = list(csv.DictReader(f))
tfn = list(trows[0].keys())
filled = 0
for r in trows:
    dc = (r.get("designCaseId") or "").strip()
    if dc in executed:
        r["执行时间"] = TS; filled += 1
    else:
        r["执行时间"] = ""
with open(TRACING, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=tfn); w.writeheader(); w.writerows(trows)
print(f"[追踪表] 共{len(trows)} 行 | 已执行(回填执行时间)={filled}")

print("回填完成。执行时间 =", TS)