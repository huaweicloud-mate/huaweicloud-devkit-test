# -*- coding: utf-8 -*-
"""R11-6: 设计矩阵门禁审计脚本（Codex round-10 P1-5 增强版）
作为测试设计门禁使用：任一检查失败 → 非零退出码（CI/闭环可阻断）。
检查项：
  1. 设计级行数 == 163、ID 唯一
  2. 必填字段（前置/测试数据/步骤/预期/指引/关联工具）0 空
  3. 展开规则 0 空 + 全部四段结构化（枚举类型|代表|证据|阻塞）
  4. 展开级保留旧 12 列并追加规范化状态/终端字段、每行列数一致
  5. NR3 状态枚举合法（PASS/FAIL/BLOCKED/SPEC-MISMATCH/NOT_RUN/UNASSESSED），无状态混用
  6. BLOCKED/NOT_RUN 必须有 blockedReason + requiredEvidence；PASS/FAIL/SPEC 必须有 requiredEvidence
  7. 工具全集覆盖审计（由 tools.mjs 机器推导，全名匹配，无简称兜底）
  8. NR3 旧漂移文案检测
  9. 追踪表保留原字段并追加 design_status/execution_status + ID 外键校验 + 状态一致性
运行：python verify_new.py   # 全部通过退出 0，任一失败退出 1
"""
import csv
import collections
import hashlib
import os
import re
import subprocess
import sys
import tempfile

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
P_DES = os.path.join(REPO_ROOT, 'test-cases', 'design', '用例矩阵-设计级.csv')
P_EXP = os.path.join(REPO_ROOT, 'test-cases', 'expanded', '用例矩阵-展开级.csv')
P_TRACE = os.path.join(REPO_ROOT, 'test-cases', 'tracing', '需求-设计-证据追踪表.csv')
REQUIRED_FIELDS = ["前置条件", "测试数据", "操作步骤", "预期结果", "指引来源", "关联工具"]
NEW_IDS = ["D1-56", "D1-57", "D1-58", "D2-21", "D3-C7", "D3-C8", "D3-C9", "D4-24", "D6-8", "D9-9"]
VALID_STATUS = {"PASS", "FAIL", "BLOCKED", "SPEC-MISMATCH", "NOT_RUN", "UNASSESSED", "PARTIAL"}
ENUM_TYPES = ("COMMON", "CLIENT_MATRIX", "OS_MATRIX", "AGENT_E2E", "CROSS_PROCESS")
STALE_PATTERNS = ["无 Linux 测试机可用", "SSH 无凭据不可达", "WSL 无发行版"]

def _resolve_tools_mjs():
    """解析被测项目 tools.mjs 注册源（P1 可移植门禁）：
    优先 env HUAWEICLOUD_DEVKIT_HOME，其次与测试仓相邻的 ../hdk（仓库约定）。
    返回 (绝对路径, 来源标签)；解析不到返回 (None, "")，由调用方明确 BLOCKED。"""
    hdk = os.environ.get("HUAWEICLOUD_DEVKIT_HOME")
    cands = []
    if hdk:
        cands.append(("env HUAWEICLOUD_DEVKIT_HOME",
                      os.path.join(hdk, "plugins", "huaweicloud-core", "src", "tools.mjs")))
    cands.append(("sibling ../hdk",
                  os.path.normpath(os.path.join(REPO_ROOT, "..", "hdk", "plugins", "huaweicloud-core", "src", "tools.mjs"))))
    for tag, p in cands:
        if os.path.isfile(p):
            return p, tag
    return None, ""

TOOLS_MJS, TOOLS_MJS_SRC = _resolve_tools_mjs()
if not TOOLS_MJS:
    print("[BLOCKED] ENV_MISSING：无法定位被测项目 tools.mjs（优先设 HUAWEICLOUD_DEVKIT_HOME，或把 hdk 放在测试仓相邻目录 ../hdk）")
    sys.exit(2)
print(f"[INFO] 工具注册源({TOOLS_MJS_SRC}) = {TOOLS_MJS}")

def _canonical_tools():
    """从被测项目 tools.mjs 的 TOOL_DEFINITIONS 正式注册数组推导唯一工具全集。
    限制匹配范围在注册数组内，且只接受 huaweicloud_ 前缀的 name（拒绝 schema/辅助配置同名字符串误计）；去重保序。
    数量由注册源计算，39 仅为当前快照。"""
    names = []
    with open(TOOLS_MJS, encoding="utf-8") as f:
        text = f.read()
    m = re.search(r"\bTOOL_DEFINITIONS\s*=\s*\[", text)
    if not m:
        return names
    # 括号深度扫描确定数组闭合位置（含嵌套对象/字符串），避免正则越界
    i = m.end() - 1
    depth = 0
    quote = None
    while i < len(text):
        c = text[i]
        if quote:
            if c == quote and text[i - 1] != '\\':
                quote = None
        elif c in "'\"`":
            quote = c
        elif c == '[':
            depth += 1
        elif c == ']':
            depth -= 1
            if depth == 0:
                break
        i += 1
    body = text[m.end():i]
    for n in re.findall(r"\bname:\s*['\"]([a-z_0-9]+)['\"]", body):
        if not n.startswith("huaweicloud_"):
            continue
        sn = n[len("huaweicloud_"):]
        if sn and sn not in names:
            names.append(sn)
    return names

TOOLS = _canonical_tools()
print(f"[INFO] 工具全集 = {len(TOOLS)} 个")

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
check("设计级含设计/执行状态与终端字段", len(rows[0]) == 31, str(list(rows[0].keys())))
DESIGN_META_FIELDS = ["设计状态", "执行状态", "终端覆盖类型", "terminal", "agent", "OS", "Node/npm",
                      "shell", "TTY", "installLayout", "mcpTransport", "hookSupport",
                      "requiredEvidence", "blockedReason", "owner", "依赖"]
for fld in DESIGN_META_FIELDS:
    empty = [r["ID"] for r in rows if not (r.get(fld) or "").strip()
             and fld not in {"blockedReason"}]
    check(f"设计字段[{fld}] 0 空", not empty, str(empty[:5]))
check("设计状态均为 DESIGN_COVERED", all(r.get("设计状态") == "DESIGN_COVERED" for r in rows))
check("UNASSESSED 与执行 NOT_RUN 分离",
      all((r.get("用例当前状态") != "UNASSESSED") or (r.get("执行状态") == "NOT_RUN") for r in rows))
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
check("展开级含规范化状态/终端字段", len(erows[0]) == 29, str(len(erows[0])))
bad_cols = [r["ID"] for r in erows if len(r) != 29]
check("展开级每行 29 列", not bad_cols, str(bad_cols[:5]))
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

# 7) 工具覆盖（36/37 口径收敛：由 tools.mjs 唯一全集推导，全名 token 匹配，无简称兜底）
check("工具全集(tools.mjs)解析非空", len(TOOLS) > 0, f"{len(TOOLS)} 个")
def _covered_short_names(assoc):
    toks = set()
    for t in re.split(r"[,;/\s]+", assoc or ""):
        t = t.strip()
        if t:
            toks.add(t.replace("huaweicloud_", "", 1))
    return toks
covered = set()
for r in rows:
    covered |= _covered_short_names(r.get("关联工具") or "")
missing_tools = [t for t in TOOLS if t not in covered]
check(f"{len(TOOLS)} 工具逐个覆盖(全名匹配,由 tools.mjs 推导)", not missing_tools, str(missing_tools))

# 9) 追踪表校验（R11）→ R12 增强：expandedCaseId 外键 + 设计→展开映射 + 状态一致性 + 证据完整性
trace = []
if __import__("os").path.exists(P_TRACE):
    with open(P_TRACE, encoding="utf-8-sig") as f:
        trace = list(csv.DictReader(f))
check("追踪表存在且含状态分离字段",
      len(trace) > 160 and len(trace[0]) == 13 and
      "design_status" in trace[0] and "execution_status" in trace[0] and "evidencePath" in trace[0],
      f"{len(trace)}行/{len(trace[0]) if trace else 0}列")
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

# 10) 生成脚本可复现（只读校验：在临时目录生成候选 CSV 后与正式真源字节对比，不覆盖正式真源）
def _sha256(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        h.update(f.read())
    return h.hexdigest()

with tempfile.TemporaryDirectory(prefix="hdverify-") as _tmp:
    _gen_env = dict(os.environ)
    _gen_env["HUAWEICLOUD_TESTCASES_DIR"] = os.path.join(_tmp, "test-cases")
    _r1 = subprocess.run([sys.executable, os.path.join(REPO_ROOT, "test-cases", "design", "gen_matrix.py")],
                         cwd=REPO_ROOT, capture_output=True, text=True, env=_gen_env)
    _r2 = subprocess.run([sys.executable, os.path.join(REPO_ROOT, "test-cases", "design", "gen_tracing.py")],
                         cwd=REPO_ROOT, capture_output=True, text=True, env=_gen_env)
    _formal = {"设计级": P_DES, "展开级": P_EXP, "追踪表": P_TRACE}
    _cand = {
        "设计级": os.path.join(_tmp, "test-cases", "design", "用例矩阵-设计级.csv"),
        "展开级": os.path.join(_tmp, "test-cases", "expanded", "用例矩阵-展开级.csv"),
        "追踪表": os.path.join(_tmp, "test-cases", "tracing", "需求-设计-证据追踪表.csv"),
    }
    if _r1.returncode != 0 or _r2.returncode != 0:
        check("生成脚本可复现(临时目录只读比较)", False,
              f"GENERATION_CHECK_FAILED: gen_matrix exit {_r1.returncode}; gen_tracing exit {_r2.returncode}")
    else:
        _drift = [k for k in ("设计级", "展开级", "追踪表")
                  if not os.path.isfile(_cand[k]) or _sha256(_cand[k]) != _sha256(_formal[k])]
        check("生成脚本可复现(临时目录只读比较，不覆盖正式真源)", not _drift, str(_drift))

print()
if fails:
    print(f"=== 门禁 FAIL: {len(fails)} 项 ===")
    for f in fails:
        print("  -", f)
    sys.exit(1)
print("=== 门禁 PASS: 全部检查通过（exit 0） ===")
sys.exit(0)
