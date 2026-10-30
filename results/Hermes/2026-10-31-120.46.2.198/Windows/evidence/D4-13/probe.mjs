// D4-13: 只读子账号最小权限（--cli-access-key/--cli-secret-key 直连）
// 断言：读 ECS/VPC 成功 + 写 VPC 被 IAM 拒绝
// 只读 AK/SK 从 credentials.readonly.json 读取，不落盘、不打印