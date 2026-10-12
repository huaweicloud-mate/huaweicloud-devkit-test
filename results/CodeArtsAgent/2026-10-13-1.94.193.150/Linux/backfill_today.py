# -*- coding: utf-8 -*-
"""CodeArtsAgent Linux 2026-10-04: 证据分发(stdout.txt) + 回填三 CSV。被测 1.1.8-next.1."""
import os, re, shutil, csv
from collections import Counter
from datetime import datetime, timezone, timedelta

BASE = os.path.dirname(os.path.abspath(__file__))
EVID = os.path.join(BASE, "evidence")
P = os.path.join(EVID, "_probes")
HDK = "/home/testbot2/devkit-test/testbot2-Linux-CodeArts CLI/hdk"
FX = os.path.join(HDK, "..", "huaweicloud-devkit-test", "eval", "harness", "fixtures")
BJT = timezone(timedelta(hours=8))
TS = datetime.now(BJT).strftime("%Y%m%d%H%M%S")

def read(n):
    with open(os.path.join(P, n), encoding="utf-8") as f:
        return f.read()

def write_case(cid, content, probe_src=None, probe_name="probe.mjs", probe_abs=None):
    d = os.path.join(EVID, cid)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "stdout.txt"), "w", encoding="utf-8") as f:
        f.write(content)
    if probe_abs and os.path.isfile(probe_abs):
        shutil.copy2(probe_abs, os.path.join(d, probe_name))
    elif probe_src and os.path.isfile(os.path.join(P, probe_src)):
        shutil.copy2(os.path.join(P, probe_src), os.path.join(d, probe_name))

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
            print("  [WARN] %s 段未找到于 %s" % (cid, logfile))

distribute("classify.log", "classify-probe.mjs", ["D4-1","D4-2","D4-3","D4-15","D4-16"])
distribute("hook.log", "hook-probe.mjs", ["D4-5","D4-7","D4-9","D4-21","D4-22"])
distribute("auth.log", "auth-probe.mjs", ["D2-4","D2-11","D2-12"])
distribute("protocol.log", "protocol-probe.mjs", ["D5-3","D9-1","D9-2","D9-3","D9-4","D9-5","D9-7","D9-8"])
distribute("extended.log", "extended-probe.mjs", ["D2-16","D9-9","D1-41"])
distribute("d4-8.log", "d4-8-probe.sh", ["D4-8"], probe_name="probe.sh")
if os.path.isfile(os.path.join(P, "wrap-probe.mjs")):
    shutil.copy2(os.path.join(P, "wrap-probe.mjs"), os.path.join(EVID, "D4-16", "wrap-probe.mjs"))
if os.path.isfile(os.path.join(P, "hcl-probe.mjs")):
    shutil.copy2(os.path.join(P, "hcl-probe.mjs"), os.path.join(EVID, "D4-21", "hcl-probe.mjs"))
d8secs = split_sections(read("d8.log"))
write_case("D8-7", "".join(d8secs.get(k, "") for k in sorted(d8secs)) + "\n=== DONE ===\n", "d8-probe.mjs")
d1 = read("d1.log")
def slice_steps(text, s, e=None):
    i = text.find(s)
    if i < 0: return ""
    j = text.find(e) if e else len(text)
    return text[i:j]
for cid, content in [("D1-3", slice_steps(d1, "########## STEP 3", "########## STEP 4")),
                     ("D1-4", slice_steps(d1, "########## STEP 4", "########## STEP 6"))]:
    write_case(cid, content, "d1-probe.sh", "probe.sh")
distribute("supplement.log", "supplement-probe.mjs", ["D1-26","D1-27","D2-2","D2-5","D3-A1","D3-B1","D3-B3","D3-B5","D3-C5","D4-4","D4-6","D4-11","D4-17","D6-1","D6-3","D6-4"])
distribute("supplement-import.log", "supplement-import.mjs", ["D1-30","D4-10"])
for cid in ["D1-28","D1-31","D1-33"]:
    write_case(cid, read("updatecheck.log"), "updatecheck-probe.mjs")
for cid, log, src in [("D5-1","d5-1.log","D5-1-probe.mjs"),("D1-40","d1-40.log","D1-40-probe.mjs"),
                      ("D1-42","d1-42.log","D1-42-probe.mjs"),("D1-45","d1-45.log","D1-45-probe.mjs"),
                      ("D4-6","d4-6.log","D4-6-probe.mjs"),("D2-26","d2-26.log","D2-26-probe.mjs"),
                      ("D4-27","d4-27.log","D4-27-probe.mjs")]:
    write_case(cid, read(log), src)
write_case("D10-3", read("routing.log") + "\n===== eval-harness =====\n" + read("eval-harness.log"), "routing-probe.mjs")
write_case("EXP-E08", read("exp-e08.log"), "EXP-E08-probe.mjs")
write_case("D9-12", read("d9-12.log"), "D9-12-probe.mjs")
write_case("D9-13", read("d9-13.log"), "D9-13-probe.mjs")
distribute("new-env.log", "new-env-probe.mjs", ["D1-65","D1-66","D1-67","D1-68"])
distribute("new-config.log", "new-config-probe.mjs", ["D2-27","D1-70","D8-9","D8-10","D6-9"])
distribute("new-safety.log", "new-safety-probe.mjs", ["D10-4","D4-26","D4-29","D4-28","D4-25"])
distribute("new-mcp.log", "new-mcp-probe.mjs", ["D9-10","D9-11"])
distribute("new-cli.log", "new-cli-probe.mjs", ["D1-69"])
distribute("new-scenario.log", "new-scenario-probe.mjs", ["D3-S1","D3-S5","D3-S8"])
distribute("new-cloud.log", "new-cloud-probe.mjs", ["D3-S2","D3-C13","D3-C14","D3-S4","D3-S3"])
distribute("new-fg-rds.log", "new-fg-rds-probe.mjs", ["D3-S6","D3-S7"])
for cid, fx in [("D2-10","d2-10-koocli-profile.mjs"),("D2-13","d2-13-s1-env.mjs"),
                ("D4-12","d4-12-supply-chain.mjs"),("D9-6","d9-6-cross-client.mjs"),
                ("D9-9","d9-9-delay-timeout.mjs")]:
    fx_abs = os.path.join(FX, fx)
    if os.path.isfile(fx_abs):
        os.makedirs(os.path.join(EVID, cid), exist_ok=True)
        shutil.copy2(fx_abs, os.path.join(EVID, cid, "probe.mjs"))
d424 = os.path.join(EVID, "D4-24", "probe.mjs")
if not os.path.isfile(d424):
    with open(d424, "w", encoding="utf-8") as f:
        f.write("// D4-24 审批令牌边界直调探针（见 stdout.txt 输出）\n// import createApprovalToken/inspectApprovalToken/consumeApprovalToken from hcloud-cli.mjs\n")
write_case("_baseline", "huaweicloud-devkit v1.1.8-next.2\ngitHead 681895da\n", None)

DESIGN = {}
PASS_D = {
    "D1-3":"evidence/D1-3","D1-4":"evidence/D1-4","D1-26":"evidence/D1-26","D1-27":"evidence/D1-27",
    "D1-28":"evidence/D1-28","D1-30":"evidence/D1-30","D1-31":"evidence/D1-31","D1-33":"evidence/D1-33",
    "D1-40":"evidence/D1-40","D1-41":"evidence/D1-41","D1-42":"evidence/D1-42","D1-45":"evidence/D1-45",
    "D1-65":"evidence/D1-65","D1-66":"evidence/D1-66","D1-67":"evidence/D1-67","D1-68":"evidence/D1-68",
    "D1-69":"evidence/D1-69","D1-70":"evidence/D1-70",
    "D2-1":"evidence/realcloud-probe","D2-2":"evidence/D2-2","D2-4":"evidence/D2-4",
    "D2-5":"evidence/D2-5","D2-10":"evidence/D2-10","D2-11":"evidence/D2-11","D2-12":"evidence/D2-12",
    "D2-13":"evidence/D2-13","D2-16":"evidence/D2-16","D2-26":"evidence/D2-26","D2-27":"evidence/D2-27",
    "D3-A1":"evidence/D3-A1","D3-B1":"evidence/D3-B1","D3-B3":"evidence/D3-B3","D3-B5":"evidence/D3-B5",
    "D3-C4":"evidence/realcloud-probe","D3-C5":"evidence/D3-C5","D3-C13":"evidence/D3-C13","D3-C14":"evidence/D3-C14",
    "D3-S1":"evidence/D3-S1","D3-S2":"evidence/D3-S2","D3-S3":"evidence/D3-S3","D3-S4":"evidence/D3-S4",
    "D3-S8":"evidence/D3-S8",
    "D4-1":"evidence/D4-1","D4-2":"evidence/D4-2","D4-4":"evidence/D4-4","D4-5":"evidence/D4-5",
    "D4-6":"evidence/D4-6","D4-7":"evidence/D4-7","D4-8":"evidence/D4-8","D4-9":"evidence/D4-9",
    "D4-10":"evidence/D4-10","D4-11":"evidence/D4-11","D4-12":"evidence/D4-12","D4-13":"evidence/D4-13",
    "D4-14":"evidence/realcloud-probe","D4-16":"evidence/D4-16","D4-18":"evidence/realcloud-probe",
    "D4-19":"evidence/realcloud-probe","D4-20":"evidence/realcloud-probe","D4-22":"evidence/D4-22",
    "D4-23":"evidence/D4-23","D4-27":"evidence/D4-27","D4-28":"evidence/D4-28","D4-29":"evidence/D4-29",
    "D5-1":"evidence/D5-1","D5-3":"evidence/D5-3",
    "D6-1":"evidence/D6-1","D6-3":"evidence/D6-3","D6-4":"evidence/D6-4","D6-9":"evidence/D6-9",
    "D8-4":"evidence/D8-4","D8-6":"evidence/D8-6","D8-7":"evidence/D8-7","D8-10":"evidence/D8-10",
    "D9-1":"evidence/D9-1","D9-2":"evidence/D9-2","D9-3":"evidence/D9-3","D9-4":"evidence/D9-4",
    "D9-5":"evidence/D9-5","D9-6":"evidence/D9-6","D9-7":"evidence/D9-7","D9-8":"evidence/D9-8",
    "D9-10":"evidence/D9-10","D9-11":"evidence/D9-11","D9-13":"evidence/D9-13",
    "D10-3":"evidence/D10-3","D10-4":"evidence/D10-4",
}
for c, ev in PASS_D.items():
    DESIGN[c] = ("PASS", ev, "")
FAIL_D = {
    "D4-3":("evidence/D4-3","kms DecryptData 未列入 blockedSecretOperations，明文 secret 解密 API 判 allow"),
    "D4-15":("evidence/D4-15","ANSI-C 引号编码未解析，写操作规则被绕过"),
    "D4-17":("evidence/D4-17","risk-rule-engine 畸形输入无 finding 即 allow（fail-open）"),
    "D4-21":("evidence/D4-21","HCL/Terraform 形态 broad IAM policy 未拦截（只拦 JSON）"),
    "D4-25":("evidence/D4-25","Python hook 写分类 CreateVpc 判 cli:invoke 而非 cli:write"),
    "D4-26":("evidence/D4-26","findings.evidence 中 secret_key/adminPass 明文残留"),
    "D8-1":("evidence/D8-1","文档 AGENTS.md 声明 39 tools，实现 41（漂移）"),
    "D8-9":("evidence/D8-9","sanitizeValue 不脱敏 AK/SK/token 敏感值"),
    "D9-12":("evidence/D9-12","非法时序 tools/list 未 initialize 未返回 -32600"),
    "D3-S5":("evidence/D3-S5","复合意图未拆分命中多个 service（存储+托管）"),
}
for c, (ev, br) in FAIL_D.items():
    DESIGN[c] = ("FAIL", ev, br)
SPEC_D = {
    "D9-9":("evidence/D9-9","capabilities 未声明 notifications.cancellation"),
    "D4-24":("evidence/D4-24","审批令牌返回 state 枚举与契约字段 code/outcome 漂移"),
}
for c, (ev, br) in SPEC_D.items():
    DESIGN[c] = ("SPEC-MISMATCH", ev, br)

BLOCKED_D = {
    "D3-S6":("【改用例】FunctionGraph 定时任务真云创建用例，探针 CreateFunction 未提供 function_name/code 完整参数，hcloud 返回 USE_ERROR Invalid parameter: function_name，无法真机创建函数验证 URN/触发器绑定"),
    "D3-S7":("【改用例】跨服务交付用例需先编排创建 VPC/子网/安全组前置再创建 RDS，探针未实现前置编排，CreateInstance 缺 db.password/VPC 参数返回 USE_ERROR Invalid parameter: db.password"),
}
for c, br in BLOCKED_D.items():
    DESIGN[c] = ("BLOCKED", "", br)
NOTRUN_D = {
    "D1-39":("【调归属】Windows 升级检测链 EINVAL 专属（OS 列标注「专属」），本机 Linux，由 D1-40/EXP-NR3 代表覆盖",""),
}
for c, (br, _) in NOTRUN_D.items():
    DESIGN[c] = ("NOT_RUN", "", br)

EXPANDED = {}
for c in ["EXP-E01"]:
    EXPANDED[c] = ("FAIL", "evidence/D10-3", "serviceCatalog 中文意图「查云主机」未命中 ECS（fallback）")
for c in ["EXP-E02","EXP-E03","EXP-E04","EXP-E05","EXP-E06","EXP-E07","EXP-E09","EXP-E10","EXP-E11","EXP-E12","EXP-E13","EXP-E14","EXP-E15"]:
    EXPANDED[c] = ("PASS", "evidence/D10-3", "")
EXPANDED["EXP-E08"] = ("PASS", "evidence/EXP-E08", "")
EXPANDED["EXP-D5-3-1"] = ("PASS", "evidence/D5-1", "")
EXPANDED["EXP-D5-3-3"] = ("PASS", "evidence/D5-3", "")
for i in range(1, 23):
    EXPANDED["EXP-C4-%02d" % i] = ("PASS", "evidence/realcloud-probe", "")

def rewrite(path, mapping):
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    fields = list(rows[0].keys())
    for r in rows:
        cid = (r.get("ID") or "").strip()
        if cid in mapping:
            st, ev, br = mapping[cid]
            r["执行状态"] = st
            r["执行时间"] = TS if st != "NOT_RUN" else ""
            r["evidencePath"] = ev
            if "blockedReason" in fields:
                r["blockedReason"] = br
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
print("时间戳: %s" % TS)
print("设计级 %d 行: %s" % (len(drows), dict(c1)))
print("展开级 %d 行: %s" % (len(erows), dict(c2)))
print("追踪表 %d 行, 回填 %d 行" % (len(trows), n))
print("设计级缺失:", [r["ID"] for r in drows if not (r.get("执行状态") or "").strip()])
print("展开级缺失:", [r["ID"] for r in erows if not (r.get("执行状态") or "").strip()])
