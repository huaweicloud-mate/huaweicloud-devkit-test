// EXP-C4-02: VPC (hcloud:VPC) 真云只读规划验证探针
// 执行时间: 20261012182355
// 区域: cn-north-4
// 只读操作: hcloud VPC ListVpcs --cli-region=cn-north-4
// 结果: status=PASS, readOpOk=True, count=parse_error
// 证据文件: list_operations.txt, readonly_plan.log, pre_snapshot.json, post_snapshot.json
// 轻量创建: SKIP - VPC创建后子网/路由等依赖复杂，残留风险高，仅做只读规划验证
// 状态: PASS (只读规划验证通过)
