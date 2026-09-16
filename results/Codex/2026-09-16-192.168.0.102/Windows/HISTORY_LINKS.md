# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经查重命中上游仓已有历史 issue，本次**不新开单**。

## D1-39 Windows 升级检测链返回空结果
- 今日证据：`evidence/D1-39/stdout.log`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#690](https://github.com/huaweicloud/huaweicloud-devkit/issues/690)（open）**[test] Hermes Windows 每日测试 2026-09-15: D4-22 deploy plan 公网暴露规则误报 (1 新缺陷 + 3 已知复现)**
    - 历史单内容：## 缺陷描述 ### D4-22【P0】hook_check_deploy_plan 公网暴露规则误报（SPEC-MISMATCH） - **现象**：`evaluateDeployPlan` 的 `hwc-functiongraph-public-no-auth` 规则对 `public_access=false` 的安全配置也触发 `severity=warn` 告警 - **断言**：当 
  - [#677](https://github.com/huaweicloud/huaweicloud-devkit/issues/677)（open）**[test] Hermes Windows P0 缺陷汇总 (v1.1.4-next.6, 2026-09-14): D1-39/D4-2/D4-3/D4-15/D4-16**
    - 历史单内容：## 测试信息 - **客户端**: Hermes (GLM-5.2) - **OS**: Windows 10 - **被测版本**: v1.1.4-next.6 - **测试日期**: 2026-09-14 - **P0 结果**: PASS 13 / FAIL 5 - **测试报告**: [Hermes-GLM-5.2-测试报告.md](https://github.com/huaweicl
  - [#654](https://github.com/huaweicloud/huaweicloud-devkit/issues/654)（open）**[测试报告] huaweicloud-devkit 1.1.4-next.3 全量测试缺陷合并单（2 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4-next.3 - 缺陷：2 项 ## 缺陷清单 ### 1. [P1] 安装自动探测结果与测试契约不一致 - **描述**：Windows Node 测试 `install auto-detect with multiple agents requires explicit target in non-interactive shells` 期望只报告 `
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#653
