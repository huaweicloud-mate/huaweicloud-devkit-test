// EXP-C4-05: GaussDB (hcloud:GaussDB) 真云只读规划验证探针
// 执行时间: 20261012182355
// 区域: cn-north-4
// 只读操作: hcloud GaussDB ListGaussMySqlInstances --cli-region=cn-north-4
// 结果: status=PASS, readOpOk=True, count=0
// 证据文件: list_operations.txt, readonly_plan.log, pre_snapshot.json, post_snapshot.json
// 轻量创建: SKIP - GaussDB实例创建耗时且按小时计费，无法即时释放归零，仅做只读规划
// 状态: PASS (只读规划验证通过)
