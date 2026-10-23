// D4-28: hooks.json Node 版安全 hook 链路
// hooks.json 注册: node "${CLAUDE_PLUGIN_ROOT}/hooks/huaweicloud-safety.mjs"
// matcher: Bash + mcp__.*huaweicloud.*
// 高危命令 deny 验证: cat credentials => deny, printenv HW_SECRET_ACCESS_KEY => deny