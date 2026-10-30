# -*- coding: utf-8 -*-
"""verify_v2.py — v2（2.0.0）契约迁移快照门禁（方案 B，独立于母版 verify_new.py）。

验收目标：gen_matrix_v2.py 产出的 v2.0.0 冻结快照「迁移正确 + 结构完整 + 可复现」。
任一 STRUCT/MIGRATION/REPRO 检查失败 → exit 1（可阻断）；工具覆盖是信息性报告（不 FAIL），
因为补 14 个新工具用例属「源码能力覆盖」专项，不是本轮「契约迁移」的职责。

检查项：
  S1 结构：设计级 212 行 / 27 列 / ID 唯一 / 必填 6 字段 0 空
  S2 结构：展开级 137 行 / 24 列 / 每行 24 列
  M1 迁移：76 条受影响行逐字段 == 候选矩阵（快照正确复刻评审放行件）
  M2 迁移：136 条不受影响行逐字段 == 母版（未误改）
  M3 迁移：展开级 gate 前置 37 行 + 40→56 10 行 + 「40 工具」零残留
  R1 可复现：gen_matrix_v2.py 重跑字节级一致
  I1 报告：快照设计级「关联工具」覆盖 v2 56 工具 N/56（信息性，不 FAIL）

运行：python verify_v2.py    # 迁移/结构/可复现全过 exit 0；工具缺口仅报告
"""
import csv
import hashlib
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))          # test-cases/versions/v2.0.0/
REPO = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))

P_DES = os.path.join(HERE, "用例矩阵-设计级-v2.0.0.csv")
P_EXP = os.path.join(HERE, "用例矩阵-展开级-v2.0.0.csv")
P_CAND = os.path.join(REPO, "reviews", "ITER-006-20261029171721", "hermes", "candidate-matrix.csv")
P_MASTER = os.path.join(REPO, "test-cases", "design", "用例矩阵-设计级.csv")
GEN = os.path.join(HERE, "gen_matrix_v2.py")

REQUIRED_FIELDS = ["前置条件", "测试数据", "操作步骤", "预期结果", "指引来源", "关联工具"]

# v2 56 工具全名（源自 origin/v2: plugins/huaweicloud-core/src/tool-definitions.ts 解析，
# 2026-10-30 核实；v2 正式发 npm 后需复核）
V2_TOOLS = sorted([
    "auth_confirm", "auth_init", "auth_status", "auth_switch", "auth_sync",
    "check_account_type", "check_cli", "check_update", "competition_voucher_claim",
    "detect_framework", "explain_error", "gateway_call", "gateway_list_tools",
    "gateway_restart", "get_regional_availability", "get_service_icon",
    "hook_check_artifacts", "hook_check_command", "hook_check_deploy_plan",
    "list_operations", "list_packs", "list_regions", "list_skills", "obs_set_cors",
    "obs_set_website_config", "pack_info", "packs_configure", "plan_cli_command",
    "retrieve_skill", "run_approved_command", "run_readonly_command", "sandbox_check_user",
    "sandbox_close_session", "sandbox_connect", "sandbox_credentials", "sandbox_deploy_check",
    "sandbox_deploy_nginx", "sandbox_exec_one_shot", "sandbox_exec_with_session",
    "sandbox_expose_tunnel", "sandbox_keepalive_watchdog", "sandbox_renew_tunnel",
    "sandbox_sign_agreement", "sandbox_upload_file", "sandbox_upload_project", "search_docs",
    "search_marketplace", "secret_delete", "secret_list", "secret_set", "service_catalog",
    "setup_obs_config", "show_profile_redacted", "upgrade", "voucher_claim", "voucher_status",
])

fails = []


def check(name, cond, detail=""):
    st = "PASS" if cond else "FAIL"
    print(f"[{st}] {name}" + (f" | {detail}" if detail else ""))
    if not cond:
        fails.append(name)


def _read(p):
    with open(p, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


des = _read(P_DES)
exp = _read(P_EXP)
cand = _read(P_CAND)
master = _read(P_MASTER)
des_by_id = {r["ID"]: r for r in des}
cand_by_id = {r["ID"]: r for r in cand}
master_by_id = {r["ID"]: r for r in master}

# ---- S1 设计级结构 ----
check("设计级行数 == 212", len(des) == 212, str(len(des)))
check("设计级 ID 唯一", len({r['ID'] for r in des}) == len(des))
check("设计级 27 列", len(des[0]) == 27 if des else False, str(list(des[0].keys()) if des else []))
for fld in REQUIRED_FIELDS:
    empty = [r["ID"] for r in des if not (r.get(fld) or "").strip()]
    check(f"设计级字段[{fld}] 0 空", not empty, str(empty[:5]))

# ---- S2 展开级结构 ----
check("展开级行数 == 137", len(exp) == 137, str(len(exp)))
check("展开级 24 列", len(exp[0]) == 24 if exp else False, str(list(exp[0].keys()) if exp else []))
check("展开级每行 24 列", all(len(r) == 24 for r in exp))

# ---- M1 迁移：76 条受影响行逐字段 == 候选矩阵 ----
cols = list(cand_by_id.values())[0].keys()
m1_bad = []
for cid, c in cand_by_id.items():
    s = des_by_id.get(cid)
    if s is None:
        m1_bad.append((cid, "快照缺失"))
        continue
    for k in cols:
        if (s.get(k) or "") != (c.get(k) or ""):
            m1_bad.append((cid, k))
check("76 条受影响行逐字段 == 候选矩阵(正确复刻评审放行件)",
      len(cand_by_id) == 76 and not m1_bad, str(m1_bad[:5]))

# ---- M2 迁移：136 条不受影响行逐字段 == 母版 ----
unaffected_ids = [i for i in master_by_id if i not in cand_by_id]
m2_bad = []
for cid in unaffected_ids:
    s = des_by_id.get(cid)
    if s is None:
        m2_bad.append((cid, "快照缺失"))
        continue
    for k in master_by_id[cid]:
        if (s.get(k) or "") != (master_by_id[cid].get(k) or ""):
            m2_bad.append((cid, k))
check("136 条不受影响行逐字段 == 母版(未误改)", len(unaffected_ids) == 136 and not m2_bad,
      str(m2_bad[:5]))

# ---- M3 展开级迁移 ----
exp_gate = [r for r in exp if r["展开类型"] in ("D10评测集", "D3-C4服务矩阵")]
check("展开级 gate 实质承载行(37)均含「⓪建立 vendor 确认」",
      len(exp_gate) == 37 and all("⓪建立 vendor 确认" in (r["执行要点"] or "") for r in exp_gate),
      f"{len(exp_gate)}行")
res40 = [r["ID"] for r in exp if "40 工具" in (r["执行要点"] or "") + (r["预期结果"] or "")]
check("展开级「40 工具」零残留", not res40, str(res40[:5]))
res56 = [r["ID"] for r in exp if "56 工具" in (r["预期结果"] or "")]
check("展开级 toolcount 行含 56 工具(10 行)", len(res56) == 10, str(len(res56)))

# ---- R1 可复现：重跑 gen_matrix_v2.py 后字节级一致 ----
def _sha256(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        h.update(f.read())
    return h.hexdigest()


h_des_before, h_exp_before = _sha256(P_DES), _sha256(P_EXP)
r1 = subprocess.run([sys.executable, GEN], cwd=HERE, capture_output=True, text=True)
if r1.returncode != 0:
    check("gen_matrix_v2 可复现(重跑 exit 0)", False, r1.stderr[:300])
else:
    h_des_after, h_exp_after = _sha256(P_DES), _sha256(P_EXP)
    check("gen_matrix_v2 可复现(重跑字节级一致)",
          h_des_before == h_des_after and h_exp_before == h_exp_after,
          f"design {h_des_before[:8]}=={h_des_after[:8]}; expanded {h_exp_before[:8]}=={h_exp_after[:8]}")

# ---- I1 工具覆盖信息性报告（不 FAIL）----
covered = set()
for r in des:
    for t in re.split(r"[,;/\s]+", r["关联工具"] or ""):
        t = t.strip()
        if t:
            covered.add(t.replace("huaweicloud_", "", 1))
missing_v2 = sorted(set(V2_TOOLS) - covered)
print(f"\n[INFO] v2 工具覆盖 {len(covered & set(V2_TOOLS))}/56（剩余 14 = 独立 source-coverage 专项待办，非本轮契约迁移职责）")
print(f"[INFO] 未覆盖工具: {missing_v2}")

print()
if fails:
    print(f"=== verify_v2 门禁 FAIL: {len(fails)} 项 ===")
    for f in fails:
        print("  -", f)
    sys.exit(1)
print("=== verify_v2 门禁 PASS: 迁移/结构/可复现全部通过（exit 0） ===")
sys.exit(0)