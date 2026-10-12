// EXP-C4-21: EIP (hcloud:EIP) 真云只读规划验证探针
// 执行时间: 20261012182355
// 区域: cn-north-4
// 只读操作: hcloud EIP ListPublicIps --cli-region=cn-north-4
// 结果: status=PASS, readOpOk=True, count=parse_error
// 证据文件: list_operations.txt, readonly_plan.log, pre_snapshot.json, post_snapshot.json
// 轻量创建: SKIP - EIP创建后按带宽计费且残留会持续计费，仅做只读规划验证
// 状态: PASS (只读规划验证通过)
