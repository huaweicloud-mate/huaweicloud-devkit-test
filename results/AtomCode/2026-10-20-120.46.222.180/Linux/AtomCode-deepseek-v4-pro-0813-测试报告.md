# AtomCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-20 05:20（北京时间）
> **执行归档**：`results/AtomCode/2026-10-20-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux aarch64` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.9`（gitHead `05a67b64`，PR #950） |
| 工具全集 | `42`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12` / `doctor 确认已配置` |
| 真云凭证 | `cn-north-4`（AKSK 已配置，只读子账号已就绪） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级探针 `.mjs` 直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（结论落 `stdout.log`）；CLI 真机（install/doctor/status/hcloud）记录日志；真云 E2E 走 `scripts/realcloud_e2e.mjs`（D3-C1/C2/C3/C6 建删资源归零）；MCP 协议探针（D9-*）stdio 直调；证据统一落 `evidence/<case-id>/`（每用例独立 probe.mjs + stdout.log）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 12 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 145） | `91.0%` |
| P0 / P1 / P2 新增缺陷 | `1 / 6 / 3` |
| 红线（I 类）违规 | `2`（D2-4 JSON 凭证脱敏、D4-27 小写 ak/sk 脱敏） |
| 资源释放 | 真云资源全部归零（D3-C1 无残留、D3-C2 OBS 已删、D3-C3/D3-C6 沙箱会话关闭、D3-C7 EIP total_count=0） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `94` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移（D9-9） |
| NOT_RUN | `1` | D1-39 Windows 专属（OS 结构化豁免） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 中文「云主机」未路由 |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望（断言） | 实际结果 | 根因（文件:行号） | 证据 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | D2-4 | JSON 键值形态凭证漏脱敏 | 输出不得含明文 `AKID123456` | 原样返回，未脱敏 | `src/safety-policy.mjs:34-62` | `evidence/D2-4/stdout.log` |
| 2 | P1 | D3-S1 | 中文只读 ECS 意图未路由 | 路由到 `ECS` | 回落 `Run hcloud --help` | `src/tools.mjs:1997-2252` | `evidence/D3-S1/stdout.log` |
| 3 | P1 | D3-S2 | 中文删 VPC 意图未路由 | 路由到 `VPC` 并触发确认 | 回落 `Run hcloud --help` | `src/tools.mjs:1997-2252` | `evidence/D3-S2/stdout.log` |
| 4 | P1 | D3-S3 | 中文沙箱预览意图未路由 | 路由到 `Sandbox`/`DevStation` | 回落 `Run hcloud --help` | `src/tools.mjs:1997-2252` | `evidence/D3-S3/stdout.log` |
| 5 | P1 | EXP-E01 | 中文「云主机」未路由 | 路由到 `ECS` | 回落 `Run hcloud --help` | `src/tools.mjs:1997-2252` | `evidence/EXP-E01/stdout.log` |
| 6 | P1 | D4-27 | 小写 `ak=`/`sk=` 值未脱敏 | 大小写不敏感全 `<redacted>` | 明文残留 | `src/safety-policy.mjs:45` | `evidence/D4-27/stdout.log` |
| 7 | P1 | D9-9 | initialize 未声明取消能力 | capabilities 声明 cancellation | 仅声明 `tools:{}` | `src/mcp-protocol.mjs:47-49` | `evidence/D9-9/stdout.log` |
| 8 | P2 | D3-S5 | 复合中文意图未分层路由 | 返回主要服务集合 | 回落 `Run hcloud --help` | `src/tools.mjs:1997-2252` | `evidence/D3-S5/stdout.log` |
| 9 | P2 | D4-25 | 空格分隔写命令误分类 | 分类为 `cli:write` | 分类为 `cli:invoke` | `hooks/huaweicloud-safety.py:46,111-112` | `evidence/D4-25/stdout.log` |
| 10 | P2 | D8-9 | 遥测值脱敏缺失 | 不含明文 `AK=` 值 | 明文残留 | `src/telemetry/telemetry.mjs:189-195` | `evidence/D8-9/stdout.log` |

### 非产品缺陷（不计入提单）

| 用例ID | 级别 | 描述 | 根因 |
|---|---|---|---|
| D3-C1 | P1 | 真云 ECS E2E 失败 | VPC 路由配额不足（VPC.0010 create_router），资源已归零 |
| D3-C2 | P1 | 真云 OBS E2E 建桶断言假阴性 | hcloud `obs mb` 退出码解析敏感，set/get/删桶全 PASS 且归零 |
| D3-C7 | P1 | 跨区域 EIP 写失败 | IAM token 区域绑定 cn-north-4（VPC.0501），只读/规划/归零均 PASS |

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属用例（升级检测链），本机 Linux，OS 列「专属」结构化豁免 | Linux 侧由展开级代表段覆盖 |

> 其余用例均已执行并回填状态；无 BLOCKED 项。

---

## 六、安全与红线合规

- 凭证泄漏事件：`0`（本机证据目录无原始 AK/SK 明文落盘）
- 写操作误判 read-only：`0`
- 红线（I 类）违规：`2`（D2-4 JSON 凭证脱敏、D4-27 小写 ak/sk 脱敏，均为 SUT 缺陷，非测试侧泄漏）
- 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS / VPC / 子网（D3-C1） | 尝试创建（VPC 配额不足未建成） | — | 已归零（无残留） |
| OBS 桶（D3-C2） | 是 | 已删 | 已归零 |
| 沙箱会话（D3-C3 / D3-C6） | 是 | close_session | 已归零 |
| EIP（D3-C7） | 尝试创建（跨区失败） | — | total_count=0 |

> 真云只删本次创建资源；删除前全量盘点 + 时间戳命名白名单，未删既有/他人资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（MCP initialize 未声明取消/超时语义，协议契约漂移）
- 历史缺陷延续：本轮 10 项产品缺陷与 `2026-10-19` 完全一致（SUT 未变 gitHead `05a67b64`），提单脚本历史查重后应走 `HISTORY_LINKS.md` 关联、避免重复开单。
- 建议：优先修 D2-4 / D4-27（I 类红线，凭证明文外泄风险）与 `serviceCatalog` 中文同义词/分词（影响 6 个场景路由用例）。