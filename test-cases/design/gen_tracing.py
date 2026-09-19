# -*- coding: utf-8 -*-
"""生成全仓需求→设计级→展开级→证据追踪表（纯设计追踪，无执行态）。

真源：test-cases/design/用例矩阵-设计级.csv (197) + expanded (137)
执行状态/结果已移入 results/Summary（build_summary.py 聚合），追踪表只保留
「需求→设计→展开→证据要求」的覆盖关系 + 设计状态 + 缺口结论。
输出：test-cases/tracing/需求-设计-证据追踪表.csv（10 列）
"""
import csv, os, sys
from collections import Counter

# 输入/输出目录可被 env 覆盖（只读复现校验时重定向到临时目录）
TC = os.environ.get("HUAWEICLOUD_TESTCASES_DIR",
                    os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DES = os.path.join(TC, "design", "用例矩阵-设计级.csv")
EXP = os.path.join(TC, "expanded", "用例矩阵-展开级.csv")
OUT_DIR = os.path.join(TC, "tracing")
os.makedirs(OUT_DIR, exist_ok=True)
OUT = os.path.join(OUT_DIR, "需求-设计-证据追踪表.csv")

HEADERS = ["sourceAsset", "requirementOrRisk", "designCaseId", "expandedCaseId",
           "testLayer", "clientOrOSScope", "requiredEvidence",
           "design_status", "owner", "gap"]

# 覆盖缺口落用例（2026-09-13，coverage-gaps.md D1~D10）
COMMENT_IDS = {
    "D1-59", "D1-60", "D1-61", "D1-62", "D1-63", "D1-64",
    "D2-22", "D2-23", "D2-24", "D2-25",
    "D3-C10", "D3-C11", "D3-C12", "D4-25", "D4-26", "D9-10",
}

with open(DES, encoding="utf-8-sig") as f:
    drows = list(csv.DictReader(f))
with open(EXP, encoding="utf-8-sig") as f:
    erows = list(csv.DictReader(f))

des_ids = set(r["ID"] for r in drows)
exp_ids = set(r["ID"] for r in erows)

exp_by_src = {}
for e in erows:
    exp_by_src.setdefault(e["源用例"], []).append(e["ID"])

rows = []
fk_errors = []


def source_asset(rid):
    if rid in COMMENT_IDS:
        return "覆盖缺口落用例20260913(coverage-gaps.md)"
    if rid in ("D1-56", "D1-57", "D1-58", "D2-21", "D3-C7", "D3-C8", "D3-C9", "D4-24", "D6-8", "D9-9"):
        return "R12回填ITER-005-P2" if rid == "D1-58" else "全量评审补齐REV-20260911004604"
    if rid.startswith("D1-") and rid[3:].isdigit() and 26 <= int(rid[3:]) <= 55:
        return "NR3版本升级提醒"
    if rid.startswith("D2-") and rid[3:].isdigit() and 8 <= int(rid[3:]) <= 20:
        return "NR2 AK/SK架构v4"
    return "v1.5规划(v1.3基线)"


def test_layer(dim):
    return {
        "D1安装": "安装/生命周期", "D2认证": "认证/凭证", "D4安全": "安全/审批",
        "D5客户端": "客户端适配", "D6性能": "性能/可靠性", "D7兼容": "兼容性",
        "D8质量": "文档/质量", "D9协议": "MCP协议", "D10评测": "Agent评测",
    }.get(dim, "功能/配置")


for d in drows:
    rid = d["ID"]
    dim = d["维度"]
    rule0 = (d["展开规则"] or "").split("|")[0]
    exps = ";".join(exp_by_src.get(rid, []))
    # R12-2: 设计→展开映射——展开规则声明了展开类型但展开级无直接行时，显式标注执行载体矩阵
    if not exps:
        if rule0 == "CLIENT_MATRIX" and rid.startswith("D"):
            exps = "由EXP-D5客户端矩阵覆盖(D5-1~7逐客户端)"
        elif rule0 == "OS_MATRIX" and rid.startswith("D"):
            exps = "由EXP-D7 OS矩阵覆盖(OS×Node)"
        elif rule0 == "AGENT_E2E" and rid.startswith("D"):
            exps = "AGENT_E2E: 由D10评测/真实会话执行"
        elif rule0 == "CROSS_PROCESS" and rid.startswith("D"):
            exps = "由EXP-NR3-18~20跨进程行覆盖(如适用)"
        else:
            exps = "无(不展开/代表执行)"
    scope = d["展开规则"].split("|")[1] if "|" in d["展开规则"] else d["展开规则"]
    design_st = d.get("设计状态") or "DESIGN_COVERED"
    rows.append([source_asset(rid), d["标题"], rid, exps, test_layer(dim), scope,
                 d["预期结果"][:60], design_st, "测试负责人", ""])

# 专项资产行（设计缺口结论，不含执行态）
specials = [
    ["ITER-005(PR#592)", "README 徽章动态化 D1-1~4", "-", "-", "静态核对+CLI", "Windows W",
     "next-stable.mjs 运行输出", "REFERENCE_ONLY", "测试负责人", "复用既有 ID，无独立设计级（结论：接受）"],
    ["ITER-005(PR#592)", "P1 install 目标解析四态", "D1-2/D1-7/D1-9", "-", "CLI+PTY/非TTY", "Windows W + Linux L",
     "setup.cjs 决策树 44/44", "REFERENCE_ONLY", "测试负责人", "复用既有 ID（结论：接受）"],
    ["ITER-005(PR#592)", "P2 通用 MCP 白名单接入", "D1-58", "-", "CLI", "Linux L",
     "Claude/Cursor merge 场景", "REFERENCE_ONLY", "测试负责人", "已回填 D1-58（R12-3 完成，不再留待回填）"],
    ["ITER-002 hand", "各客户端 CDP 会话级自动化", "D5-1~7", "EXP-D5-1-1;EXP-D5-5-1", "客户端会话", "7 客户端",
     "各 manual/会话级自动化.md", "REFERENCE_ONLY", "测试负责人", "执行记录性质（结论：接受，不另立 ID）"],
]
rows += specials

# 外键校验（波浪线范围如 "D5-1~7" 跳过）
for r in rows:
    dcid = r[2]
    if dcid and dcid != "-" and "~" not in dcid:
        for part in dcid.split(";"):
            part = part.strip()
            if part and part not in des_ids:
                for pid in part.split("/"):
                    if pid and pid not in des_ids:
                        fk_errors.append((r[0], part, pid))
    ecid = r[3]
    if ecid and ecid != "-" and ecid != "无(不展开/代表执行)" and "由EXP-" not in ecid:
        for pid in ecid.split(";"):
            pid = pid.strip()
            if pid and pid not in exp_ids:
                fk_errors.append((r[0], "expanded", pid))

with open(OUT, "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f)
    w.writerow(HEADERS)
    for r in rows:
        w.writerow(r)

st_cnt = Counter(r[7] for r in rows)
print(f"追踪表生成: {OUT} 共 {len(rows)} 行（设计级映射 {len(drows)} + 专项 {len(specials)}）")
print(f"列数: {len(HEADERS)}（纯设计追踪：需求→设计→展开→证据要求，无执行态）")
print(f"design_status 分布: {dict(st_cnt)}")
print(f"外键校验错误: {len(fk_errors)}", fk_errors[:5] if fk_errors else "")
if fk_errors:
    print("[GATE-FAIL] 存在外键错误 → exit 1")
    sys.exit(1)
print("[GATE-PASS] 外键校验通过")
sys.exit(0)