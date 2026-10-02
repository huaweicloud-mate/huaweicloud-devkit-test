# Codex-GPT-5-Codex 每日测试报告
> **报告名**：`Codex-GPT-5-Codex-测试报告.md`
> **生成时间**：2026-10-03 05:07:24（北京时间）
> **执行归档**：`results/Codex/2026-10-03-192.168.0.102/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Codex` + `GPT-5-Codex` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.8-next.1` |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：prepare_env/update 后运行 fixture 批次、D10 serviceCatalog 路由 harness、D9 protocol-probe；源码可核对项由 backfill.py 标注，未完成真云服务矩阵实测的 EXP-C4 保留 BLOCKED。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `92 / 4 / 44 / 1 / 0` |
| 通过率（分母 = PASS+FAIL = 96） | `95.8%` |
| P0 / P1 / P2 新增缺陷 | `1 / 3 / 0` |
| 红线（I 类）违规 | `1`（D4-16 P0 命令包裹穿透仍为 FAIL，沿用当前仓库回填规则） |
| 资源释放 | `未创建云资源`（本轮未执行 EXP-C4 最低配创建/释放；fixture 使用本地临时目录/mock，进程已退出） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `77` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | 不符预期，根因见缺陷清单 |
| BLOCKED | `21` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `15` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `23` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | 见 FINDINGS.md | 待提单 |
| 2 | P1 | `D8-4` | D8质量 | 引导步骤可机械执行 | 见 FINDINGS.md | 待提单 |
| 3 | P1 | `D9-2` | D9协议 | JSON-RPC错误码 | 见 FINDINGS.md | 待提单 |
| 4 | P1 | `EXP-E01` |  |  | 见 FINDINGS.md | 待提单 |

### 根因详情

根因详情已落 `FINDINGS.md`。D9-2 与 EXP-E01 为本轮 harness 实测；D4-16/D8-4 为仓库回填规则记录的既有失败项。

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D1-3` | D1安装 | doctor健康自检 | 无静态可核对依据 |
| `D1-4` | D1安装 | status/update幂等 | 无静态可核对依据 |
| `D1-26` | D1安装 | 升级提醒工具注册与协议暴露 | 需真机/真实CLI执行 |
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 需真机/真实CLI执行 |
| `D1-70` | D1安装 | 代理配置与 WebSocket 代理 | 源码核对(函数存在) |
| `D3-C5` | D3功能 | 工具冒烟 | 需真机/真实CLI执行 |
| `D3-S4` | D3功能 | 场景-领券闭环 | 需真机/真实CLI执行 |
| `D4-22` | D4安全 | hook_check_deploy_plan 具名回归（部署计划预检） | 需真机/真实CLI执行 |
| `D4-23` | D4安全 | 全局规则 huawei-agent-rules.md 注入生效性（11 安装目标） | 无静态可核对依据 |
| `D6-3` | D6性能 | MCP冷启时间 | 无静态可核对依据 |
| `D6-4` | D6性能 | 并发调度正确性 | 无静态可核对依据 |
| `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | 源码核对(函数存在) |
| `D9-1` | D9协议 | tools/list合规 | 无静态可核对依据 |
| `D9-3` | D9协议 | tools/call响应格式 | 无静态可核对依据 |
| `D9-4` | D9协议 | 协议生命周期 | 无静态可核对依据 |
| `D9-5` | D9协议 | stdio传输健壮 | 无静态可核对依据 |
| `D9-7` | D9协议 | 协议版本协商降级 | 无静态可核对依据 |
| `D9-8` | D9协议 | inputSchema版本合规 | 无静态可核对依据 |
| `D9-12` | D9协议 | initialize 握手协议安全基线 | 源码核对(函数存在) |
| `D9-13` | D9协议 | tools/call 凭证不泄露与权限校验 | 源码核对(函数存在) |
| `D10-3` | D10评测 | 路由准确率+混淆矩阵 | 无静态可核对依据 |
| `EXP-C4-01` |  |  | 未找到当前仓库可直接执行的 EXP-C4 服务矩阵 harness；本轮未进行逐服务 hcloud list_operations + plan + 最低配创建/释放归零验证，需补真实云端执行 |
| `EXP-C4-02` |  |  | 未找到当前仓库可直接执行的 EXP-C4 服务矩阵 harness；本轮未进行逐服务 hcloud list_operations + plan + 最低配创建/释放归零验证，需补真实云端执行 |
| `EXP-C4-03` |  |  | 未找到当前仓库可直接执行的 EXP-C4 服务矩阵 harness；本轮未进行逐服务 hcloud list_operations + plan + 最低配创建/释放归零验证，需补真实云端执行 |
| `EXP-C4-04` |  |  | 未找到当前仓库可直接执行的 EXP-C4 服务矩阵 harness；本轮未进行逐服务 hcloud list_operations + plan + 最低配创建/释放归零验证，需补真实云端执行 |
| `EXP-C4-05` |  |  | 未找到当前仓库可直接执行的 EXP-C4 服务矩阵 harness；本轮未进行逐服务 hcloud list_operations + plan + 最低配创建/释放归零验证，需补真实云端执行 |
| `EXP-C4-06` |  |  | 未找到当前仓库可直接执行的 EXP-C4 服务矩阵 harness；本轮未进行逐服务 hcloud list_operations + plan + 最低配创建/释放归零验证，需补真实云端执行 |
| `EXP-C4-07` |  |  | 未找到当前仓库可直接执行的 EXP-C4 服务矩阵 harness；本轮未进行逐服务 hcloud list_operations + plan + 最低配创建/释放归零验证，需补真实云端执行 |
| `EXP-C4-08` |  |  | 未找到当前仓库可直接执行的 EXP-C4 服务矩阵 harness；本轮未进行逐服务 hcloud list_operations + plan + 最低配创建/释放归零验证，需补真实云端执行 |
| `EXP-C4-09` |  |  | 未找到当前仓库可直接执行的 EXP-C4 服务矩阵 harness；本轮未进行逐服务 hcloud list_operations + plan + 最低配创建/释放归零验证，需补真实云端执行 |
| `EXP-C4-10` |  |  | 未找到当前仓库可直接执行的 EXP-C4 服务矩阵 harness；本轮未进行逐服务 hcloud list_operations + plan + 最低配创建/释放归零验证，需补真实云端执行 |
| `EXP-C4-11` |  |  | 未找到当前仓库可直接执行的 EXP-C4 服务矩阵 harness；本轮未进行逐服务 hcloud list_operations + plan + 最低配创建/释放归零验证，需补真实云端执行 |
| `EXP-C4-12` |  |  | 未找到当前仓库可直接执行的 EXP-C4 服务矩阵 harness；本轮未进行逐服务 hcloud list_operations + plan + 最低配创建/释放归零验证，需补真实云端执行 |
| `EXP-C4-13` |  |  | 未找到当前仓库可直接执行的 EXP-C4 服务矩阵 harness；本轮未进行逐服务 hcloud list_operations + plan + 最低配创建/释放归零验证，需补真实云端执行 |
| `EXP-C4-14` |  |  | 未找到当前仓库可直接执行的 EXP-C4 服务矩阵 harness；本轮未进行逐服务 hcloud list_operations + plan + 最低配创建/释放归零验证，需补真实云端执行 |
| `EXP-C4-15` |  |  | 未找到当前仓库可直接执行的 EXP-C4 服务矩阵 harness；本轮未进行逐服务 hcloud list_operations + plan + 最低配创建/释放归零验证，需补真实云端执行 |
| `EXP-C4-16` |  |  | 未找到当前仓库可直接执行的 EXP-C4 服务矩阵 harness；本轮未进行逐服务 hcloud list_operations + plan + 最低配创建/释放归零验证，需补真实云端执行 |
| `EXP-C4-17` |  |  | 未找到当前仓库可直接执行的 EXP-C4 服务矩阵 harness；本轮未进行逐服务 hcloud list_operations + plan + 最低配创建/释放归零验证，需补真实云端执行 |
| `EXP-C4-18` |  |  | 未找到当前仓库可直接执行的 EXP-C4 服务矩阵 harness；本轮未进行逐服务 hcloud list_operations + plan + 最低配创建/释放归零验证，需补真实云端执行 |
| `EXP-C4-19` |  |  | 未找到当前仓库可直接执行的 EXP-C4 服务矩阵 harness；本轮未进行逐服务 hcloud list_operations + plan + 最低配创建/释放归零验证，需补真实云端执行 |
| `EXP-C4-20` |  |  | 未找到当前仓库可直接执行的 EXP-C4 服务矩阵 harness；本轮未进行逐服务 hcloud list_operations + plan + 最低配创建/释放归零验证，需补真实云端执行 |
| `EXP-C4-21` |  |  | 未找到当前仓库可直接执行的 EXP-C4 服务矩阵 harness；本轮未进行逐服务 hcloud list_operations + plan + 最低配创建/释放归零验证，需补真实云端执行 |
| `EXP-C4-22` |  |  | 未找到当前仓库可直接执行的 EXP-C4 服务矩阵 harness；本轮未进行逐服务 hcloud list_operations + plan + 最低配创建/释放归零验证，需补真实云端执行 |
| `EXP-E08` |  |  | serviceCatalog route harness marks explain_error as N/A; real Codex agent/CDP conversation harness was not available in this run |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：未发现；D9-13 未完成实测，保持 BLOCKED。
- [x] 写操作误判 read-only：未新增实测失败。
- [x] 红线（I 类）违规：D4-16 保持 FAIL，需维护者按历史问题归并。
- [x] 脱敏复核：D2/D4 已执行 fixture 未输出明文 AK/SK。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 本地 fixture 临时目录/mock server | 是 | 是 | 进程退出，临时目录位于系统 temp，由 fixture 清理/覆盖 |
| 华为云真实资源 | 否 | 不适用 | 本轮未创建云资源；EXP-C4 保持 BLOCKED |

---

## 八、遗留与建议

- D9-9 cancellation capability 未声明，按 SPEC-MISMATCH 待裁决。
- EXP-C4 服务矩阵缺当前仓库可直接运行 harness，本轮未做真云最低配创建/释放归零，应补专用自动化后复测。
- EXP-E08 诊断类意图在 serviceCatalog harness 中为 N/A，需真实 Codex/CDP 会话 harness 补测。
