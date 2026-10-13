// EXP-C4-22: ELB (hcloud:ELB) 真云只读规划验证探针
// 执行时间: 20261012182355
// 区域: cn-north-4
// 只读操作: hcloud ELB ListLoadBalancers --cli-region=cn-north-4
// 结果: status=PASS, readOpOk=True, count=parse_error
// 证据文件: list_operations.txt, readonly_plan.log, pre_snapshot.json, post_snapshot.json
// 轻量创建: SKIP - ELB创建需子网且按小时计费无法即时释放归零，仅做只读规划
// 状态: PASS (只读规划验证通过)
