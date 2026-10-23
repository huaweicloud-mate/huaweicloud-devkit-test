// D2-11: auth_switch persist+securityToken 拒绝落盘
// MCP: huaweicloud_auth_switch(action=persist, securityToken=ATESTTOKEN123)
// 结果: needs_confirmation => auth_confirm(s1) => aborted
// 凭证文件不含 token: true