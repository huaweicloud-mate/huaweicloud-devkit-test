# -*- coding: utf-8 -*-
"""设计级矩阵深度扫描：逐维度场景覆盖 + 展开规则缺失 + 区域/项目/凭证维度"""
import csv, collections, os, re, sys

io_enc = sys.stdout
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
P = os.path.join(REPO_ROOT, 'test-cases', 'design', '用例矩阵-设计级.csv')

with open(P, encoding='utf-8-sig') as f:
    rows = list(csv.DictReader(f))

# 1) 逐维度场景关键词覆盖
dims = collections.OrderedDict()
KWS = ['超时','重试','幂等','清理','归零','异常','错误','失败','无凭证','最小权限','只读','审批',
       '边界','并发','断网','离线','损坏','坏JSON','超长','大','重复','恢复','中断','部分就绪',
       '竞态','注入','绕过','降级','权限不足','拒绝','误杀','升级','回滚','恢复','挂起','hang']
for r in rows:
    d = r['维度']
    text = (r.get('标题') or '') + (r.get('操作步骤') or '') + (r.get('预期结果') or '') + (r.get('前置条件') or '')
    dims.setdefault(d, {'n': 0, 'kws': collections.Counter()})
    dims[d]['n'] += 1
    for kw in KWS:
        if kw.lower() in text.lower():
            dims[d]['kws'][kw] += 1
print('=== 逐维度场景关键词覆盖 ===')
for d, v in dims.items():
    print(f'{d}: n={v["n"]} 关键词={dict(v["kws"])}')

# 2) 展开规则空值列表（门禁：必须为 0）
print()
print('=== 展开规则空值（门禁要求=0）: ===')
empty_expand = [r['ID'] for r in rows if not (r.get('展开规则') or '').strip()]
print(f'共 {len(empty_expand)} 条: {empty_expand}')
if empty_expand:
    print('[GATE-FAIL] 展开规则存在空值 → exit 1')
    sys.exit(1)
print('[GATE-PASS] 展开规则 0 空')

# 3) 区域/项目/凭证/资源状态 维度
print()
print('=== 区域(region/区域)相关 ===')
for r in rows:
    t = (r.get('标题') or '') + (r.get('前置条件') or '') + (r.get('操作步骤') or '') + (r.get('预期结果') or '')
    if any(k in t for k in ['region','区域','北京','贵阳','华南','华东']):
        print(f"  {r['ID']} {r['标题']}")
print('=== 项目(project)相关 ===')
for r in rows:
    t = (r.get('标题') or '') + (r.get('前置条件') or '') + (r.get('操作步骤') or '') + (r.get('预期结果') or '')
    if any(k in t for k in ['project','项目ID','enterprise_project']):
        print(f"  {r['ID']} {r['标题']}: {r.get('测试数据','')[:60]}")
print('=== 凭证状态相关 ===')
for r in rows:
    t = (r.get('标题') or '') + (r.get('前置条件') or '') + (r.get('操作步骤') or '')
    if any(k in t for k in ['过期','错误AK','无凭证','缺失','轮换','多profile','多档','部分就绪','最小权限','只读凭证','STS','token','runtime']):
        print(f"  {r['ID']} {r['标题']}")

# 4) 工具覆盖审计：由 tools.mjs 唯一全集推导（P1 可移植；2026-09-12 收敛 36/37→39）
print()
def _resolve_tools_mjs():
    hdk = os.environ.get("HUAWEICLOUD_DEVKIT_HOME")
    cands = []
    if hdk:
        cands.append(("env HUAWEICLOUD_DEVKIT_HOME",
                      os.path.join(hdk, "plugins", "huaweicloud-core", "src", "tools.mjs")))
    cands.append(("sibling ../hdk",
                  os.path.normpath(os.path.join(REPO_ROOT, "..", "hdk", "plugins", "huaweicloud-core", "src", "tools.mjs"))))
    for tag, p in cands:
        if os.path.isfile(p):
            return p, tag
    return None, ""
TOOLS_MJS, TOOLS_MJS_SRC = _resolve_tools_mjs()
if not TOOLS_MJS:
    print("[BLOCKED] ENV_MISSING：无法定位被测项目 tools.mjs（优先设 HUAWEICLOUD_DEVKIT_HOME，或把 hdk 放在测试仓相邻目录 ../hdk）")
    sys.exit(2)
print(f"[INFO] 工具注册源({TOOLS_MJS_SRC}) = {TOOLS_MJS}")
tools = []
with open(TOOLS_MJS, encoding='utf-8') as f:
    mtxt = f.read()
_m = re.search(r"\bTOOL_DEFINITIONS\s*=\s*\[", mtxt)
if _m:
    _i = _m.end() - 1
    _depth = 0
    _quote = None
    while _i < len(mtxt):
        _c = mtxt[_i]
        if _quote:
            if _c == _quote and mtxt[_i - 1] != '\\':
                _quote = None
        elif _c in "'\"`":
            _quote = _c
        elif _c == '[':
            _depth += 1
        elif _c == ']':
            _depth -= 1
            if _depth == 0:
                break
        _i += 1
    _body = mtxt[_m.end():_i]
    for n in re.findall(r"\bname:\s*['\"]([a-z_0-9]+)['\"]", _body):
        if not n.startswith('huaweicloud_'):
            continue
        sn = n[len('huaweicloud_'):]
        if sn and sn not in tools:
            tools.append(sn)
print(f'=== {len(tools)} 工具覆盖审计（关联工具列，由 tools.mjs 推导） ===')

def _covered_short_names(assoc):
    toks = set()
    for t in re.split(r'[,;/\s]+', assoc or ''):
        t = t.strip()
        if t:
            toks.add(t.replace('huaweicloud_', '', 1))
    return toks

covered = set()
for r in rows:
    covered |= _covered_short_names(r.get('关联工具') or '')
missing = [t for t in tools if t not in covered]
print(f'缺失工具用例（关联工具列零命中）: {len(missing)}')
for t in missing:
    print(f'  {t}')
if missing:
    print('[GATE-FAIL] 存在工具覆盖缺口 → exit 1')
    sys.exit(1)
print(f'[GATE-PASS] {len(tools)} 工具全部有覆盖')

# 5) 维度-用例列表（用于最终汇总）
print()
print('=== 各维度用例 ID 清单 ===')
for d in ['D1安装','D2认证','D3功能','D4安全','D5客户端','D6性能','D7兼容','D8质量','D9协议','D10评测']:
    ids = [r['ID'] for r in rows if r['维度'] == d]
    print(f'{d}: {len(ids)} -> {ids}')