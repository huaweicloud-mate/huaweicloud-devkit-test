# -*- coding: utf-8 -*-
"""AtomCode Linux 每日测试执行状态回填脚本（next.6 / gitHead 69ac7279）。
回填三份 CSV：设计级 / 展开级（执行状态 + blockedReason + 执行时间 + evidencePath），追踪表（执行时间）。
"""
import csv, datetime, collections, sys, os

D = os.path.dirname(os.path.abspath(__file__))
TS = datetime.datetime.now().astimezone(datetime.timezone(datetime.timedelta(hours=8))).strftime("%Y%m%d%H%M%S")

# ---- 设计级：ID -> (执行状态, evidencePath, blockedReason) ----
BLK_INSTALL = "环境阻塞：run-only 每日测试不执行破坏性全局安装/卸载/改源"
BLK_REALCLOUD = "环境阻塞：需真实华为云资源创建/销毁或只读账号（红线：最低配置创建→测后删除）"
BLK_LLM = "环境阻塞：需 LLM 评测/多轮自主执行环境，run-only 无法代理"
BLK_OTHER = "环境阻塞：需其他客户端/Inspector/多机环境"

DESIGN = {
    # P0 全量覆盖
    "D1-39": ("PASS", "evidence/d1-upgrade-detect/stdout.log", ""),
    "D1-40": ("PASS", "evidence/d1-upgrade/stdout.log", ""),
    "D2-11": ("PASS", "evidence/d2-auth/stdout.log", ""),
    "D4-18": ("PASS", "evidence/d4-confirm/stdout.log", ""),
    "D4-19": ("PASS", "evidence/d4-confirm/stdout.log", ""),
    "D2-4":  ("PASS", "evidence/d4-security-core/stdout.log", ""),
    "D4-1":  ("PASS", "evidence/d4-security-core/stdout.log", ""),
    "D4-2":  ("FAIL", "evidence/d4-security/stdout.log", ""),
    "D4-3":  ("PASS", "evidence/d4-security-core/stdout.log", ""),
    "D4-5":  ("PASS", "evidence/d4-security-core/stdout.log", ""),
    "D4-9":  ("PASS", "evidence/d4-security-core/stdout.log", ""),
    "D4-15": ("PASS", "evidence/d4-security-core/stdout.log", ""),
    "D4-16": ("FAIL", "evidence/d4-security/stdout.log", ""),
    "D4-21": ("FAIL", "evidence/d4-security-core/stdout.log", ""),
    "D4-22": ("PASS", "evidence/d4-security-core/stdout.log", ""),
    "D4-23": ("FAIL", "evidence/d4-rules/stdout.log", ""),
    "D8-7":  ("PASS", "evidence/d8-skills/stdout.log", ""),
    "D10-4": ("PASS", "evidence/d8-skills/stdout.log", ""),
    # 安装/生命周期（阻塞：破坏性）
    "D1-1": ("BLOCKED", "", BLK_INSTALL),
    "D1-2": ("BLOCKED", "", BLK_INSTALL),
    "D1-5": ("BLOCKED", "", BLK_INSTALL),
    "D1-6": ("BLOCKED", "", BLK_INSTALL),
    "D1-58": ("BLOCKED", "", "环境阻塞：需交互式 install 菜单 option3 白名单探测"),
    "D7-4": ("BLOCKED", "", BLK_INSTALL),
    # D1 升级检测链
    "D1-3":  ("PASS", "evidence/cli/stdout.log", ""),
    "D1-4":  ("PASS", "evidence/cli/stdout.log", ""),
    "D1-26": ("PASS", "evidence/d2-auth/stdout.log", ""),
    "D1-27": ("PASS", "evidence/d1-upgrade/stdout.log", ""),
    "D1-28": ("PASS", "evidence/d1-upgrade/stdout.log", ""),
    "D1-30": ("PASS", "evidence/d1-upgrade/stdout.log", ""),
    "D1-31": ("PASS", "evidence/d1-upgrade/stdout.log", ""),
    "D1-33": ("PASS", "evidence/d1-extend/stdout.log", ""),
    "D1-41": ("PASS", "evidence/d1-extend/stdout.log", ""),
    "D1-42": ("PASS", "evidence/d1-extend/stdout.log", ""),
    "D1-45": ("PASS", "evidence/d1-upgrade/stdout.log", ""),
    # D2 凭证鉴权
    "D2-1":  ("PASS", "evidence/d2-auth/stdout.log", ""),
    "D2-2":  ("PASS", "evidence/d2-auth/stdout-d2-auth.log", ""),
    "D2-5":  ("PASS", "evidence/d2-auth/stdout.log", ""),
    "D2-10": ("PASS", "evidence/d2-extend/stdout.log", ""),
    "D2-12": ("PASS", "evidence/d2-extend/stdout.log", ""),
    "D2-13": ("PASS", "evidence/d2-auth/stdout.log", ""),
    "D2-16": ("PASS", "evidence/d2-extend/stdout.log", ""),
    # D3 工具/技能
    "D3-A1": ("PASS", "evidence/d5-tools/stdout.log", ""),
    "D3-B1": ("PASS", "evidence/d5-tools/stdout.log", ""),
    "D3-B3": ("BLOCKED", "", BLK_REALCLOUD),
    "D3-B5": ("PASS", "evidence/d5-tools/stdout.log", ""),
    "D3-C4": ("BLOCKED", "", "环境阻塞：真云 E2E 服务创建类回归（红线：最低配置创建→测后删除→归零验证），本轮未发起"),
    "D3-C5": ("PASS", "evidence/d3misc/stdout.log", ""),
    # D4 安全
    "D4-4":  ("PASS", "evidence/d4-security/stdout.log", ""),
    "D4-6":  ("PASS", "evidence/d4-extend/stdout.log", ""),
    "D4-7":  ("PASS", "evidence/d4-extend/stdout.log", ""),
    "D4-8":  ("BLOCKED", "", "环境阻塞：Python hook 路径本机未携带，无法做 Python/Node 同源策略对比"),
    "D4-10": ("PASS", "evidence/d4-extend/stdout.log", ""),
    "D4-11": ("PASS", "evidence/d4-extend/stdout.log", ""),
    "D4-12": ("BLOCKED", "", "环境阻塞：供应链/依赖锁定/SBOM 审计需独立 CI + npm audit 全量核对"),
    "D4-13": ("BLOCKED", "", BLK_REALCLOUD),
    "D4-14": ("BLOCKED", "", "环境阻塞：操作可审计性需真实 CTS 审计记录"),
    "D4-17": ("PASS", "evidence/d4-extend/stdout.log", ""),
    "D4-20": ("PASS", "evidence/d4-extend/stdout.log", ""),
    "D4-24": ("PASS", "evidence/d4-extend/stdout.log", ""),
    # D5/D6/D8/D9/D10
    "D5-1":  ("PASS", "evidence/d5-tools/stdout.log", ""),
    "D5-3":  ("PASS", "evidence/d3misc/stdout.log", ""),
    "D6-1":  ("PASS", "evidence/d3misc/stdout.log", ""),
    "D6-3":  ("PASS", "evidence/d3misc/stdout.log", ""),
    "D6-4":  ("PASS", "evidence/d3misc/stdout.log", ""),
    "D9-9":  ("PASS", "evidence/d3misc/stdout.log", ""),
    "D8-1":  ("PASS", "evidence/d3misc/stdout.log", ""),
    "D8-4":  ("PASS", "evidence/d3misc/stdout.log", ""),
    "D8-6":  ("PASS", "evidence/d3misc/stdout.log", ""),
    "D9-1":  ("PASS", "evidence/d9-protocol/stdout.log", ""),
    "D9-2":  ("FAIL", "evidence/d9-protocol/stdout-d9-mcp-protocol.log", ""),
    "D9-3":  ("PASS", "evidence/d9-protocol/stdout.log", ""),
    "D9-4":  ("PASS", "evidence/d9-protocol/stdout.log", ""),
    "D9-5":  ("BLOCKED", "", "环境阻塞：stdio 大 payload/断连恢复需真实 MCP 传输子进程压测"),
    "D9-6":  ("BLOCKED", "", BLK_OTHER),
    "D9-7":  ("PASS", "evidence/d9-protocol/stdout.log", ""),
    "D9-8":  ("PASS", "evidence/d9-protocol/stdout-d9-8.log", ""),
    "D10-1": ("PASS", "evidence/d8-skills/stdout.log", ""),
    "D10-2": ("PASS", "evidence/d8-skills/stdout.log", ""),
    "D10-3": ("BLOCKED", "", BLK_LLM),
    "D10-5": ("BLOCKED", "", BLK_LLM),
}

# ---- 展开级：ID -> (执行状态, evidencePath, blockedReason) ----
EXPANDED = {}
# NR3 P0
EXPANDED["EXP-NR3-09"] = ("PASS", "evidence/expanded/stdout.log", "")
EXPANDED["EXP-NR3-10"] = ("PASS", "evidence/expanded/stdout.log", "")
EXPANDED["EXP-NR3-11"] = ("BLOCKED", "", "环境阻塞：无 macOS / 独立 macOS 机器，声明支持的 macOS 路径无证据")
# C4 服务矩阵（22，只读规划冒烟）
for n in range(1, 23):
    EXPANDED[f"EXP-C4-{n:02d}"] = ("PASS", "evidence/expanded/stdout.log", "")
# D5 客户端矩阵：AtomCode 自己 2 行 PASS，其余 18 行明确不适用本客户端
for row in range(1, 11):
    for kind in ["1", "3"]:
        cid = f"EXP-D5-{row}-{kind}"
        if row == 10:
            EXPANDED[cid] = ("PASS", "evidence/d5-tools/stdout.log" if kind == "1" else "evidence/d3misc/stdout.log", "")
        else:
            EXPANDED[cid] = ("BLOCKED", "", "环境不满足：该行为其他客户端 D5 矩阵枚举，需由对应客户端在其 results 目录自行执行（本机为 AtomCode）")
# NR3 终端矩阵（Linux 适用部分 PASS，其余 NOT_RUN）
EXPANDED["EXP-NR3-01"] = ("PASS", "evidence/d1-extend/stdout.log", "")
EXPANDED["EXP-NR3-02"] = ("PASS", "evidence/d1-upgrade/stdout.log", "")
EXPANDED["EXP-NR3-03"] = ("PASS", "evidence/d1-extend/stdout.log", "")
EXPANDED["EXP-NR3-04"] = ("PASS", "evidence/d1-extend/stdout.log", "")
EXPANDED["EXP-NR3-23"] = ("PASS", "evidence/d1-upgrade/stdout.log", "")
EXPANDED["EXP-NR3-24"] = ("PASS", "evidence/d1-upgrade/stdout.log", "")
# D10 评测集（15，需 LLM 评测环境）
for n in range(1, 16):
    EXPANDED[f"EXP-E{n:02d}"] = ("BLOCKED", "", BLK_LLM)
# D1-58 白名单矩阵（5，需交互 install 菜单）
for n in range(1, 6):
    EXPANDED[f"EXP-D1-58-{n:02d}"] = ("BLOCKED", "", "环境阻塞：需交互式 install 菜单 option3 白名单探测")

# ---- 回填 ----
def backfill_case_csv(path, mapping, kind):
    rows = list(csv.DictReader(open(path, encoding="utf-8-sig")))
    fields = list(rows[0].keys())
    # 追加 blockedReason 列（若不存在）
    br_col = "blockedReason"
    if br_col not in fields:
        fields.append(br_col)
    for r in rows:
        cid = r.get("ID") or r.get("expandedCaseId") or ""
        # 展开级用 expandedCaseId 匹配
        if cid not in mapping and kind == "expanded":
            cid = r.get("expandedCaseId") or r.get("ID") or ""
        rec = mapping.get(cid)
        if rec:
            status, ev, reason = rec
            r["执行状态"] = status
            r["执行时间"] = TS
            r["evidencePath"] = ev
            r[br_col] = reason
        else:
            r[br_col] = ""
            if not r.get("执行状态") or not r["执行状态"].strip():
                r["执行状态"] = "NOT_RUN"
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow(r)
    c = collections.Counter((r.get("执行状态") or "").strip() or "(空)" for r in rows)
    print(f"[{kind}] 回填 {len(rows)} 行 -> {dict(c)}")

backfill_case_csv(os.path.join(D, "用例矩阵-设计级.csv"), DESIGN, "设计级")
backfill_case_csv(os.path.join(D, "用例矩阵-展开级.csv"), EXPANDED, "展开级")

# 追踪表：executed(PASS/FAIL) 的设计级用例回填执行时间
executed = {cid for cid, (st, ev, _) in DESIGN.items() if st in ("PASS", "FAIL")}
tp = os.path.join(D, "需求-设计-证据追踪表.csv")
trows = list(csv.DictReader(open(tp, encoding="utf-8-sig")))
tfields = list(trows[0].keys())
for r in trows:
    dc = (r.get("designCaseId") or "").strip()
    if dc in executed:
        r["执行时间"] = TS
    else:
        r["执行时间"] = ""
with open(tp, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=tfields)
    w.writeheader()
    for r in trows:
        w.writerow(r)
filled = sum(1 for r in trows if (r.get("执行时间") or "").strip())
print(f"[追踪表] 执行时间回填 {filled}/{len(trows)} 行（executed 设计级 {len(executed)} 用例）")
print("回填完成，执行时间:", TS)