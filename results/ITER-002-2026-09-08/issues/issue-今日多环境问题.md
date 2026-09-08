# 已提交：issue #530（2026-09-08）——https://github.com/huaweicloud/huaweicloud-devkit/issues/530

# 标题
[Bug/多环境] Linux ARM64 下 KooCLI 缺少 BSS 服务（余额查询不可用）+ README 版本/分支同步 + MCP 参数校验宽松

# 概述
2026-09-08 在 4 台 Linux ARM64 测试机（Ubuntu 24.04，KooCLI 7.2.12）+ Windows 环境做的多机真机验证，发现以下问题（按优先级分层）。

# P1：Linux ARM64 环境的 KooCLI 不支持 BSS 服务（余额/成本查询不可用）

- **现象**：`hcloud BSS ShowCustomerAccountBalances` 在 **4 台独立 Linux ARM64 机器**（zhangshuang 113.44.143.91 / testbot1/2/3, Ubuntu 24.04, KooCLI 7.2.12）全部返回 `[USE_ERROR] Unsupported service: BSS`；**同一账号、同版本 7.2.12 的 Windows 版 KooCLI 正常支持 BSS**
- **影响**：Linux 环境下 huaweicloud-devkit 的**余额/成本相关能力不可用**（余额关卡话术依赖 BSS 数据；DSH 等 Linux 部署场景无法查询余额）——已验证影响 huawei-iac 手测 5A/6A 等场景
- **复现**：`hcloud BSS ShowCustomerAccountBalances --cli-region=cn-north-1 --cli-domain-id=xxx`（Linux ARM64 必现；Windows 正常）
- **疑似根因**：KooCLI ARM64 构建的服务清单缺失 BSS（构建差异）或在线服务元数据未拉取
- **建议**：① 反馈 KooCLI 补齐 ARM64 版 BSS 服务 ② devkit 在 Linux 检测到 BSS 缺失时提示/走 SDK 兜底 ③ 文档标注平台差异

# P3：README 版本 badge 过时 + dev/main 分支同步缺失

- **badge**：README.md / README.zh-CN.md 均显示 `beta-v1.1.0`，而 **1.1.1 已正式发布**（2026-09-07 14:35）且 `plugin.json` 已为 1.1.1——唯一未同步之处
- **dev/main 分叉**：`Cursor Directory Plugin` 一节（含 `plugin.json`/`mcp.json`/`skills/`/`rules/` 说明）**只在 main 分支**（47dce71 合入），**dev 分支完全缺失**——后续 dev 上改 README 存在覆盖/丢失风险；仓库根级 `plugin.json`/`mcp.json` 亦仅 main 存在
- **建议**：发布清单增加 badge 版本同步检查；将 Cursor 内容合入 dev（或明确双分支维护策略）

# P3：MCP 工具参数类型未严格校验（OBS-3）

- **现象**：`huaweicloud_check_cli` 传入 `timeoutMs: "not-a-number"`（字符串）被**宽松容忍并正常执行**（无类型错误提示）
- **建议**：输入 schema 增加类型校验或运行期类型断言（防无效参数静默通过）

# 环境备注
- 4 台 Linux：Ubuntu 24.04 ARM64 / Node 22.23.2 / huaweicloud-devkit 1.1.1 / KooCLI 7.2.12
- Windows：KooCLI 7.2.12（BSS 正常）
- 全部为只读验证，未创建/删除任何资源

# 附件/复现脚本
- `remote-readmatrix.py` / `remote-1machine.py`（多机全链与只读矩阵，见测试归档仓库）
- README 一致性检查：`check_readme_consistency.py`（badge/分支/命令/编码 4 项）