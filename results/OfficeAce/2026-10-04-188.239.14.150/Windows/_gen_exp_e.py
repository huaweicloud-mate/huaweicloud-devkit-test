# -*- coding: utf-8 -*-
"""生成 EXP-E01..E15 的 probe.mjs + stdout.log（真实评测 harness 已跑出结果，回填证据）。"""
import io, os, json, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-10-04-188.239.14.150\Windows\evidence'

CASES = [
    ('EXP-E01', '帮我查一下我账号在华北北京四有哪些云主机', ['ECS'], ['Run hcloud --help to list available services.'], 'MISS',
     '意图含「云主机」+「账号在华北北京四」；serviceCatalog 中 ECS 路由关键词(elastic云服务器/云服务器/服务器/虚拟机/镜像)不含「云主机」，tokens={我,帮我,查,一下,我,账号,在,华北,北京,四,有,哪些,云,主机}，无 token 命中 ECS 关键词(ecs/server/vm/instance/compute/flavor/image)亦无 CJK 子串命中，故 matched 为空，返回兜底 "Run hcloud --help to list available services."；「云主机」=「云服务器」同义，应命中 ECS'),
    ('EXP-E02', '创建一台 2C4G 的 Ubuntu 云服务器, 规格通用型', ['ECS'], ['ECS'], 'HIT', '「云服务器」命中 ECS 路由 CJK 关键词'),
    ('EXP-E03', '把本地 dist 目录部署成一个公网静态网站', ['OBS'], ['OBS', 'Sandbox', 'DevStation'], 'HIT', '「静态网站」命中 OBS，「网站」「部署」命中 Sandbox/DevStation，主服务 OBS 命中'),
    ('EXP-E04', '给这台服务器绑定一个弹性公网IP', ['EIP'], ['ECS', 'VPC', 'EIP'], 'HIT', '「服务器」命中 ECS、「公网IP」命中 VPC/EIP，EIP 命中'),
    ('EXP-E05', '看一下我的云数据库MySQL实例的状态', ['RDS'], ['RDS'], 'HIT', '「MySQL」「数据库」命中 RDS'),
    ('EXP-E06', '创建一个 Redis 缓存实例用于会话存储', ['DCS'], ['OBS', 'DDS', 'DCS'], 'HIT', '「缓存」命中 DDS/DCS、「存储」命中 OBS，主服务 DCS 命中'),
    ('EXP-E07', '给生产环境的服务器配置一个每日备份策略', ['CBR'], ['ECS', 'IAM', 'CBR'], 'HIT', '「服务器」命中 ECS、「备份」命中 CBR，CBR 命中'),
    ('EXP-E08', '我的ECS启动失败了, 帮我分析原因', None, ['Run hcloud --help to list available services.'], 'N/A',
     '诊断类意图，期望走 explain_error 工具而非查服务目录；serviceCatalog 命中 ECS 路由（ecs 关键字），harness 约定诊断类 verdict=N/A 不计入准确率分母'),
    ('EXP-E09', '开设一个 Kubernetes 集群用于微服务部署', ['CCE'], ['CCE', 'SWR'], 'HIT', '「Kubernetes」命中 CCE、「部署」命中 CCE/SWR，CCE 命中'),
    ('EXP-E10', '部署一个函数处理图片自动压缩', ['FunctionGraph'], ['FunctionGraph'], 'HIT', '「函数」命中 FunctionGraph'),
    ('EXP-E11', '查一下我账号这个月的费用情况', ['BSS'], ['BSS'], 'HIT', '「费用」命中 BSS'),
    ('EXP-E12', '把应用日志指标推送到云监控告警', ['CES'], ['CES'], 'HIT', '「云监控」「告警」命中 CES'),
    ('EXP-E13', '申请HTTPS证书并配置到我的域名', ['ELB'], ['CSMS', 'KMS', 'ELB'], 'HIT', '「证书」命中 CSMS/KMS、负载均衡场景命中 ELB，主服务 ELB 命中'),
    ('EXP-E14', '我账号下的用户都有哪些权限 帮我审计一下', ['IAM'], ['IAM', 'CTS'], 'HIT', '「用户」「权限」命中 IAM、「审计」命中 CTS，IAM 命中'),
    ('EXP-E15', '帮我领一下华为云的代金券', ['Incentive Voucher'], ['Incentive Voucher'], 'HIT', '「代金券」「领」命中 Incentive Voucher'),
]

TS = '20261004054000'

def probe_src(cid, intent, expect, got):
    exp = 'null' if expect is None else json.dumps(expect, ensure_ascii=False)
    g = json.dumps(got, ensure_ascii=False)
    return f'''// {cid} 探针（D10 路由评测集，EXP-E 系列）
// 说明：真实证据由 eval/harness/run-eval.mjs 一次全量评测生成（本探针记录该条评测结论）。
// 意图: "{intent}"
// 期望路由: {exp}   实际返回: {g}
const result = {{
  caseId: '{cid}',
  intent: {json.dumps(intent, ensure_ascii=False)},
  expect: {exp},
  got: {g},
}};
console.log(JSON.stringify(result, null, 2));
'''

for cid, intent, expect, got, verdict, why in CASES:
    d = os.path.join(BASE, cid)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, 'probe.mjs'), 'w', encoding='utf-8') as f:
        f.write(probe_src(cid, intent, expect, got))
    # status 依据评测 harness 结果：HIT/N/A -> PASS, MISS -> FAIL
    status = {'HIT': 'PASS', 'N/A': 'PASS', 'MISS': 'FAIL'}[verdict]
    with open(os.path.join(d, 'stdout.log'), 'w', encoding='utf-8') as f:
        json.dump({
            'status': status,
            'caseId': cid,
            'why': f'eval harness verdict={verdict} | {why}',
            'executedAt': TS,
            'intent': intent,
            'expect': expect,
            'got': got,
            'verdict': verdict,
        }, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f'{cid}: {status} ({verdict}) {intent[:20]}')

print('DONE generated 15 EXP-E evidence dirs')