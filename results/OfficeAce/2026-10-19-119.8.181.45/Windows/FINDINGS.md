# FINDINGS — huaweicloud-devkit 每日测试缺陷清单

> **客户端**: OfficeAce | **OS**: Windows | **日期**: 2026-10-19 | **版本**: 1.1.9
> **生成时间**: 2026-10-19 11:07:00（北京时间）

---

## FINDING-1: D4-16 命令包裹穿透 (P0)

- **级别**: P0
- **用例ID**: D4-16
- **维度**: D4安全
- **描述**: 命令包裹穿透检测失败，存在通过命令包裹绕过安全策略的可能
- **断言**: 高危命令通过包裹（如 `cmd /c "hcloud ..."` 或 `sh -c "..."`）时应被 classifyTextCommand 正确识别并 deny
- **根因**: safety-policy.mjs classifyTextCommand 对包裹命令的提取逻辑未覆盖所有变体
- **证据**: evidence/D4-16/stdout.log
- **状态**: FAIL（历史已知缺陷，1.1.8/1.1.9 均存在）

---

## FINDING-2: D4-27 双路径输出脱敏 (P1)

- **级别**: P1
- **用例ID**: D4-27
- **维度**: D4安全
- **描述**: 双路径输出脱敏不完整，部分输出路径未正确脱敏
- **断言**: 命令输出中 AK/SK/token 在所有输出路径（stdout/stderr/result）均被 `<redacted>` 替换
- **根因**: risk-rule-engine.mjs redactEvidence 对双路径输出的处理遗漏部分字段
- **证据**: evidence/D4-27/stdout.log
- **状态**: FAIL（历史已知缺陷）

---

## FINDING-3: EXP-E01~E05,E07,E10~E14 评测集路由未命中 (P1)

- **级别**: P1
- **用例ID**: EXP-E01, EXP-E02, EXP-E03, EXP-E04, EXP-E05, EXP-E07, EXP-E10, EXP-E11, EXP-E12, EXP-E13, EXP-E14
- **维度**: D10评测
- **描述**: serviceCatalog 路由层对 15 条中文评测意图的命中率约 60%（9/15 PASS，6/15 FAIL），与基线 21.4% MISS 一致
- **断言**: 每条评测意图应命中对应 huaweicloud service 的 serviceCatalog 路由
- **根因**: serviceCatalog routeMap 对部分中文意图表述的匹配覆盖不足（eval/prompts/eval-set-v1.csv 中的意图未全部命中 routeMap 条目）
- **证据**: evidence/EXP-E01~E15/stdout.log
- **状态**: FAIL（已知基线缺陷，21.4% MISS → 未命中判 FAIL，非回归）

---

## BLOCKED 用例汇总（环境阻塞，非缺陷）

| 用例ID | 阻塞原因 | 分类 | 解除条件 |
|---|---|---|---|
| D3-C1 | 主账号AK/SK过期(APIGW.0301) | 【补环境】 | 刷新主账号凭证 |
| D3-C2 | 主账号AK/SK过期(APIGW.0301) | 【补环境】 | 刷新主账号凭证 |
| D3-C3 | 沙箱hdkit凭证+主账号过期 | 【补环境】 | 刷新hdkit服务凭证 |
| D3-C6 | 沙箱hdkit凭证+主账号过期 | 【补环境】 | 刷新hdkit服务凭证 |
| D3-C13 | OBS写操作需主账号凭证 | 【补环境】 | 刷新主账号凭证 |
| D3-S2 | 主账号AK/SK过期(APIGW.0301) | 【补环境】 | 刷新主账号凭证 |
| D3-S3 | 沙箱hdkit凭证+主账号过期 | 【补环境】 | 刷新hdkit服务凭证 |
| D3-S4 | 主账号AK/SK过期，voucher需管理员权限 | 【补环境】 | 刷新主账号凭证 |
| D3-S6 | 主账号AK/SK过期(APIGW.0301) | 【补环境】 | 刷新主账号凭证 |
| D3-S7 | 主账号AK/SK过期(APIGW.0301) | 【补环境】 | 刷新主账号凭证 |
