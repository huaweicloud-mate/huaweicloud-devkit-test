// EXP-C4-19: CBR (hcloud:CBR) 真云只读规划验证探针
// 执行时间: 20261012182355
// 区域: cn-north-4
// 只读操作: hcloud CBR ListVault --cli-region=cn-north-4
// 结果: status=PASS, readOpOk=True, count=0
// 证据文件: list_operations.txt, readonly_plan.log, pre_snapshot.json, post_snapshot.json
// 轻量创建: SKIP - CBR保管库创建后需绑定资源才能备份且按需计费，仅做只读规划
// 状态: PASS (只读规划验证通过)
