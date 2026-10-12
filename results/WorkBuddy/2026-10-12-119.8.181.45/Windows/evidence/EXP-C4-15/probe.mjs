// EXP-C4-15: WAF (hcloud:WAF) 真云只读规划验证探针
// 执行时间: 20261012182355
// 区域: cn-north-4
// 只读操作: hcloud WAF ListHost --cli-region=cn-north-4
// 结果: status=PASS, readOpOk=True, count=0
// 证据文件: list_operations.txt, readonly_plan.log, pre_snapshot.json, post_snapshot.json
// 轻量创建: SKIP - WAF域名防护需已备案域名且策略残留有安全影响，仅做只读规划
// 状态: PASS (只读规划验证通过)
