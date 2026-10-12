// EXP-C4-08: IAM (hcloud:IAM) 真云只读规划验证探针
// 执行时间: 20261012182355
// 区域: cn-north-4
// 只读操作: hcloud IAM KeystoneListUsers --cli-region=cn-north-4
// 结果: status=PASS, readOpOk=True, count=2
// 证据文件: list_operations.txt, readonly_plan.log, pre_snapshot.json, post_snapshot.json
// 轻量创建: SKIP - IAM为全局服务，创建用户/委托有安全风险且无法自动归零，仅做只读规划
// 状态: PASS (只读规划验证通过)
