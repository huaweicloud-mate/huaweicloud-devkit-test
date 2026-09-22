# OfficeAce-glm-5.2 每日测试报告

**日期**: 2026-09-22  
**客户端**: OfficeAce  
**模型**: glm-5.2  
**OS**: Windows  
**IP**: 188.239.14.150  
**被测版本**: huaweicloud-devkit@1.1.5  
**执行时间**: 2026-09-22 16:11:38

---

## 一、测试概述

本报告为 OfficeAce 客户端在 Windows 平台上对 huaweicloud-devkit@1.1.5 的每日测试结果。测试覆盖 9 个维度（D1安装、D2认证、D3功能、D4安全、D5客户端、D6性能、D8质量、D9协议、D10评测），共执行 100 条设计级用例 + 39 条展开级用例 = 139 条。

## 二、执行摘要

| 层级 | 总数 | PASS | FAIL | BLOCKED | NOT_RUN |
|------|------|------|------|---------|---------|
| 设计级 | 100 | 90 | 9 | 1 | 0 |
| 展开级 | 39 | 26 | 13 | 0 | 0 |
| **合计** | **139** | **116** | **22** | **1** | **0** |

**通过率**: 83.5% (116/139)

## 三、状态汇总

### 按优先级

| 优先级 | 总数 | PASS | FAIL | BLOCKED |
|--------|------|------|------|---------|
| P0 | 19 | 17 | 2 | 0 |
| P1 | 51 | 42 | 8 | 1 |
| P2 | 30 | 28 | 1 | 0 |
| 展开级 | 39 | 26 | 13 | 0 |

### 按维度

| 维度 | 总数 | PASS | FAIL | BLOCKED |
|------|------|------|------|---------|
| D1安装 | 19 | 18 | 0 | 1 |
| D2认证 | 11 | 11 | 0 | 0 |
| D3功能 | 16 | 16 | 0 | 0 |
| D4安全 | 29 | 23 | 6 | 0 |
| D5客户端 | 2 | 0 | 2 | 0 |
| D6性能 | 4 | 3 | 1 | 0 |
| D8质量 | 6 | 6 | 0 | 0 |
| D9协议 | 11 | 11 | 0 | 0 |
| D10评测 | 2 | 1 | 1 | 0 |
| 展开级 | 39 | 26 | 13 | 0 |

## 四、缺陷清单

### 1. D4-3 (设计级) - 明文secret API拦截

- **状态**: FAIL
- **维度**: D4安全
- **优先级**: P0
- **原因**: 存在未拦截的 secret API 调用
- **证据**: evidence/D4-3/stdout.log

### 2. D4-6 (设计级) - adminPass回显警告

- **状态**: FAIL
- **维度**: D4安全
- **优先级**: P1
- **原因**: 存在未脱敏的敏感值
- **证据**: evidence/D4-6/stdout.log

### 3. D4-8 (设计级) - Python/Node策略一致

- **状态**: FAIL
- **维度**: D4安全
- **优先级**: P1
- **原因**: 双路径判定不一致
- **证据**: evidence/D4-8/stdout.log

### 4. D4-11 (设计级) - 提示注入防护

- **状态**: FAIL
- **维度**: D4安全
- **优先级**: P1
- **原因**: 部分注入 payload 未被拦截 [PARTIAL treated as FAIL per test framework]
- **证据**: evidence/D4-11/stdout.log

### 5. D4-16 (设计级) - 命令包裹穿透

- **状态**: FAIL
- **维度**: D4安全
- **优先级**: P0
- **原因**: 存在未被拦截的包裹命令
- **证据**: evidence/D4-16/stdout.log

### 6. D4-27 (设计级) - 双路径输出脱敏

- **状态**: FAIL
- **维度**: D4安全
- **优先级**: P1
- **原因**: 存在未脱敏的输出
- **证据**: evidence/D4-27/stdout.log

### 7. D5-1 (设计级) - 清单发现加载

- **状态**: FAIL
- **维度**: D5客户端
- **优先级**: P1
- **原因**: One or more checks failed (exit code 1)
- **证据**: evidence/D5-1/stdout.log

### 8. D5-3 (设计级) - 工具全量枚举

- **状态**: FAIL
- **维度**: D5客户端
- **优先级**: P1
- **原因**: One or more checks failed (exit code 1)
- **证据**: evidence/D5-3/stdout.log

### 9. D6-9 (设计级) - 缓存清理三入口

- **状态**: FAIL
- **维度**: D6性能
- **优先级**: P2
- **原因**: One or more checks failed (exit code 1)
- **证据**: evidence/D6-9/stdout.log

### 10. EXP-D5-7-1 (展开级) - 在 OfficeAce 上执行 D5-1 用例

- **状态**: FAIL
- **维度**: D5-1
- **优先级**: P1
- **原因**: One or more checks failed (exit code 1)
- **证据**: evidence/EXP-D5-7-1/stdout.log

### 11. EXP-D5-7-3 (展开级) - 在 OfficeAce 上执行 D5-3 用例

- **状态**: FAIL
- **维度**: D5-3
- **优先级**: P1
- **原因**: One or more checks failed (exit code 1)
- **证据**: evidence/EXP-D5-7-3/stdout.log

### 12. EXP-E01 (展开级) - ①源码级: node eval/harness/run-eval.mjs 跑 serviceCatalog(intent

- **状态**: FAIL
- **维度**: D10-3
- **优先级**: P1
- **原因**: EXP-E01: 路由未命中 期望=ECS 实际=Run hcloud --help to list available services.
- **证据**: evidence/EXP-E01/stdout.log

### 13. EXP-E02 (展开级) - ①源码级: node eval/harness/run-eval.mjs 跑 serviceCatalog(intent

- **状态**: FAIL
- **维度**: D10-3
- **优先级**: P1
- **原因**: EXP-E02: 路由未命中 期望=ECS 实际=Run hcloud --help to list available services.
- **证据**: evidence/EXP-E02/stdout.log

### 14. EXP-E03 (展开级) - ①源码级: node eval/harness/run-eval.mjs 跑 serviceCatalog(intent

- **状态**: FAIL
- **维度**: D10-3
- **优先级**: P1
- **原因**: EXP-E03: 路由未命中 期望=OBS 实际=Sandbox+DevStation
- **证据**: evidence/EXP-E03/stdout.log

### 15. EXP-E04 (展开级) - ①源码级: node eval/harness/run-eval.mjs 跑 serviceCatalog(intent

- **状态**: FAIL
- **维度**: D10-3
- **优先级**: P1
- **原因**: EXP-E04: 路由未命中 期望=EIP 实际=Run hcloud --help to list available services.
- **证据**: evidence/EXP-E04/stdout.log

### 16. EXP-E05 (展开级) - ①源码级: node eval/harness/run-eval.mjs 跑 serviceCatalog(intent

- **状态**: FAIL
- **维度**: D10-3
- **优先级**: P1
- **原因**: EXP-E05: 路由未命中 期望=RDS 实际=Run hcloud --help to list available services.
- **证据**: evidence/EXP-E05/stdout.log

### 17. EXP-E07 (展开级) - ①源码级: node eval/harness/run-eval.mjs 跑 serviceCatalog(intent

- **状态**: FAIL
- **维度**: D10-3
- **优先级**: P1
- **原因**: EXP-E07: 路由未命中 期望=CBR 实际=Run hcloud --help to list available services.
- **证据**: evidence/EXP-E07/stdout.log

### 18. EXP-E10 (展开级) - ①源码级: node eval/harness/run-eval.mjs 跑 serviceCatalog(intent

- **状态**: FAIL
- **维度**: D10-3
- **优先级**: P1
- **原因**: EXP-E10: 路由未命中 期望=FunctionGraph 实际=Run hcloud --help to list available services.
- **证据**: evidence/EXP-E10/stdout.log

### 19. EXP-E11 (展开级) - ①源码级: node eval/harness/run-eval.mjs 跑 serviceCatalog(intent

- **状态**: FAIL
- **维度**: D10-3
- **优先级**: P1
- **原因**: EXP-E11: 路由未命中 期望=BSS 实际=Run hcloud --help to list available services.
- **证据**: evidence/EXP-E11/stdout.log

### 20. EXP-E12 (展开级) - ①源码级: node eval/harness/run-eval.mjs 跑 serviceCatalog(intent

- **状态**: FAIL
- **维度**: D10-3
- **优先级**: P1
- **原因**: EXP-E12: 路由未命中 期望=CES 实际=Run hcloud --help to list available services.
- **证据**: evidence/EXP-E12/stdout.log

### 21. EXP-E13 (展开级) - ①源码级: node eval/harness/run-eval.mjs 跑 serviceCatalog(intent

- **状态**: FAIL
- **维度**: D10-3
- **优先级**: P1
- **原因**: EXP-E13: 路由未命中 期望=ELB 实际=Run hcloud --help to list available services.
- **证据**: evidence/EXP-E13/stdout.log

### 22. EXP-E14 (展开级) - ①源码级: node eval/harness/run-eval.mjs 跑 serviceCatalog(intent

- **状态**: FAIL
- **维度**: D10-3
- **优先级**: P1
- **原因**: EXP-E14: 路由未命中 期望=IAM 实际=Run hcloud --help to list available services.
- **证据**: evidence/EXP-E14/stdout.log

## 五、未执行用例与原因

- **D1-67** (设计级): BLOCKED - 需DSH环境才能完整测试AGENT_TOOLKIT_MODE注入和SKIP_DSH跳过安装行为

## 六、安全/红线

- 真云用例已执行（AK/SK 凭证就绪）
- 未伪造任何 PASS 结果
- 所有 PASS 用例均有证据落盘（evidence/<case-id>/stdout.log）
- 未修改 test-cases 母版
- 只提交 results/OfficeAce/ 目录

## 七、资源释放

- 未创建持久云资源
- 探针脚本仅读取源码和调用只读命令
- 无需清理

## 八、遗留建议

1. D4-3/D4-16 (P0 FAIL): 安全策略覆盖缺口，建议加强 secret API 拦截和命令包裹穿透防护
2. D5-1/D5-3 (P1 FAIL): 客户端清单和工具枚举功能需修复
3. EXP-E01~E14: serviceCatalog 路由准确率 21.4%（与基线一致），建议优化中文意图路由
4. D1-67 (BLOCKED): 需 DSH 环境才能完整测试
