# -*- coding: utf-8 -*-
import glob, io, json, os, csv

base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, "evidence")

# 1) 合并单对象 + 聚合数组 → case_id -> (status, why)
case_map = {}
def put(cid, st, why):
    if cid not in case_map:
        case_map[cid] = [st, why]
    else:
        # 任一 FAIL 则 FAIL（聚合多检查项）
        if st == "FAIL" and case_map[cid][0] != "FAIL":
            case_map[cid] = [st, why]

for p in sorted(glob.glob(os.path.join(ev, "*", "stdout.log"))):
    cdir = os.path.basename(os.path.dirname(p))
    raw = io.open(p, encoding="utf-8-sig").read().strip()
    if not raw:
        continue
    try:
        j = json.loads(raw)
    except Exception:
        continue
    if not isinstance(j, dict):
        continue
    if "status" in j:
        put(cdir, j["status"], j.get("why", "") or j.get("blockedReason", ""))
        continue
    if "results" in j and isinstance(j["results"], list):
        for r in j["results"]:
            if not isinstance(r, dict) or not r.get("id"):
                continue
            st = "PASS" if r.get("pass") else "FAIL"
            why = (r.get("failMsg") or r.get("actual") or "")[:120]
            put(r["id"], st, why)

print("CASE MAP total:", len(case_map))
# 2) 对照 CSV
for name in ["用例矩阵-设计级.csv", "用例矩阵-展开级.csv"]:
    rows = list(csv.DictReader(io.open(os.path.join(base, name), encoding="utf-8-sig")))
    no_ev = []
    fail = []
    for r in rows:
        cid = r["ID"]
        if cid not in case_map:
            no_ev.append(cid)
        elif case_map[cid][0] == "FAIL":
            fail.append(cid)
    print("=" * 60)
    print(name, "rows", len(rows))
    print("  FAIL:", fail)
    print("  无证据(%d):" % len(no_ev), no_ev)

# 3) 输出 case_map 里不在 CSV 中的 id（可能指向未下发展开级如 EXP-D5-1-1 等）
csv_ids = set()
for name in ["用例矩阵-设计级.csv", "用例矩阵-展开级.csv"]:
    csv_ids |= set(r["ID"] for r in csv.DictReader(io.open(os.path.join(base, name), encoding="utf-8-sig")))
orphan = [k for k in case_map if k not in csv_ids]
print("=" * 60)
print("case_map 中不属于 CSV 的 id (%d):" % len(orphan), orphan)