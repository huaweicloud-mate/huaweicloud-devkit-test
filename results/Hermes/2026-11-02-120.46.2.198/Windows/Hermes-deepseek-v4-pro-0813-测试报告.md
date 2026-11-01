# Hermes-deepseek-v4-pro-0813 每日测试报告

> **生成时间**：2026-11-02 05:30:00（北京时间）
> **执行归档**：`results/Hermes/2026-11-02-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`，npm @1.1.13-next.0）
> **结论**：`PARTIAL`（有 5 条 FAIL、2 条 SPEC-MISMATCH；P0 无 NOT_RUN）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Windows（git-bash/MSYS，Administrator） |
| Node / npm / Python | Node v26.7.0 / npm 11.19.0 / Python 3.14.7 |
| 被测版本（SUT） | `1.1.13-next.0`（npm @next，v2 TS 重构版；CLI 2.0.0） |
| 工具全集 | `46`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | KooCLI 7.2.12（doctor WARN：插件配对 7.3.12）/ doctor 已配置 |
| 真云凭证 | cn-north-4（管理员 + 只读子账号 test001 均可用） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 43（预筛后）/ 追踪表 / 使命 mission-001 |

> **执行方法**：探针脚本（.mjs）直调 npm 包 `plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；协议/评测走 `eval/harness`；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 150（设计级 107 + 展开级 43 + 使命 9 子集） |
| 已执行 | 150 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 136 / 5 / 7 / 2 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 95.1%（136/143） |
| P0 / P1 / P2 新增缺陷 | 0 / 3 / 3（另有 1 条环境侧非产品缺陷） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 本轮创建资源（OBS 桶、只读探针 VPC）均已删除归零；历史残留另存 |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 94 | 有证据且通过 PASS 门禁 |
| FAIL | 4 | D3-C2、D3-C13、D4-13、D9-2（根因见缺陷清单） |
| BLOCKED | 7 | D3-C1（VPC 配额满）、D3-C3/C6/S3/C14（沙箱维护）、D3-S6/S7（计费资源窗口受限） |
| SPEC-MISMATCH | 2 | D4-23、D9-9（契约漂移） |
| NOT_RUN | 0 | — |
| **合计** | **107** | |

### 3.2 展开级（43）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 42 | 含 EXP-C4 22 服务、EXP-E02~15、EXP-NR3 全序列 |
| FAIL | 1 | EXP-E01（serviceCatalog 路由 MISS） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **43** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果 | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P1 | D3-C2/D3-C13 | OBS 静态网站配置 AWS4 签名错误 | set/get 返回 200 | HTTP 400 `x-amz-security-token ... signed headers not [included]` | `tools.mjs:3040-3041(:3078)` | P | 待提单 |
| 2 | P2 | D9-2 | tools/list 非法参数不返 -32602 | `error.code=-32602` | 正常返回工具列表 | `mcp-protocol.mjs:61-63` | P | 待提单 |
| 3 | P1 | D10-3/EXP-E01 | 路由未命中「查云主机」ECS 意图 | 命中 ECS | MISS（`Run hcloud --help...`） | serviceCatalog 路由层 | P | 待提单 |
| 4 | P2 | D4-23 | agent-rules 孤儿文件未注入 | `setup.cjs` refs>0 | refs=0 | `bin/setup.cjs` | G | 待提单 |
| 5 | P2 | D9-9 | capabilities 未声明 cancellation | `notifications.cancellation=true` | 缺失 | `mcp-protocol.mjs:50-53` | G | 待提单 |
| 6 | 环境侧 | D4-13 | 只读子账号具备写权限 | 写被拒 | CreateVpc 成功 | 云侧 IAM 策略过宽 | I | 环境侧 |

### 根因详情（P0/P1 缺陷）

**#1 [P1] D3-C2/D3-C13 OBS 静态网站托管配置 AWS4 签名错误**

- 期望：带 securityToken 凭证下 `obs_set_website_config` 返回 `{ok:true,status:200}`
- 实际：HTTP 400 `Request has x-amz-security-token header but signed headers not [included]`
- 根因：`plugins/huaweicloud-core/src/tools.mjs:3040-3041` 的 `signedHeaders` 未含 `x-amz-security-token`，而 `:3078` 签名后追加了该 header
- 证据：`evidence/D3-C2/stdout.log`、`evidence/D3-C13/stdout.log`

**#3 [P1] D10-3/EXP-E01 路由未命中 ECS 意图**

- 期望：「帮我查一下我账号在华北北京四有哪些云主机」→ 命中 ECS
- 实际：`serviceCatalog` 返回 `Run hcloud --help...`（MISS）
- 根因：服务目录路由层缺「查云主机」短语映射；`eval/harness/run-eval.mjs` 基线 HIT=13 MISS=1
- 证据：`evidence/EXP-E01/stdout.log`

---

## 五、未执行用例与原因（BLOCKED 7 条）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| D3-C1 | 设计级 | P1 | BLOCKED | 补环境 | VPC 配额 5/5 已满（历史残留 VPC：hdk-s7-vpc/tctest-*/testbot3-hermes-e2e-*），CreateVpc 返回 VPC.0114 Quota exceeded。解除：清理历史残留 VPC |
| D3-C3 | 设计级 | P1 | BLOCKED | 补环境 | 沙箱后端维护 HDKIT_SANDBOX_MAINTENANCE。解除：沙箱升级完成 |
| D3-C6 | 设计级 | P1 | BLOCKED | 补环境 | 沙箱 7 隐式工具冒烟依赖沙箱，HDKIT_SANDBOX_MAINTENANCE |
| D3-S3 | 设计级 | P1 | BLOCKED | 补环境 | 沙箱预览 URL 依赖沙箱，HDKIT_SANDBOX_MAINTENANCE |
| D3-C14 | 设计级 | P2 | BLOCKED | 补环境 | 沙箱 HDKit/hwlink 凭证依赖沙箱，HDKIT_SANDBOX_MAINTENANCE |
| D3-S6 | 设计级 | P2 | BLOCKED | 补环境 | FunctionGraph 定时任务需创建函数+触发器（按需计费），本轮窗口受限未建删 |
| D3-S7 | 设计级 | P1 | BLOCKED | 补环境 | Web+RDS 跨服务需 RDS 实例创建（10min+ 按需计费），本轮窗口受限未建删 |

> 无 NOT_RUN。所有 BLOCKED 均为「补环境」类（沙箱维护 / 配额 / 计费窗口），无「改用例」类。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（全部证据经脱敏复核，无原始 AK/SK）
- [x] 写操作误判 read-only：`0`（D4-5 写操作识别全正确）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（D3-C2） | 是（testbot3-hermes-obs-*） | 已删 | 归零（rm 成功） |
| VPC（D4-13 只读探针） | 是（readonly-probe-test） | 已删 | 归零（ListVpcs 无残留） |
| ECS（D3-C1） | 否（VPC.0114 配额阻断） | — | 无本次创建 |

> 真云只删本次创建资源；历史残留（tctest-*/hdk-s7-vpc-*/testbot3-hermes-e2e-*）为其它 agent 历史运行遗留，未擅动。

---

## 八、遗留与建议

- 待裁决 SPEC：`D4-23`（agent-rules 孤儿）、`D9-9`（cancellation 未声明）
- 本轮未覆盖（范围）：沙箱类 4 条（后端维护）、真云计费资源类 2 条（FG/RDS 窗口受限）、VPC E2E（配额满）
- 建议：① 修复 `tools.mjs` OBS 签名 signedHeaders；② 收窄 test001 只读 IAM 策略后复测 D4-13；③ 清理历史残留 VPC 释放配额