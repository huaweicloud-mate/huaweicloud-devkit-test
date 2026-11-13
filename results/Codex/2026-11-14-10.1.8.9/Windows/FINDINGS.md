# FINDINGS - Codex-GPT-5

> 生成时间：2026-11-14（北京时间）
> 被测版本：huaweicloud-devkit@1.1.14-next.5，gitHead 4fb59d76

## #1【P0】D2-4 凭证脱敏正确性

- **现象**：脱敏探针仍返回测试 AK/SK 明文。
- **断言**：`redactSecrets` 对 AK、SK、token 输入不得在返回值中保留原始秘密。
- **根因**：`hdk/plugins/huaweicloud-core/src/safety-policy.mjs:34-68` 的字符串/对象脱敏规则未覆盖本探针使用的凭证字段形态。
- **影响**：认证状态或工具输出可能泄漏凭证。
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待提单

## #2【P0】D4-16 命令包裹穿透

- **现象**：MCP 包裹命令探针对 shell wrapper 返回 `decision=allow`。
- **断言**：`powershell/sh/bash -c` 包裹的高风险 hcloud 写命令必须被 deny 或要求确认。
- **根因**：`hdk/plugins/huaweicloud-core/src/safety-policy.mjs:411-530` 的 wrapper 解包路径未覆盖该 MCP 输入形态。
- **影响**：攻击者可通过命令包装绕过写操作安全策略。
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单

## #3【P1】D4-27 双路径输出脱敏

- **现象**：同时包含 stdout/stderr 的输入仍返回 `AKID123`、`SK1234567890abcdef`、`STSTOKEN1`。
- **断言**：stdout 和 stderr 两条输出路径均不得保留原始 AK/SK/token。
- **根因**：`hdk/plugins/huaweicloud-core/src/safety-policy.mjs:34-68` 的递归脱敏规则与该双路径字段组合不匹配。
- **影响**：错误输出或诊断日志可能泄漏凭证。
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：待提单

## #4【P1】D8-4 安装包缺少 INSTALL.md

- **现象**：安装包机械检查找不到 `INSTALL.md`。
- **断言**：发布包应包含指南引用的 `INSTALL.md`，或 CLI 应提供等价可执行安装步骤。
- **根因**：`hdk/package.json:1-80` 的发布文件清单未将仓库根目录 `INSTALL.md` 纳入 npm 包。
- **影响**：用户无法按发布包内文档完成安装。
- **证据**：`evidence/D8-4/stdout.log`
- **状态**：待提单

## #5【P1】D9-2 JSON-RPC 错误码

- **现象**：协议错误码探针与预期错误码契约不一致。
- **断言**：参数错误、未知方法和内部错误必须分别返回约定的 JSON-RPC 错误码。
- **根因**：`hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs:78-114` 的错误映射仍存在契约不一致。
- **影响**：客户端无法稳定区分参数错误、方法错误和服务端错误。
- **证据**：`evidence/D9-2/stdout.log`
- **状态**：待提单

## #6【P1】EXP-E01 服务目录路由缺失

- **现象**：查询华北北京四云主机返回帮助提示，未推荐 ECS。
- **断言**：该意图的 `recommendedServices` 必须包含 `ECS`。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:2358-2620` 的 `serviceCatalog` 规则未覆盖该中文查询表达。
- **影响**：用户无法从自然语言意图进入正确服务工具。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单

## #7【P1】EXP-E02 服务目录路由回归

- **现象**：单条 serviceCatalog 探针未返回 ECS。
- **断言**：创建 2C4G Ubuntu 云服务器意图必须命中 ECS。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:2358-2620` 的服务匹配规则在当前 MCP 调用路径未稳定返回 ECS。
- **证据**：`evidence/EXP-E02/stdout.log`
- **状态**：待提单

## #8【P1】EXP-E03 服务目录路由回归

- **现象**：静态网站部署意图未稳定命中 OBS。
- **断言**：静态网站部署意图的 `recommendedServices` 必须包含 `OBS`。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:2358-2620` 的部署意图分支在当前调用路径未稳定返回 OBS。
- **证据**：`evidence/EXP-E03/stdout.log`
- **状态**：待提单

## #9【P1】EXP-E04 服务目录路由回归

- **现象**：绑定弹性公网 IP 意图未稳定命中 EIP。
- **断言**：绑定公网 IP 意图必须包含 `EIP`。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:2358-2620` 的 EIP 意图匹配在当前调用路径未稳定返回 EIP。
- **证据**：`evidence/EXP-E04/stdout.log`
- **状态**：待提单

## #10【P1】EXP-E05 服务目录路由回归

- **现象**：查询 MySQL 实例状态意图未稳定命中 RDS。
- **断言**：MySQL 实例状态查询必须包含 `RDS`。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:2358-2620` 的 RDS 意图匹配在当前调用路径未稳定返回 RDS。
- **证据**：`evidence/EXP-E05/stdout.log`
- **状态**：待提单

## #11【P1】EXP-E07 服务目录路由回归

- **现象**：每日备份策略意图未稳定命中 CBR。
- **断言**：备份策略意图必须包含 `CBR`。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:2358-2620` 的 CBR 意图匹配在当前调用路径未稳定返回 CBR。
- **证据**：`evidence/EXP-E07/stdout.log`
- **状态**：待提单

## #12【P1】EXP-E10 服务目录路由回归

- **现象**：图片压缩函数部署意图未稳定命中 FunctionGraph。
- **断言**：函数部署意图必须包含 `FunctionGraph`。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:2358-2620` 的函数部署匹配在当前调用路径未稳定返回 FunctionGraph。
- **证据**：`evidence/EXP-E10/stdout.log`
- **状态**：待提单

## #13【P1】EXP-E11 服务目录路由回归

- **现象**：费用查询意图未稳定命中 BSS。
- **断言**：费用查询意图必须包含 `BSS`。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:2358-2620` 的 BSS 意图匹配在当前调用路径未稳定返回 BSS。
- **证据**：`evidence/EXP-E11/stdout.log`
- **状态**：待提单

## #14【P1】EXP-E12 服务目录路由回归

- **现象**：监控告警意图未稳定命中 CES。
- **断言**：云监控告警意图必须包含 `CES`。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:2358-2620` 的 CES 意图匹配在当前调用路径未稳定返回 CES。
- **证据**：`evidence/EXP-E12/stdout.log`
- **状态**：待提单

## #15【P1】EXP-E13 服务目录路由回归

- **现象**：HTTPS 证书配置意图未稳定命中 ELB。
- **断言**：证书配置意图必须包含 `ELB`。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:2358-2620` 的 ELB 意图匹配在当前调用路径未稳定返回 ELB。
- **证据**：`evidence/EXP-E13/stdout.log`
- **状态**：待提单

## #16【P1】EXP-E14 服务目录路由回归

- **现象**：权限审计意图未稳定命中 IAM。
- **断言**：权限审计意图必须包含 `IAM`。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:2358-2620` 的 IAM 意图匹配在当前调用路径未稳定返回 IAM。
- **证据**：`evidence/EXP-E14/stdout.log`
- **状态**：待提单
