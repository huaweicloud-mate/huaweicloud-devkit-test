# FINDINGS (OpenCode/Windows/2026-10-02-188.239.14.150)

## P0

### D1-39 - update-check.parseDistTagsOutput 拒绝数组形态
- 文件：dist-tags 解析路径（update-check）
- 现象：npm view huaweicloud-devkit dist-tags --json 在 npm 12.1.0 返回数组 `[{latest,next}]`，解析返回 null → queryDistTagsSync 返回 null → Windows 升级检测链静默失败（check_update 呈现 check_failed）
- 影响：升级检测失效
- 建议：兼容数组形态（[{tag,value}, ...]）

### D4-16 - hook 绕过（命令包裹/编码/拼接）
- 工具：huaweicloud_hook_check_command（tools.mjs）
- 路径差异：调用 `risk-rule-engine.evaluateCommandRisk`（未展开嵌套命令/编码/包裹），而 `safety-policy.classifyTextCommand` 会递归展开
- 确认绕过样例（evidence）：
  - `sh -c "printenv HUAWEICLOUD_SDK_AK"` → hook=allow / engine=allow / policy=deny
  - `hcloud ECS $(printf Delete)Server` → hook=allow / engine=allow / policy=allow
  - `hcloud ECS Delet%65Server` → hook=allow / engine=allow / policy=allow
- 根因：hook 执行路径未与安全分类器的递归展开对齐
- 影响：安全干预存在绕过缺口
- 建议：hook 路径也应按 safety-policy 的展开策略对嵌套命令/编码/包裹做规范化后判定，或复用同一分类器

## P1/P0 其他关键项

### D10-4 - 规则库基线漂移（功能正确）
- 规则库实测 19 条（deny=9, warn=10），预期 16 条（deny=9, warn=7）
- 判定：SPEC-MISMATCH（deny/warn/allow 三态判定正确）
- 建议：更新用例基线或同步规则库定义

### D3-S2 - 真云场景
- 未能创建测试 VPC（资源/配额/网络前置条件），确认流未能完全验证。需记录环境约束并按真云约束处理。

其他非空 FAIL/SPEC-MISMATCH 详见测试报告和 evidence。