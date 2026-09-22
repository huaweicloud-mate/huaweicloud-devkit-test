# FINDINGS - 2026-09-22 OfficeAce Windows

## 缺陷清单

### Finding 1: D4-3 - 明文secret API拦截

- **级别**: P0
- **描述**: 存在未拦截的 secret API 调用
- **断言**: 用例 D4-3 预期结果未满足
- **证据**: evidence/D4-3/stdout.log

### Finding 2: D4-6 - adminPass回显警告

- **级别**: P1
- **描述**: 存在未脱敏的敏感值
- **断言**: 用例 D4-6 预期结果未满足
- **证据**: evidence/D4-6/stdout.log

### Finding 3: D4-8 - Python/Node策略一致

- **级别**: P1
- **描述**: 双路径判定不一致
- **断言**: 用例 D4-8 预期结果未满足
- **证据**: evidence/D4-8/stdout.log

### Finding 4: D4-11 - 提示注入防护

- **级别**: P1
- **描述**: 部分注入 payload 未被拦截 [PARTIAL treated as FAIL per test framework]
- **断言**: 用例 D4-11 预期结果未满足
- **证据**: evidence/D4-11/stdout.log

### Finding 5: D4-16 - 命令包裹穿透

- **级别**: P0
- **描述**: 存在未被拦截的包裹命令
- **断言**: 用例 D4-16 预期结果未满足
- **证据**: evidence/D4-16/stdout.log

### Finding 6: D4-27 - 双路径输出脱敏

- **级别**: P1
- **描述**: 存在未脱敏的输出
- **断言**: 用例 D4-27 预期结果未满足
- **证据**: evidence/D4-27/stdout.log

### Finding 7: D5-1 - 清单发现加载

- **级别**: P1
- **描述**: One or more checks failed (exit code 1)
- **断言**: 用例 D5-1 预期结果未满足
- **证据**: evidence/D5-1/stdout.log

### Finding 8: D5-3 - 工具全量枚举

- **级别**: P1
- **描述**: One or more checks failed (exit code 1)
- **断言**: 用例 D5-3 预期结果未满足
- **证据**: evidence/D5-3/stdout.log

### Finding 9: D6-9 - 缓存清理三入口

- **级别**: P2
- **描述**: One or more checks failed (exit code 1)
- **断言**: 用例 D6-9 预期结果未满足
- **证据**: evidence/D6-9/stdout.log

### Finding 10: EXP-D5-7-1 - 在 OfficeAce 上执行 D5-1 用例

- **级别**: P1
- **描述**: One or more checks failed (exit code 1)
- **断言**: 用例 EXP-D5-7-1 预期结果未满足
- **证据**: evidence/EXP-D5-7-1/stdout.log

### Finding 11: EXP-D5-7-3 - 在 OfficeAce 上执行 D5-3 用例

- **级别**: P1
- **描述**: One or more checks failed (exit code 1)
- **断言**: 用例 EXP-D5-7-3 预期结果未满足
- **证据**: evidence/EXP-D5-7-3/stdout.log

### Finding 12: EXP-E01 - ①源码级: node eval/harness/run-eval.mjs 跑 serviceCatalog(intent

- **级别**: P1
- **描述**: EXP-E01: 路由未命中 期望=ECS 实际=Run hcloud --help to list available services.
- **断言**: 用例 EXP-E01 预期结果未满足
- **证据**: evidence/EXP-E01/stdout.log

### Finding 13: EXP-E02 - ①源码级: node eval/harness/run-eval.mjs 跑 serviceCatalog(intent

- **级别**: P1
- **描述**: EXP-E02: 路由未命中 期望=ECS 实际=Run hcloud --help to list available services.
- **断言**: 用例 EXP-E02 预期结果未满足
- **证据**: evidence/EXP-E02/stdout.log

### Finding 14: EXP-E03 - ①源码级: node eval/harness/run-eval.mjs 跑 serviceCatalog(intent

- **级别**: P1
- **描述**: EXP-E03: 路由未命中 期望=OBS 实际=Sandbox+DevStation
- **断言**: 用例 EXP-E03 预期结果未满足
- **证据**: evidence/EXP-E03/stdout.log

### Finding 15: EXP-E04 - ①源码级: node eval/harness/run-eval.mjs 跑 serviceCatalog(intent

- **级别**: P1
- **描述**: EXP-E04: 路由未命中 期望=EIP 实际=Run hcloud --help to list available services.
- **断言**: 用例 EXP-E04 预期结果未满足
- **证据**: evidence/EXP-E04/stdout.log

### Finding 16: EXP-E05 - ①源码级: node eval/harness/run-eval.mjs 跑 serviceCatalog(intent

- **级别**: P1
- **描述**: EXP-E05: 路由未命中 期望=RDS 实际=Run hcloud --help to list available services.
- **断言**: 用例 EXP-E05 预期结果未满足
- **证据**: evidence/EXP-E05/stdout.log

### Finding 17: EXP-E07 - ①源码级: node eval/harness/run-eval.mjs 跑 serviceCatalog(intent

- **级别**: P1
- **描述**: EXP-E07: 路由未命中 期望=CBR 实际=Run hcloud --help to list available services.
- **断言**: 用例 EXP-E07 预期结果未满足
- **证据**: evidence/EXP-E07/stdout.log

### Finding 18: EXP-E10 - ①源码级: node eval/harness/run-eval.mjs 跑 serviceCatalog(intent

- **级别**: P1
- **描述**: EXP-E10: 路由未命中 期望=FunctionGraph 实际=Run hcloud --help to list available services.
- **断言**: 用例 EXP-E10 预期结果未满足
- **证据**: evidence/EXP-E10/stdout.log

### Finding 19: EXP-E11 - ①源码级: node eval/harness/run-eval.mjs 跑 serviceCatalog(intent

- **级别**: P1
- **描述**: EXP-E11: 路由未命中 期望=BSS 实际=Run hcloud --help to list available services.
- **断言**: 用例 EXP-E11 预期结果未满足
- **证据**: evidence/EXP-E11/stdout.log

### Finding 20: EXP-E12 - ①源码级: node eval/harness/run-eval.mjs 跑 serviceCatalog(intent

- **级别**: P1
- **描述**: EXP-E12: 路由未命中 期望=CES 实际=Run hcloud --help to list available services.
- **断言**: 用例 EXP-E12 预期结果未满足
- **证据**: evidence/EXP-E12/stdout.log

### Finding 21: EXP-E13 - ①源码级: node eval/harness/run-eval.mjs 跑 serviceCatalog(intent

- **级别**: P1
- **描述**: EXP-E13: 路由未命中 期望=ELB 实际=Run hcloud --help to list available services.
- **断言**: 用例 EXP-E13 预期结果未满足
- **证据**: evidence/EXP-E13/stdout.log

### Finding 22: EXP-E14 - ①源码级: node eval/harness/run-eval.mjs 跑 serviceCatalog(intent

- **级别**: P1
- **描述**: EXP-E14: 路由未命中 期望=IAM 实际=Run hcloud --help to list available services.
- **断言**: 用例 EXP-E14 预期结果未满足
- **证据**: evidence/EXP-E14/stdout.log

