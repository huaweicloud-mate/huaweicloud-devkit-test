# DSH-deepseek-v4.1-flash-1017 每日测试报告

> **报告名**：`DSH-deepseek-v4.1-flash-1017-测试报告.md`
> **生成时间**：2026-11-19 15:26（北京时间）
> **执行归档**：`results/DSH/2026-11-19-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（9 项缺陷，P0 3 项；146 例全量重跑，D3-C1 ECS 生命周期真机建删归零通过）

- **缺陷单**：[#1158](https://github.com/huaweicloud/huaweicloud-devkit/issues/1158)（9 项合并单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `DSH` + `deepseek-v4.1-flash-1017` |
| OS / 架构 | `Linux`（aarch64/arm64，Ubuntu 24.04，kernel 6.8.0-106-generic） |
| Node / npm / Python | `Node v22.13.0` / `npm 10.9.2` / `Python 3.12` |
| 被测版本（SUT） | `huaweicloud-devkit v2.0.0-next.4`（npm `@next`，gitHead `16a24814`，tag `v2.0.0-next.4`；全局安装，`plugins/huaweicloud-core/dist/*.js`） |
| 工具全集 | `58`（v2 `TOOL_DEFINITIONS`；schema 独立在 `tool-schemas.js`） |
| hcloud / 依赖 | `hcloud 7.2.12`（`~/.local/bin`）；doctor 确认 AK/SK 已配置 |
| 真云凭证 | `cn-north-4`（真实 AKSK，AK `HPUAN…SXXD`；只读副本用于 D4-13） |
| 测试类型 | 源码/产物级探针直调 `dist`、真机 CLI（install/doctor/status）、MCP stdio/remote 协议、真云 E2E（ECS/VPC/OBS）、路由评测 |
| 设计真源 | 设计级 107 / 展开级 39（daily 基线，与上一轮一致） |

> **执行方法**：`.mjs` 探针 import 已安装包的 `plugins/huaweicloud-core/dist` 导出（v2 源码为 `.ts`，根因回写 `src/*.ts`），逐例写 `evidence/<case-id>/stdout.log` + `probe.mjs`；真云用例由 hcloud 实建实删并在 finally 归零；D9-10 真起 `--transport remote` 进程做 MCP 握手。146 例全部为 2026-11-19 当日重跑，未沿用旧证据。
>
> **v2 适配说明**：本轮对探针做了 v2 兼容改造——`compatSrc()` 构建 `_probe/_compat/` 伪包根（保留 `package.json` 层级供夹具解析），`hdkSrc()` 指向全局安装 `dist`；`hdk()` 注入 `vendorConfirmed` 以穿越 v2 vendor gate（`HUAWEICLOUD_VENDOR_CHALLENGE=off` 仅关闭首轮挑战）。D3-C14/D9-9 因 v2 移除对应内部模块改判 BLOCKED，非产品失败。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（另 1 项 OS 专属豁免 NOT_RUN：D1-39 Windows） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `129 / 7 / 7 / 2 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 138） | `93.5%` |
| P0 / P1 / P2 缺陷（按影响定级） | `3 / 2 / 4`（共 9 项，另 2 项 SPEC-MISMATCH 待裁决） |
| 红线（I 类）违规 | `无`（未发生越权执行；D4-16/D4-21 属「该拦未拦」缺陷，已在缺陷单记录） |
| 资源释放 | `全部归零`：ECS 1 台建→ACTIVE→删→0；VPC/子网/SG 0；EIP 0；OBS 桶 0；沙箱未建立会话 |

> 与上一轮（v1.1.14-next.1，146 例 132 PASS）相比：PASS 129（-3），主要差异为 v2 审批门导致 D3-C3/C6/C13/S3 由 PASS 变 BLOCKED（4 项），D3-C1 修正探针后 PASS；D9-6 因 vendor gate 变为 FAIL；D9-9 因内部 API 移除为 BLOCKED。

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `91` | 有证据且通过 PASS 门禁（`verify_no_fake_pass.py` 全绿） |
| FAIL | `6` | D4-16、D4-21、D9-12、D9-6、D2-10、D8-9 |
| BLOCKED | `7` | D3-C3、D3-C6、D3-C7、D3-C13、D3-C14、D3-S3、D9-9 |
| SPEC-MISMATCH | `2` | D1-68（region 优先级）、D4-12（v2 安装器基线） |
| NOT_RUN | `1` | D1-39（Windows 专属） |
| **合计** | **`107`** | |

P0 21：PASS 17 / FAIL 3（D4-16、D4-21、D9-12）/ NOT_RUN 1（D1-39）
P1 56：PASS 48 / FAIL 2（D9-6、D2-10）/ BLOCKED 6
P2 30：PASS 26 / SPEC 2 / FAIL 1（D8-9）/ BLOCKED 1

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 全部有证据 |
| FAIL | `1` | EXP-E01 中文云主机意图路由 MISS |
| BLOCKED / SPEC / NOT_RUN | `0 / 0 / 0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单

> 缺陷级别按实际影响定级，与用例优先级解耦（例：D8-9 用例为 P2，但遥测明文凭证影响定 P1；D2-10 用例 P1，影响面窄定 P2）。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果 | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-16` | `sh -c` 包裹的凭证 env dump 绕过命令风险引擎 | `deny` | `{"decision":"allow","findings":[]}` | `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:27-39`（边界 `(^|\s)` 不匹配引号内 `env`；`src/safety/classify-text.ts:997-1007` 能拦，两条链路不一致） | #1158 |
| 2 | P0 | `D4-21` | HCL/Terraform `actions=["*"]` 仅 warn 不 deny | `deny` | `json=deny hcl=warn` | `cloud-risk-rules.json:277-311` deny 规则要求 `Effect … Allow`；HCL 无 Effect，仅命中 `:312-335` warn 规则 | #1158 |
| 3 | P0 | `D9-12` | 未 initialize 直接 tools/list 返回全量工具 | 协议时序错误 | 返回 58 工具，无错误 | `src/mcp-protocol.ts` `createDevkitMcpServer` 未做 initialize 前置状态机守卫 | #1158 |
| 4 | P1 | `D9-6` | vendor gate + resources 能力移除破坏第三方 MCP 客户端互通 | `tools/call` 非错误、resources 互通 | `isError:true`（Vendor gate 文本）；`resources/list` -32601 | `src/vendor-gate.ts:38-52` 将只读 `service_catalog` 等列入 gated；`src/mcp-protocol.ts` capabilities 仅 `tools.listChanged` | #1158 |
| 5 | P1 | `D8-9` | 遥测 sanitizeValue 未脱敏凭证 | 凭证脱敏 | `AK=AK123 secret_key=SECRET token=abc123` 原样返回 | `src/telemetry/telemetry-values.ts:27-34` 仅折叠空白/截断，无 secret 匹配 | #1158 |
| 6 | P2 | `EXP-E01` | 中文「云主机」查询意图路由 MISS | 命中 `ECS` | 回落 `Run hcloud --help …` | `src/capability-catalog.ts:400-408` 中文「云主机」未进 ECS 关键词表 | #1158 |
| 7 | P2 | `D1-68` | region 环境变量优先级契约相反 | `HUAWEICLOUD_REGION` 优先 | `HW_REGION` 优先 | `src/auth/credential-resolver.ts:32` | SPEC 待裁决 |
| 8 | P2 | `D2-10` | KooCLI 缺失错误消息拼接中文前缀 | 精确含 `KooCLI config not found` | `KooCLI(hcloud)未安装或未就绪。(KooCLI config not found)` | `src/auth/error-table.ts:84` + `src/auth/reconcile.ts:122` 拼接 | #1158 |
| 9 | P2 | `D4-12` | v2 安装器不再执行 npm install，安装参数断言失效 | `--omit=dev --no-audit --no-fund` 出现 | 三断言均不出现（v2 改 npx + postinstall） | v2 安装器重构（`plugin.json`/`mcp.json` 自带流程） | SPEC 待裁决 |

### 根因详情（P0/P1）

**#1 D4-16**：`cloud-risk-rules.json` 的 `hwc-command-env-dump` 首条件 `(^|\s)(env|printenv|…)` 无法命中 `sh -c "env | …"`（`env` 前是双引号）；同文件 key 正则能命中 `HUAWEICLOUD_ACCESS_KEY`，因此只在命令边界漏拦。证据 `evidence/D4-16/stdout.log` 的 `why` 即引擎原始返回。

**#2 D4-21**：broad-admin deny 规则要求 `Effect … Allow` 同现；Terraform HCL 的 `actions = ["*"]` 无 `Effect` 字段，落到 wildcard warn 规则，导致 IaC 宽授权以 warn 放行。

**#3 D9-12**：v2 改用 MCP SDK `McpServer` 注册工具后直接 `connect(transport)`，业务层没有「initialize 之前拒绝 tools/list」的守卫；实测未握手直接 list 返回 58 工具。

**#4 D9-6**：`VENDOR_GATED_TOOLS` 含只读的 `huaweicloud_service_catalog`/`list_regions`/`check_cli`；第三方客户端（Schema 知道 `vendorConfirmed`，但语义上不知道要引用用户原话）调用即 `isError`。同时 v2 capabilities 移除了 v1 的 resources 面，`resources/list` 返回 -32601。

**#5 D8-9**：`sanitizeValue` 仅做换行折叠、trim、255 字符截断，无 `AK=/sk=/token` 模式匹配；遥测事件可携带明文凭证。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| `D3-C3` | 设计级 | P1 | BLOCKED | 补环境 | v2 审批门 `USER_CONFIRMATION_REQUIRED`：自动化会话无交互终端，`huaweicloud-devkit approve` 拒绝非 TTY；沙箱「上传→nginx→预览」链路无法建立 |
| `D3-C6` | 设计级 | P1 | BLOCKED | 补环境 | 同上，沙箱 connect 被审批门拦截，7 个隐式工具无法冒烟 |
| `D3-C13` | 设计级 | P1 | BLOCKED | 补环境 | OBS 静态站 `set` 被审批门拦截（返回 approvalToken），随后 `get` 404；账号本身有 OBS 权限 |
| `D3-S3` | 设计级 | P1 | BLOCKED | 补环境 | 沙箱预览 URL 链路被同一审批门拦截 |
| `D3-C14` | 设计级 | P2 | BLOCKED | 改用例 | v2 移除 `sandbox/hwlink-api` 模块（迁 devbridge），夹具 import 无对应实现；需重写夹具 |
| `D9-9` | 设计级 | P1 | BLOCKED | 改用例 | v2 移除 `mcp-protocol.dispatch` 导出，夹具无法注入延迟 server；超时/取消语义需基于 `createDevkitMcpServer` 重写 |
| `D3-C7` | 设计级 | P1 | BLOCKED | 补环境 | 账号 project 仅 cn-north-4，跨区域 ap-southeast-3 调 ECS 返回 `Common.0013`（region 与项目不匹配） |
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属用例，本机 Linux 不适用（OS 列已标注专属） |

> 审批门阻塞属环境/交互能力缺口（`补环境`）：建议宿主侧代用户批准（`DEVKIT_APPROVAL_MODE=ask` + `approvedByUser:true`）或提供测试免批通道后复测；不修改用例语义。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（证据目录已复核，无原始 AK/SK；D8-9 缺陷仅记录脱敏失败，未落真实凭证）
- [x] 写操作误判 read-only：`0`（写操作均走审批门；D4-18/19/20 拒绝路径 PASS）
- [x] 红线（I 类）违规：`无`（未执行未审批写操作；真云仅本次测试资源且已归零）
- [x] 实测安全缺口 2 项（D4-16 命令包裹穿透、D4-21 HCL 宽授权 warn）已在缺陷单记录，属「该拦未拦」，非本次执行越权

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（`testbot2-dsh-ecs-*`，kc1.small.1，ARM Ubuntu 24.04） | 是（1 台，job SUCCESS→ACTIVE） | 是（DeleteServers job SUCCESS） | `ListServersDetails` = 0 |
| VPC / 子网 / 安全组（`testbot2-dsh-vpc/subnet/sg-*`） | 是（各 1，D3-C1） | 是（SG→Subnet→VPC，异步删除轮询至列表消失） | `ListVpcs/ListSubnets/ListSecurityGroups` = 0（仅系统 default SG） |
| EIP | 否（ECS 未绑公网 IP） | — | `ListPublicips` = 0 |
| OBS（D3-C13 建桶） | 是（1，set 被审批门拦截后删除） | 是 | `OBS ls` 无 `testbot2-dsh-obs-*` |
| 沙箱会话 | 否（connect 被审批门拦截，未建 workspace） | — | — |

> 说明：D3-C1 首轮因探针 `CreateSecurityGroup` 误带 `--vpc_id`（v3 无此参数）导致 SG id 从帮助文本误解析、VPC 删除轮询超时，留下 1 个 VPC；已在 15:15 前后手动清理并复核归零，随后修正探针并在 15:22 重跑通过（`网络归零=true`）。

---

## 八、遗留与建议

- **待裁决 SPEC 2 项**：`D1-68`（region 优先级，建议明确 v2 契约并同步用例）、`D4-12`（v2 安装器参数基线，建议改用「安装后 doctor/status + dist 完整性」断言）。
- **v2 测试基线待重写 2 项**：`D3-C14`（devbridge 凭证注入）、`D9-9`（超时/取消注入）。
- **审批门阻塞 4 项**（D3-C3/C6/C13/S3）：建议在 CI/自动化场景提供宿主代批或测试免批配置，否则所有真实写入类 E2E 均无法无人值守执行。
- **D3-C7**：需账号具备跨区域 project 或改用支持多 region 的账号后复测。
- **下轮重点**：v2 vendor gate 与 MCP resources/时序契约的对外兼容性；遥测脱敏；中文路由关键词覆盖。
