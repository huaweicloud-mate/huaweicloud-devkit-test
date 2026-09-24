# -*- coding: utf-8 -*-
import glob, io, json, os, csv

base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, "evidence")

def load_csv(name):
    rows = list(csv.DictReader(io.open(os.path.join(base, name), encoding="utf-8-sig")))
    return rows

# 收集 case-id -> status 映射
case_map = {}   # case_id -> (status, why)
unknown = []    # 无法判定的 stdout.log

for p in sorted(glob.glob(os.path.join(ev, "*", "stdout.log"))):
    cdir = os.path.basename(os.path.dirname(p))
    raw = io.open(p, encoding="utf-8-sig").read().strip()
    if not raw:
        continue
    try:
        j = json.loads(raw)
    except Exception:
        unknown.append((cdir, "NONJSON"))
        continue
    if not isinstance(j, dict):
        unknown.append((cdir, "NOTDICT"))
        continue
    # 单对象
    if "status" in j:
        case_map[cdir] = (j["status"], j.get("why", "") or j.get("blockedReason", ""))
        continue
    # results 数组聚合
    if "results" in j and isinstance(j["results"], list):
        for r in j["results"]:
            if not isinstance(r, dict):
                continue
            rid = r.get("id")
            if not rid:
                continue
            st = "PASS" if r.get("pass") else "FAIL"
            why = (r.get("failMsg") or r.get("actual") or "")[:80]
            # 聚合里同一个 id 多条检查，取"全 PASS 才 PASS"
            if rid in case_map:
                prev_st, prev_why = case_map[rid]
                if st == "FAIL" and prev_st == "PASS":
                    case_map[rid] = ("FAIL", why)
            else:
                case_map[rid] = (st, why)
        continue
    unknown.append((cdir, "UNRECOGNIZED:" + ",".join(list(j.keys()))))

print("=== CASE MAP (%d ids) ===" % len(case_map))
for cid in sorted(case_map):
    print(cid, "|", case_map[cid][0], "|", case_map[cid][1][:60])

print()
print("=== UNKNOWN stdout.log ===")
for u in unknown:
    print(u)

# 对比 CSV
for csvname in ["用例矩阵-设计级.csv", "用例矩阵-展开级.csv"]:
    rows = load_csv(csvname)
    ids = [r["ID"].strip() for r in rows]
    covered = [i for i in ids if i in case_map]
    missing = [i for i in ids if i not in case_map]
    print()
    print("=== %s: total %d, covered %d, missing %d ===" % (csvname, len(ids), len(covered), len(missing)))
    print("MISSING:", ",".join(missing))