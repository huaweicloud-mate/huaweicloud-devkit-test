// EXP-C4-09: CTS (hcloud:CTS) 真云只读规划验证探针
// 执行时间: 20261012182355
// 区域: cn-north-4
// 只读操作: hcloud CTS ListTraces --cli-region=cn-north-4
// 结果: status=PASS, readOpOk=True, count=10
// 证据文件: list_operations.txt, readonly_plan.log, pre_snapshot.json, post_snapshot.json
// 轻量创建: SKIP - CTS追踪器创建为全局操作影响所有资源审计，仅做只读规划验证
// 状态: PASS (只读规划验证通过)
