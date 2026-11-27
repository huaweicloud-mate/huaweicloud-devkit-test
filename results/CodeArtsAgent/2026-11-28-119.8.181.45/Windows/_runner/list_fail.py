import glob, os, json
D = r"C:\Users\Administrator\devkit-test\testbot4-codearts1\huaweicloud-devkit-test\results\CodeArtsAgent\2026-11-22-119.8.181.45\Windows"
for p in sorted(glob.glob(os.path.join(D, "evidence", "*", "stdout.log"))):
    try:
        j = json.load(open(p, encoding="utf-8"))
    except Exception:
        continue
    if j.get("status") in ("FAIL", "SPEC-MISMATCH"):
        print(j.get("caseId"), "|", j.get("status"), "|", (j.get("why") or "")[:300])
