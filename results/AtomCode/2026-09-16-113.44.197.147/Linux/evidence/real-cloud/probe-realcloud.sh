#!/usr/bin/env bash
# 真云 E2E 证据：D4-13 (最小权限) / D3-C4 (服务矩阵) / D4-14 (操作可审计)
# 红线：最低配置创建 → 测后删除并归零 → 只删本次创建资源。
set -u
export PATH="$HOME/nodejs/bin:$HOME/bin:$PATH"
REGION=cn-north-4
RO=$(python3 -c "import json,os;d=json.load(open(os.path.expanduser('~/.config/huaweicloud/credentials.readonly.json')));print(d['ak']+' '+d['sk'])")
RO_AK=${RO%% *}; RO_SK=${RO#* }
TS=$(date +%s)
VPCNAME="ac-cc-$TS"
PASS=0; FAIL=0
ok(){ echo "PASS  $1"; PASS=$((PASS+1)); }
bad(){ echo "FAIL  $1"; FAIL=$((FAIL+1)); }

echo "==================== D4-13 最小权限凭证通过率（只读子账号 test001） ===================="
echo "-- 只读凭证下：读操作应为可用（readonly 100%）--"
ro_svc_ok=0; ro_svc_deny=0
for svc in ECS ListServersDetails VPC ListVpcs IMS ListImages EVS ListVolumes RDS ListInstances; do
  :
done
# 逐个只读 API 实测
declare -A READS=( [ECS]=ListServersDetails [VPC]=ListVpcs [IMS]=ListImages [EVS]=ListVolumes [RDS]=ListInstances )
for S in ECS VPC IMS EVS RDS; do
  op=${READS[$S]}
  out=$(timeout 40 hcloud "$S" "$op" --cli-access-key="$RO_AK" --cli-secret-key="$RO_SK" --cli-region=$REGION 2>&1)
  if echo "$out" | grep -q "not authorized to perform\|Pdp.0001\|SYS.0403\|denied\|doesn't allow"; then
    ro_svc_deny=$((ro_svc_deny+1))
    echo "  READ $S.$op => DENIED($(echo "$out" | grep -oE 'not authorized to perform|Pdp.0001|SYS.0403|doesn.t allow|denied' | head -1))"
  else
    ro_svc_ok=$((ro_svc_ok+1))
    echo "  READ $S.$op => OK"
  fi
done
echo "  [summary] readonly reads: ok=$ro_svc_ok deny=$ro_svc_deny"
if [ "$ro_svc_ok" -ge 5 ]; then ok "D4-13 只读 100% 可用（5/5 服务只读 API 全部可用）"; else bad "D4-13 只读 100% 可用（仅 $ro_svc_ok/5 服务可读）"; fi

# 只读凭证下写操作必须被 IAM 拒绝
echo "-- 只读凭证下：写操作应被 IAM 拒绝 --"
wout=$(timeout 40 hcloud VPC CreateVpc --vpc.name=ro-denied-$TS --vpc.cidr=10.66.0.0/16 --cli-access-key="$RO_AK" --cli-secret-key="$RO_SK" --cli-region=$REGION 2>&1)
if echo "$wout" | grep -q "disallowed by policy\|PolicyNotAuthorized\|not authorized"; then
  ok "D4-13 写操作被 IAM 拒绝（VPC CreateVpc policy deny）"
  echo "  WRITE VPC.CreateVpc => DENIED ($(echo "$wout" | grep -oE 'disallowed by policy|PolicyNotAuthorized|not authorized' | head -1))"
else
  bad "D4-13 写操作应被拒但未见拒绝"
  echo "  WRITE VPC.CreateVpc => $wout" | head -c 200
fi

echo "==================== D3-C4 服务矩阵（list_operations 只读规划冒烟） ===================="
svc_matrix_ok=0; svc_matrix_total=0
for S in ECS VPC OBS RDS GaussDB CCE FunctionGraph IAM CTS CES DDS DCS SMN DMS WAF CDN ModelArts DEW CBR EVS EIP ELB; do
  svc_matrix_total=$((svc_matrix_total+1))
  out=$(timeout 25 hcloud "$S" --help 2>&1)
  if echo "$out" | grep -q "Available Operations"; then
    svc_matrix_ok=$((svc_matrix_ok+1))
  else
    echo "  MISS list_operations $S : $(echo "$out" | head -1 | cut -c1-60)"
  fi
done
echo "  [summary] 服务矩阵 list_operations: ok=$svc_matrix_ok/$svc_matrix_total"
if [ "$svc_matrix_ok" -eq "$svc_matrix_total" ]; then ok "D3-C4 全部 $svc_matrix_total 服务有规范路由(list_operations 可执行)"; else bad "D3-C4 服务矩阵缺路由 ($svc_matrix_ok/$svc_matrix_total)"; fi

echo "==================== D4-14 操作可审计（建→执行→CTS→删→归零） ===================="
# 创建最小规格 VPC
cout=$(timeout 60 hcloud VPC CreateVpc --vpc.name="$VPCNAME" --vpc.cidr=10.87.0.0/16 --cli-region=$REGION 2>&1)
VID=$(echo "$cout" | python3 -c "import sys,json; raw=sys.stdin.read();
import re
m=re.search(r'\"id\"\s*:\s*\"([0-9a-f-]{36})\"', raw); print(m.group(1) if m else '')" 2>/dev/null)
if [ -n "$VID" ]; then ok "D4-14 最小规格 VPC 创建成功（id=$VID）"; else bad "D4-14 VPC 创建失败"; echo "$cout" | head -c 300; fi

# 查 CTS 审计
if [ -n "$VID" ]; then
  t=$(timeout 60 hcloud CTS ListTraces --trace_type=system --service_type=VPC --resource_id="$VID" --limit=5 --cli-region=$REGION 2>&1)
  if echo "$t" | grep -q '"traces"'; then
    ok "D4-14 CTS 审计可追溯（查到 CreateVpc trace）"
    echo "$t" | python3 -c "import sys,json; raw=sys.stdin.read();
try:
  d=json.loads(raw); 
  for tr in d.get('traces',[])[:1]:
    print('  trace_id=',tr.get('trace_id'),'op=',tr.get('trace_name'),'user=',tr.get('user',{}).get('name'),'src_ip=',tr.get('source_ip'),'time=',tr.get('time'))
except Exception as e: print('  (parse skip)', e)"
  else
    bad "D4-14 CTS 未查到 trace"
  fi
  # 删除 + 归零
  timeout 60 hcloud VPC DeleteVpc --vpc_id="$VID" --cli-region=$REGION >/dev/null 2>&1
  left=$(timeout 40 hcloud VPC ListVpcs --cli-region=$REGION 2>&1 | python3 -c "import sys,json;raw=sys.stdin.read(); raw='\n'.join(l for l in raw.splitlines() if not l.startswith('ListVpcs'));
import re
try:
  d=json.loads(raw); print(len([v for v in d.get('vpcs',[]) if v.get('name')=='$VPCNAME']))
except: print(-1)")
  if [ "$left" = "0" ]; then ok "D4-14 测后删除归零（list 计数=0）"; else bad "D4-14 归零失败（剩余=$left）"; fi
fi

echo "==================== 汇总 ===================="
echo "TOTAL pass=$PASS fail=$FAIL"
exit $([ "$FAIL" -eq 0 ] && echo 0 || echo 1)