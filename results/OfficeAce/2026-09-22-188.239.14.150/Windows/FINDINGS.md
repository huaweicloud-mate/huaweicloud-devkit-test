# FINDINGS - 2026-09-22 OfficeAce Windows

## 缺陷清单

## #1【严重】D4-3 明文secret API拦截

- **现象**: 存在未拦截的 secret API 调用
- **断言**: 用例 D4-3 预期结果未满足
- **根因**: 存在未拦截的 secret API 调用
- **影响**: D4安全 维度 P0 用例
- **证据**: evidence/D4-3/stdout.log

## #2【高】D4-6 adminPass回显警告

- **现象**: 存在未脱敏的敏感值
- **断言**: 用例 D4-6 预期结果未满足
- **根因**: 存在未脱敏的敏感值
- **影响**: D4安全 维度 P1 用例
- **证据**: evidence/D4-6/stdout.log

## #3【高】D4-8 Python/Node策略一致

- **现象**: 双路径判定不一致
- **断言**: 用例 D4-8 预期结果未满足
- **根因**: 双路径判定不一致
- **影响**: D4安全 维度 P1 用例
- **证据**: evidence/D4-8/stdout.log

## #4【高】D4-11 提示注入防护

- **现象**: 部分注入 payload 未被拦截 [PARTIAL treated as FAIL per test framework]
- **断言**: 用例 D4-11 预期结果未满足
- **根因**: 部分注入 payload 未被拦截 [PARTIAL treated as FAIL per test framework]
- **影响**: D4安全 维度 P1 用例
- **证据**: evidence/D4-11/stdout.log

## #5【严重】D4-16 命令包裹穿透

- **现象**: 存在未被拦截的包裹命令
- **断言**: 用例 D4-16 预期结果未满足
- **根因**: 存在未被拦截的包裹命令
- **影响**: D4安全 维度 P0 用例
- **证据**: evidence/D4-16/stdout.log

## #6【高】D4-27 双路径输出脱敏

- **现象**: 存在未脱敏的输出
- **断言**: 用例 D4-27 预期结果未满足
- **根因**: 存在未脱敏的输出
- **影响**: D4安全 维度 P1 用例
- **证据**: evidence/D4-27/stdout.log

## #7【高】D5-1 清单发现加载

- **现象**: One or more checks failed (exit code 1)
- **断言**: 用例 D5-1 预期结果未满足
- **根因**: One or more checks failed (exit code 1)
- **影响**: D5客户端 维度 P1 用例
- **证据**: evidence/D5-1/stdout.log

## #8【高】D5-3 工具全量枚举

- **现象**: One or more checks failed (exit code 1)
- **断言**: 用例 D5-3 预期结果未满足
- **根因**: One or more checks failed (exit code 1)
- **影响**: D5客户端 维度 P1 用例
- **证据**: evidence/D5-3/stdout.log

## #9【中】D6-9 缓存清理三入口

- **现象**: One or more checks failed (exit code 1)
- **断言**: 用例 D6-9 预期结果未满足
- **根因**: One or more checks failed (exit code 1)
- **影响**: D6性能 维度 P2 用例
- **证据**: evidence/D6-9/stdout.log

## #10【高】EXP-D5-7-1 在 OfficeAce 上执行 D5-1 用例

- **现象**: One or more checks failed (exit code 1)
- **断言**: 用例 EXP-D5-7-1 预期结果未满足
- **根因**: One or more checks failed (exit code 1)
- **影响**: D5-1 维度 P1 用例
- **证据**: evidence/EXP-D5-7-1/stdout.log

## #11【高】EXP-D5-7-3 在 OfficeAce 上执行 D5-3 用例

- **现象**: One or more checks failed (exit code 1)
- **断言**: 用例 EXP-D5-7-3 预期结果未满足
- **根因**: One or more checks failed (exit code 1)
- **影响**: D5-3 维度 P1 用例
- **证据**: evidence/EXP-D5-7-3/stdout.log

## #12【高】EXP-E01 ①源码级: node eval/harness/run-eval.mjs 跑 serviceCata

- **现象**: EXP-E01: 路由未命中 期望=ECS 实际=Run hcloud --help to list available services.
- **断言**: 用例 EXP-E01 预期结果未满足
- **根因**: EXP-E01: 路由未命中 期望=ECS 实际=Run hcloud --help to list available services.
- **影响**: D10-3 维度 P1 用例
- **证据**: evidence/EXP-E01/stdout.log

## #13【高】EXP-E02 ①源码级: node eval/harness/run-eval.mjs 跑 serviceCata

- **现象**: EXP-E02: 路由未命中 期望=ECS 实际=Run hcloud --help to list available services.
- **断言**: 用例 EXP-E02 预期结果未满足
- **根因**: EXP-E02: 路由未命中 期望=ECS 实际=Run hcloud --help to list available services.
- **影响**: D10-3 维度 P1 用例
- **证据**: evidence/EXP-E02/stdout.log

## #14【高】EXP-E03 ①源码级: node eval/harness/run-eval.mjs 跑 serviceCata

- **现象**: EXP-E03: 路由未命中 期望=OBS 实际=Sandbox+DevStation
- **断言**: 用例 EXP-E03 预期结果未满足
- **根因**: EXP-E03: 路由未命中 期望=OBS 实际=Sandbox+DevStation
- **影响**: D10-3 维度 P1 用例
- **证据**: evidence/EXP-E03/stdout.log

## #15【高】EXP-E04 ①源码级: node eval/harness/run-eval.mjs 跑 serviceCata

- **现象**: EXP-E04: 路由未命中 期望=EIP 实际=Run hcloud --help to list available services.
- **断言**: 用例 EXP-E04 预期结果未满足
- **根因**: EXP-E04: 路由未命中 期望=EIP 实际=Run hcloud --help to list available services.
- **影响**: D10-3 维度 P1 用例
- **证据**: evidence/EXP-E04/stdout.log

## #16【高】EXP-E05 ①源码级: node eval/harness/run-eval.mjs 跑 serviceCata

- **现象**: EXP-E05: 路由未命中 期望=RDS 实际=Run hcloud --help to list available services.
- **断言**: 用例 EXP-E05 预期结果未满足
- **根因**: EXP-E05: 路由未命中 期望=RDS 实际=Run hcloud --help to list available services.
- **影响**: D10-3 维度 P1 用例
- **证据**: evidence/EXP-E05/stdout.log

## #17【高】EXP-E07 ①源码级: node eval/harness/run-eval.mjs 跑 serviceCata

- **现象**: EXP-E07: 路由未命中 期望=CBR 实际=Run hcloud --help to list available services.
- **断言**: 用例 EXP-E07 预期结果未满足
- **根因**: EXP-E07: 路由未命中 期望=CBR 实际=Run hcloud --help to list available services.
- **影响**: D10-3 维度 P1 用例
- **证据**: evidence/EXP-E07/stdout.log

## #18【高】EXP-E10 ①源码级: node eval/harness/run-eval.mjs 跑 serviceCata

- **现象**: EXP-E10: 路由未命中 期望=FunctionGraph 实际=Run hcloud --help to list available services.
- **断言**: 用例 EXP-E10 预期结果未满足
- **根因**: EXP-E10: 路由未命中 期望=FunctionGraph 实际=Run hcloud --help to list available services.
- **影响**: D10-3 维度 P1 用例
- **证据**: evidence/EXP-E10/stdout.log

## #19【高】EXP-E11 ①源码级: node eval/harness/run-eval.mjs 跑 serviceCata

- **现象**: EXP-E11: 路由未命中 期望=BSS 实际=Run hcloud --help to list available services.
- **断言**: 用例 EXP-E11 预期结果未满足
- **根因**: EXP-E11: 路由未命中 期望=BSS 实际=Run hcloud --help to list available services.
- **影响**: D10-3 维度 P1 用例
- **证据**: evidence/EXP-E11/stdout.log

## #20【高】EXP-E12 ①源码级: node eval/harness/run-eval.mjs 跑 serviceCata

- **现象**: EXP-E12: 路由未命中 期望=CES 实际=Run hcloud --help to list available services.
- **断言**: 用例 EXP-E12 预期结果未满足
- **根因**: EXP-E12: 路由未命中 期望=CES 实际=Run hcloud --help to list available services.
- **影响**: D10-3 维度 P1 用例
- **证据**: evidence/EXP-E12/stdout.log

## #21【高】EXP-E13 ①源码级: node eval/harness/run-eval.mjs 跑 serviceCata

- **现象**: EXP-E13: 路由未命中 期望=ELB 实际=Run hcloud --help to list available services.
- **断言**: 用例 EXP-E13 预期结果未满足
- **根因**: EXP-E13: 路由未命中 期望=ELB 实际=Run hcloud --help to list available services.
- **影响**: D10-3 维度 P1 用例
- **证据**: evidence/EXP-E13/stdout.log

## #22【高】EXP-E14 ①源码级: node eval/harness/run-eval.mjs 跑 serviceCata

- **现象**: EXP-E14: 路由未命中 期望=IAM 实际=Run hcloud --help to list available services.
- **断言**: 用例 EXP-E14 预期结果未满足
- **根因**: EXP-E14: 路由未命中 期望=IAM 实际=Run hcloud --help to list available services.
- **影响**: D10-3 维度 P1 用例
- **证据**: evidence/EXP-E14/stdout.log

