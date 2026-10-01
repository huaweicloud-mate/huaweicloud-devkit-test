# -*- coding: utf-8 -*-
"""Hermes Linux 2026-10-02 每日测试：证据分发（stdout.txt）+ 回填三 CSV（v1.1.8-next.1 预发布 gitHead ffd7b474）。"""
import os, re, shutil, csv
from collections import Counter
from datetime import datetime, timezone, timedelta

BASE = os.path.dirname(os.path.abspath(__file__))
EVID = os.path.join(BASE, "evidence")
P = os.path.join(EVID, "_probes")
BJT = timezone(timedelta(hours=8))
TS = datetime.now(BJT).strftime("%Y%m%d%H%M%S")

def read(n):
    with open(os.path.join(P, n), encoding="utf-8") as f:
        return f.read()

def write_case(cid, content, probe_src=None, probe_name="probe.mjs"):
    d = os.path.join(EVID, cid)
    os.makedirs(d, exist_ok=True)
    # 证据落盘用 stdout.txt（.gitignore 排除 *.log，stdout.log 不会 push 远端）
    with open(os.path.join(d, "stdout.txt"), "w", encoding="utf-8") as f:
        f.write(content)
    if probe_src and os.path.isfile(os.path.join(P, probe_src)):
        shutil.copy2(os.path.join(P, probe_src), os.path.join(d, probe_name))

def append_case(cid, content):
    d = os.path.join(EVID, cid)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "stdout.txt"), "a", encoding="utf-8") as f:
        f.write(content)

def split_sections(text):
    out = {}
    for m in re.finditer(r"=====CASE ([^\n]+)=====\n(.*?)\n=====END \1=====", text, re.S):
        out[m.group(1)] = m.group(2).rstrip("\n") + "\n"
    return out

def distribute(logfile, probe_src, mapping, probe_name="probe.mjs"):
    secs = split_sections(read(logfile))
    for cid in mapping:
        if cid in secs:
            write_case(cid, secs[cid], probe_src, probe_name)
        else:
            print(f"  [WARN] {cid} 段未找到于 {logfile}")

# ===== 1. 分发证据 =====
print("== classify (D4-1/2/3/15/16) ==")
distribute("classify.log", "classify-probe.mjs", ["D4-1","D4-2","D4-3","D4-15","D4-16"])
print("== hook (D4-5/7/9/21/22) ==")
distribute("hook.log", "hook-probe.mjs", ["D4-5","D4-7","D4-9","D4-21","D4-22"])
print("== auth (D2-4/11/12) ==")
distribute("auth.log", "auth-probe.mjs", ["D2-4","D2-11","D2-12"])
print("== protocol (D5-3/D9-*) ==")
distribute("protocol.log", "protocol-probe.mjs", ["D5-3","D9-1","D9-2","D9-3","D9-4","D9-5","D9-7","D9-8"])
print("== extended (D2-16/D9-9/D1-41) ==")
distribute("extended.log", "extended-probe.mjs", ["D2-16","D9-9","D1-41"])
print("== d4-8 ==")
distribute("d4-8.log", "d4-8-probe.sh", ["D4-8"], probe_name="probe.sh")
print("== D4-21 hcl 补充 ==")
append_case("D4-21", "\n===== hcl-probe 补充 =====\n" + read("hcl-probe.log"))
shutil.copy2(os.path.join(P, "hcl-probe.mjs"), os.path.join(EVID, "D4-21", "hcl-probe.mjs"))
print("== D4-16 wrap 补充 ==")
append_case("D4-16", "\n===== wrap-probe 补充 =====\n" + read("wrap-probe.log"))
shutil.copy2(os.path.join(P, "wrap-probe.mjs"), os.path.join(EVID, "D4-16", "wrap-probe.mjs"))
print("== d8 (D8-7 七技能合并) ==")
d8secs = split_sections(read("d8.log"))
write_case("D8-7", "".join(d8secs.get(k, "") for k in sorted(d8secs)) + "\n=== DONE ===\n", "d8-probe.mjs")
print("== D1 安装域 (按 STEP 切片) ==")
d1 = read("d1.log")
def slice_steps(text, s, e=None):
    i = text.find(s)
    if i < 0: return ""
    j = text.find(e) if e else len(text)
    return text[i:j]
for cid, content in [("D1-3", slice_steps(d1, "########## STEP 1", "########## STEP 3")),
                     ("D1-4", slice_steps(d1, "########## STEP 3", "########## STEP 4"))]:
    write_case(cid, content, "d1-probe.sh", "probe.sh")
print("== supplement (16 用例) ==")
distribute("supplement.log", "supplement-probe.mjs",
           ["D1-26","D1-27","D2-2","D2-5","D3-A1","D3-B1","D3-B3","D3-B5","D3-C5","D4-4","D4-6","D4-11","D4-17","D6-1","D6-3","D6-4"])
print("== supplement-import (D1-30/D4-10) ==")
distribute("supplement-import.log", "supplement-import.mjs", ["D1-30","D4-10"])
print("== updatecheck (D1-28/31/33) ==")
for cid in ["D1-28","D1-31","D1-33"]:
    write_case(cid, read("updatecheck.log"), "updatecheck-probe.mjs")
print("== disttags (EXP-NR3-10) ==")
write_case("EXP-NR3-10", read("disttags.log"), "disttags-probe.mjs")
print("== D5-1 ==")
write_case("D5-1", read("d5-1.log"), "D5-1-probe.mjs")
print("== D1-40 / D1-42 / D1-45 / D4-6(source) / D2-26 / D4-27 ==")
for cid, log, src in [("D1-40","d1-40.log","D1-40-probe.mjs"),("D1-42","d1-42.log","D1-42-probe.mjs"),
                      ("D1-45","d1-45.log","D1-45-probe.mjs"),
                      ("D2-26","d2-26.log","D2-26-probe.mjs"),("D4-27","d4-27.log","D4-27-probe.mjs")]:
    write_case(cid, read(log), src)
# D4-6：源码级脱敏证据（redactSecrets adminPass）+ supplement MCP 层 hook 证据
write_case("D4-6", read("d4-6.log"), "D4-6-probe.mjs")
append_case("D4-6", "\n===== supplement MCP hook 层 =====\n" + split_sections(read("supplement.log")).get("D4-6",""))
print("== D10-3 routing + eval harness ==")
write_case("D10-3", read("routing.log") + "\n===== eval-harness =====\n" + read("eval-harness.log"), "routing-probe.mjs")
print("== EXP-E08 diagnostic ==")
write_case("EXP-E08", read("exp-e08.log"), "EXP-E08-probe.mjs")
print("== D9-12 / D9-13 ==")
write_case("D9-12", read("d9-12.log"), "D9-12-probe.mjs")
write_case("D9-13", read("d9-13.log"), "D9-13-probe.mjs")
print("== new-env (D1-65/66/67/68) ==")
distribute("new-env.log", "new-env-probe.mjs", ["D1-65","D1-66","D1-67","D1-68"])
print("== new-config (D2-27/D1-70/D8-9/D8-10/D6-9) ==")
distribute("new-config.log", "new-config-probe.mjs", ["D2-27","D1-70","D8-9","D8-10","D6-9"])
print("== new-safety (D10-4/D4-26/D4-29/D4-28/D4-25) ==")
distribute("new-safety.log", "new-safety-probe.mjs", ["D10-4","D4-26","D4-29","D4-28","D4-25"])
print("== new-mcp (D9-10/D9-11) ==")
distribute("new-mcp.log", "new-mcp-probe.mjs", ["D9-10","D9-11"])
print("== new-cli (D1-69) ==")
distribute("new-cli.log", "new-cli-probe.mjs", ["D1-69"])
print("== new-scenario (D3-S1/S5/S8) ==")
distribute("new-scenario.log", "new-scenario-probe.mjs", ["D3-S1","D3-S5","D3-S8"])
print("== new-cloud (D3-S2/C13/C14/S4/S3) ==")
distribute("new-cloud.log", "new-cloud-probe.mjs", ["D3-S2","D3-C13","D3-C14","D3-S4","D3-S3"])
print("== new-fg-rds (D3-S6/S7) ==")
distribute("new-fg-rds.log", "new-fg-rds-probe.mjs", ["D3-S6","D3-S7"])
print("== D8-10 merge 补充 ==")
append_case("D8-10", "\n===== merge-probe 补充 =====\n" + read("merge.log"))
shutil.copy2(os.path.join(P, "merge-probe.mjs"), os.path.join(EVID, "D8-10", "merge-probe.mjs"))

print("== realcloud / D4-13 / D4-23 (已有 stdout.txt + probe.mjs) ==")
write_case("_baseline", "huaweicloud-devkit v1.1.8-next.1\ngitHead ffd7b474\n", None)
print("  _baseline: v1.1.8-next.1 (gitHead ffd7b474)")

# ===== 2. 回填 CSV =====
PASS_D = [
    "D1-3","D1-4","D1-26","D1-27","D1-28","D1-30","D1-31","D1-33",
    "D1-40","D1-41","D1-42","D1-45","D1-65","D1-66","D1-67","D1-68","D1-69","D1-70",
    "D2-1","D2-2","D2-4","D2-5","D2-11","D2-12","D2-16","D2-26","D2-27",
    "D3-A1","D3-B1","D3-B3","D3-B5","D3-C4","D3-C5","D3-C13","D3-C14",
    "D3-S1","D3-S2","D3-S3","D3-S4","D3-S8",
    "D4-1","D4-3","D4-4","D4-5","D4-7","D4-8","D4-9","D4-10","D4-11","D4-13","D4-14",
    "D4-15","D4-16","D4-18","D4-19","D4-20","D4-22","D4-23","D4-27","D4-28","D4-29",
    "D5-1","D5-3","D6-1","D6-3","D6-4","D6-9","D8-7","D8-10",
    "D9-1","D9-2","D9-3","D9-4","D9-5","D9-7","D9-8","D9-10","D9-11","D9-13",
]

FAIL_D = {
    "D4-2":  "env | grep -i access_key 未拦截（generic access_key 无云前缀）",
    "D4-6":  "hook_check_command(--admin-pass) 返回 allow 未告警",
    "D4-17": "hook 模糊输入 fail-open（&& rm -rf /、$(curl|sh) 放行）",
    "D4-21": "hook_check_artifacts 未拦截 HCL actions=[*] / AdministratorFullAccess",
    "D4-25": "Python hook 写操作遥测误分类 cli:invoke（应 cli:write）",
    "D4-26": "findings.evidence JSON 带引号 key 明文 secret_key/adminPass 泄漏",
    "D3-S5": "serviceCatalog 复合意图未命中多 service（回退 help）",
    "D3-S6": "FunctionGraph CreateFunction 返回 code.filename 参数错误，未生成 URN/触发器",
    "D3-S7": "RDS 复合意图部署目标未命中 + CreateInstance 缺 vpc/subnet/sg 前置（Invalid parameter: db.port）",
    "D9-12": "initialize 版本检查缺失 + 非法时序 tools/list 未拒 -32600",
    "D10-3": "serviceCatalog 中文意图 EXP-E01 未命中（92.9% 未达 100%）",
}

SPEC_D = {
    "D8-9":  "sanitizeValue 未脱敏 AK/SK/token 敏感值（契约漂移）",
    "D9-9":  "capabilities.cancellation 未声明（契约漂移）",
    "D10-4": "规则库由 16 条(9deny+7warn) 增至 19 条(9deny+10warn)，用例断言漂移",
}

BLOCKED_D = {
    "D2-10": "【补环境】R7 current 档跟随需 KooCLI 多 profile 夹具（current=deploy 切换）",
    "D2-13": "【补环境】R9 configuredBySession 优先 env 需隔离 S1 + HW_ACCESS_KEY env 夹具（会污统一账号凭证库）",
    "D4-12": "【补环境】供应链安装期安全需 npm 安装期抓包/SBOM 审计通道",
    "D4-24": "【补环境】确认令牌过期/重复确认边界需审批流 + 可注入时钟",
    "D9-6":  "【调归属】跨客户端互通需多客户端并存环境（单机仅 Hermes）",
}

NOTRUN_D = {
    "D1-39": "【调归属】Windows 升级检测链 EINVAL 专属（OS 列标注「专属」）；Linux 侧由 EXP-NR3-10(disttags 探针)代表覆盖",
    "D8-1":  "【改用例】文档与能力一致需白盒 docs 全量比对，本轮未覆盖",
    "D8-4":  "【改用例】引导步骤可机械执行需逐条核验 getting-started 步骤，本轮未覆盖",
    "D8-6":  "【改用例】中英文文档一致需中英双源逐段比对，本轮未覆盖",
}

DESIGN = {}
for c in PASS_D:
    DESIGN[c] = ("PASS", f"evidence/{c}", "")
# 真云/审批流用例共用 realcloud-probe 证据（单条 stdout.txt 覆盖 D2-1/D3-C4/D4-14/D4-18/19/20）
for c in ["D2-1", "D3-C4", "D4-14", "D4-18", "D4-19", "D4-20"]:
    DESIGN[c] = ("PASS", "evidence/realcloud-probe", "")
for c, br in FAIL_D.items():
    DESIGN[c] = ("FAIL", f"evidence/{c}", "")
for c, br in SPEC_D.items():
    DESIGN[c] = ("SPEC-MISMATCH", f"evidence/{c}", "")
for c, br in BLOCKED_D.items():
    DESIGN[c] = ("BLOCKED", "", br)
for c, br in NOTRUN_D.items():
    DESIGN[c] = ("NOT_RUN", "", br)

EXPANDED = {}
EXPANDED["EXP-D5-8-1"] = ("PASS", "evidence/D5-1", "")
EXPANDED["EXP-D5-8-3"] = ("PASS", "evidence/D5-3", "")
for i in range(1, 23):
    EXPANDED[f"EXP-C4-{i:02d}"] = ("PASS", "evidence/realcloud-probe", "")
for c in ["EXP-E02","EXP-E03","EXP-E04","EXP-E05","EXP-E06","EXP-E07","EXP-E09","EXP-E10","EXP-E11","EXP-E12","EXP-E13","EXP-E14","EXP-E15"]:
    EXPANDED[c] = ("PASS", "evidence/D10-3", "")
EXPANDED["EXP-E08"] = ("PASS", "evidence/EXP-E08", "")
EXPANDED["EXP-E01"] = ("FAIL", "evidence/D10-3", "")
EXPANDED["EXP-NR3-02"] = ("PASS", "evidence/D1-27", "")
EXPANDED["EXP-NR3-04"] = ("PASS", "evidence/D1-42", "")
EXPANDED["EXP-NR3-10"] = ("PASS", "evidence/EXP-NR3-10", "")
EXPANDED["EXP-NR3-24"] = ("PASS", "evidence/D1-45", "")

def rewrite(path, mapping, id_col="ID"):
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    fields = list(rows[0].keys())
    for r in rows:
        cid = (r.get(id_col) or "").strip()
        if cid in mapping:
            st, ev, br = mapping[cid]
            r["执行状态"] = st
            r["执行时间"] = TS if st != "NOT_RUN" else ""
            r["evidencePath"] = ev
            if "blockedReason" in fields:
                r["blockedReason"] = br if st == "BLOCKED" else ""
        else:
            r["执行状态"] = "NOT_RUN"
            r["执行时间"] = ""
            r["evidencePath"] = ""
            if "blockedReason" in fields:
                r["blockedReason"] = "本轮未覆盖（映射缺失）"
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader(); w.writerows(rows)
    return rows

drows = rewrite(os.path.join(BASE, "用例矩阵-设计级.csv"), DESIGN)
erows = rewrite(os.path.join(BASE, "用例矩阵-展开级.csv"), EXPANDED)

tpath = os.path.join(BASE, "需求-设计-证据追踪表.csv")
with open(tpath, encoding="utf-8-sig") as f:
    trows = list(csv.DictReader(f))
tfields = list(trows[0].keys())
covered = set(DESIGN.keys()) | set(EXPANDED.keys())
n = 0
for r in trows:
    cid = (r.get("designCaseId") or "").strip()
    ecid = (r.get("expandedCaseId") or "").strip()
    if (cid in DESIGN) or (ecid in EXPANDED):
        r["执行时间"] = TS; n += 1
with open(tpath, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=tfields); w.writeheader(); w.writerows(trows)

c1 = Counter((x.get("执行状态") or "").strip() for x in drows)
c2 = Counter((x.get("执行状态") or "").strip() for x in erows)
print(f"\n时间戳: {TS}")
print(f"设计级 {len(drows)} 行: {dict(c1)}")
print(f"展开级 {len(erows)} 行: {dict(c2)}")
print(f"追踪表 {len(trows)} 行, 回填执行时间 {n} 行")
missing_d = [r["ID"] for r in drows if not (r.get("执行状态") or "").strip()]
print("设计级缺失状态行:", missing_d)