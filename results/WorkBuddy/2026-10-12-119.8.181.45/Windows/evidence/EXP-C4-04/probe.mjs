// EXP-C4-04: RDS (hcloud:RDS) 真云只读规划验证探针
// 执行时间: 20261012182355
// 区域: cn-north-4
// 只读操作: hcloud RDS ListInstances --cli-region=cn-north-4
// 结果: status=PASS, readOpOk=True, count=0
// 证据文件: list_operations.txt, readonly_plan.log, pre_snapshot.json, post_snapshot.json
// 轻量创建: SKIP - RDS实例创建耗时>10分钟且按小时计费，无法即时释放归零，仅做只读规划
// 状态: PASS (只读规划验证通过)
