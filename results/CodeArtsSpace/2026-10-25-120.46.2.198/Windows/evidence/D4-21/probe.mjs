// D4-21: hook_check_artifacts 宽泛 IAM policy 拦截
// MCP: huaweicloud_hook_check_artifacts([{path:"broad-iam-policy.json", content:"{Action:*,Resource:*}"}])
// 结果: decision=deny, rule=hwc-iam-admin-policy