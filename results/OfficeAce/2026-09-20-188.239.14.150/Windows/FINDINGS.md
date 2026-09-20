# FINDINGS — 2026-09-20 OfficeAce/Windows

## 设计级 FAIL (8 条)

### D1-39 [P0] Windows 升级检测链可用性
- **文件**: `hdk/plugins/huaweicloud-core/src/update-check.mjs`
- **根因**: `queryDistTagsSync` 调用 `child_process.execSync('npm view huaweicloud-devkit dist-tags --json')`，Windows 上因 `EINVAL` 导致同步进程启动失败，错误未被捕获
- **复现**: 在 Windows 上执行 `node -e "require('child_process').execSync('npm view huaweicloud-devkit dist-tags --json')"` 可能触发 EINVAL
- **修复建议**: 用 try-catch 包裹 execSync，失败时返回 null 优雅降级

### D4-2 [P0] 凭证env打印拦截
- **文件**: `hdk/plugins/huaweicloud-core/src/safety-policy.mjs`
- **根因**: `redactSecrets()` 正则模式不完整，`HW_SECRET_ACCESS_KEY` 等非标准命名变体未被覆盖
- **复现**: `echo $HW_SECRET_ACCESS_KEY` 输出未被脱敏
- **修复建议**: 扩展正则覆盖所有 `*SECRET*`、`*ACCESS_KEY*`、`*PASSWORD*` 通配模式

### D4-3 [P0] 明文secret API拦截
- **文件**: `hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs`
- **根因**: deny 规则未覆盖 `--secret-key=xxx` 等 CLI 标志格式
- **复现**: `hcloud KMS DecryptData --secret-key=plaintext` 未被拦截
- **修复建议**: 在 deny 规则中增加 `--secret-key`、`--access-key` 等标志格式正则

### D4-15 [P0] hook绕过尝试
- **文件**: `hdk/plugins/huaweicloud-core/src/setup-cli.mjs`
- **根因**: Windows 路径反斜杠转义未被 hook 检测正则正确处理
- **复现**: 包含 `C:\Users\...` 转义路径的命令绕过安全 hook
- **修复建议**: 规范化路径分隔符，同时匹配 `\` 和 `/`

### D4-16 [P0] 命令包裹穿透
- **文件**: `hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs`
- **根因**: Shell 包装命令（`sh -c`、`cmd /c`）中的内层命令未被拆解检测，6 处穿透
- **复现**: `sh -c "hcloud ECS CreateServers ..."` 内层命令未被风险规则检测
- **修复建议**: 在 `evaluateCommandRisk` 中增加 shell 包装拆解，递归检测内层命令

### D4-23 [P0] 全局规则注入生效性
- **文件**: `hdk/plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json`
- **根因**: `KMS DecryptData` 操作未在 `blockedSecretOperations` 或风险规则正则中
- **复现**: `hcloud KMS DecryptData --cipher-text=xxx` 未被安全预检拦截
- **修复建议**: 将 `KMS.*Decrypt` 加入 `blockedSecretOperations` 或 deny 规则

### D4-26 [P2] findings 证据脱敏
- **文件**: `hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs`
- **根因**: `redactEvidence()` 未对 CLI 标志风格密钥（`--ak=`、`--token=`）脱敏
- **复现**: 证据日志中 `--ak=AKxxx` 明文保留
- **修复建议**: 在 `redactEvidence` 中增加对 `--ak=`、`--token=`、`--sk=` 格式的脱敏

### D10-4 [P0] 安全干预-静态规则层
- **文件**: `hdk/plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json`
- **根因**: `echo $HW_SECRET_ACCESS_KEY` 命令未被任何 deny/warn 规则覆盖
- **复现**: `echo $HW_SECRET_ACCESS_KEY` 未被风险规则拦截
- **修复建议**: 增加 `echo.*SECRET`、`echo.*ACCESS_KEY` 等 deny 规则

## 展开级 FAIL (11 条)

### EXP-E01~E14 (D10-3 路由准确率)
- **文件**: `hdk/plugins/huaweicloud-core/src/tools.mjs` (serviceCatalog 工具)
- **根因**: `serviceCatalog` 路由器对多数华为云服务提示词无法正确识别目标服务
- **准确率**: 21.4% (3 HIT / 14 有效用例)
- **受影响服务**: ECS, OBS, EIP, RDS, CBR, FunctionGraph, BSS, CES, ELB, IAM
- **修复建议**: 增强 serviceCatalog 服务关键词匹配逻辑，覆盖更多服务别名和描述模式

## 汇总

| 类别 | 数量 | 优先级分布 |
|------|------|-----------|
| 设计级 FAIL | 8 | P0×7, P2×1 |
| 展开级 FAIL | 11 | P1×11 |
| 展开级 NOT_RUN | 1 | N/A (诊断用例) |
| **合计 FAIL** | **19** | |
