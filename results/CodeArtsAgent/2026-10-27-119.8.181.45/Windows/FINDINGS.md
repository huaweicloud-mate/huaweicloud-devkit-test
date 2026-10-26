# FINDINGS - huaweicloud-devkit 每日测试缺陷清单

> 生成时间: 2026-10-27 05:13 (北京时间)
> 客户端: CodeArtsAgent
> OS: Windows
> 被测版本: huaweicloud-devkit@1.1.12

## 缺陷汇总

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | D4-5 | D4安全 | 写操作误判检测 | safety-policy.mjs:384 classifyTextCommand | 待提单 |
| 2 | P0 | D4-9 | D4安全 | 公开暴露/破坏性预检 | risk-rule-engine.mjs:143 evaluateCommandRisk | 待提单 |
| 3 | P0 | D4-15 | D4安全 | hook绕过尝试 | safety-policy.mjs:384 classifyTextCommand | 待提单 |
| 4 | P0 | D4-16 | D4安全 | 命令包裹穿透 | safety-policy.mjs:384 classifyTextCommand | 待提单 |
| 5 | P0 | D4-23 | D4安全 | 全局规则huawei-agent-rules.md注入生效性 | 文件不存在 | 待提单 |
| 6 | P0 | D8-7 | D8质量 | 7个meta/通用技能指引可机械执行验证 | 目录结构变更 | 待提单 |

## 缺陷详情

### 1. D4-5 写操作误判检测
**级别**: P0
**描述**: DeleteServer命令被误判为allow，预期应为write或deny
**根因**: plugins/huaweicloud-core/src/safety-policy.mjs:384 classifyTextCommand函数未正确识别DeleteServer为写操作

### 2. D4-9 公开暴露/破坏性预检
**级别**: P0
**描述**: 破坏性操作(hcloud server delete)判定为warn而非deny
**根因**: plugins/huaweicloud-core/src/risk-rule-engine.mjs:143 evaluateCommandRisk函数中删除操作的规则严重级别设置为warn而非deny

### 3. D4-15 hook绕过尝试
**级别**: P0
**描述**: 变体绕过测试失败，所有变体均被判定为allow而非deny
**根因**: plugins/huaweicloud-core/src/safety-policy.mjs:384 classifyTextCommand函数未处理大小写变体

### 4. D4-16 命令包裹穿透
**级别**: P0
**描述**: 命令包裹穿透测试失败，所有包裹命令均被判定为warn而非deny
**根因**: plugins/huaweicloud-core/src/risk-rule-engine.mjs:143 evaluateCommandRisk函数未正确识别shell包裹中的内层命令

### 5. D4-23 全局规则huawei-agent-rules.md注入生效性
**级别**: P0
**描述**: agent-rules.md文件不存在于预期路径
**根因**: 文件路径错误或文件未生成

### 6. D8-7 7个meta/通用技能指引可机械执行验证
**级别**: P0
**描述**: 核心技能文件不存在于skills目录
**根因**: 目录结构变更
