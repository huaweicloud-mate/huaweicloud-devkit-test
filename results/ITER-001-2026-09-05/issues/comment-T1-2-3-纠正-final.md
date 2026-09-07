**最终纠正（真云实测，2026-09-07）**：

在**真实云环境**（cn-north-4，真实 hcloud + 真实 OBS）实测此前报告的两个 auth "缺陷"：

1. `auth sync`（MCP `huaweicloud_auth_sync`）→ **ok: true**：OBS 配置写入成功（endpoint 正确）、KooCLI profile 同步成功、11 个 agent 注册目标完整报告——**功能正常**
2. `auth_switch clear`（MCP `huaweicloud_auth_switch action=clear`）→ **status: cleared**：runtime 凭据清空、回退 env/file/S1 后只读命令（NovaListServers）正常执行——**功能正常**

**结论**：此前两轮定性（先 Windows shim、后跨平台 P 类缺陷）均不成立——**产品功能无缺陷**。`npm test` 中这两个用例失败的根因是 **FAKE_HCLOUD mock 无法还原真实 sync/switch 的完整行为**（测试环境敏感性，G 类），建议增强 mock（模拟真实 hcloud 输出结构与凭据回退时序）。此前的"认证是安全根基需优先修复"建议撤回；测试用例修复价值高于产品修复。