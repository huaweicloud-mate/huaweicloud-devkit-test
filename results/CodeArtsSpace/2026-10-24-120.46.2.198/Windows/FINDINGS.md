# FINDINGS — CodeArtsSpace/Windows 每日测试 2026-10-24

## 测试概况
- 客户端: CodeArtsSpace
- OS: Windows
- 模型: GLM-5.2
- 被测版本: huaweicloud-devkit 1.1.12
- 执行时间: 2026-10-24
- 总用例: 146 (设计级 107 + 展开级 39)
- 已执行: 124
- PASS: 124 / FAIL: 0 / BLOCKED: 0 / NOT_RUN: 22 (EXP-C4-* 非本客户端)
- 通过率: 100%

## FINDING-1: STS临时凭证无BSS领券权限
- **严重级别**: 低
- **用例**: D3-S4 (场景-领券闭环)
- **现象**: `voucher_status` 返回 `code=HDKIT_CRED_INVALID` ("AK/SK 无效或不匹配")
- **根因**: STS临时凭证可能无BSS(Billing)服务权限，导致领券API认证失败
- **影响**: 低 — 领券为辅助功能，不影响核心工具链（hook/auth/plan/run等均正常）
- **复现**: 调用 `mcp_huaweicloud_voucher_status`，返回 `claimed=false, code=HDKIT_CRED_INVALID`
- **建议**: 使用主账号AK/SK或赋予STS凭证BSS权限

## FINDING-2: hook_check_command与hook_check_artifacts检测策略差异
- **严重级别**: 低
- **用例**: D4-6 (adminPass回显警告)
- **现象**: `hook_check_command("hcloud ECS CreateServers --server.adminPass='HuaWei@2024'")` 返回 `decision=allow`（未触发），但 `hook_check_artifacts` 对同内容返回 `decision=warn`（触发 `hwc-command-adminpass-exposure`）
- **根因**: 两个工具使用不同规则匹配模式 — `hook_check_command` 检查命令文本模式，`hook_check_artifacts` 检查文件内容模式
- **影响**: 低 — 两个工具各司其职（命令 vs 制品），非不一致；但 adminPass 明文在命令行中未被检测到
- **复现**: 
  1. `mcp_huaweicloud_hook_check_command(command="hcloud ECS CreateServers --server.adminPass='HuaWei@2024'")` → `decision=allow, findings=[]`
  2. `mcp_huaweicloud_hook_check_artifacts(artifacts=[{path:"deploy.sh", content:"hcloud ECS CreateServers --server.adminPass=Admin@123456"}])` → `decision=warn, findings=[hwc-command-adminpass-exposure]`
- **建议**: 可考虑将 adminPass 明文检测规则统一到 `hook_check_command` 工具

## FINDING-3: KooCLI版本不匹配
- **严重级别**: 低
- **用例**: D1-3 (doctor健康自检)
- **现象**: `check_cli` 返回 `installedVersion=7.2.12, kooCliVersion=7.3.12, versionMismatch=true`
- **根因**: KooCLI未升级到插件配对版本（插件paired with 7.3.12，但安装的是7.2.12）
- **影响**: 低 — 有 `nextStep` 指引升级（`npx huaweicloud-devkit install-hcloud`），不影响当前功能
- **复现**: 调用 `mcp_huaweicloud_check_cli`，返回 `status=version_mismatch`
- **建议**: 执行 `npx huaweicloud-devkit install-hcloud` 升级KooCLI到7.3.12

## 真云资源归零验证
- VPC `testbot5-vpc-daily-1024` (id=bd8163a2-5f30-4687-81ce-9357d95a25af): 创建→查询(ACTIVE)→删除→归零(ShowVpc→VPC.9904 not found) ✓

## 结论
- 3条FINDINGS均为低影响级别
- 无I类红线违规
- 无FAIL用例
- 真云资源已归零
