# -*- coding: utf-8 -*-
"""分发今日新增/独立探针证据到 evidence/<case-id>/（updatecheck/disttags/merge/routing/D1-40/42/45/D5-1/D4-6/EXP-E08/eval-harness）。"""
import os, re, shutil

BASE = os.path.dirname(os.path.abspath(__file__))
EVID = os.path.join(BASE, "evidence")
P = os.path.join(EVID, "_probes")

def read(n):
    with open(os.path.join(P, n), encoding="utf-8") as f:
        return f.read()

def write_case(cid, content, probe_src, probe_name="probe.mjs"):
    d = os.path.join(EVID, cid)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "stdout.log"), "w", encoding="utf-8") as f:
        f.write(content)
    if probe_src and os.path.isfile(os.path.join(P, probe_src)):
        shutil.copy2(os.path.join(P, probe_src), os.path.join(d, probe_name))

def split_sections(text):
    out = {}
    for m in re.finditer(r"=====CASE ([^\n]+)=====\n(.*?)\n=====END \1=====", text, re.S):
        out[m.group(1)] = m.group(2).rstrip("\n") + "\n"
    return out

# updatecheck -> D1-28/31/33（单文件，按整段写）
unk = read("updatecheck.log")
for cid in ["D1-28", "D1-31", "D1-33"]:
    write_case(cid, unk, "updatecheck-probe.mjs")
    print(f"  {cid}: updatecheck.log ({len(unk)} bytes)")

# disttags -> EXP-NR3-10
write_case("EXP-NR3-10", read("disttags.log"), "disttags-probe.mjs")
print("  EXP-NR3-10: disttags.log")

# merge -> D1-58
write_case("D1-58", read("merge.log"), "merge-probe.mjs")
print("  D1-58: merge.log")

# routing + eval-harness -> D10-3
write_case("D10-3", read("routing.log") + "\n===== eval-harness =====\n" + read("eval-harness.log"), "routing-probe.mjs")
print("  D10-3: routing.log + eval-harness.log")

# 独立源码级探针
for cid, log, src in [
    ("D1-40", "d1-40.log", "D1-40-probe.mjs"),
    ("D1-42", "d1-42.log", "D1-42-probe.mjs"),
    ("D1-45", "d1-45.log", "D1-45-probe.mjs"),
    ("D5-1", "d5-1.log", "D5-1-probe.mjs"),
    ("D4-6", "d4-6.log", "D4-6-probe.mjs"),
    ("EXP-E08", "exp-e08.log", "EXP-E08-probe.mjs"),
]:
    write_case(cid, read(log), src)
    print(f"  {cid}: {log}")

# 复制 eval harness 结果 CSV 到 D10-3
eval_csv_src = "/home/testbot2/devkit-test/Hermes/huaweicloud-devkit-test/eval/results"
cs = sorted([f for f in os.listdir(eval_csv_src) if f.startswith("eval-run-")], key=lambda x: os.path.getmtime(os.path.join(eval_csv_src, x)))
if cs:
    latest = cs[-1]
    shutil.copy2(os.path.join(eval_csv_src, latest), os.path.join(EVID, "D10-3", "eval-run-result.csv"))
    print(f"  D10-3 eval-run-result.csv <- {latest}")

# 基线版本
write_case("_baseline", "huaweicloud-devkit v1.1.5\n", None)
print("  _baseline: v1.1.5")

print("== 完成 ==")