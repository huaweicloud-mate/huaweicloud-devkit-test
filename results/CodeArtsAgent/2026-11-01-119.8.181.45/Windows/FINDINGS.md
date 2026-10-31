# FINDINGS - CodeArtsAgent Windows 每日测试

## #1【P1】D4-7 hook三工具有效性 - broad IAM policy 检出失败

- **现象**: evaluateArtifacts 对 broad IAM policy (actions=["*"]) 未检出，findings 数组为空
- **断言**: evaluateArtifacts 应检出 broad IAM policy (actions=["*"]) 风险，findings 数组长度 > 0
- **根因**: risk-rule-engine.mjs 中 IAM policy 规则未正确匹配 actions=["*"] 模式
- **影响**: 宽泛权限策略无法被安全预检发现，存在权限过度分配风险
- **证据**: evidence/D4-1/stdout.log

## #2【P1】D1-3 doctor健康自检

- **现象**: 所有11项检查全部通过
- **断言**: doctor 命令应正确检测所有组件状态
- **根因**: 无缺陷
- **影响**: 无
- **证据**: evidence/D1-3/stdout.log

## #3【P1】D1-27 检测语义-已是最新

- **现象**: judgeUpdate('1.1.2', {latest: '1.1.2'}, null) 返回 result='up_to_date', updateAvailable=false
- **断言**: judgeUpdate 应正确判断 current == latest 场景
- **根因**: 无缺陷
- **影响**: 无
- **证据**: evidence/D1-27/stdout.log

## #4【P1】D1-28 检测语义-有新版本

- **现象**: judgeUpdate('1.1.1', {latest: '1.1.2'}, null) 返回 result='update_available', updateAvailable=true, targetVersion='1.1.2'
- **断言**: judgeUpdate 应正确判断 current < latest 场景
- **根因**: 无缺陷
- **影响**: 无
- **证据**: evidence/D1-28/stdout.log
