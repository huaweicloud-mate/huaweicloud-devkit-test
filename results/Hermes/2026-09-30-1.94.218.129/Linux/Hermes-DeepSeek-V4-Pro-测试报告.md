# Hermes-DeepSeek-V4-Pro 每日测试报告

> **报告名**：`Hermes-DeepSeek-V4-Pro-测试报告.md`
> **生成时间**：2026-09-30 11:05（北京时间）
> **执行归档**：`results/Hermes/2026-09-30-1.94.218.129/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项，其中 D4-5/D9-12/D2-4 历史复现，D4-3 为新增过度拦截）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `DeepSeek-V4-Pro` |
| OS / 架构 | `Linux`（aarch64） |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `1.1.8-next.1`（npm @next，gitHead `ffd7b47`） |
| 工具全集 | `41`（`tools.mjs` TOOL_DEFINITIONS = 41，MCP tools/list 实测 41） |
| hcloud / 依赖 | `hcloud 7.2.12（已配置 cn-north-4）` |
| 真云凭证 | `cn-north-4（AK/SK 管理员 + test001 只读子账号）` |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 102 / 展开级 43 |

> **执行方法**：33 支探针全量 fresh 重跑（5 grouped：d4-security/d2-auth/d1-upgrade/mcp-tools/c4-service-matrix + 顶层源码级探针 + shell/python 探针 + 独立 per-case + eval/protocol harness + 真云 E2E realcloud-s3-d414/realcloud-newcases），证据落盘 `evidence/<case-id>/stdout.log`。本轮对 v1.1.8-next.1 全量重跑，并对照 v1.1.7 缺陷清单逐项复核修复情况。

> **环境说明**：本机（testbot3）默认 Python 无 pip 模块（PEP 668），`doctor` 自检中「Hermes MCP Python SDK」子项提示 `pip3 install mcp`（该 SDK 仅 Python 系客户端使用，Hermes 为 Node hook 插件，非必需），doctor 其余 10 项自检全 PASS。此为机器环境差异，非产品缺陷。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `145`（设计级 102 + 展开级 43） |
| 已执行 | `142` |
| PASS / FAIL / SPEC-MISMATCH / NOT_RUN / BLOCKED | `120 / 19 / 3 / 3 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC = 142） | `84.5%` |
| P0 / P1 / P2 新增缺陷 | `1 / 3 / 1`（另 SPEC-MISMATCH 3，详情见 §四） |
| 红线（I 类）违规 | `0`（均为源码静态规则缺口/契约漂移，非运行期凭证泄漏事件） |
| 资源释放 | 真云 E2E 全部归零（见 §七） |

> **版本差异结论**：v1.1.8-next.1 较 v1.1.7 有 57 commits，**修复 6 项历史 FAIL**：D4-16 命令包裹（#758）、D1-70 no_proxy CIDR（#767）、D4-2 HW_ 前缀 env dump（#770）、EXP-E02~E15 中文意图路由（#770，路由准确率 21.4%→92.9%）、DMS/DEW 映射（#767，unsupported→aggregate）、D4-24 令牌过期/重放（#745）。**仍残留 4 项 P0**：D4-5/D9-12/D2-4（历史复现）+ D4-3（#773 新增过度拦截）。

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `81` | 有证据且通过 PASS 门禁 |
| FAIL | `16` | 不符预期，根因见缺陷清单 |
| SPEC-MISMATCH | `3` | 契约漂移（D1-68、D8-9、D9-9） |
| NOT_RUN | `2` | D1-39（Windows 专属 P0）、D3-S7（真云跨服务交付未覆盖） |
| BLOCKED | `0` | — |
| **合计** | **`102`** | |

**P0 分布**：PASS 16 / FAIL 4（D2-4、D4-3、D4-5、D9-12）/ NOT_RUN 1（D1-39 Windows 专属，OS 豁免）

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `39` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | EXP-C4-14（DMS）、EXP-C4-18（DEW）、EXP-E01（云主机 miss） |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `1` | EXP-E08（诊断意图无确定性路由） |
| BLOCKED | `0` | — |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|
| 1 | P0 | `D4-5`/`D4-4` | Change* 写操作误判 read-only | `safety/policy.json:27-38` writeOperationPrefixes 缺 Change | 历史复现 |
| 2 | P0 | `D9-12` | initialize 握手非法时序未返回 -32600 | `src/mcp-protocol.mjs:30-58` dispatch 无 initialize 状态机 | 历史复现（#814） |
| 3 | P0 | `D4-3` | ShowSecret 元数据被过度封禁 | `safety/policy.json:26` blockedSecretOperations 含 ShowSecret | 新增（#773 过度拦截） |
| 4 | P0 | `D2-4` | 小写 ak=/sk= 脱敏缺失 | `src/safety-policy.mjs:46` (AK\|SK) 无 /i | 历史复现 |
| 5 | P1 | `D3-S1`/`EXP-E01` | 中文「云主机」未路由到 ECS | `src/tools.mjs` routeMap ECS 关键词缺「云主机」 | 历史（#770 残留盲区） |
| 6 | P1 | `D3-S3` | 沙箱预览公网 URL 不可达 | DevBridge 隧道未建立 | 历史复现 |
| 7 | P1 | `D4-8` | Python/Node 策略不一致（写操作/configure show） | `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 前置捕获组 | 新增 |
| 8 | P1 | `D4-11` | 提示注入防护未覆盖自然语言注入 | `src/safety-policy.mjs:554-560` extractHcloudSubcommand | 新增 |
| 9 | P1 | `D4-13` | 最小权限凭证只读可用率不达标 | 只读子账号 project ID 未解析 | 新增 |
| 10 | P1 | `D4-17` | hook 畸形输入 fail-open（应 fail-closed） | `hooks/huaweicloud-safety.mjs`/`.py` 异常走 allow | 新增 |
| 11 | P1 | `D4-27` | 双路径输出脱敏（小写 + redactOutput 文本） | `src/safety-policy.mjs:46` 无 /i | 历史复现 |
| 12 | P1 | `D9-2` | invalid params 未返回 -32602 | `src/mcp-protocol.mjs` dispatch 未构造 invalid-params error | 新增 |
| 13 | P1 | `D3-S5` | 复合意图分层路由未命中沙箱 | `src/tools.mjs` routeMap 预览/沙箱分层关键词缺失 | 历史复现 |
| 14 | P2 | `D4-25` | Python hook 事件遥测分类错乱 | `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 前置捕获组 | 历史复现 |
| 15 | P2 | `D4-26` | findings 证据脱敏泄密 | `src/risk-rule-engine.mjs:19-25` redactEvidence | 历史复现 |
| 16 | P2 | `EXP-C4-14/18` | DMS/DEW 聚合服务无法直接只读冒烟 | `src/tools.mjs:1809-1878` AGGREGATE_SERVICES | 改进（unsupported→aggregate） |
| 17 | P2(SPEC) | `D1-68` | 区域环境变量优先级契约漂移 | `src/auth/credentials.mjs:133` HW_REGION 优先 | 历史复现 |
| 18 | P2(SPEC) | `D8-9` | 遥测 sanitizeValue 未移除敏感值 | `src/telemetry/telemetry.mjs:189` | 历史复现 |
| 19 | P1(SPEC) | `D9-9` | 取消能力 notifications.cancellation 未声明 | `src/mcp-server.mjs` capabilities | 新增 |

### 根因详情（P0）

- **D4-3（新增）**：#773 将 `ShowSecret` 整体加入 `blockedSecretOperations`，但未区分「元数据查询（ShowSecret，应 allow）」与「取明文（ShowSecretVersion/GetSecretValue，应 deny）」，导致 over-block。这是本轮唯一**新增 P0**。
- **D4-5/D4-4**：`writeOperationPrefixes` 长期缺 `Change`，`Change*` 系列（换 OS/改 VPC/改实例配置）一致性漏拦截，历史 P0 未修复。
- **D9-12**：`mcp-protocol.mjs` dispatch 无 initialize 状态机（#814 已在跟踪）。
- **D2-4**：`safety-policy.mjs:46` 大小写敏感无 `/i`（与 D4-27 同源）。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属升级检测链（EINVAL 语义）本机为 Linux，由展开级 EXP-NR3-10（54 条通用断言）代表覆盖 | OS 专属标注已明确，无需改 |
| `D3-S7` | 设计级 | P1 | NOT_RUN | 补环境 | 跨服务交付(Web应用+RDS)并归零：需真云复合编排交付，本轮真云探针集覆盖 S1-S4/C13/D4-14/S6，未覆盖该复合场景 | 建议补一个跨服务复合交付真云探针 |
| `EXP-E08` | 展开级 | P1 | NOT_RUN | 改用例 | 诊断意图（ECS 启动失败分析）无确定性 routeMap 映射，源码级 serviceCatalog 返回 Run hcloud --help | 诊断类意图无确定性路由，建议标注为「需真实 Agent 会话评测」或从 daily 路由断言剔除 |

> 无 BLOCKED 项：本轮所有「假阻塞」均已实跑（D10 评测 harness、真云 E2E、Python hook、协议探针均 fresh 执行）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0 运行期泄漏`（真云 E2E 均经脱敏输出，证据目录复核无明文 AK/SK）
- [x] 写操作误判 read-only：D4-5/D4-4 已如实标 FAIL 并记根因（`policy.json:27-38` 缺 Change），未虚报 PASS
- [x] 红线（I 类）违规：`0`（无运行期凭证泄漏，均为源码静态规则缺口）
- [x] 脱敏复核：D2-4/D4-27/D4-26/D8-9 脱敏缺口已如实标 FAIL/SPEC 并记根因，未虚报

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 0（本轮只读查询） | — | count=0 |
| VPC（D4-14/D3-S2/D4-20） | 创建并删除 | `DeleteVpc` 归零 | ListVpcs 不含本次创建 = true |
| FunctionGraph 函数/触发器（D3-S6） | 创建 + TIMER 触发器 | `DeleteFunction` 归零 | ListFunctions 不再含 = true |
| OBS 静态站（D3-C13） | 创建配置 | set/get/del 归零 | del=true |
| 沙箱会话（D3-S3） | deploy_nginx | 会话未建立公网隧道 | 无资源残留 |
| CTS 审计（D4-14） | 读取 | — | 只读，无可释放资源 |
| 只读子账号（D4-13） | 动态注入 env | 命令结束自动还原 | 未落盘 |

> 所有真云用例均「最低配置创建 → 测后删除 → 归零验证」，只删本次创建资源。

---

## 八、遗留与建议

1. **P0 遗留（4 项）**：D4-5/D4-4（policy.json 补 Change 前缀）、D9-12（已 #814 跟踪）、D2-4（safety-policy.mjs:46 补 /i，与 D4-27/D4-26/D8-9 同源脱敏缺口）、D4-3（#773 过度拦截，需区分 ShowSecret 元数据 vs ShowSecretVersion 明文）。
2. **中文路由盲区**：routeMap ECS 补「云主机」关键词即可消除 EXP-E01/D3-S1 唯一 MISS（准确率可至 100%）。
3. **Python/Node 一致性**：D4-8/D4-17/D4-25 均源于 `huaweicloud-safety.py:46` 前置捕获组 + 异常 fail-open，建议统一 Node/Python hook 类实现与默认 fail-closed 语义。
4. **协议健壮性**：D9-2（-32602）、D9-12（initialize 状态机）、D9-9（cancellation 声明）三处 MCP 协议合规缺口建议统一补齐。
5. **本机环境**：doctor 的 Python MCP SDK 子项因本机无 pip 提示手动安装；对 Hermes（Node 客户端）非必需，建议在 doctor 中按目标客户端区分该子项为 optional。