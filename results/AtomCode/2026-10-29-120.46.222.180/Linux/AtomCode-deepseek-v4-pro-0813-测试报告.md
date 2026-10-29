# AtomCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-29 21:30（北京时间）
> **执行归档**：`results/AtomCode/2026-10-29-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| Node / npm / Python | `Node v22.13.0` / Python 3.12 |
| 被测版本（SUT） | `v1.1.12 (gitHead 4ed07801)` |
| hcloud / 依赖 | `hcloud 7.2.12`（region cn-north-4 已配置） |
| 真云凭证 | `cn-north-4（AK/SK + 只读子账号已配置）` |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E（建删归零） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；真云用例走 `scripts/realcloud_e2e.mjs` 真机建删并归零验证；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（另 1 条 D1-39 为 OS 专属 NOT_RUN） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `131 / 10 / 3 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 141） | `92.9%` |
| P0 / P1 / P2 新增缺陷 | `1 / 6 / 3`（其中 D3-S1/2/3/5/EXP-E01 属同一路由缺陷合并） |
| 红线（I 类）违规 | `2`（D2-4、D8-9 脱敏漏红，见 §四） |
| 资源释放 | `全部归零（ECS/VPC/EIP/OBS 残留 0）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `93` | 有证据且通过 PASS 门禁 |
| FAIL | `9` | 不符预期，根因见缺陷清单 |
| BLOCKED | `3` | 环境/权限/凭证阻塞（D3-C3/C6/C7） |
| SPEC-MISMATCH | `1` | 契约漂移（D9-9） |
| NOT_RUN | `1` | 未执行（D1-39 OS 专属） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 serviceCatalog 路由缺失 |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（唯一断言） | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | redactSecrets 未脱敏 JSON 字符串形态 ak/sk/token | 输出不得含 `AKID123456`/`secret789`/`TOKEN123` | `safety-policy.mjs:42`、`:45` | 待提单 |
| 2 | P1 | `D4-27` | 双路径输出脱敏小写 ak=/sk= 未覆盖 | 输出不含明文 AK/SK（不分大小写） | `safety-policy.mjs:42`、`:45` | 待提单 |
| 3 | P1 | `D3-S1/D3-S2/D3-S3/D3-S5/EXP-E01` | serviceCatalog 中文意图路由缺失回落 help | recommendedServices 非空且不含 help 文案 | `tools.mjs:2190`、`:2441-2443` | 待提单 |
| 4 | P2 | `D4-25` | Python hook 写命令遥测分类边界失配→cli:invoke | DeleteServers 必须命中 cli:write | `plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46`、`:111` | 待提单 |
| 5 | P2 | `D8-9` | sanitizeValue 不脱敏凭证进入遥测 | 含 AK=/SK=/token= 值替换为占位符 | `telemetry/telemetry.mjs:189-197` | 待提单 |
| 6 | P1 | `D9-9` | mcp-protocol 未声明 cancellation（SPEC-MISMATCH） | capabilities 声明 cancellation/notifications | `mcp-protocol.mjs:47` | 待提单 |

> 完整根因/证据/影响见 `FINDINGS.md`。D3-C2（OBS CLI 退出码误判）与 BLOCKED 3 例、NOT_RUN 1 例为非产品缺陷/环境区块（见 §五），不计入缺陷提单。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 | 分类 |
|---|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | Windows 专属用例（OS 列标注「专属」），Linux 无法执行 EINVAL 语义；由 Linux 侧 d1-upgrade 代表覆盖 | 【调归属】OS 专属 |

### BLOCKED

| 用例ID | 标题 | 阻塞原因 | 分类 |
|---|---|---|---|
| `D3-C3` | 沙箱部署E2E | 华为云沙箱服务连接失败（workspace_id required，服务维护中），真机执行无资源残留 | 【补环境】沙箱服务维护 |
| `D3-C6` | 沙箱 7 工具具名冒烟 | 沙箱服务升级维护（HDKIT_SANDBOX_MAINTENANCE），真机执行无资源残留 | 【补环境】沙箱服务维护 |
| `D3-C7` | 跨区域资源操作引导 | IAM token 绑定 cn-north-4，跨区 ap-southeast-3 写操作被 VPC.0501 拒绝，4/5 通过且 EIP 归零 | 【补环境】区域 token 限制 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：**D2-4**（redactSecrets 漏脱敏 JSON 短键）、**D4-27**（小写 ak=/sk= 漏脱敏）、**D8-9**（sanitizeValue 不脱敏）——见缺陷 #1/#2/#5
- [x] 写操作误判 read-only：D4-25 写命令被误分类 cli:invoke（遥测维度，非 read-only 放行），见缺陷 #4
- [x] 红线（I 类）违规：`2` 项（D2-4、D8-9 属凭证脱敏 I 类泄漏风险）
- [x] 脱敏复核：`token=` 可脱敏；`ak=`/`sk=`/JSON 短键未脱敏（已记缺陷）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | D3-C1 创建 1 台 `testbot3-hermes-ecs-*` | `DeleteServers` 提交删除 | 轮询确认已归零 ✓ |
| VPC / Subnet | D3-C1 创建 `testbot3-hermes-e2e-*` | `DeleteSubnet` + `DeleteVpc` | subnet:OK vpc:OK ✓ |
| OBS | D3-C2 创建 `testbot3-hermes-obs-*` 桶 | `OBS rm` 删桶 | 删除成功 ✓ |
| EIP | D3-C7 最小 EIP 建删 | 创建被 VPC.0501 拒绝 | total_count=0 ✓ |

> 独立复核（hcloud）：ECS/VPC/EIP/OBS 以 `testbot3-hermes*`、`tctest*` 前缀查均为 `0` 残留，云端归零。

---

## 八、遗留与建议

- 缺陷 #1/#2/#4/#5/#6 与 10-27 基线为同一批历史缺陷（SUT 未升级，同为 v1.1.12 / gitHead 4ed07801），提单前已历史查重：命中即不回开单、生成 `HISTORY_LINKS.md` 关联，见下一步 file_issue.py 输出。
- D10 真实 Agent 会话评测（D10-1/2/5/9）需 dsh/LLM harness，本客户端 AtomCode 非 DSH，未含于本日展开级（已按 agent 预筛剔除），不作 BLOCKED。
- 建议修复方优先处理 I 类脱敏缺陷（D2-4、D8-9），并补充 serviceCatalog 路由关键词覆盖。