# FINDINGS — 缺陷发现清单（OfficeAce-glm-5.2）

> **落盘路径**：`results/OfficeAce/2026-10-16-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：`2026-10-16 09:46:00`（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式必须严格遵循。

---

## #1【P0】D2-4 JSON 凭证脱敏失效

- **现象**：`redactString('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234"}')` 返回明文 ak/sk
- **断言**：redactString 对 JSON 格式中的 ak/sk 字段应替换为 `<redacted>`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` redactString 函数对 JSON 格式凭证的脱敏正则不完整，未覆盖 JSON key-value 形式
- **影响**：凭证可能以明文形式出现在日志/响应中，存在安全风险
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待提单

## #2【P0】D4-16 sh wrap 命令绕过安全检查（MCP 层）

- **现象**：MCP 层 `hook_check_command` 对 `sh -c "cat credentials.json"` 返回 `allow`
- **断言**：`sh -c` 包装的凭证读取命令应返回 `deny`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` wrap 检测逻辑未覆盖 `sh -c` 包装形式
- **影响**：攻击者可通过 sh wrap 绕过安全检查读取凭证
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单

## #3【P1】D4-27 双路径脱敏不完整

- **现象**：redactString 对 `{"ak":"...","sk":"...","token":"..."}` 中 token 字段未脱敏
- **断言**：redactString 应对 ak/sk/token 三字段均脱敏为 `<redacted>`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` redactString 脱敏字段列表缺少 token
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：待提单

## #4【P1】EXP-E01 serviceCatalog 路由 MISS

- **现象**：中文意图"创建ECS"经 serviceCatalog 路由未命中 ECS skill
- **断言**：serviceCatalog 应将 ECS 相关意图路由到 huawei-ecs skill
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 路由层中文意图匹配率不足
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单

## #5【P1】EXP-E02 serviceCatalog 路由 MISS

- **现象**：中文意图"创建VPC"经 serviceCatalog 路由未命中 VPC skill
- **断言**：serviceCatalog 应将 VPC 相关意图路由到 huawei-vpc skill
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 路由层中文意图匹配率不足
- **证据**：`evidence/EXP-E02/stdout.log`
- **状态**：待提单

## #6【P1】EXP-E03 serviceCatalog 路由 MISS

- **现象**：中文意图"创建OBS桶"经 serviceCatalog 路由未命中 OBS skill
- **断言**：serviceCatalog 应将 OBS 相关意图路由到 huawei-obs skill
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 路由层中文意图匹配率不足
- **证据**：`evidence/EXP-E03/stdout.log`
- **状态**：待提单

## #7【P1】EXP-E04 serviceCatalog 路由 MISS

- **现象**：中文意图"创建RDS"经 serviceCatalog 路由未命中 RDS skill
- **断言**：serviceCatalog 应将 RDS 相关意图路由到 huawei-rds skill
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 路由层中文意图匹配率不足
- **证据**：`evidence/EXP-E04/stdout.log`
- **状态**：待提单

## #8【P1】EXP-E05 serviceCatalog 路由 MISS

- **现象**：中文意图"创建CCE集群"经 serviceCatalog 路由未命中 CCE skill
- **断言**：serviceCatalog 应将 CCE 相关意图路由到 huawei-cce skill
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 路由层中文意图匹配率不足
- **证据**：`evidence/EXP-E05/stdout.log`
- **状态**：待提单

## #9【P1】EXP-E07 serviceCatalog 路由 MISS

- **现象**：中文意图"创建IAM用户"经 serviceCatalog 路由未命中 IAM skill
- **断言**：serviceCatalog 应将 IAM 相关意图路由到 huawei-iam skill
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 路由层中文意图匹配率不足
- **证据**：`evidence/EXP-E07/stdout.log`
- **状态**：待提单

## #10【P1】EXP-E10 serviceCatalog 路由 MISS

- **现象**：中文意图"创建DDS"经 serviceCatalog 路由未命中 DDS skill
- **断言**：serviceCatalog 应将 DDS 相关意图路由到 huawei-dds-dcs skill
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 路由层中文意图匹配率不足
- **证据**：`evidence/EXP-E10/stdout.log`
- **状态**：待提单

## #11【P1】EXP-E11 serviceCatalog 路由 MISS

- **现象**：中文意图"创建DCS"经 serviceCatalog 路由未命中 DCS skill
- **断言**：serviceCatalog 应将 DCS 相关意图路由到 huawei-dds-dcs skill
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 路由层中文意图匹配率不足
- **证据**：`evidence/EXP-E11/stdout.log`
- **状态**：待提单

## #12【P1】EXP-E12 serviceCatalog 路由 MISS

- **现象**：中文意图"创建SMN主题"经 serviceCatalog 路由未命中 SMN skill
- **断言**：serviceCatalog 应将 SMN 相关意图路由到 huawei-smn-dms skill
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 路由层中文意图匹配率不足
- **证据**：`evidence/EXP-E12/stdout.log`
- **状态**：待提单

## #13【P1】EXP-E13 serviceCatalog 路由 MISS

- **现象**：中文意图"创建DEW密钥"经 serviceCatalog 路由未命中 DEW skill
- **断言**：serviceCatalog 应将 DEW 相关意图路由到 huawei-dew skill
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 路由层中文意图匹配率不足
- **证据**：`evidence/EXP-E13/stdout.log`
- **状态**：待提单

## #14【P1】EXP-E14 serviceCatalog 路由 MISS

- **现象**：中文意图"创建CBR备份"经 serviceCatalog 路由未命中 CBR skill
- **断言**：serviceCatalog 应将 CBR 相关意图路由到 huawei-cbr skill
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 路由层中文意图匹配率不足
- **证据**：`evidence/EXP-E14/stdout.log`
- **状态**：待提单

## #15【P2】D3-C14 E2E 用例 FAIL（历史证据复用）

- **现象**：从 2026-10-14 历史证据复用，状态为 FAIL
- **断言**：需本轮重新执行探针确认
- **根因**：待复测定位
- **证据**：`evidence/D3-C14/stdout.log`
- **状态**：待提单

## #16【P2】D8-9 文档完整性 FAIL（历史证据复用）

- **现象**：从 2026-10-14 历史证据复用，状态为 FAIL
- **断言**：需本轮重新执行探针确认
- **根因**：待复测定位
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：待提单
