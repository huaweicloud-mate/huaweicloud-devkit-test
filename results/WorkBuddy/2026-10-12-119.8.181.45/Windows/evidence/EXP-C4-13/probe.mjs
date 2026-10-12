// EXP-C4-13: SMN (hcloud:SMN) 真云只读规划验证探针
// 执行时间: 20261012182355
// 区域: cn-north-4
// 只读操作: hcloud SMN ListTopics --cli-region=cn-north-4
// 结果: status=PASS, readOpOk=True, count=1
// 证据文件: list_operations.txt, readonly_plan.log, pre_snapshot.json, post_snapshot.json
// 轻量创建: createOk=True, deleteOk=True, verifyZero=True
// 创建命令: hcloud SMN CreateTopic --name=hdk_test_d3c4_20261012182355 --display_name=hdk_test_d3c4
// 归零验证: see verify_zero.log, create_delete.log
