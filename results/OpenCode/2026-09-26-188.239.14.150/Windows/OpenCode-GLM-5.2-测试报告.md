# OpenCode-GLM-5.2 每日测试报告

## 一、测试概述

| 项目 | 值 |
|---|---|
| 客户端 | OpenCode (GLM-5.2) |
| 操作系统 | Windows Server 2022 (x86_64) |
| 被测版本 | huaweicloud-devkit@1.1.7 (gitHead 7456d059) |
| 测试日期 | 2026-09-26 |
| 机器IP | 188.239.14.150 |
| 测试类型 | 每日测试 (daily) |
| npm 包 | huaweicloud-devkit@1.1.7 (latest 正式版) |

## 二、执行摘要

| 层级 | 总数 | PASS | FAIL | BLOCKED | NOT_RUN | 通过率 |
|---|---|---|---|---|---|---|
| 设计级 | 102 | 96 | 6 | 0 | 0 | 94.1% |
| 展开级 | 39 | 27 | 12 | 0 | 0 | 69.2% |
| **合计** | **141** | **123** | **18** | **0** | **0** | **87.2%** |

### P0 结果

| P0 用例 | 状态 |
|---|---|
| D1-39 Windows 升级检测链可用性 | PASS |
| D1-40 镜像 lag 下检测正确性 | PASS |
| D2-11 R3 STS token拒绝落盘 | PASS |
| D4-1 凭证文件读取拦截 | PASS |
| D4-2 凭证env打印拦截 | **FAIL** |
| D4-3 明文secret API拦截 | **FAIL** |
| D4-5 写操作误判检测 | PASS |
| D4-9 公开暴露/破坏性预检 | PASS |
| D4-15 hook绕过尝试 | PASS |
| D4-16 命令包裹穿透 | **FAIL** |
| D4-18 confirm-not-deny审批语义 | PASS |
| D4-19 确认流下预检仍生效 | PASS |
| D4-21 hook_check_artifacts回归 | PASS |
| D4-22 hook_check_deploy_plan回归 | PASS |
| D4-23 全局规则注入生效性 | PASS |
| D4-28 Node版安全hook链路 | PASS |
| D4-4 凭证脱敏正确性 | PASS |
| D8-7 7个meta/通用技能指引 | PASS |
| D9-12 initialize握手协议安全基线 | PASS |
| D9-13 tools/call凭证不泄露与权限校验 | PASS |
| D10-4 安全干预-静态规则层 | PASS |

P0: 18 PASS / 3 FAIL = 85.7% 通过率

## 三、状态汇总

### 设计级按维度统计

| 维度 | 总数 | PASS | FAIL |
|---|---|---|---|
| D1 安装 | 16 | 16 | 0 |
| D2 认证 | 12 | 12 | 0 |
| D3 功能 | 16 | 16 | 0 |
| D4 安全 | 29 | 23 | 6 |
| D5 客户端矩阵 | 2 | 2 | 0 |
| D6 性能 | 4 | 4 | 0 |
| D8 文档 | 6 | 6 | 0 |
| D9 协议 | 11 | 11 | 0 |
| D10 评测 | 2 | 1 | 1 |
| D3-C4 服务矩阵 | 1 | 1 | 0 |
| D3-S 场景 | 3 | 3 | 0 |

### 展开级统计

| 展开类型 | 总数 | PASS | FAIL |
|---|---|---|---|
| D5客户端矩阵 | 2 | 2 | 0 |
| D3-C4服务矩阵 | 22 | 22 | 0 |
| D10评测集 | 15 | 3 | 12 |

## 四、缺陷清单

共 6 项缺陷（3 P0 + 3 P1），均为已知历史缺陷复现：

| # | 优先级 | 用例 | 描述 | 根因 |
|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证env打印拦截不完整 | cloud-risk-rules.json:39 HW_前缀未覆盖 |
| 2 | P0 | D4-3 | 明文secret API拦截缺失 | cloud-risk-rules.json 缺少内联密钥参数规则 |
| 3 | P0 | D4-16 | 命令包裹穿透 | risk-rule-engine.mjs:143 不解析shell包裹 |
| 4 | P1 | D4-7 | hook_check_command对内联密钥无效 | 同#2，缺少内联密钥参数规则 |
| 5 | P1 | D4-17 | 未知命令fail-open | risk-rule-engine.mjs:106 fail-open应fail-closed |
| 6 | P1 | D10-3 | serviceCatalog路由准确率21.4% | tools.mjs serviceCatalog意图匹配覆盖不足 |

展开级 EXP-E01~E14 路由 MISS（12 项）均为 D10-3 同一根因的展开表现。

详细缺陷信息见 `FINDINGS.md`。

## 五、未执行用例与原因

无未执行用例（NOT_RUN=0, BLOCKED=0）。所有用例均已实际执行并落盘证据。

## 六、安全/红线

- **真云执行**：D3-S1(ECS查询)、D3-S2(VPC删除计划)、D3-S3(沙箱用户检查)、D3-S4(代金券状态)、D3-S7(跨服务)、D3-S8(排障)、D1-41(check_update) 均通过 MCP 工具真机执行，资源归零验证通过。
- **PASS 门禁**：`verify_no_fake_pass.py` 通过 — 所有 PASS 用例均有 evidencePath 且证据文件存在。
- **覆盖率门禁**：`verify_coverage.py` 通过 — P0 无 NOT_RUN/空，NOT_RUN+空占比 0.0%。
- **凭证安全**：所有工具响应均无 AK/SK 泄露（D9-13 验证通过）。

## 七、资源释放

- ECS ListServersDetails: count=0（干净账号，无残留资源）
- VPC DeleteVpc: plan 阶段 deny（未实际执行删除，无资源创建）
- 沙箱检查: 仅 check_user 只读调用，未创建沙箱实例
- 代金券: claimed=true（已领取状态确认，无新增领取）
- 所有真云测试均为只读或 plan 阶段，零资源创建，零残留

## 八、遗留建议

1. **D4-2/D4-3/D4-7**：安全规则引擎需补充 `HW_` 前缀覆盖和 hcloud 内联密钥参数检测规则。这是自 v1.1.2 以来的已知缺陷，跨多个版本复现。
2. **D4-16**：风险规则引擎需增加 shell 包裹解析能力，提取 `sh -c`/`bash -c`/`cmd /c` 中的内层命令进行独立检查。
3. **D4-17**：风险规则引擎的默认策略应从 fail-open 改为 fail-closed，未知命令至少返回 warn。
4. **D10-3**：serviceCatalog 需大幅扩展中文意图匹配模式覆盖面，当前 21.4% 准确率远低于 90% 阈值，影响 Agent 对中文用户请求的路由能力。
5. 以上 6 项缺陷均为历史已知问题（详见 HISTORY_LINKS.md），已在多个上游 issue 中记录，本次为 v1.1.7 版本复核确认仍未修复。
