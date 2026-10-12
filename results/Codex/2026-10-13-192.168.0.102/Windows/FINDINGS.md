## #1【P0】D2-4 凭证脱敏遗漏裸 ak/sk 字段

- **现象**：`redactSecrets({"ak":"AKIDTEST12345678","sk":"SKTEST..."})` 保留明文。
- **断言**：AK/SK 字段必须统一替换为 `<redacted>`。
- **根因**：`hdk/plugins/huaweicloud-core/src/safety-policy.mjs:15-31` 的 `isSecretKeyName` 只匹配 `access key`/`secret key` 等完整名称，未覆盖裸 `ak`/`sk`。
- **影响**：凭证展示路径可能泄露云凭证。
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待提单

## #2【P0】D4-16 MCP hook 包裹命令穿透

- **现象**：MCP `hook_check_command` 对 `sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"` 返回 `allow`；直接分类同类命令为 `deny`。
- **断言**：hook 检查必须提取并拒绝 shell 包裹内的凭证读取命令。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:944-951` 先将命令拆为前两段，丢失 `sh -c` 内层文本后再进入 `classifyTextCommand`。
- **影响**：MCP 安全 hook 与源码直调决策不一致。
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单

## #3【P1】D4-27 双路径脱敏遗漏裸 ak/sk

- **现象**：`redactSecrets` 与 `redactOutput` 对 JSON 裸 `ak`/`sk` 均保留明文。
- **断言**：两条输出路径都必须替换 AK/SK/token/password 敏感值。
- **根因**：`hdk/plugins/huaweicloud-core/src/safety-policy.mjs:15-31` 与 D2-4 同源，裸字段未进入敏感键判定。
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：待提单

## #4【P1】D8-4 npm 包安装文档缺失

- **现象**：安装包验证未发现预期 `INSTALL.md`。
- **断言**：发布包必须包含安装文档。
- **根因**：`hdk/package.json:8-20` 的 `files` 发布白名单未包含该文档路径。
- **证据**：`evidence/D8-4/stdout.log`
- **状态**：待提单

## #5【P1】D9-2 JSON-RPC 错误契约不一致

- **现象**：错误参数/未知工具路径的错误码与设计断言不一致。
- **断言**：未知方法、未知工具和非法参数分别稳定返回约定的 `-32601`/`-32602`。
- **根因**：`hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs:65-78` 的参数错误分支与测试契约不一致。
- **证据**：`evidence/D9-2/stdout.log`
- **状态**：待提单

## #6【P0】D9-12 initialize 握手非法时序未拒绝

- **现象**：协议探针 4/6 通过；未 initialize 先 `tools/list` 返回工具列表而不是 `-32600`，initialize 分支未直接调用 `runVersionCheck`。
- **断言**：未完成 initialize 的会话不得调用 `tools/list`；初始化阶段应满足版本检查契约。
- **根因**：`hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs:32-61` 未跟踪初始化状态，且版本检查不在 initialize 分支。
- **证据**：`evidence/D9-12/run.txt`、`evidence/D9-12/stdout.log`
- **状态**：待提单

## #7【P1】EXP-E01~EXP-E15 服务目录路由命中率不足

- **现象**：确定性 harness 对评测集仅 4/15 命中，E01-E05、E07、E10-E14 为 MISS。
- **断言**：每条评测意图必须路由到预期 Huawei Cloud 服务目录。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:1983-2080` 的 `serviceCatalog` 关键词映射未覆盖失败意图。
- **证据**：`evidence/EXP-E01/stdout.log` 至 `evidence/EXP-E14/stdout.log`
- **状态**：待提单
