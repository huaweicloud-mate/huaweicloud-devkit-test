import csv, sys
sys.stdout.reconfigure(encoding='utf-8')
with open('用例矩阵-展开级.csv', encoding='utf-8-sig') as fh:
    rows = list(csv.DictReader(fh))
for i, r in enumerate(rows):
    print(f"---- #{i+1} {r.get('ID')} | 源用例={r.get('源用例')} | 展开类型={r.get('展开类型')} | 枚举对象={r.get('枚举对象')}")
    print(f"    要点: {r.get('执行要点')}")
    print(f"    预期: {r.get('预期结果')}")
    print(f"    reqEv: {r.get('requiredEvidence')} | designCaseId: {r.get('designCaseId')} | OS: {r.get('OS')} | terminal: {r.get('terminal')} | mcpTransport: {r.get('mcpTransport')} | TTY: {r.get('TTY')}")