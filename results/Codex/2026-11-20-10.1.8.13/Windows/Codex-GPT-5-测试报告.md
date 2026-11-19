# Codex-GPT-5 每日测试报告
> **报告名**：`Codex-GPT-5-测试报告.md`
> **生成时间**：2026-11-20 05:13:46（北京时间）
> **执行归档**：`results/Codex/2026-11-20-10.1.8.13/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Codex` + `GPT-5` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `2.0.0-next.4` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：v2 dist 纯函数直调、CLI 真机命令、MCP stdio 夹具与 Codex 插件发现夹具；未执行资源创建

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `88 / 53 / 5 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141） | `62.4%` |
| P0 / P1 / P2 新增缺陷 | `5 / 47 / 1` |
| 红线（I 类）违规 | `无已确认产品红线违规；MCP harness 兼容性见 FINDINGS.md` |
| 资源释放 | `无已确认产品红线违规；MCP harness 兼容性见 FINDINGS.md` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `87` | 有证据且通过 PASS 门禁 |
| FAIL | `15` | 不符预期，根因见缺陷清单 |
| BLOCKED | `5` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `1` | 有证据且通过 PASS 门禁 |
| FAIL | `38` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `D1-26` | D1安装 | 升级提醒工具注册与协议暴露 | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 2 | P1 | `D1-41` | D1安装 | check_update 真实 MCP 返回契约 | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 3 | P1 | `D1-45` | D1安装 | 兜底提示真实序列与预热竞态 | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 4 | P0 | `D4-18` | D4安全 | confirm-not-deny审批语义 | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 5 | P1 | `D2-5` | D2认证 | 凭证缺失报错指引 | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 6 | P2 | `D3-B1` | D3功能 | list_operations规范名 | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 7 | P1 | `D3-C1` | D3功能 | ECS生命周期E2E | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 8 | P1 | `D3-C4` | D3功能 | 服务创建类回归 | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 9 | P0 | `D4-15` | D4安全 | hook绕过尝试 | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 10 | P0 | `D8-7` | D8质量 | 7 个 meta/通用技能指引可机械执行验证 | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 11 | P1 | `D9-1` | D9协议 | tools/list合规 | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 12 | P1 | `D9-2` | D9协议 | JSON-RPC错误码 | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 13 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 14 | P0 | `D9-13` | D9协议 | tools/call 凭证不泄露与权限校验 | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 15 | P1 | `D10-3` | D10评测 | 路由准确率+混淆矩阵 | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 16 | P1 | `EXP-D5-2-3` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 17 | P1 | `EXP-C4-01` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 18 | P1 | `EXP-C4-02` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 19 | P1 | `EXP-C4-03` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 20 | P1 | `EXP-C4-04` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 21 | P1 | `EXP-C4-05` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 22 | P1 | `EXP-C4-06` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 23 | P1 | `EXP-C4-07` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 24 | P1 | `EXP-C4-08` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 25 | P1 | `EXP-C4-09` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 26 | P1 | `EXP-C4-10` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 27 | P1 | `EXP-C4-11` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 28 | P1 | `EXP-C4-12` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 29 | P1 | `EXP-C4-13` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 30 | P1 | `EXP-C4-14` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 31 | P1 | `EXP-C4-15` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 32 | P1 | `EXP-C4-16` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 33 | P1 | `EXP-C4-17` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 34 | P1 | `EXP-C4-18` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 35 | P1 | `EXP-C4-19` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 36 | P1 | `EXP-C4-20` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 37 | P1 | `EXP-C4-21` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 38 | P1 | `EXP-C4-22` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 39 | P1 | `EXP-E01` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 40 | P1 | `EXP-E02` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 41 | P1 | `EXP-E03` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 42 | P1 | `EXP-E04` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 43 | P1 | `EXP-E05` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 44 | P1 | `EXP-E06` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 45 | P1 | `EXP-E07` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 46 | P1 | `EXP-E08` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 47 | P1 | `EXP-E09` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 48 | P1 | `EXP-E10` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 49 | P1 | `EXP-E11` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 50 | P1 | `EXP-E12` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 51 | P1 | `EXP-E13` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 52 | P1 | `EXP-E14` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |
| 53 | P1 | `EXP-E15` |  |  | 测试侧 v1→v2 harness 兼容性，详见 FINDINGS.md | 待提单 |

### 根因详情

> 53 条 FAIL 的统一测试侧根因与证据见 FINDINGS.md；修复 harness 后必须重跑，当前不归因产品。

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D1-67` | D1安装 | Agent toolkit 模式与 DSH 跳过安装环境变量 | AGENT_TOOLKIT_MODE=local is DSH-client-specific (HUAWEICLOUD_AGENT_TOOLKIT_MODE env tested by DSH agent) |
| `D3-C3` | D3功能 | 沙箱部署E2E | Sandbox E2E requires DevStation upstream connection (real network sandbox) |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | Sandbox HDKit requires DevStation upstream |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | Sandbox requires DevStation upstream |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | Sandbox requires DevStation upstream |

---

## 六、安全与红线合规

- [ ] 凭证泄漏事件：`无已确认产品红线违规；MCP harness 兼容性见 FINDINGS.md`
- [ ] 写操作误判 read-only：`无已确认产品红线违规；MCP harness 兼容性见 FINDINGS.md`
- [ ] 红线（I 类）违规：`无已确认产品红线违规；MCP harness 兼容性见 FINDINGS.md`
- [ ] 脱敏复核：`无已确认产品红线违规；MCP harness 兼容性见 FINDINGS.md`

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 本轮未创建云资源 | 0 | 0 | 不适用 |

> 本轮执行包未下发需要创建云资源的用例，未产生待释放资源。

---

## 八、遗留与建议

- 先修复测试仓库 v1 MCP helper 与 v2 stdio/模块布局兼容性，再重跑当前 53 条 FAIL；5 条 BLOCKED 需 DevStation/DSH 专属上游环境补测。
