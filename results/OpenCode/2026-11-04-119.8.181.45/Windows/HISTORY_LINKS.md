# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经查重命中上游仓已有历史 issue，本次**不新开单**。

## D1-39 Windows 升级检测链静默失败（parseDistTagsOutput 拒绝 npm 12 数组输出）
- 今日证据：`evidence/D1-39/stdout.log`（含 rawNpmOutput 数组形式 + parseDistTagsOutput 对 array 返回 null、对 object 返回正确结果）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#1063](https://github.com/huaweicloud/huaweicloud-devkit/issues/1063)（open）**[测试报告] huaweicloud-devkit 1.1.13-next.0 每日测试缺陷合并单（1 项）**
    - 历史单内容：## 目标 修复 huaweicloud-devkit 1.1.13-next.0 在 Windows 环境下升级检测链可用性缺陷（用例 D1-39，P0）。 ## 现状 - 被测版本：1.1.13-next.0 - 测试环境：Windows / CodeArtsAgent + openpangu-2.0-pro - 每日测试报告结论 PARTIAL：设计级已执行 35，PASS 32 / FAI
  - [#761](https://github.com/huaweicloud/huaweicloud-devkit/issues/761)（open）**[测试报告] huaweicloud-devkit v1.1.5 每日测试缺陷合并单（OfficeAce Windows 2026-09-20，8+11 项）**
    - 历史单内容：## 每日测试缺陷合并单 — OfficeAce/Windows/2026-09-20 ### 基本信息 - **客户端**: OfficeAce - **操作系统**: Windows (AMD64) - **被测版本**: huaweicloud-devkit@1.1.5 - **测试日期**: 2026-09-20 - **设计级**: 100 条 (92 PASS, 8 FAIL) - *
  - [#690](https://github.com/huaweicloud/huaweicloud-devkit/issues/690)（open）**[test] Hermes Windows 每日测试 2026-09-15: D4-22 deploy plan 公网暴露规则误报 (1 新缺陷 + 3 已知复现)**
    - 历史单内容：## 缺陷描述 ### D4-22【P0】hook_check_deploy_plan 公网暴露规则误报（SPEC-MISMATCH） - **现象**：`evaluateDeployPlan` 的 `hwc-functiongraph-public-no-auth` 规则对 `public_access=false` 的安全配置也触发 `severity=warn` 告警 - **断言**：当 
  - [#677](https://github.com/huaweicloud/huaweicloud-devkit/issues/677)（open）**[test] Hermes Windows P0 缺陷汇总 (v1.1.4-next.6, 2026-09-14): D1-39/D4-2/D4-3/D4-15/D4-16**
    - 历史单内容：## 测试信息 - **客户端**: Hermes (GLM-5.2) - **OS**: Windows 10 - **被测版本**: v1.1.4-next.6 - **测试日期**: 2026-09-14 - **P0 结果**: PASS 13 / FAIL 5 - **测试报告**: [Hermes-GLM-5.2-测试报告.md](https://github.com/huaweicl
  - [#653](https://github.com/huaweicloud/huaweicloud-devkit/issues/653)（open）**[测试报告] huaweicloud-devkit 1.1.4-next.3 全量测试缺陷合并单（1 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4-next.3 - 缺陷：1 项 ## 缺陷清单 ### 1. [P0] Windows 升级检测链 EINVAL 静默失败 - **描述**：在 Windows + Node.js v22.22.2 环境下，`queryDistTagsSync` 和 `queryDistTags` 调用 `spawnSync('npm.cmd', ...)` / `spa

## D1-40 镜像 lag 检测失效（同一根因：parseDistTagsOutput 拒绝数组）
- 今日证据：`evidence/D1-40/stdout.log`（defaultRegistryResult=null, officialRegistryResult=null）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#673](https://github.com/huaweicloud/huaweicloud-devkit/issues/673)（open）**[测试报告] huaweicloud-devkit 1.1.4-next.6 全量测试缺陷合并单（6 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4-next.6 - 缺陷：6 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECRET_KEY` 经 `h
