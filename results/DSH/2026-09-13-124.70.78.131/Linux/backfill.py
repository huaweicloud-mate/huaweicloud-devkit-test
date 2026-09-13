# -*- coding: utf-8 -*-
"""DSH/Linux 2026-09-13 执行回填。只改 results/DSH 本目录副本，不碰真源。"""
import csv, os

BASE = os.path.dirname(os.path.abspath(__file__))
DESIGN = os.path.join(BASE, "用例矩阵-设计级.csv")
EXPAND = os.path.join(BASE, "用例矩阵-展开级.csv")

# ---------------- 设计级映射 ----------------
PASS = {
    # cli-readonly
    "D1-3": "evidence/cli-readonly", "D1-4": "evidence/cli-readonly", "D1-6": "evidence/cli-readonly",
    # d1-upgrade
    "D1-26": "evidence/d1-upgrade", "D1-27": "evidence/d1-upgrade", "D1-28": "evidence/d1-upgrade",
    "D1-30": "evidence/d1-upgrade", "D1-31": "evidence/d1-upgrade", "D1-32": "evidence/d1-upgrade",
    "D1-33": "evidence/d1-upgrade", "D1-34": "evidence/d1-upgrade", "D1-35": "evidence/d1-upgrade",
    "D1-37": "evidence/d1-upgrade", "D1-40": "evidence/d1-upgrade", "D1-44": "evidence/d1-upgrade",
    "D1-46": "evidence/d1-upgrade", "D1-47": "evidence/d1-upgrade", "D1-53": "evidence/d1-upgrade",
    # d4-security
    "D2-4": "evidence/d4-security", "D4-1": "evidence/d4-security", "D4-3": "evidence/d4-security",
    "D4-4": "evidence/d4-security", "D4-5": "evidence/d4-security", "D4-6": "evidence/d4-security",
    "D4-7": "evidence/d4-security", "D4-9": "evidence/d4-security", "D4-15": "evidence/d4-security",
    "D4-17": "evidence/d4-security", "D4-21": "evidence/d4-security", "D4-22": "evidence/d4-security",
    # d9-protocol
    "D5-3": "evidence/d9-protocol", "D9-1": "evidence/d9-protocol", "D9-3": "evidence/d9-protocol",
    "D9-4": "evidence/d9-protocol", "D9-8": "evidence/d9-protocol",
    # dsh-install
    "D1-1": "evidence/dsh-install", "D5-1": "evidence/dsh-install", "D5-2": "evidence/dsh-install",
    "D8-7": "evidence/dsh-install",
}
FAIL = {
    "D4-2": "evidence/d4-security",
    "D4-16": "evidence/d4-security",
    "D4-23": "evidence/dsh-install",
    "D9-2": "evidence/d9-protocol",
}
BLOCKED = {
    "D1-39": "Windows 专属断言（EINVAL），本机为 Linux；Linux 检测链已验证可用（readInstalledVersion/queryDistTagsSync/judgeUpdate 均正常）",
    "D1-52": "需真实升级安装+重启会话验证，会替换当前版本，不在本机执行",
    "D5-6": "Windows 专属（Hermes/文件锁/Python SDK）",
    "D7-3": "Windows better-sqlite3 专属缺口",
    "D2-1": "需真云 AK/SK 三端同步写入",
    "D2-8": "需真云 credentials 变更回归",
    "D2-11": "需真云 STS securityToken",
    "D2-21": "需真云 AK/SK 轮换",
    "D3-C1": "需真云 ECS 生命周期 E2E（创建→删除→归零）",
    "D3-C2": "需真云 OBS 静态站部署",
    "D3-C3": "需沙箱环境",
    "D3-C4": "需真云多服务轻量创建",
    "D3-C5": "需真云 ECS 冒烟",
    "D3-C6": "需沙箱 7 工具",
    "D3-C7": "需跨区域真云资源",
    "D3-C8": "需企业项目真云（EPS）",
    "D3-C9": "需真云资源状态/冻结场景",
    "D4-18": "需互动确认流+真云写操作",
    "D4-19": "需真云高危写确认流",
    "D4-20": "需确认流+云资源验证",
    "D4-24": "需真云 ECS 确认令牌过期场景",
    "D10-4": "需真实 Agent 互动安全干预评测",
}

# ---------------- 设计级回填 ----------------
with open(DESIGN, encoding="utf-8-sig", newline="") as f:
    rows = list(csv.DictReader(f))
fieldnames = rows[0].keys()
stat_col = "执行状态"
ev_col = "evidencePath"
br_col = "blockedReason"

n_pass = n_fail = n_blocked = n_notrun = 0
for r in rows:
    cid = (r.get("ID") or "").strip()
    if cid in PASS:
        r[stat_col] = "PASS"; r[ev_col] = PASS[cid]; r[br_col] = ""; n_pass += 1
    elif cid in FAIL:
        r[stat_col] = "FAIL"; r[ev_col] = FAIL[cid]; r[br_col] = ""; n_fail += 1
    elif cid in BLOCKED:
        r[stat_col] = "BLOCKED"; r[ev_col] = ""; r[br_col] = BLOCKED[cid]; n_blocked += 1
    else:
        r[stat_col] = "NOT_RUN"; r[ev_col] = ""; r[br_col] = ""; n_notrun += 1

with open(DESIGN, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=fieldnames)
    w.writeheader(); w.writerows(rows)
print(f"[设计级] 共{len(rows)} | PASS {n_pass} | FAIL {n_fail} | BLOCKED {n_blocked} | NOT_RUN {n_notrun}")

# ---------------- 展开级回填（本次未逐条展开执行 → NOT_RUN，避免虚报）----------------
with open(EXPAND, encoding="utf-8-sig", newline="") as f:
    erows = list(csv.DictReader(f))
efn = erows[0].keys()
for r in erows:
    r["execution_status"] = "NOT_RUN"
    r["evidencePath"] = ""
    # 设计级判定的端子/agent/OS 附加信息不影响门禁，保留原样
with open(EXPAND, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=efn)
    w.writeheader(); w.writerows(erows)
print(f"[展开级] 共{len(erows)} 行 → execution_status 全部置 NOT_RUN（本次未逐条展开执行）")
print("回填完成。")
