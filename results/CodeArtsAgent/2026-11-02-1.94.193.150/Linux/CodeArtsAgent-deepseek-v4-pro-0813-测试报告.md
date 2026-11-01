# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-02（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-11-02-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项，均历史复现）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsAgent` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64` |
| Node / npm / Python | `Node v26.8.1 / npm 11.19.0 / Python 3.12.3` |
| 被测版本（SUT） | `1.1.13-next.0`（npm @next，gitHead `47170d1f`，本地 hdk `47170d1f`） |
| 工具全集 | `46`（tools/list 实测） |
| hcloud / 依赖 | `hcloud 7.2.12`（doctor 确认已配置） |
| 真云凭证 | `cn-north-4（AK/SK 已配置 + 只读子账号 test001）` |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E（建删归零） |
| daily 基础用例 | 设计级 107 / 展开级 39（预筛剔除 27 条非本客户端/OS） |

> **执行方法**：复用昨日确定性探针（probe.mjs 真实执行逻辑），今日逐条重新实测并落新鲜 stdout.log；真云 E2E 真机建删归零；沙箱用例今日实测仍维护中（HDKIT_SANDBOX_MAINTENANCE）如实标 BLOCKED。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `131 / 10 / 3 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 141） | `92.9%` |
| P0 / P1 / P2 缺陷 | `3 / 3 / 5`（均历史复现，不新开单） |
| 红线（I 类）违规 | `0` |
| 资源释放 | 本次创建资源全部归零（ECS/SG/子网/VPC/RDS/FunctionGraph/EIP 手动补删确认） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 |
|---|---|
| PASS | `93` |
| FAIL | `9` |
| BLOCKED | `3` |
| SPEC-MISMATCH | `1` |
| NOT_RUN | `1` |
| **合计** | **`107`** |

### 3.2 展开级

| 状态 | 数量 |
|---|---|
| PASS | `38` |
| FAIL | `1` |
| BLOCKED | `0` |
| SPEC-MISMATCH | `0` |
| NOT_RUN | `0` |
| **合计** | **`39`** |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | safety/policy.json:26 | 历史（不重复开单） |
| 2 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归 | cloud-risk-rules.json:209 | 历史（不重复开单） |
| 3 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | mcp-protocol.mjs:61 | 历史（不重复开单） |
| 4 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | tools.mjs:1310 | 历史（不重复开单） |
| 5 | P1 | `D9-9` | D9协议 | tools/call 取消能力未声明(SPEC) | mcp-protocol.mjs capabilities | 历史（不重复开单） |
| 6 | P1 | `EXP-E01` | D10评测 | 中文意图「云主机」未命中 ECS | tools.mjs:2195 | 历史（不重复开单） |
| 7 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 | tools.mjs:2195 | 历史（不重复开单） |
| 8 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | huaweicloud-safety.py:112 | 历史（不重复开单） |
| 9 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | risk-rule-engine.mjs:19 | 历史（不重复开单） |
| 10 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | telemetry.mjs:190 | 历史（不重复开单） |
| 11 | P2 | `D8-1` | D8质量 | 文档与能力一致 | hdk/AGENTS.md:27 | 历史（不重复开单） |

> 上述 10 项 FAIL + 1 项 SPEC-MISMATCH 均今日实测复现，与历史结论一致（源码 1.1.13-next.0 未修）。历史查重命中既有 open issue，本次不重复开单。详见 FINDINGS.md 与 HISTORY_LINKS.md。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | Windows 专属用例（OS 列标注「专属」），本机 Linux 不适用；Linux 侧由 NR3 终端矩阵代表覆盖 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C3` | D3功能 | 沙箱部署E2E | 今日实测沙箱服务维护中：sandbox_check_user 返回 HDKIT_SANDBOX_MAINTENANCE。解除条件：沙箱服务恢复 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟 | 今日实测 7 工具均返回 HDKIT_SANDBOX_MAINTENANCE。解除条件：沙箱服务恢复 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 今日实测 check_user 返回 HDKIT_SANDBOX_MAINTENANCE，无法 connect。解除条件：沙箱服务恢复 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（探针输出已 redact，无明文 AK/SK 落盘）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`0`（真云用例真机建删归零、沙箱维护如实 BLOCKED、无虚报 PASS）
- [x] 脱敏复核：`通过`（真云输出 AK/SK 已 redact，证据 stdout.log 无明文凭证）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 是（真机） | 是（DeleteServers 提交后异步删除，手动补删确认） | 归零（ListServersDetails 不含 tctest-c1-ecs） |
| VPC/子网/SG（D3-C1/D3-S7/D4-24） | 是 | 是（手动补删归零） | 归零（ListVpcs/ListSubnets 不含本次 tctest-c1/hdk-s7/tctest-d424 资源） |
| RDS（D3-S7） | 是（CreateInstance 返回 instanceId） | 是（DeleteInstance + 归零 true） | 归零 |
| FunctionGraph（D3-S6） | 是（CreateFunction 返回 URN） | 是（DeleteFunction） | 归零 true |
| EIP（D3-C7） | 是（创建最小 EIP） | 是（释放） | 归零（不含本次 EIP） |
| 沙箱 | 未创建 | - | 沙箱维护中，未产生资源 |

> 注：云账号中仍存在历史残留 `tctest-tmr-*`、`testbot3-hermes-e2e-*`（非本次 run 创建，按「只删本次创建」红线不予处理，已在报告记录）。

---

## 八、遗留建议

1. 11 项缺陷均为历史复现（源码 1.1.13-next.0 未修），建议维护者按既有 open issue 排期修复（P0 三项优先：D4-3/D4-21/D9-12）。
2. 沙箱服务（HDKIT_SANDBOX_MAINTENANCE）已连续多日维护，影响 D3-C3/D3-C6/D3-S3 三个用例，建议维护者关注沙箱恢复时间并补测。
3. D3-C7/D4-24/D3-C1/D3-S7 真机探针存在「异步资源删除未等待/未重试」问题（ECS/RDS/VPC 删除后立即检查导致误判），建议探针侧增强删除重试+轮询，非产品缺陷。
