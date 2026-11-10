# -*- coding: utf-8 -*-
import csv, io, os
d = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-11-119.8.181.45\Windows"
out = io.open(os.path.join(d, "_design_full.txt"), "w", encoding="utf-8")
rows = list(csv.DictReader(io.open(os.path.join(d, "用例矩阵-设计级.csv"), encoding="utf-8-sig")))
for r in rows:
    out.write("### %s | %s | P=%s\n" % (r["ID"], r["维度"], r["优先级"]))
    out.write("标题: %s\n" % r["标题"])
    out.write("前置: %s\n" % r["前置条件"])
    out.write("步骤: %s\n" % r["操作步骤"])
    out.write("预期: %s\n" % r["预期结果"])
    out.write("工具: %s | 建议: %s | requiredEvidence: %s\n\n" % (r["关联工具"], r["自动化建议"], r["requiredEvidence"]))
out.close()
out = io.open(os.path.join(d, "_expanded_full.txt"), "w", encoding="utf-8")
rows = list(csv.DictReader(io.open(os.path.join(d, "用例矩阵-展开级.csv"), encoding="utf-8-sig")))
for r in rows:
    out.write("### %s | %s | P=%s | agent=%s OS=%s\n" % (r["ID"], r["展开类型"], r["优先级"], r.get("agent"), r.get("OS")))
    out.write("源用例: %s | 要点: %s\n" % (r["源用例"], r["执行要点"]))
    out.write("预期: %s\n\n" % r["预期结果"])
out.close()
out = io.open(os.path.join(d, "_mission_full.txt"), "w", encoding="utf-8")
rows = list(csv.DictReader(io.open(os.path.join(d, "使命-mission-001.csv"), encoding="utf-8-sig")))
for r in rows:
    out.write("### %s | P=%s | mission=%s\n" % (r["ID"], r["优先级"], r.get("mission")))
    out.write("标题: %s\n步骤: %s\n预期: %s\n工具: %s | 建议: %s\n\n" % (r["标题"], r["操作步骤"], r["预期结果"], r["关联工具"], r["自动化建议"]))
out.close()
print("ok")
