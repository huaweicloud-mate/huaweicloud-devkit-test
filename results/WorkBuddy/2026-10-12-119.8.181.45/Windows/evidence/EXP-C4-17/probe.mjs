// EXP-C4-17: ModelArts (hcloud:ModelArts) 真云只读规划验证探针
// 执行时间: 20261012182355
// 区域: cn-north-4
// 只读操作: hcloud ModelArts ListNotebooks --cli-region=cn-north-4
// 结果: status=PASS, readOpOk=True, count=0
// 证据文件: list_operations.txt, readonly_plan.log, pre_snapshot.json, post_snapshot.json
// 轻量创建: SKIP - ModelArts notebook按小时计费且需OBS依赖，仅做只读规划
// 状态: PASS (只读规划验证通过)
