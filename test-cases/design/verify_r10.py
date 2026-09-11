# -*- coding: utf-8 -*-
"""验证 R10 后展开级 CSV：12 列结构 + NR3 状态分布 + 设计级展开规则结构化"""
import csv, collections

with open('test-cases/expanded/用例矩阵-展开级.csv', encoding='utf-8-sig') as f:
    rows = list(csv.DictReader(f))
print('展开级行数:', len(rows))
print('列:', list(rows[0].keys()))
print('列数:', len(rows[0].keys()))

# NR3 行状态分布（status 列非空）
nr3 = [r for r in rows if r['ID'].startswith('EXP-NR3')]
print(f'\nNR3 行数: {len(nr3)}')
st = collections.Counter(r['status'] or '(空=设计基线)' for r in nr3)
print('NR3 status 分布:', dict(st))
for s, n in st.items():
    ids = [r['ID'] for r in nr3 if r['status'] == s]
    print(f'  {s} ({n}): {ids}')

# 设计基线行（非 NR3）status 应为空
base = [r for r in rows if not r['ID'].startswith('EXP-NR3')]
bad = [r['ID'] for r in base if r['status']]
print(f'\n设计基线行数: {len(base)}, status 非空异常: {len(bad)}', bad[:5])

# 每行列数一致性
bad_cols = [r['ID'] for r in rows if len(r) != 12]
print(f'列数!=12 的行: {len(bad_cols)}', bad_cols[:5])

# NR3 中 blockedReason 与 status 的对应
for r in nr3:
    if r['status'] in ('BLOCKED', 'NOT_RUN', 'FAIL', 'SPEC-MISMATCH') and not r['blockedReason']:
        print(f'  ⚠️ {r["ID"]} status={r["status"]} 但 blockedReason 为空')
    if r['status'] == 'PASS' and not r['requiredEvidence']:
        print(f'  ⚠️ {r["ID"]} PASS 但 requiredEvidence 为空')
print('\nblockedReason/evidence 完整性检查完成')

# 设计级展开规则结构化检查（含 | 分隔符）
with open('test-cases/design/用例矩阵-设计级.csv', encoding='utf-8-sig') as f:
    drows = list(csv.DictReader(f))
struct = sum(1 for r in drows if '|' in (r['展开规则'] or ''))
print(f'\n设计级展开规则含结构化分隔符(|) 的行: {struct}/{len(drows)}')
# 9 条新用例的展开规则
for i in ['D1-56','D1-57','D2-21','D3-C7','D3-C8','D3-C9','D4-24','D6-8','D9-9']:
    r = next(x for x in drows if x['ID'] == i)
    print(f'  {i}: {r["展开规则"][:90]}')