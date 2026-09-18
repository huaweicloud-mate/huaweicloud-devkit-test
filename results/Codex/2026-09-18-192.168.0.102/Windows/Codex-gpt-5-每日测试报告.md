# Codex-gpt-5 每日测试报告

生成时间：2026-09-18 15:45:00（北京时间）  
执行归档：`results/Codex/2026-09-18-192.168.0.102/Windows/`  
被测版本：`huaweicloud-devkit@1.1.5`，源码 commit `e7ed6f66`  
结论：`FAIL`

## 一、测试概述

客户端/Agent：Codex；OS：Windows；Node：v22.23.2；Python：3.11.15。工具全集：40。真云区域：cn-north-4，管理员凭证和只读子账号均已实测。测试覆盖源码探针、MCP 协议、D10 路由 harness、真云 E2E 和服务矩阵。

## 二、执行摘要

| 项 | 值 |
|---|---:|
| 计划用例 | 119 |
| 已执行 | 118 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 99 / 18 / 0 / 1 / 1 |
| 通过率（PASS / PASS+FAIL+SPEC） | 83.9% |
| P0 / P1 / P2 新增产品缺陷 | 3 / 6 / 1 |
| 资源释放 | ECS/VPC/子网删除请求已提交；OBS 已删桶；沙箱会话已关闭 |

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 |
|---|---:|
| PASS | 72 |
| FAIL | 7 |
| BLOCKED | 0 |
| SPEC-MISMATCH | 1 |
| NOT_RUN | 0 |
| 合计 | 80 |

### 3.2 展开级

| 状态 | 数量 |
|---|---:|
| PASS | 27 |
| FAIL | 11 |
| BLOCKED | 0 |
| SPEC-MISMATCH | 0 |
| NOT_RUN | 1 |
| 合计 | 39 |

## 四、缺陷清单

详细缺陷见同目录 `FINDINGS.md`。主要问题包括 D4-16 shell 包裹写操作绕过、D2-4/D4-27 脱敏不完整、D9-2 非法参数错误码缺失、D10-3 路由准确率 21.4%、D3-C3 部署检查失败，以及 D9-9 取消能力契约漂移。

## 五、未执行用例与原因

| 用例 | 层级 | 状态 | 分类 | 原因及建议 |
|---|---|---|---|---|
| EXP-E08 | 展开级/P1 | NOT_RUN | 改用例 | harness 将诊断意图定义为 N/A，未产生 serviceCatalog 可判定命中；建议拆为 explain_error 专项断言。 |

## 六、安全与红线合规

- 凭证泄漏事件：测试日志按探针输出；发现 D2-4/D4-27 产品脱敏缺陷，已写入 FINDINGS。
- 写操作误判只读：D4-16 发现 shell 包装绕过，已写入 FINDINGS。
- PASS 门禁：`verify_no_fake_pass.py` 通过。
- 覆盖率门禁：`verify_coverage.py` 通过，P0 无空值或 NOT_RUN。

## 七、资源释放

OBS 测试桶已创建并成功删除；ECS、VPC、子网使用本轮唯一标识，脚本 finally 已提交删除请求；沙箱会话已关闭。D3-C1 证据保留资源 ID 与清理记录，需维护者后续确认异步删除最终归零。

## 八、遗留与建议

- 统一提单前需历史查重；FINDINGS 中 FAIL/SPEC 项应合并提报源码仓库。
- D9-9 需先裁决 cancellation capability 规格。
- 建议优先修复 D4-16、D2-4/D4-27、D9-2，再复测 D10 路由和沙箱部署检查。
