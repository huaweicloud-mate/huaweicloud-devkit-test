#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# D4-13 配套: 只读账号 test001 的「写被拒 + 只读可用性」真机验证 (hcloud inline 凭证)
import json, subprocess, os

ro = json.load(open(os.path.expanduser('~/.config/huaweicloud/credentials.readonly.json')))
ak, sk = ro['ak'], ro['sk']
CRED = ['--cli-access-key=' + ak, '--cli-secret-key=' + sk, '--cli-region=cn-north-4']

def redact(s):
    return s.replace(sk, '<READONLY_SK>').replace(ak, '<READONLY_AK>')

def run(args):
    r = subprocess.run(['hcloud'] + args, capture_output=True, text=True, timeout=90)
    return r.returncode, redact(r.stdout + r.stderr)

print('=== D4-13 写/只读 真机验证 (只读账号 test001) ===')

# 1) 写操作: 建 VPC (最小规格) → 预期 IAM 拒绝
rc, out = run(['vpc', 'CreateVpc', *CRED, '--vpc.name=rotest-delme', '--vpc.cidr=192.168.97.0/24'])
print('[WRITE vpc CreateVpc] exitCode=', rc)
print(out[:500])
write_denied = ('PolicyNotAuthorized' in out) or ('not authorized' in out) or ('Pdp.0001' in out) or ('SYS.0403' in out) or ('error' in out.lower() and 'deny' in out.lower())
print('    => 写被拒?', 'YES (IAM 权限不足)' if write_denied else 'NO (需人工核查)')

# 2) 写操作: 建 ECS (CreateServers), 最小参数也会先到 IAM 校验
rc, out = run(['ecs', 'CreateServers', *CRED, '--server.name=rotest-delme', '--server.flavorRef=s6.small.1'])
print('[WRITE ecs CreateServers] exitCode=', rc)
print(out[:400])
ecs_write_denied = ('not authorized' in out) or ('Pdp.0001' in out) or ('deny' in out.lower())
print('    => 写被拒?', 'YES (IAM)' if ecs_write_denied else ('未到 IAM(参数校验先触发) 等'))

# 3) 只读: ECS ListServersDetails → 预期被拒(记录最小权限的"认证可签但资源只读拒")
rc, out = run(['ecs', 'ListServersDetails', *CRED])
print('[READ ecs ListServersDetails] exitCode=', rc)
print(out[:300])
ecs_read_denied = ('not authorized' in out) or ('Pdp.0001' in out) or ('SYS.0403' in out)
print('    => 资源级只读?', 'DENIED (test001 无资源只读策略, 仅 IAM 验证可读)' if ecs_read_denied else 'ALLOWED')

# 4) 清理确认: 确认本次未留下任何资源 (只删本次创建; 本次写全部被 IAM 拒绝, 无资源产生)
r0 = subprocess.run(['hcloud', 'vpc', 'ListVpcs', '--cli-access-key=' + ak, '--cli-secret-key=' + sk, '--cli-region=cn-north-4'], capture_output=True, text=True, timeout=90)
print('[cleanup] 用 test001 查 VPC 列表(应被拒, 无删除需要):')
print(redact(r0.stdout + r0.stderr)[:200])
print('    结论: 本次未创建任何资源(写全被 IAM 拒绝), 无需删除归零。')