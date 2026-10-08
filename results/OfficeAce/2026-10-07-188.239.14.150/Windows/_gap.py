import csv, os
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-10-07-188.239.14.150\Windows'
ev = os.path.join(base, 'evidence')

design = list(csv.reader(open(os.path.join(base,'用例矩阵-设计级.csv'),encoding='utf-8-sig')))
expand = list(csv.reader(open(os.path.join(base,'用例矩阵-展开级.csv'),encoding='utf-8-sig')))
track = list(csv.reader(open(os.path.join(base,'需求-设计-证据追踪表.csv'),encoding='utf-8-sig')))

dh = design[0]; eh = expand[0]
didx = dh.index('ID'); dpri = dh.index('优先级')
eidx = eh.index('ID'); epri = eh.index('优先级')

evdirs = set(d for d in os.listdir(ev) if os.path.isdir(os.path.join(ev,d)))

design_ids = [(r[didx], r[dpri]) for r in design[1:]]
expand_ids = [(r[eidx], r[epri]) for r in expand[1:]]

print("设计级 total", len(design_ids), "展开级 total", len(expand_ids))

def missing(ids):
    out = []
    for cid, pr in ids:
        if cid.strip() not in evdirs:
            out.append((cid, pr))
    return out

md = missing(design_ids)
me = missing(expand_ids)
print("\n=== 设计级缺证据 ===")
for c in md: print(c)
print("\n=== 展开级缺证据 ===")
for c in me: print(c)

# grouped dirs that are not case ids
grouped = [d for d in sorted(evdirs) if d not in set(c for c,_ in design_ids) ]
print("\n=== evidence 非用例目录 ===", grouped)

# all evidence dirs with no stdout.log
print("\n=== evidence 目录但无 stdout.log ===")
no_so = [d for d in sorted(evdirs) if not os.path.isfile(os.path.join(ev,d,'stdout.log'))]
print(no_so)