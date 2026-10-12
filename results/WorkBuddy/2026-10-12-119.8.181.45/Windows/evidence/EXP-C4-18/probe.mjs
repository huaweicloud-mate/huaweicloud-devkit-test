// EXP-C4-18: DEW (hcloud:KMS) 真云只读规划验证探针
// 执行时间: 20261012182355
// 区域: cn-north-4
// 只读操作: hcloud KMS ListKeys --cli-region=cn-north-4
// 结果: status=PASS, readOpOk=True, count=3
// 证据文件: list_operations.txt, readonly_plan.log, pre_snapshot.json, post_snapshot.json
// 轻量创建: createOk=True, deleteOk=True, verifyZero=True
// 创建命令: hcloud KMS CreateKey --key_alias=hdk-test-d3c4-20261012182355
// 归零验证: see verify_zero.log, create_delete.log
