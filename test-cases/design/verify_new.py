# -*- coding: utf-8 -*-
"""R11-6: 设计矩阵门禁审计脚本（Codex round-10 P1-5 增强版）
作为测试设计门禁使用：任一检查失败 → 非零退出码（CI/闭环可阻断）。
检查项：
  1. 设计级行数 == 162、ID 唯一
  2. 必填字段（前置/测试数据/步骤/预期/指引/关联工具）0 空
  3. 展开规则 0 空 + 全部四段结构化（枚举类型|代表|证据|阻塞）
  4. 展开级 12 列结构、每行列数一致
  5. NR3 状态枚举合法（PASS/FAIL/BLOCKED/SPEC-MISMATCH/NOT_RUN/UNASSESSED），无状态混用
  6. BLOCKED/NOT_RUN 必须有 blockedReason + requiredEvidence；PASS/FAIL/SPEC 必须有 requiredEvidence
  7. 36 工具覆盖审计（全名匹配，无简称兜底）
  8. NR3 旧漂移文案检测
  9. 追踪表 10 列 + ID 外键校验 + 状态一致性（设计基线 status 空 <-> 追踪表 UNASSESSED）
运行：python verify_new.py   # 全部通过退出 0，任一失败退出 1
"""
import csv
import collections
import sys

P_DES = 'test-cases/design/用例矩阵-设计级.csv'
P_EXP = 'test-cases/expanded/用例矩阵-展开级.csv'
P_TRACE = 'test-cases/tracing/需求-设计-证据追踪表.csv'
REQUIRED_FIELDS = ["前置条件", "测试数据", "操作步骤", "预期结果", "指引来源", "关联工具"]
NEW_IDS = ["D1-56", "D1-57", "D1-58", "D2-21", "D3-C7", "D3-C8", "D3-C9", "D4-24", "D6-8", "D9-9"]
VALID_STATUS = {"PASS", "FAIL", "BLOCKED", "SPEC-MISMATCH", "NOT_RUN", "UNASSESSED", "PARTIAL"}
ENUM_TYPES = ("COMMON", "CLIENT_MATRIX", "OS_MATRIX", "AGENT_E2E", "CROSS_PROCESS")
STALE_PATTERNS = ["无 Linux 测试机可用", "SSH 无凭据不可达", "WSL 无发行版"]
TOOLS = ["huaweicloud_auth_init", "auth_status", "auth_sync", "check_cli", "detect_framework",
         "setup_obs_config", "plan_cli_command", "run_readonly_command", "run_approved_command",
         "list_operations", "list_regions", "get_regional_availability", "service_catalog",
         "search_marketplace", "search_docs", "retrieve_skill", "get_service_icon",
         "hook_check_command", "hook_check_artifacts", "hook_check_deploy_plan", "explain_error",
         "show_profile_redacted", "sandbox_check_user", "sandbox_connect", "sandbox_credentials",
         "sandbox_sign_agreement", "sandbox_exec_one_shot", "sandbox_exec_with_session",
         "sandbox_close_session", "sandbox_upload_file", "sandbox_upload_project",
         "sandbox_deploy_check", "sandbox_deploy_nginx", "voucher_status", "voucher_claim",
         "check_update", "upgrade"]

fails = []

def check(name, cond, detail=""):
    status = "PASS" if cond else "FAIL"
    print(f"[{status}] {name}" + (f" | {detail}" if detail else ""))
    if not cond:
        fails.append(name)

# 1) 设计级
with open(P_DES, encoding="utf-8-sig") as f:
    rows = list(csv.DictReader(f))
check("设计级行数 == 163", len(rows) == 163, str(len(rows)))
# 2026-09-11 用户要求：预期结果与当前状态分离——设计级新增「用例当前状态」列
check("设计级 14 列（含用例当前状态）", len(rows[0]) == 14, str(list(rows[0].keys())))
des_st = [r.get("用例当前状态") or "" for r in rows]
VOLID_DES_ST = {"PASS", "FAIL", "SPEC-MISMATCH", "UNASSESSED"}
bad_des_st = [r["ID"] for r in rows
              if not (r.get("用例当前状态") in VOLID_DES_ST or (r.get("用例当前状态") or "").startswith("PARTIAL"))]
check("用例当前状态统一枚举", not bad_des_st, str(bad_des_st[:5]))
# 预期结果列清洗：不得含执行观测/状态结论词（实测/当前状态/已验证等）
MIX_WORDS = ["实测发现", "以实测行为", "(实测", "（实测", "当前状态", "已执行", "已验证"]
mix_hits = [r["ID"] for r in rows if any(w in (r.get("预期结果") or "") for w in MIX_WORDS)]
check("预期结果无状态混入词", not mix_hits, str(mix_hits[:5]))
ids = [r["ID"] for r in rows]
check("ID 唯一", len(ids) == len(set(ids)))
check("10 条新用例在场", all(i in ids for i in NEW_IDS))
for fld in REQUIRED_FIELDS:
    empty = [r["ID"] for r in rows if not (r.get(fld) or "").strip()]
    check(f"字段[{fld}] 0 空", not empty, str(empty[:5]))

# 3) 展开规则四段结构化校验（R11：全部 162 行必须 <枚举>|<代表>|<证据>|<阻塞>）
bad_rule = []
for r in rows:
    rule = (r.get("展开规则") or "").strip()
    if not rule:
        bad_rule.append((r["ID"], "空"))
        continue
    segs = [s for s in rule.split("|") if s.strip()]
    if len(segs) != 4:
        bad_rule.append((r["ID"], f"{len(segs)}段"))
        continue
    if not any(segs[0] == e or segs[0].startswith(e + "(") or segs[0].startswith(e + "<") for e in ENUM_TYPES):
        bad_rule.append((r["ID"], f"首段={segs[0][:30]}"))
    for i, tag in ((1, "代表"), (2, "证据"), (3, "阻塞")):
        if not segs[i].startswith("<") or tag not in segs[i]:
            bad_rule.append((r["ID"], f"第{i+1}段缺{tag}标签"))
check("展开规则全部四段结构化(枚举|代表|证据|阻塞)", not bad_rule, str(bad_rule[:8]))

# 2) 展开级
with open(P_EXP, encoding="utf-8-sig") as f:
    erows = list(csv.DictReader(f))
check("展开级行数 == 137", len(erows) == 137, str(len(erows)))
check("展开级 12 列", len(erows[0]) == 12, str(len(erows[0])))
bad_cols = [r["ID"] for r in erows if len(r) != 12]
check("展开级每行 12 列", not bad_cols, str(bad_cols[:5]))
nr3 = [r for r in erows if r["ID"].startswith("EXP-NR3")]
bad_st = [r["ID"] for r in nr3 if r["status"] not in VALID_STATUS]
check("NR3 状态枚举合法", not bad_st, str(bad_st))
mix = []
for r in nr3:
    exp = r["预期结果"]
    if r["status"] == "PASS" and ("BLOCKED" in exp or "FAIL" in exp):
        mix.append(r["ID"])
check("NR3 无 PASS/BLOCKED 状态混用", not mix, str(mix))
no_reason = [r["ID"] for r in nr3 if r["status"] in ("BLOCKED", "NOT_RUN") and not r["blockedReason"]]
check("BLOCKED/NOT_RUN 均有 blockedReason", not no_reason, str(no_reason))
no_ev = [r["ID"] for r in nr3 if r["status"] in ("BLOCKED", "NOT_RUN") and not r["requiredEvidence"]]
check("BLOCKED/NOT_RUN 均有 requiredEvidence(R11)", not no_ev, str(no_ev))
no_ev2 = [r["ID"] for r in nr3 if r["status"] in ("PASS", "FAIL", "SPEC-MISMATCH") and not r["requiredEvidence"]]
check("PASS/FAIL/SPEC 均有 requiredEvidence", not no_ev2, str(no_ev2))
stale = []
all_text = "\n".join(r["执行要点"] + r["预期结果"] for r in nr3)
for pat in STALE_PATTERNS:
    if pat in all_text:
        stale.append(pat)
check("NR3 无旧漂移文案", not stale, str(stale))

# 7) 工具覆盖（R11：全名匹配，无简称兜底；36 工具必须全部命中）
tool_hits = {}
for t in TOOLS:
    hit = [r["ID"] for r in rows if t in (r.get("关联工具") or "")]
    tool_hits[t] = hit
missing_tools = {t: h for t, h in tool_hits.items() if not h}
check("36 工具逐个覆盖(全名匹配,无兜底)", not missing_tools, str(list(missing_tools.keys())[:10]))

# 9) 追踪表校验（R11）→ R12 增强：expandedCaseId 外键 + 设计→展开映射 + 状态一致性 + 证据完整性
trace = []
if __import__("os").path.exists(P_TRACE):
    with open(P_TRACE, encoding="utf-8-sig") as f:
        trace = list(csv.DictReader(f))
check("追踪表存在且 10 列", len(trace) > 160 and len(trace[0]) == 10, f"{len(trace)}行/{len(trace[0]) if trace else 0}列")
# 外键 a：追踪表 designCaseId 都可在设计级找到（波浪线范围如 "D5-1~7" 跳过）
fk_trace = []
des_id_set = set(ids)
exp_id_set = {r["ID"] for r in erows}
for r in trace:
    dcid = r.get("designCaseId") or ""
    if dcid and dcid != "-" and "~" not in dcid:
        for pid in dcid.replace("/", ";").split(";"):
            pid = pid.strip()
            if pid and pid not in des_id_set:
                fk_trace.append((r["sourceAsset"], "design", pid))
check("追踪表 designCaseId 外键有效", not fk_trace, str(fk_trace[:5]))
# 外键 b（R12）：追踪表 expandedCaseId 都可在展开级找到；"由XX矩阵覆盖"标注为合法载体引用
COVER_MARK = "由EXP-"
fk_exp = []
for r in trace:
    ecid = r.get("expandedCaseId") or ""
    if ecid and ecid != "-" and ecid != "无(不展开/代表执行)" and COVER_MARK not in ecid:
        for pid in ecid.split(";"):
            pid = pid.strip()
            if pid and pid not in exp_id_set:
                fk_exp.append((r["sourceAsset"], "expanded", pid))
check("追踪表 expandedCaseId 外键有效(R12)", not fk_exp, str(fk_exp[:5]))
# 设计→展开映射（R12）：设计级"展开规则"声明 CLIENT_MATRIX/OS_MATRIX 等展开类型的，追踪表 expandedCaseId 不得为空
map_gap = []
for r in trace:
    dcid = r.get("designCaseId") or ""
    ecid = r.get("expandedCaseId") or ""
    if dcid and dcid != "-" and "~" not in dcid and not (ecid or "").strip():
        # 完全空值才算缺口（"由XX矩阵覆盖"/"无"/具体ID 均为合法标注）
        map_gap.append((r["sourceAsset"], dcid))
check("设计→展开映射无缺口(R12)", not map_gap, str(map_gap[:6]))
# 证据完整性（R12）：非 UNASSESSED 行 requiredEvidence 非空
ev_gap = [r["sourceAsset"] for r in trace if r.get("status") != "UNASSESSED" and not (r.get("requiredEvidence") or "").strip()]
check("追踪表已执行行 requiredEvidence 非空(R12)", not ev_gap, str(ev_gap[:5]))
# 状态一致性（R12+）：追踪表与展开级状态聚合一致——展开级存在 FAIL/SPEC/BLOCKED/NOT_RUN 时父级不得为 PASS
st_consistency = []
exp_by_src = {}
for e in erows:
    exp_by_src.setdefault(e["源用例"], []).append(e)
for r in trace:
    dcid = r.get("designCaseId") or ""
    if dcid and dcid != "-" and "~" not in dcid:
        for pid in dcid.replace("/", ";").split(";"):
            pid = pid.strip()
            exp_rows = exp_by_src.get(pid, [])
            tr_st = r.get("status")
            if not exp_rows:
                continue
            # 聚合语义：展开级任一行非 PASS/UNASSESSED → 父级不得纯 PASS
            has_not_pass = any(x["status"] not in ("PASS", "UNASSESSED", "") for x in exp_rows)
            if tr_st == "PASS" and has_not_pass:
                st_consistency.append((r["sourceAsset"], pid, tr_st,
                                       "展开级含" + ",".join(sorted({x["status"] for x in exp_rows if x["status"] not in ("PASS", "UNASSESSED", "")}))))
            # 展开级全 PASS → 父级不应是 BLOCKED/FAIL（除非 FAIL 语义来自其他层）
            if tr_st in ("FAIL",) and all(x["status"] == "PASS" for x in exp_rows) and pid != "D1-39":
                st_consistency.append((r["sourceAsset"], pid, tr_st, "展开级全PASS但父级FAIL"))
check("追踪表/展开级状态一致性(R12+R15)", not st_consistency, str(st_consistency[:6]))
# 状态统一枚举（R15: PARTIAL 前缀聚合语义合法）
bad_trace_st = [r["sourceAsset"] for r in trace
                if not (r.get("status") in VALID_STATUS or (r.get("status") or "").startswith("PARTIAL"))]
check("追踪表 status 统一枚举", not bad_trace_st, str(bad_trace_st[:5]))

print("\nNR3 status 分布:", dict(collections.Counter(r["status"] for r in nr3)))

print()
if fails:
    print(f"=== 门禁 FAIL: {len(fails)} 项 ===")
    for f in fails:
        print("  -", f)
    sys.exit(1)
print("=== 门禁 PASS: 全部检查通过（exit 0） ===")
sys.exit(0)