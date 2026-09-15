# Hermes-DeepSeek-V4-Pro 测试报告

> **报告名**：`Hermes-DeepSeek-V4-Pro-测试报告.md`
> **生成时间**：2026-09-15 09:30（北京时间）
> **执行归档**：`results/Hermes/2026-09-15-1.94.218.129/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（6 项缺陷：3 P0 + 3 P1，与 1.1.4-next.x 阶段已提单/跟踪项完全一致，均已在 #671/#679/#681/#682/#652/#651 去重跟踪，本轮不重复提单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + DeepSeek-V4-Pro |
| OS / 架构 | Linux aarch64，Ubuntu 6.8.0-106-generic |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.4`（官方 npm `latest` 正式版，gitHead `9b67256`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS；1.1.4 较 1.1.3 新增 `huaweicloud_obs_set_website_config`） |
| hcloud / 依赖 | hcloud 7.2.12（KooCLI）/ doctor 10 项全 PASS |
| 真云凭证 | 未使用（本轮仅源码级探针 + 只读 CLI + 本机 install-hcloud，未创建云资源） |
| 测试类型 | 源码级探针直调 + 真机 CLI（doctor/status/install-hcloud/auth status）+ MCP 协议（含 stdio server 层真机探针） |
| 设计真源 | 设计级 81 / 展开级 71（daily 精选，展开级预筛 Hermes/Linux 后 48） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；D9-2 用 stdio server 层真机探针（probe-d9-2.mjs）实测错误码；证据统一落 `evidence/<case-id>/`。
>
> **SUT 校正说明**：本机 npm registry `127.0.0.1:45998` 快照滞后（`latest` 仍指 1.1.3，官方已 1.1.4），`prepare_env --update` 因此 gitHead 查询失败回退 main（1.1.3）。本轮已据此校正：hdk checkout `v1.1.4` + `npm install -g huaweicloud-devkit@1.1.4 --registry https://registry.npmjs.org`，使源码与黑盒 CLI 对齐官方 latest 1.1.4。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `129`（设计级 81 + 展开级 48，展开级已预筛非 Hermes/Linux 23 条） |
| 已执行（有断言证据） | `69`（PASS 63 + FAIL 5 + SPEC-MISMATCH 1） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `63 / 5 / 60 / 1 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `91.3%`（63/69） |
| P0 / P1 / P2 缺陷 | `3 / 3 / 0`（本轮无新增，均为既有跟踪/已提单项） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（本轮未创建真云资源）` |

---

## 三、状态汇总

### 3.1 设计级（81 条）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 57 | 有证据且通过 PASS 门禁 |
| FAIL | 5 | D4-2 / D4-4 / D4-11 / D4-16 / D4-23（根因见缺陷清单） |
| BLOCKED | 18 | 真云/多客户端/评测/性能/破坏性安装等环境阻塞（均有 blockedReason） |
| SPEC-MISMATCH | 1 | D9-2（JSON-RPC 错误码 -32603 vs -32601） |
| NOT_RUN | 0 | — |
| **合计** | **81** | |

### 3.2 展开级（48 条，预筛后）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 6 | EXP-D5-8-1/8-3 + EXP-NR3-02/04/10/24（Hermes/Linux 矩阵） |
| FAIL | 0 | — |
| BLOCKED | 42 | 22 服务真云矩阵 + 评测集 + 隔离 HOME 矩阵（均有 blockedReason） |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **48** | |

---

## 四、缺陷清单（详尽，6 项，本轮无新增）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截不完整 | `printenv HW_ACCESS_KEY` 应 `deny` | `allow`，`HW_*` 前缀未拦截 | `safety-policy.mjs:336` | P | 已跟踪 #679/#681/#682/#671 |
| 2 | P0 | D4-16 | 命令包裹穿透 | `sh -c 'hcloud ecs DeleteServers...'` 应 `deny` | `allow/not_huaweicloud` | `safety-policy.mjs:345` | P | 已跟踪 #681/#682/#671 |
| 3 | P0 | D4-23 | 全局规则未注入 | 安装后 rules 存在 | 安装后无 rules 目录 | `package.json:8` | P | 已跟踪 #679/#681/#671/#650/#651 |
| 4 | P1 | D4-4 | 写操作审批门漏词 Change* | `ChangeServerOsWithoutCloudInit` 应 `deny` | `allow`（leak） | `safety/policy.json:27` | P | 已提单 #671 + #679 |
| 5 | P1 | D4-11 | 提示注入防护绕过 | 注入 payload 应 `deny` | `allow`（仅 warn） | `safety-policy.mjs:345`+`:76` | P | 已提单 #671 + #679 |
| 6 | P1 | D9-2 | JSON-RPC 错误码不符规范 | 未知方法应 `-32601` | `-32603` | `mcp-server.mjs:169` | G | 已跟踪 #671/#652/#651 |

> 逐用例结果与副本 CSV「执行状态」+「evidencePath」列一致；根因（文件:行号）已在本轮源码实探复核（v1.1.4，gitHead 9b67256）。
> **提单动作**：6 项缺陷均为 1.1.4-next.x 阶段已提单/跟踪的同源缺陷，且已被 v1.1.4 全量合并单覆盖（见状态列）。按红线「勿拆单/勿重复拆单」，本轮不重复提单。

---

## 五、阻塞项（BLOCKED 共 60 项，抽代表性列示）

| 用例 ID（代表） | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| D3-C4 / EXP-C4-01~22 | 22 服务真云只读/创建回归 | 真云 22 服务矩阵（AK/SK 最低配置+归零） | 真云只读规划环境 |
| D4-14 | 操作可审计性 | 真云 CTS 审计日志 | 配真云 CTS |
| EXP-E01~15 / D10-1/2/3/5 | 评测集 | 评测 harness + 模型预算 | 评测预算到位 |
| D6-1/3/4 | 性能采样 | 采样统计环境 | 采样 harness |
| D9-6 | 跨客户端互通 | 各客户端终端 | 对应客户端 agent |
| EXP-D5-*（非 Hermes） | 非 Hermes 客户端矩阵 | 各客户端终端 | 对应客户端 agent |
| D1-1/2/5、EXP-D1-58-01~05 | 全新安装/卸载/多 agent（破坏性）+ 隔离 HOME | 空 HOME/隔离专机 | 专机 |
| D7-4 | 国内镜像源安装 | 镜像网络 | 镜像源可达 |
| D1-45 / D4-12 / D8-1 / D9-9 | 预热竞态 / 供应链流水线 / 文档全文核对 / 超时注入 | 特定注入条件 | 条件具备后复测 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（本轮 5 项 FAIL 均为漏拦，非误判 read-only）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（全部探针使用 FAKE/TEST 占位凭证）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源（ECS/沙箱/OBS 等） | 否 | — | 本轮未创建 |
| ~/.local/bin/hcloud | 是（install-hcloud 测试） | 保留（工具安装，非云资源） | 7.2.12 |
| 临时 HOME/探针文件（/tmp/hdk-*） | 是 | 探针内 rmSync | 探针内归零 |

---

## 八、遗留与建议

- **待裁决 SPEC**：D9-2 JSON-RPC 错误码 `-32603` vs `-32601`（规范漂移，建议按 MCP 规范按方法分区错误码）。
- **本轮未覆盖（说明范围）**：真云 E2E（D3-C4/EXP-C4-*/D4-14）、评测集（EXP-E*/D10）、性能采样（D6）、多客户端互通（D9-6/EXP-D5 非 Hermes）、破坏性安装（D1-1/2/5）、隔离 HOME（EXP-D1-58-*）。均已标 BLOCKED 并回填 blockedReason。
- **建议（对修复方）**：① env-dump 规则补 `HW_` 前缀（`HW_ACCESS_KEY`/`HW_SECRET_KEY`/`HW_SECURITY_TOKEN`）；② `writeOperationPrefixes` 补 `Change`（对齐真实 ECS 写动词，1.1.4 已补 `Apply` 仍漏 `Change`）；③ `package.json.files` 纳入 `rules` 目录；④ mcp-server 按方法区分 JSON-RPC 错误码（-32601/-32602/-32603）；⑤ 改进 hcloud 命令识别（识别引号内/自然语言夹带的 hcloud 写命令，而非仅行首/空白前匹配）。
- **test-cases 母版维护**：工具计数 39→40（1.1.4 新增 `huaweicloud_obs_set_website_config`），D5-3/D9-1/EXP-D5-8-3 的断言数字待更新；本机私有 registry 快照滞后（latest 停 1.1.3），建议同步快照或 pin 官方 registry。