# -*- coding: utf-8 -*-
"""CodeArtsAgent Linux 2026-10-14 回填三 CSV（执行状态+时间+evidencePath+blockedReason）"""
import csv, os
from datetime import datetime, timezone, timedelta

BASE = os.path.dirname(os.path.abspath(__file__))
BJT = timezone(timedelta(hours=8))
TS = datetime.now(BJT).strftime("%Y%m%d%H%M%S")

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
    "D3-C1":"evidence/D3-C1","D3-C2":"evidence/D3-C2","D3-C3":"evidence/D3-C3","D3-C6":"evidence/D3-C6","D3-C7":"evidence/D3-C7",
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
FAIL_D = {
    "D4-3":("evidence/D4-3","kms DecryptData 未列入 blockedSecretOperations，明文 secret 解密 API 判 allow"),
    "D4-15":("evidence/D4-15","ANSI-C 引号编码未解析，写操作规则被绕过"),
    "D4-17":("evidence/D4-17","risk-rule-engine 畸形输入无 finding 即 allow（fail-open）"),
    "D4-21":("evidence/D4-21","HCL/Terraform 形态 broad IAM policy 未拦截（只拦 JSON）"),
    "D4-25":("evidence/D4-25","Python hook 写分类 CreateVpc 判 cli:invoke 而非 cli:write"),
    "D4-26":("evidence/D4-26","findings.evidence 中 secret_key/adminPass 明文残留"),
    "D8-1":("evidence/D8-1","文档 AGENTS.md:27/45 声明 39 tools，实现 42（漂移 3）"),
    "D8-9":("evidence/D8-9","sanitizeValue 不脱敏 AK/SK/token 敏感值"),
    "D9-12":("evidence/D9-12","非法时序 tools/list 未 initialize 未返回 -32600"),
    "D3-S5":("evidence/D3-S5","复合意图未拆分命中多个 service（存储+托管）"),
}
SPEC_D = {
    "D9-9":("evidence/D9-9","capabilities 未声明 notifications.cancellation"),
    "D4-24":("evidence/D4-24","审批令牌返回 state 枚举与契约字段 code/outcome 漂移"),
}
BLOCKED_D = {
    "D3-S6":("【改用例】FunctionGraph 定时任务真云创建，探针 CreateFunction 缺 code.zip_file 完整参数，hcloud 返回 USE_ERROR Invalid parameter: code.zip_file，无法真机创建函数验证 URN/触发器绑定"),
    "D3-S7":("【改用例】跨服务交付用例需先编排 VPC/子网/安全组前置再创建 RDS，CreateInstance 缺 db.password/VPC 参数返回 USE_ERROR Invalid parameter: db.password"),
}
NOTRUN_D = {
    "D1-39":("【调归属】Windows 升级检测链 EINVAL 专属（OS 列标注「专属」），本机 Linux，由 D1-40 代表覆盖",""),
}

DESIGN = {}
for c, ev in PASS_D.items():
    DESIGN[c] = ("PASS", ev, "")
for c, (ev, br) in FAIL_D.items():
    DESIGN[c] = ("FAIL", ev, br)
for c, (ev, br) in SPEC_D.items():
    DESIGN[c] = ("SPEC-MISMATCH", ev, br)
for c, br in BLOCKED_D.items():
    DESIGN[c] = ("BLOCKED", "", br)
for c, (br, _) in NOTRUN_D.items():
    DESIGN[c] = ("NOT_RUN", "", br)

EXPANDED = {}
EXPANDED["EXP-E01"] = ("FAIL", "evidence/D10-3", "serviceCatalog 中文意图「查云主机」未命中 ECS（fallback）")
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

# 追踪表回填执行时间
tpath = os.path.join(BASE, "需求-设计-证据追踪表.csv")
with open(tpath, encoding="utf-8-sig") as f:
    trows = list(csv.DictReader(f))
tfields = list(trows[0].keys())
for r in trows:
    r["执行时间"] = TS
with open(tpath, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=tfields); w.writeheader(); w.writerows(trows)

from collections import Counter
dc = Counter(r["执行状态"] for r in drows)
ec = Counter(r["执行状态"] for r in erows)
print("设计级状态:", dict(dc))
print("展开级状态:", dict(ec))
print("回填完成 TS=", TS)
