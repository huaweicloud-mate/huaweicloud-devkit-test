// AI生成
// D1-4: status/update 幂等性验证
// 1. 运行 status 命令，验证安装状态
// 2. 运行 update 命令，验证用户配置不被修改（MCP config unchanged）
// 3. 再次运行 update，验证幂等性（输出一致，配置仍 unchanged）
// 命令: npx huaweicloud-devkit status && npx huaweicloud-devkit update && npx huaweicloud-devkit update
// 验证点:
//   - status exit 0, 显示所有已安装 agent
//   - update exit 0, 所有 MCP config 标记 "unchanged"
//   - 第二次 update exit 0, 输出结构与第一次一致, MCP config 仍 "unchanged"
