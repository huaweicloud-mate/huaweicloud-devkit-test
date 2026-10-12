#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Hermes Linux 2026-10-12 每日测试：证据分发（stdout.txt）+ 写 stdout.log JSON + 回填三 CSV。"""
import os, re, json, csv, shutil
from collections import Counter
from datetime import datetime, timezone, timedelta

BASE = os.path.dirname(os.path.abspath(__file__))
EVID = os.path.join(BASE, "evidence")
P = os.path.join(EVID, "_probes")
BJT = timezone(timedelta(hours=8))
TS = datetime.now(BJT).strftime("%Y%m%d%H%M%S")

def read(n):
    with open(os.path.join(P, n), encoding="utf-8", errors="replace") as f:
        return f.read()

def write_case(cid, content):
    d = os.path.join(EVID, cid)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "stdout.txt"), "w", encoding="utf-8") as f:
        f.write(content)

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

def distribute(logfile, mapping):
    secs = split_sections(read(logfile))
    for cid in mapping:
        if cid in secs:
            write_case(cid, secs[cid])
        else:
            print(f"  [WARN] {cid} 段未找到于 {logfile}")

# ===== 1. 分发证据（stdout.txt）=====
print("== classify (D4-1/2/3/15/16) ==")
distribute("classify.log", ["D4-1","D4-2","D4-3","D4-15","D4-16"])
print("== hook (D4-5/7/9/21/22) ==")
distribute("hook.log", ["D4-5","D4-7","D4-9","D4-21","D4-22"])
print("== auth (D2-4/11/12) ==")
distribute("auth.log", ["D2-4","D2-11","D2-12"])
print("== protocol (D5-3/D9-*) ==")
distribute("protocol.log", ["D5-3","D9-1","D9-2","D9-3","D9-4","D9-5","D9-7","D9-8"])
print("== extended (D2-16/D9-9/D1-41) ==")
distribute("extended.log", ["D2-16","D9-9","D1-41"])
print("== d4-8 ==")
distribute("d4-8.log", ["D4-8"])
print("== D4-21 hcl 补充 ==")
append_case("D4-21", "\n===== hcl-probe 补充 =====\n" + read("hcl-probe.log"))
print("== D4-16 wrap 补充 ==")
append_case("D4-16", "\n===== wrap-probe 补充 =====\n" + read("wrap-probe.log"))
print("== d8 (D8-7) ==")
d8secs = split_sections(read("d8.log"))
write_case("D8-7", "".join(d8secs.get(k, "") for k in sorted(d8secs)) + "\n=== DONE ===\n")
print("== D1 安装域 (按 STEP 切片) ==")
d1 = read("d1.log")
def slice_steps(text, s, e=None):
    i = text.find(s)
    if i < 0: return ""
    j = text.find(e) if e else len(text)
    return text[i:j]
write_case("D1-3", slice_steps(d1, "########## STEP 1", "########## STEP 3"))
write_case("D1-4", slice_steps(d1, "########## STEP 3", "########## STEP 4"))
print("== supplement (16 用例) ==")
distribute("supplement.log", ["D1-26","D1-27","D2-2","D2-5","D3-A1","D3-B1","D3-B3","D3-B5","D3-C5","D4-4","D4-6","D4-11","D4-17","D6-1","D6-3","D6-4"])
print("== supplement-import (D1-30/D4-10) ==")
distribute("supplement-import.log", ["D1-30","D4-10"])
print("== updatecheck (D1-28/31/33) ==")
for cid in ["D1-28","D1-31","D1-33"]:
    write_case(cid, read("updatecheck.log"))
print("== D5-1 ==")
write_case("D5-1", read("d5-1.log"))
print("== D1-40 / D1-42 / D1-45 / D2-26 / D4-27 ==")
for cid, log in [("D1-40","d1-40.log"),("D1-42","d1-42.log"),("D1-45","d1-45.log"),
                 ("D2-26","d2-26.log"),("D4-27","d4-27.log")]:
    write_case(cid, read(log))
print("== D4-6 (source redactSecrets + supplement hook 层) ==")
write_case("D4-6", read("d4-6.log"))
append_case("D4-6", "\n===== supplement MCP hook 层 =====\n" + split_sections(read("supplement.log")).get("D4-6",""))
print("== D10-3 routing + eval-harness ==")
write_case("D10-3", read("routing.log") + "\n===== eval-harness =====\n" + read("eval-harness.log"))
print("== EXP-E01~E15 (eval-harness 全量) ==")
eh = read("eval-harness.log")
for i in range(1, 16):
    write_case(f"EXP-E{i:02d}", eh)
print("== EXP-E08 诊断 (追加) ==")
append_case("EXP-E08", "\n===== EXP-E08-probe 诊断路由 =====\n" + read("exp-e08.log"))
print("== D9-12 / D9-13 ==")
write_case("D9-12", read("d9-12.log"))
write_case("D9-13", read("d9-13.log"))
print("== new-env (D1-65/66/67/68) ==")
distribute("new-env.log", ["D1-65","D1-66","D1-67","D1-68"])
print("== new-config (D2-27/D1-70/D8-9/D8-10/D6-9) ==")
distribute("new-config.log", ["D2-27","D1-70","D8-9","D8-10","D6-9"])
print("== new-safety (D10-4/D4-26/D4-29/D4-28/D4-25) ==")
distribute("new-safety.log", ["D10-4","D4-26","D4-29","D4-28","D4-25"])
print("== new-mcp (D9-10/D9-11) ==")
distribute("new-mcp.log", ["D9-10","D9-11"])
print("== new-cli (D1-69) ==")
distribute("new-cli.log", ["D1-69"])
print("== new-scenario (D3-S1/S5/S8) ==")
distribute("new-scenario.log", ["D3-S1","D3-S5","D3-S8"])
print("== new-cloud (D3-S2/C13/C14/S4/S3) ==")
distribute("new-cloud.log", ["D3-S2","D3-C13","D3-C14","D3-S4","D3-S3"])
print("== new-fg-rds (D3-S6/S7) ==")
distribute("new-fg-rds.log", ["D3-S6","D3-S7"])
print("== D8-10 merge 补充 ==")
append_case("D8-10", "\n===== merge-probe 补充 =====\n" + read("merge.log"))
print("== D1-39 disttags（供 EXP-NR3-10 复用）==")
write_case("EXP-NR3-10", read("disttags.log"))

# 真云/审批流：realcloud-probe 单条 stdout.txt 覆盖多 case（各 case 目录复制完整输出）
print("== realcloud 多 case 分发 ==")
rc_out = open(os.path.join(EVID, "realcloud-probe", "stdout.txt"), encoding="utf-8", errors="replace").read()
for cid in ["D2-1", "D3-C4", "D4-14", "D4-18", "D4-19", "D4-20"] + [f"EXP-C4-{i:02d}" for i in range(1, 23)]:
    write_case(cid, rc_out)

# 6 Hermes 专属展开级：复制映射源 case 的 stdout.txt
print("== 6 Hermes 专属展开级 (复制源 case stdout.txt) ==")
for cid, src in [("EXP-D5-8-1","D5-1"),("EXP-D5-8-3","D5-3"),
                 ("EXP-NR3-02","D1-27"),("EXP-NR3-04","D1-42"),("EXP-NR3-24","D1-45")]:
    sp = os.path.join(EVID, src, "stdout.txt")
    if os.path.isfile(sp):
        write_case(cid, open(sp, encoding="utf-8", errors="replace").read())
    else:
        print(f"  [WARN] {cid} 源 {src} 无 stdout.txt")

# fixture 4 (D2-10/D2-13/D4-12/D9-6) 已由 run_all.sh 自写 stdout.txt；D4-13/D4-23 亦自写。无需动作。

# ===== 2. 写 stdout.log JSON（供 backfill_daily 读取）=====
status_map = json.load(open("/tmp/status_map.json", encoding="utf-8"))

WHY = {
    "D4-2": "classifyTextCommand env-dump 正则未覆盖无云厂商前缀的泛化 access_key/secret_key 词（env | grep -i access_key -> allow）; 根因 safety-policy.mjs:517-520",
    "D4-21": "evaluateArtifacts 仅拦 JSON 形态 IAM；Terraform HCL actions=[\"*\"] 与 data huaweicloud_iam_policy name=AdministratorFullAccess 未拦截; 根因 cloud-risk-rules.json:196(hwc-iam-admin-policy 规则缺 HCL 匹配)",
    "D9-12": "initialize 不触发 runVersionCheck + dispatch 无 initialize 前置校验(tools/list 未 initialize 未拒 -32600); 根因 mcp-server.mjs:183-187",
    "D4-6": "redactString 未覆盖 --admin_pass 空格形态与 camelCase adminPass JSON 字符串(未脱敏/不告警); 根因 safety-policy.mjs:41",
    "D4-17": "hook_check_command 对空/模糊/注入命令 fail-open(&& rm -rf /*、$(curl|sh) 结论=ok); 根因 tools.mjs:1161-1162 evaluateCommandRisk 空输入回退 allow，未走 invalidRiskResult fail-closed",
    "D3-S7": "serviceCatalog 复合意图未命中 RDS 部署目标(仅 RDS) + CreateInstance 返回 Invalid parameter: db.password(缺 vpc/subnet/sg 前置); 根因 tools.mjs:1983 serviceCatalog",
    "D3-S5": "serviceCatalog 复合意图(存储+托管)未命中多 service, 回退 --help; 根因 tools.mjs:1983 serviceCatalog 复合意图拆分",
    "D3-S6": "FunctionGraph CreateFunction 返回 Invalid parameter: function_name, 未生成 URN/绑定定时触发器; 根因 tools.mjs FunctionGraph 编排参数缺 function_name",
    "D4-25": "Python hook 写操作遥测误分类 cli:invoke(应 cli:write); 根因 hooks/huaweicloud-safety.py:112",
    "D4-26": "findings.evidence JSON 带引号 key 明文 secret_key/adminPass 残留(未脱敏); 根因 tools.mjs:1643 findings 未过 redactSecrets",
    "EXP-E01": "serviceCatalog 中文意图「云主机」未命中 ECS(回退 --help), 92.9%(MISS=1); 根因 tools.mjs:1983 serviceCatalog 中文词表缺「云主机」",
    "D8-9": "sanitizeValue 仅去控制字符/截断, 未移除 AK/SK/token 敏感值(SPEC 契约漂移); 根因 telemetry/telemetry.mjs:189",
    "D9-9": "initialize capabilities 未声明 cancellation(SPEC 契约漂移, 非假定); 根因 mcp-server.mjs initialize capabilities={tools:{}}",
    "D10-4": "规则库 16 条增至 19 条(9 deny+10 warn), 用例断言契约漂移(非安全回归); 根因 cloud-risk-rules.json 规则数变化",
    "D1-39": "OS 列=Windows 升级检测链 EINVAL 专属；Linux 侧由 EXP-NR3-10(disttags)代表覆盖",
}

# 需要写 stdout.log 的 case：所有非 NOT_RUN
wrote = 0
for cid, st in status_map.items():
    if st == "NOT_RUN":
        continue
    d = os.path.join(EVID, cid)
    os.makedirs(d, exist_ok=True)
    payload = {"status": st, "executedAt": TS}
    if st in WHY:
        payload["why"] = WHY[st]
    with open(os.path.join(d, "stdout.log"), "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
    wrote += 1
print(f"写 stdout.log: {wrote} 个（跳过 NOT_RUN）")

# ===== 3. 回填三 CSV =====
def backfill_csv(path, id_col="ID"):
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    fields = list(rows[0].keys())
    n = 0
    for r in rows:
        cid = (r.get(id_col) or "").strip()
        if cid not in status_map:
            continue
        st = status_map[cid]
        r["执行状态"] = st
        if st == "NOT_RUN":
            r["执行时间"] = ""
            r["evidencePath"] = ""
        elif st == "BLOCKED":
            r["执行时间"] = TS
            r["evidencePath"] = ""
        else:
            r["执行时间"] = TS
            r["evidencePath"] = f"evidence/{cid}"
        if "blockedReason" in fields:
            r["blockedReason"] = WHY.get(cid, "") if st == "BLOCKED" else ""
        n += 1
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    return n, rows

d_n, drows = backfill_csv(os.path.join(BASE, "用例矩阵-设计级.csv"))
e_n, erows = backfill_csv(os.path.join(BASE, "用例矩阵-展开级.csv"))

# 追踪表：designCaseId 或 expandedCaseId 命中即回填执行时间
tpath = os.path.join(BASE, "需求-设计-证据追踪表.csv")
with open(tpath, encoding="utf-8-sig") as f:
    trows = list(csv.DictReader(f))
tfields = list(trows[0].keys())
tn = 0
for r in trows:
    cid = (r.get("designCaseId") or "").strip()
    ecid = (r.get("expandedCaseId") or "").strip()
    if cid in status_map or ecid in status_map:
        r["执行时间"] = TS
        tn += 1
with open(tpath, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=tfields)
    w.writeheader()
    w.writerows(trows)

c1 = Counter((r.get("执行状态") or "").strip() for r in drows)
c2 = Counter((r.get("执行状态") or "").strip() for r in erows)
print(f"\n时间戳: {TS}")
print(f"设计级 {len(drows)} 行: {dict(c1)}")
print(f"展开级 {len(erows)} 行: {dict(c2)}")
print(f"追踪表 {len(trows)} 行, 回填 {tn} 行")
missing = [r["ID"] for r in drows if not (r.get("执行状态") or "").strip()]
print("设计级缺失状态:", missing)
missing2 = [r["ID"] for r in erows if not (r.get("执行状态") or "").strip()]
print("展开级缺失状态:", missing2)
print("DONE backfill")