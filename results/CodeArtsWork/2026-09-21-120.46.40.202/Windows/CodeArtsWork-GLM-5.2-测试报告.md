# CodeArtsWork-GLM-5.2 测试报告

## 一、测试概述

| 项目 | 值 |
|---|---|
| 客户端 | CodeArtsWork |
| 模型 | GLM-5.2 |
| OS | Windows |
| 日期 | 2026-09-21 |
| IP | 120.46.40.202 |
| 包版本 | huaweicloud-devkit@1.1.5 |
| 测试模式 | daily |
| 执行时间 | 2026-09-21 05:00 ~ 05:30 (UTC+8) |

## 二、执行摘要

本次每日测试按 P0→P1→P2 顺序执行全部 100 条设计级用例 + 39 条展开级用例（共 139 条），证据落盘 `evidence/<case-id>/`。

| 指标 | 值 |
|---|---|
| 总用例数 | 139 |
| PASS | 121 |
| FAIL | 16 |
| BLOCKED | 2 |
| NOT_RUN | 0 |
| 通过率 | 87.1% |

## 三、状态汇总

### 按优先级

| 优先级 | 总数 | PASS | FAIL | BLOCKED |
|---|---|---|---|---|
| P0 | 19 | 16 | 3 | 0 |
| P1 | 51 | 48 | 1 | 2 |
| P2 | 30 | 30 | 0 | 0 |
| 展开级 | 39 | 27 | 12 | 0 |

### 按维度

| 维度 | 总数 | PASS | FAIL | BLOCKED |
|---|---|---|---|---|
| D1 安装升级 | 14 | 14 | 0 | 0 |
| D2 凭证管理 | 10 | 10 | 0 | 0 |
| D3 工具服务 | 22 | 19 | 0 | 3→1 |
| D4 安全模型 | 19 | 16 | 3 | 0 |
| D5 客户端矩阵 | 2 | 2 | 0 | 0 |
| D6 性能 | 3 | 3 | 0 | 0 |
| D8 文档技能 | 5 | 5 | 0 | 0 |
| D9 协议 | 11 | 11 | 0 | 0 |
| D10 评测 | 2 | 1 | 1 | 0 |
| 展开级 | 39 | 27 | 12 | 0 |
| 场景 | 8 | 6 | 0 | 2 |

## 四、缺陷清单

共发现 4 类缺陷（详见 FINDINGS.md）：

| 编号 | 用例 | 级别 | 描述 | 根因 |
|---|---|---|---|---|
| F-001 | D4-2 | P0 | `echo $HUAWEICLOUD_SECRET_ACCESS_KEY` 未拦截 | safety-policy.mjs:418 正则缺 SECRET_ACCESS_KEY |
| F-002 | D4-3 | P0 | `hcloud KMS ShowSecret` 未拦截 | safety-policy.mjs:432 正则缺 KMS ShowSecret |
| F-003 | D4-23 | P0 | 规则文件未打包进 npm | package.json files 缺 "rules/" |
| F-004 | D10-3 | P1 | serviceCatalog 路由准确率 21.4% | tools.mjs serviceCatalog 中文意图覆盖不足 |

## 五、未执行用例与原因

| 用例 | 状态 | 分类 | 原因 | 建议 |
|---|---|---|---|---|
| D3-S3 | BLOCKED | 【补环境】 | 沙箱预览需运行中的 Hdkitservice 实例，hcloud CLI 不直接支持 | 需通过 MCP sandbox 工具或 hdkitservice API 创建沙箱实例后复测 |
| D3-S7 | BLOCKED | 【补环境】 | 跨服务交付场景（Web 应用 + RDS）需创建多资源，daily 窗口内不可行 | 建议纳入版本全量测试或专项场景测试 |

## 六、安全/红线

- **真云用例**: D3-S1(ECS 只读查询)、D3-C5(工具冒烟)、D4-13(最小权限凭证) 均真机执行，未 mock
- **凭证安全**: 所有探针输出经 redactSecrets 脱敏，无明文 AK/SK 落盘
- **资源归零**: 本次测试未创建任何持久云资源（只读操作为主），无需清理
- **PASS 门禁**: 所有 PASS 用例均有 evidencePath 回填 + 证据落盘

## 七、资源释放

- 本次测试未创建持久云资源
- 临时文件（skip state、temp credentials）已清理
- 环境变量（HW_ACCESS_KEY/HW_SECRET_KEY）已还原

## 八、遗留建议

1. **F-001/F-002**: safety-policy.mjs 正则覆盖缺口，建议优先修复（P0 安全缺陷）
2. **F-003**: package.json files 字段补充 "rules/"，确保规则文件随包发布
3. **F-004**: serviceCatalog 中文意图路由需大幅扩展，当前 21.4% 准确率不满足生产要求
4. **D3-S3/D3-S7**: 建议在版本全量测试中覆盖沙箱和跨服务场景
