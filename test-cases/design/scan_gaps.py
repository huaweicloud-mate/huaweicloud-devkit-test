# -*- coding: utf-8 -*-
"""设计级矩阵深度扫描：逐维度场景覆盖 + 展开规则缺失 + 区域/项目/凭证维度"""
import csv, collections, sys

io_enc = sys.stdout
P = 'test-cases/design/用例矩阵-设计级.csv'

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

# 4) 工具覆盖审计：36 工具是否有用例
print()
print('=== 36 工具覆盖审计（关联工具列） ===')
tools = ['huaweicloud_auth_init','auth_status','auth_sync','check_cli','detect_framework','setup_obs_config',
         'plan_cli_command','run_readonly_command','run_approved_command','list_operations','list_regions',
         'get_regional_availability','service_catalog','search_marketplace','search_docs','retrieve_skill',
         'get_service_icon','hook_check_command','hook_check_artifacts','hook_check_deploy_plan','explain_error',
         'show_profile_redacted','sandbox_check_user','sandbox_connect','sandbox_credentials','sandbox_sign_agreement',
         'sandbox_exec_one_shot','sandbox_exec_with_session','sandbox_close_session','sandbox_upload_file',
         'sandbox_upload_project','sandbox_deploy_check','sandbox_deploy_nginx','voucher_status','voucher_claim',
         'check_update','upgrade']
tool_covered = {}
for t in tools:
    hit = [r['ID'] for r in rows if t in (r.get('关联工具') or '')]
    tool_covered[t] = hit
missing = {t: h for t, h in tool_covered.items() if not h}
print(f'缺失工具用例（关联工具列零命中）: {len(missing)}')
for t, h in missing.items():
    print(f'  {t}')
if missing:
    print('[GATE-FAIL] 存在工具覆盖缺口 → exit 1')
    sys.exit(1)
print('[GATE-PASS] 36 工具全部有覆盖')

# 5) 维度-用例列表（用于最终汇总）
print()
print('=== 各维度用例 ID 清单 ===')
for d in ['D1安装','D2认证','D3功能','D4安全','D5客户端','D6性能','D7兼容','D8质量','D9协议','D10评测']:
    ids = [r['ID'] for r in rows if r['维度'] == d]
    print(f'{d}: {len(ids)} -> {ids}')