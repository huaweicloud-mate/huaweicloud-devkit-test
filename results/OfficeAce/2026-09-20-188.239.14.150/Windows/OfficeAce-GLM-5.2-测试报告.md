# huaweicloud-devkit 每日测试报告

## 1. 基本信息

| 项目 | 值 |
|------|-----|
| 被测包 | huaweicloud-devkit@1.1.5 |
| 客户端 | OfficeAce |
| 模型 | GLM-5.2 |
| 操作系统 | Windows (AMD64) |
| Node.js | v24.14.1 |
| 测试日期 | 2026-09-20 |
| 测试仓库 | huaweicloud-devkit-test.git |
| 源码仓库 | huaweicloud-devkit.git (hdk) |
| IP | 188.239.14.150 |

## 2. 执行摘要

### 设计级用例（100 条）

| 状态 | 数量 | 占比 |
|------|------|------|
| ✅ PASS | 92 | 92.0% |
| ❌ FAIL | 8 | 8.0% |
| ⛔ BLOCKED | 0 | 0.0% |
| ⏭️ NOT_RUN | 0 | 0.0% |

### 展开级用例（39 条）

| 状态 | 数量 | 占比 |
|------|------|------|
| ✅ PASS | 27 | 69.2% |
| ❌ FAIL | 11 | 28.2% |
| ⏭️ NOT_RUN | 1 | 2.6% |

### 门控检查

| 门控 | 结果 |
|------|------|
| PASS 虚报检查 (verify_no_fake_pass.py) | ✅ 通过 |
| 覆盖率检查 (verify_coverage.py) | ✅ 通过 (P0 无 NOT_RUN, 展开级 NOT_RUN+空=2.6% ≤15%) |

## 3. 维度明细

| 维度 | PASS | FAIL | 总计 | 通过率 |
|------|------|------|------|--------|
| D1安装 | 18 | 1 | 19 | 94.7% |
| D2认证 | 11 | 0 | 11 | 100.0% |
| D3功能 | 16 | 0 | 16 | 100.0% |
| D4安全 | 23 | 6 | 29 | 79.3% |
| D5客户端 | 2 | 0 | 2 | 100.0% |
| D6性能 | 4 | 0 | 4 | 100.0% |
| D8质量 | 6 | 0 | 6 | 100.0% |
| D9协议 | 11 | 0 | 11 | 100.0% |
| D10评测 | 1 | 1 | 2 | 50.0% |
| **合计** | **92** | **8** | **100** | **92.0%** |

## 4. FAIL 用例详情

### 4.1 D1-39 (P0): Windows 升级检测链可用性

- **维度**: D1安装
- **根因**: Windows 上 `queryDistTagsSync` 使用 `child_process.execSync` 调用 `npm view huaweicloud-devkit dist-tags --json`，在某些 Windows 环境下因 `EINVAL` 错误导致同步进程启动失败。错误未被捕获，导致升级检测链中断。
- **影响**: Windows 用户无法获取最新版本通知，升级检测功能失效。
- **建议**: 改用异步 `exec` 或增加 `try-catch` 包裹 `execSync` 调用，失败时优雅降级。

### 4.2 D4-2 (P0): 凭证env打印拦截

- **维度**: D4安全
- **根因**: `safety-policy.mjs` 的 `redactSecrets()` 函数对环境变量名匹配模式不完整。`HW_SECRET_ACCESS_KEY` 和 `HUAWEICLOUD_SECRET_ACCESS_KEY` 等非标准命名变体未被脱敏正则覆盖，导致通过 `echo $HW_SECRET_ACCESS_KEY` 等方式可泄露密钥。
- **影响**: 攻击者可通过非标准环境变量名绕过脱敏，泄露云凭证。
- **建议**: 扩展 `redactSecrets` 正则模式，覆盖所有 `*SECRET*`、`*ACCESS_KEY*`、`*PASSWORD*` 等通配模式。

### 4.3 D4-3 (P0): 明文secret API拦截

- **维度**: D4安全
- **根因**: `risk-rule-engine.mjs` 的 deny 规则未覆盖所有明文密钥传递模式。`--secret-key=xxx` 等 CLI 标志格式未被 `blockedSecretOperations` 正则匹配。
- **影响**: 用户可通过 CLI 标志格式传递明文密钥，绕过安全拦截。
- **建议**: 在 deny 规则中增加 `--secret-key`、`--access-key` 等标志格式的正则匹配。

### 4.4 D4-15 (P0): hook绕过尝试

- **维度**: D4安全
- **根因**: Windows 路径中的反斜杠转义（如 `C:\Users\...`）未被 hook 检测正则正确处理，导致包含转义路径的命令绕过安全 hook。
- **影响**: 恶意构造的 Windows 路径可绕过安全检查。
- **建议**: 在 hook 检测逻辑中规范化路径分隔符，同时匹配 `\` 和 `/`。

### 4.5 D4-16 (P0): 命令包裹穿透

- **维度**: D4安全
- **根因**: Shell 包装命令（如 `sh -c "hcloud ..."`、`cmd /c "hcloud ..."`）中的内层命令未被风险规则引擎拆解检测。6 处内层命令成功穿透。
- **影响**: 攻击者可通过 shell 包装绕过命令安全检查。
- **建议**: 在 `evaluateCommandRisk` 中增加 shell 包装拆解逻辑，递归检测内层命令。

### 4.6 D4-23 (P0): 全局规则注入生效性

- **维度**: D4安全
- **根因**: `KMS DecryptData` 操作未在 `blockedSecretOperations` 列表或风险规则正则中机械拦截。该操作可解密密文，属于敏感操作但未被安全规则覆盖。
- **影响**: KMS 解密操作未被安全预检拦截，可能导致敏感数据泄露。
- **建议**: 将 `KMS.*Decrypt` 加入 `blockedSecretOperations` 或 deny 规则。

### 4.7 D4-26 (P2): findings 证据脱敏

- **维度**: D4安全
- **根因**: `risk-rule-engine.mjs` 的 `redactEvidence()` 函数未对 CLI 标志风格的密钥进行脱敏。`--ak=xxx`、`--token=xxx` 等格式的密钥在证据日志中明文保留。
- **影响**: 证据日志中可能泄露密钥信息。
- **建议**: 在 `redactEvidence` 中增加对 `--ak=`、`--token=`、`--sk=` 等标志格式的脱敏。

### 4.8 D10-4 (P0): 安全干预-静态规则层

- **维度**: D10评测
- **根因**: `echo $HW_SECRET_ACCESS_KEY` 命令未被 `cloud-risk-rules.json` 中的任何 deny/warn 规则覆盖。风险规则缺少对环境变量泄露命令的检测。
- **影响**: 通过 echo 命令泄露环境变量中的密钥不被安全规则拦截。
- **建议**: 在 `cloud-risk-rules.json` 中增加 `echo.*SECRET`、`echo.*ACCESS_KEY` 等 deny 规则。

## 5. 展开级 FAIL 用例汇总

展开级 11 条 FAIL 均来自 D10-3 路由准确率测试（serviceCatalog），根因统一为：

- **根因**: `serviceCatalog` 路由器对多数华为云服务提示词无法正确识别目标服务，返回 `"Run hcloud --help to list available services."` 而非具体服务名。
- **影响**: 15 条 eval 用例中仅 3 条命中（准确率 21.4%），11 条路由失败。
- **受影响服务**: ECS(2), OBS(1), EIP(1), RDS(1), CBR(1), FunctionGraph(1), BSS(1), CES(1), ELB(1), IAM(1)
- **建议**: 增强 `serviceCatalog` 的服务关键词匹配逻辑，覆盖更多服务别名和描述模式。

### 混淆矩阵摘要

| 期望服务 | TP | FN | 召回率 |
|----------|----|----|--------|
| ECS | 0 | 2 | 0.0% |
| OBS | 0 | 2 | 0.0% |
| EIP | 0 | 1 | 0.0% |
| RDS | 0 | 1 | 0.0% |
| DCS | 1 | 1 | 50.0% |
| CBR | 0 | 1 | 0.0% |
| CCE | 1 | 1 | 50.0% |
| FunctionGraph | 0 | 1 | 0.0% |
| BSS | 0 | 1 | 0.0% |
| CES | 0 | 1 | 0.0% |
| ELB | 0 | 1 | 0.0% |
| IAM | 0 | 1 | 0.0% |
| Incentive Voucher | 1 | 0 | 100.0% |

## 6. 环境信息

| 项目 | 值 |
|------|-----|
| Python | 3.13.4 |
| hcloud CLI | 已安装 |
| 云凭证 | ~/.config/huaweicloud/credentials.json |
| 推送 Token | HDK_GH_TOKEN / ~/.hdk_token |
| MCP 传输 | stdio + HTTP (port 9528) |
| 工具数量 | 40 个 MCP 工具 |
| 风险规则 | 9 deny + 7 warn |

## 7. 测试覆盖

- **设计级**: 100 条用例，9 个维度，27 列属性
- **展开级**: 39 条用例，3 种展开类型（D5客户端、D3-C4服务、D10-3路由）
- **证据**: 每条 PASS 用例均有 evidence/<ID>/ 目录含探针脚本和 stdout.log
- **P0 覆盖**: 所有 P0 用例已执行，无 NOT_RUN

## 8. 后续行动

1. **P0 缺陷修复**: 7 个 P0 FAIL 用例需优先修复（D1-39, D4-2, D4-3, D4-15, D4-16, D4-23, D10-4）
2. **P2 缺陷修复**: 1 个 P2 FAIL 用例（D4-26）安排后续迭代
3. **路由准确率提升**: serviceCatalog 路由器需大幅增强服务识别能力
4. **Issue 提交**: 8 个设计级 FAIL + 11 个展开级 FAIL 统一提交 GitHub Issue
5. **结果推送**: 回填后的 CSV 和证据推送到远程仓库
