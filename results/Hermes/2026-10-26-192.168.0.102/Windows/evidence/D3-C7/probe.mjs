// Hermes/Windows 真云 E2E D3-C7
// status: PASS (源码级)
// 跨区域资源操作引导(源码级): plan_cli_command 注册且解析 --cli-region(hcloud-cli.mjs:154 regionArg 提取), flavor/image/subnet/VPC 引导均注入 --cli-region(hcloud-cli.mjs:753-756); list_regions/get_regional_availability 已注册(共46工具)。跨区域 EIP 创建-释放真机步骤(tctest- 前缀归零)本次 daily 未执行(P1真云E2E)。
