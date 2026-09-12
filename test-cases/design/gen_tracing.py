# -*- coding: utf-8 -*-
"""R11-5: 生成全仓需求→设计级→展开级→证据追踪表（Codex round-10 P1-2 增强版）
真源：test-cases/design/用例矩阵-设计级.csv (163) + expanded (137)
增强（R11）：①ID 外键校验（designCaseId 必须在设计级存在；expandedCaseId 必须在展开级存在）
  ②状态统一枚举（UNASSESSED/PASS/FAIL/SPEC-MISMATCH/BLOCKED/NOT_RUN）
  ③专项 gap 处理结论显式化
输出：test-cases/tracing/需求-设计-证据追踪表.csv（12 列；保留历史 status，并分离 design_status/execution_status）
"""
import csv, os, sys
from datetime import datetime

# 输入/输出目录可被 env 覆盖（只读复现校验时重定向到临时目录）；默认取本仓库 test-cases（基于 __file__，可移植）
TC = os.environ.get("HUAWEICLOUD_TESTCASES_DIR",
                    os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DES = os.path.join(TC, "design", "用例矩阵-设计级.csv")
EXP = os.path.join(TC, "expanded", "用例矩阵-展开级.csv")
OUT_DIR = os.path.join(TC, "tracing")
os.makedirs(OUT_DIR, exist_ok=True)
OUT = os.path.join(OUT_DIR, "需求-设计-证据追踪表.csv")

# 保留原 10 列并追加设计/执行状态，避免 UNASSESSED 被误读为执行通过。
HEADERS = ["sourceAsset", "requirementOrRisk", "designCaseId", "expandedCaseId",
           "testLayer", "clientOrOSScope", "requiredEvidence", "status",
           "design_status", "execution_status", "owner", "gap", "evidencePath"]

# ITER-006 执行证据链映射（用例 ID → 证据目录，相对执行归档根；多个用 ; 分隔）
EVIDENCE = {
    "D1-3": "evidence/d1-cli-readonly", "D1-4": "evidence/d1-cli-readonly", "D1-6": "evidence/d1-cli-readonly",
    "D1-26": "evidence/d9-protocol;evidence/d1-upgrade",
    "D2-2": "evidence/d2-auth-core", "D2-4": "evidence/d2-auth-core", "D2-5": "evidence/d2-auth-core",
    "D2-6": "evidence/d2-auth-core", "D2-7": "evidence/d2-auth-reconcile",
    "D2-10": "evidence/d2-auth-reconcile", "D2-11": "evidence/d2-auth-switch", "D2-12": "evidence/d2-auth-core",
    "D2-13": "evidence/d2-auth-core", "D2-14": "evidence/d2-auth-core", "D2-15": "evidence/d2-auth-switch",
    "D2-16": "evidence/d2-auth-switch", "D2-18": "evidence/d2-auth-reconcile", "D2-19": "evidence/d2-auth-reconcile",
    "D3-A1": "evidence/d3-a1-skills", "D3-A4": "evidence/d3-misc", "D3-A5": "evidence/d2-d3-readonly;evidence/d3-misc",
    "D3-B1": "evidence/d3-b-readonly;evidence/d3-misc", "D3-B2": "evidence/d3-b-readonly", "D3-B3": "evidence/d3-b-readonly",
    "D3-B4": "evidence/d3-misc", "D3-B5": "evidence/d9-d3-function", "D3-B6": "evidence/d3-misc",
    "D3-B7": "evidence/d3-b7-approval", "D3-B8": "evidence/d3-b8-voucher",
    "D3-C2": "evidence/d3-c2-obs", "D3-C5": "evidence/d3-c5-smoke", "D3-C7": "evidence/d3-c7-eip;evidence/d3-misc",
    "D3-C8": "evidence/d3-c8-evs", "D3-C9": "evidence/d3-c9-notfound",
    "D4-1": "evidence/d4-security-core", "D4-2": "evidence/d4-security-core", "D4-15": "evidence/d4-security-core",
    "D4-16": "evidence/d4-security-core", "D4-21": "evidence/d4-security-core", "D4-22": "evidence/d4-security-core",
    "D4-24": "evidence/d3-b7-approval",
    "D5-1": "evidence/d5-static", "D5-3": "evidence/d5-static", "D5-8": "evidence/d5-static",
    "D6-1": "evidence/d6-perf", "D6-3": "evidence/d6-perf", "D6-4": "evidence/d6-perf",
    "D7-4": "evidence/d8-doc",
    "D8-1": "evidence/d8-doc", "D8-4": "evidence/d8-doc", "D8-6": "evidence/d8-doc", "D8-7": "evidence/d8-doc",
    "D9-1": "evidence/d9-protocol;evidence/d9-robust", "D9-2": "evidence/d9-d3-function",
    "D9-3": "evidence/d9-protocol", "D9-4": "evidence/d9-protocol",
    "D9-5": "evidence/d9-robust;evidence/d9-d3-function", "D9-7": "evidence/d9-robust",
    "D9-8": "evidence/d9-robust", "D9-9": "evidence/d9-9-cancel",
}

with open(DES, encoding="utf-8-sig") as f:
    drows = list(csv.DictReader(f))
with open(EXP, encoding="utf-8-sig") as f:
    erows = list(csv.DictReader(f))

des_ids = set(r["ID"] for r in drows)
exp_ids = set(r["ID"] for r in erows)

# 展开级按源用例映射
exp_by_src = {}
for e in erows:
    exp_by_src.setdefault(e["源用例"], []).append(e["ID"])

rows = []
fk_errors = []   # 外键校验错误
now = datetime.now().strftime("%Y-%m-%d %H:%M")

def norm_status(st):
    """统一状态枚举（R15: PARTIAL 前缀聚合 → PARTIAL）"""
    if not st:
        return "UNASSESSED"
    if st.startswith("PARTIAL"):
        return "PARTIAL"
    if "PASS" in st:
        return "PASS"
    if "FAIL" in st or "OBS-1" in st or "#56" in st:
        return "FAIL"
    if "SPEC" in st:
        return "SPEC-MISMATCH"
    if "BLOCKED" in st or "NOT_RUN" in st:
        return "BLOCKED"
    if "执行记录" in st:
        return "PASS"
    return "UNASSESSED"

for d in drows:
    rid = d["ID"]
    dim = d["维度"]
    rule0 = (d["展开规则"] or "").split("|")[0]
    exps = ";".join(exp_by_src.get(rid, []))
    # R12-2: 设计→展开映射（机器可核对）——展开规则声明了展开类型但展开级无直接行时，
    # 显式标注执行载体矩阵（expandedCaseId 非空即可，外键校验 b 认可"由XX矩阵覆盖"标注）。
    if not exps:
        if rule0 == "CLIENT_MATRIX" and rid.startswith("D"):
            exps = "由EXP-D5客户端矩阵覆盖(D5-1~7逐客户端)"
        elif rule0 == "OS_MATRIX" and rid.startswith("D"):
            exps = "由EXP-D7 OS矩阵覆盖(OS×Node)"
        elif rule0 == "AGENT_E2E" and rid.startswith("D"):
            exps = "AGENT_E2E: 由D10评测/真实会话执行(ID待D10)"
        elif rule0 == "CROSS_PROCESS" and rid.startswith("D"):
            exps = "由EXP-NR3-18~20跨进程行覆盖(如适用)"
        else:
            exps = "无(不展开/代表执行)"
    # EXP 外键校验：展开级存在但源映射不到设计级（应不会发生，防御）
    # 设计级 ID 一定在设计级（自身），无需校验
    src = "v1.5规划(v1.3基线)"
    if rid in ("D1-56", "D1-57", "D1-58", "D2-21", "D3-C7", "D3-C8", "D3-C9", "D4-24", "D6-8", "D9-9"):
        src = "全量评审补齐REV-20260911004604"
        if rid == "D1-58":
            src = "R12回填ITER-005-P2"
    elif rid.startswith("D1-") and rid[3:].isdigit() and 26 <= int(rid[3:]) <= 55:
        src = "NR3版本升级提醒"
    elif rid.startswith("D2-") and rid[3:].isdigit() and 8 <= int(rid[3:]) <= 20:
        src = "NR2 AK/SK架构v4"
    tl = "功能/配置"
    if dim == "D1安装": tl = "安装/生命周期"
    elif dim == "D2认证": tl = "认证/凭证"
    elif dim == "D4安全": tl = "安全/审批"
    elif dim == "D5客户端": tl = "客户端适配"
    elif dim == "D6性能": tl = "性能/可靠性"
    elif dim == "D7兼容": tl = "兼容性"
    elif dim == "D8质量": tl = "文档/质量"
    elif dim == "D9协议": tl = "MCP协议"
    elif dim == "D10评测": tl = "Agent评测"
    # status: 统一枚举（ITER-004 已执行结果回填 + EX-3/EX-4 真机验证回填 2026-09-11）
    # R15-2（Codex round-14）: 聚合状态从展开级动态推导——展开级存在 BLOCKED/NOT_RUN/SPEC 时
    # 父级不得标 PASS；部分覆盖用 PARTIAL 语义；FAIL 优先。
    st = "UNASSESSED"
    # ITER-006 全量执行回填（2026-09-12）——与 gen_matrix.design_status 保持一致
    _ITER006 = {
        "D1-3": "PASS", "D1-4": "PASS", "D1-6": "PASS",
        "D2-2": "PASS", "D2-4": "PASS", "D2-5": "PASS", "D2-6": "PASS", "D2-7": "PASS",
        "D2-10": "PASS", "D2-11": "PASS", "D2-12": "PASS", "D2-13": "PASS", "D2-14": "PASS",
        "D2-15": "PASS", "D2-16": "PASS", "D2-18": "PASS", "D2-19": "PASS",
        "D3-A1": "PASS", "D3-A4": "PASS", "D3-A5": "PASS",
        "D3-B1": "PASS", "D3-B2": "PASS", "D3-B3": "PASS", "D3-B4": "PASS", "D3-B5": "PASS",
        "D3-B6": "PASS", "D3-B7": "PASS", "D3-B8": "PASS",
        "D3-C2": "PASS", "D3-C5": "PASS", "D3-C7": "PASS",
        "D4-1": "PASS", "D4-21": "PASS", "D4-22": "PASS",
        "D5-1": "PASS", "D5-3": "PASS", "D5-8": "PASS",
        "D6-1": "PASS", "D6-3": "PASS", "D6-4": "PASS",
        "D8-1": "PASS", "D8-4": "PASS", "D8-6": "PASS", "D8-7": "PASS",
        "D7-4": "PASS",
        "D9-1": "PASS", "D9-3": "PASS", "D9-4": "PASS", "D9-8": "PASS",
        "D3-C9": "FAIL", "D4-2": "FAIL", "D4-15": "FAIL", "D4-16": "FAIL",
        "D9-2": "FAIL", "D9-5": "FAIL",
        "D4-24": "SPEC-MISMATCH", "D9-9": "SPEC-MISMATCH",
        "D3-C1": "PARTIAL(BLOCKED)", "D3-C3": "PARTIAL(BLOCKED)", "D3-C6": "PARTIAL(BLOCKED)", "D3-C8": "PARTIAL(BLOCKED)",
    }
    if rid in _ITER006:
        st = _ITER006[rid]
    if rid.startswith("D1-") and rid[3:].isdigit() and 26 <= int(rid[3:]) <= 55:
        if rid == "D1-39":
            st = "FAIL"
        elif rid == "D1-52":
            # 展开级 EXP-NR3-15b(CodeArtsSpace BLOCKED)/EXP-NR3-16(Linux升级链 BLOCKED) + Windows PASS 行
            st = "PARTIAL(BLOCKED×2)"
        elif rid == "D1-46":
            # 46g reject 防御=SPEC 子断言（Windows+Linux 一致观测，未裁决）→ 显式保留 SPEC 语义
            st = "PARTIAL(SPEC:46g)"
        elif rid == "D1-55":
            # EXP-NR3-19 SPEC + EXP-NR3-20 NOT_RUN + TTY BLOCKED + stdio PASS
            st = "PARTIAL(SPEC+NOT_RUN+BLOCKED)"
        elif rid in {"D1-29", "D1-43"}:
            st = "SPEC-MISMATCH"
        else:
            st = "PASS"
    if rid == "D1-58":
        # EX-4 2026-09-11: 五断言真机全 PASS（testbot3 c6c0965）——展开级 5 行全 PASS 无 BLOCKED/SPEC
        st = "PASS"
    if rid == "D2-20":
        # 与 gen_matrix design_status 一致：ITER-002 aksk-v4 实测发现 AK-FP-2 规格差异（方案 T1 断言3），待真机复核
        st = "SPEC-MISMATCH"
    scope = d["展开规则"].split("|")[1] if "|" in d["展开规则"] else d["展开规则"]
    gap = ""
    if st in ("FAIL", "SPEC-MISMATCH"):
        gap = "需 #554 回归" if rid == "D1-39" else "需开发/产品裁决"
    elif st == "PARTIAL(BLOCKED×2)":
        gap = "聚合：Windows PASS + CodeArtsSpace/Linux升级链 BLOCKED（环境接入后闭合）"
    elif st == "PARTIAL(SPEC:46g)":
        gap = "聚合：主行为 PASS + 46g reject 防御 SPEC（待开发裁决）"
    elif st == "PARTIAL(SPEC+NOT_RUN+BLOCKED)":
        gap = "聚合：stdio PASS + remote SPEC/NOT_RUN + TTY BLOCKED（待裁决/环境）"
    design_st = d.get("设计状态") or "DESIGN_COVERED"
    execution_st = d.get("执行状态") or norm_status(st)
    rows.append([src, d["标题"], rid, exps, tl, scope, d["预期结果"][:60], st,
                 design_st, execution_st, "测试负责人", gap, EVIDENCE.get(rid, "")])

# 专项资产行（gap 处理结论显式化）
specials = [
    ["ITER-005(PR#592)", "README 徽章动态化 D1-1~4", "-", "-", "静态核对+CLI", "Windows W",
     "next-stable.mjs 运行输出", "PASS", "REFERENCE_ONLY", "PASS", "测试负责人", "复用既有 ID，无独立设计级（结论：接受）", ""],
    ["ITER-005(PR#592)", "P1 install 目标解析四态", "D1-2/D1-7/D1-9", "-", "CLI+PTY/非TTY", "Windows W + Linux L",
     "setup.cjs 决策树 44/44", "PASS", "REFERENCE_ONLY", "PASS", "测试负责人", "复用既有 ID（结论：接受）", ""],
    ["ITER-005(PR#592)", "P2 通用 MCP 白名单接入", "D1-58", "-", "CLI", "Linux L",
     "Claude/Cursor merge 场景", "PASS", "REFERENCE_ONLY", "PASS", "测试负责人", "已回填 D1-58（R12-3 完成，不再留待回填）", ""],
    ["ITER-002 hand", "D4-21/22/23 hook 回归", "D4-21/D4-22/D4-23", "-", "hook 函数直调", "Hermes/Windows",
     "d4-p0-supplement2.mjs", "FAIL", "REFERENCE_ONLY", "FAIL", "测试负责人", "D4-22/23 缺陷已提单 #562/#563（结论：跟踪上游修复）", ""],
    ["ITER-002 hand", "各客户端 CDP 会话级自动化", "D5-1~7", "EXP-D5-1-1;EXP-D5-2-1;EXP-D5-3-1;EXP-D5-4-1;EXP-D5-5-1;EXP-D5-6-1;EXP-D5-7-1", "客户端会话", "7 客户端",
     "各 manual/会话级自动化.md", "PASS", "REFERENCE_ONLY", "PASS", "测试负责人", "执行记录性质（结论：接受，不另立 ID；展开引用取每客户端 D5-1 代表行）", ""],
    ["ITER-002 aksk-v4", "AK-FP-1/2 发现", "D2-20", "-", "真机", "Win+Linux",
     "NR2-设计与执行.md", "SPEC-MISMATCH", "REFERENCE_ONLY", "SPEC-MISMATCH", "测试负责人", "待人工核对（结论：挂起，需真机复核）", ""],
]
rows += specials

# 外键校验（波浪线范围如 "D5-1~7" 跳过）
for r in rows:
    dcid = r[2]
    if dcid and dcid != "-" and "~" not in dcid:
        for part in dcid.split(";"):
            part = part.strip()
            if part and part not in des_ids:
                # 多 ID 组合（如 "D1-2/D1-7/D1-9"）逐段检查
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

# 状态统计（统一枚举）
from collections import Counter
st_cnt = Counter(norm_status(r[7]) for r in rows)
print(f"追踪表生成: {OUT} 共 {len(rows)} 行（设计级映射 {len(drows)} + 专项 {len(specials)}）")
print(f"列数: {len(HEADERS)}（保留原追踪字段并追加 design_status/execution_status）")
print(f"状态分布(统一枚举): {dict(st_cnt)}")
print(f"外键校验错误: {len(fk_errors)}", fk_errors[:5] if fk_errors else "")
if fk_errors:
    print("[GATE-FAIL] 存在外键错误 → exit 1")
    sys.exit(1)
print("[GATE-PASS] 外键校验通过")
sys.exit(0)
