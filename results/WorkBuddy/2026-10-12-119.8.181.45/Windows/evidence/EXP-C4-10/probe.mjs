// EXP-C4-10: CES (hcloud:CES) 真云只读规划验证探针
// 执行时间: 20261012182355
// 区域: cn-north-4
// 只读操作: hcloud CES ListMetrics --cli-region=cn-north-4
// 结果: status=PASS, readOpOk=True, count=1000
// 证据文件: list_operations.txt, readonly_plan.log, pre_snapshot.json, post_snapshot.json
// 轻量创建: SKIP - CES告警规则创建需资源关联且残留会误告警，仅做只读规划验证
// 状态: PASS (只读规划验证通过)
