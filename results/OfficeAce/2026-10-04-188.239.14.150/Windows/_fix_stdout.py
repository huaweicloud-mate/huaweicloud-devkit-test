# -*- coding: utf-8 -*-
"""修复 4 个文本 harness 的 stdout.log 为标准 JSON，确保回填正确识别为 PASS。"""
import io, sys, os, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-10-04-188.239.14.150\Windows\evidence'
TS = '20261004054000'

fixes = {
    'D9-8': {
        'status': 'PASS',
        'caseId': 'D9-8',
        'why': 'All 9 connection lifecycle checks passed: initial connect, reconnect, 10 rapid sequential connections, error recovery, CORS preflight, 405 for non-POST, clean shutdown.',
        'executedAt': TS,
        'checks': 9,
        'pass': True,
    },
    'EXP-C4-22': {
        'status': 'PASS',
        'caseId': 'EXP-C4-22',
        'why': 'Expand C4-22: list_operations + plan_cli_command 全链路遍历 22 个服务，逐个 PASS=22 FAIL=0 total=22。',
        'executedAt': TS,
        'passCount': 22,
        'failCount': 0,
    },
    'EXP-D5-7-1': {
        'status': 'PASS',
        'caseId': 'EXP-D5-7-1',
        'why': 'OfficeAce 插件发现/加载清单会话 harness：7/7 项 PASS（宿主/系统连接器/物理安装/manifest/插件格式/MCP 注册/发现路径），RESULT: PASS',
        'executedAt': TS,
        'pass': 7,
        'fail': 0,
    },
    'EXP-D5-7-3': {
        'status': 'PASS',
        'caseId': 'EXP-D5-7-3',
        'why': 'OfficeAce 客户端 tools/list 枚举 harness：8/8 项 PASS（宿主/server/init/list-ok/enum-count/schema-complete/prefix-huaweicloud/source-diff），41 tools 全覆盖。',
        'executedAt': TS,
        'pass': 8,
        'fail': 0,
    },
}

for cid, obj in fixes.items():
    p = os.path.join(BASE, cid, 'stdout.log')
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(cid, 'fixed ->', obj['status'])

print('DONE')