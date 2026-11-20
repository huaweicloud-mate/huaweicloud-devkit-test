import csv, glob, os, json, collections
D = r"C:\Users\Administrator\devkit-test\testbot4-codearts1\huaweicloud-devkit-test\results\CodeArtsAgent\2026-11-21-119.8.181.45\Windows"
ids = []
for f in glob.glob(os.path.join(D, "*.csv")):
    if "追踪" in f:
        continue
    for r in csv.DictReader(open(f, encoding="utf-8-sig")):
        ids.append(r["ID"])
ids = sorted(set(ids))
ev = {os.path.basename(x): x for x in glob.glob(os.path.join(D, "evidence", "*")) if os.path.isdir(x)}
c = collections.Counter()
miss, nolog = [], []
for i in ids:
    if i not in ev:
        miss.append(i); continue
    p = os.path.join(ev[i], "stdout.log")
    if not os.path.exists(p):
        nolog.append(i); continue
    try:
        c[json.load(open(p, encoding="utf-8")).get("status")] += 1
    except Exception:
        c["PARSE_ERR"] += 1
print("ids", len(ids))
print("status", dict(c))
print("missing", miss)
print("nolog", nolog)
