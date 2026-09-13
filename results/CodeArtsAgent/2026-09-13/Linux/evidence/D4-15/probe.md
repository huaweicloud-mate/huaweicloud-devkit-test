# D4-15 hook绕过尝试 (大小写变体)
工具: huaweicloud_hook_check_command
命令(小写服务名变体): hcloud ecs DeleteServer --server_id i-123456

补充: 发现命令替换 + ANSI-C quoting 绕过。根因 risk-rule-engine.mjs:50-53 conditionMatches 纯正则匹配，
hwc-destructive-delete-operation 规则 (cloud-risk-rules.json) 正则 "hcloud\s+\w+\s+(\w*Delete\w*)" 要求三段式，
$(...) 命令替换与 $'E\x43S' 编码破坏 "hcloud <service> <op>" 匹配 -> allow。
