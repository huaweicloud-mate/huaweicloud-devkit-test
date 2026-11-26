import csv, re, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
base = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test"
runner = open(base + r"\scripts\_batch_runner_officeace_20261112.mjs", encoding='utf-8').read()
covered = set(re.findall(r"writeResult\('([^']+)'", runner))
covered |= set(re.findall(r"writeResult\(e\.id", runner) and [])
# loops
import re as _re
c4 = _re.findall(r"C4_SERVICES = \[(.*?)\]", runner, _re.S)
covered |= {f"EXP-C4-{i+1:02d}" for i in range(22)}
covered |= {f"EXP-E{i+1:02d}" for i in range(15)}
covered |= {'EXP-D5-5-1','EXP-D5-5-3'}
rows = list(csv.DictReader(open(base + r"\results\OfficeAce\2026-11-27-119.8.181.45\Windows\用例矩阵-设计级.csv", encoding='utf-8-sig')))
missing = [r['ID'] for r in rows if r['ID'] not in covered]
print("runner covers:", len(covered))
print("matrix design:", len(rows))
print("missing:", len(missing))
print(','.join(missing))
