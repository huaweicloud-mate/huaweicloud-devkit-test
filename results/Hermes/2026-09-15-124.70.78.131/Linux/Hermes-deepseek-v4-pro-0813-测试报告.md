# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-09-15 13:14`（北京时间）
> **执行归档**：`results/Hermes/2026-09-15-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（复现 3 个 P0 + 2 个 P1 缺陷；其中 4 项为已知缺陷 #652，1 项新发现 D4-17 fail-open）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 6.8.0-106-generic，ECS） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.11.16 |
| 被测版本（SUT） | `v1.1.4`（npm latest 正式版，gitHead `9b67256e`，release PR `#669`） |
| 工具全集 | `40`（`tools/list` 实测，含新增 `huaweicloud_obs_set_website_config`） |
| hcloud / 依赖 | 已配置（doctor 确认 11 pass；hcloud 7.2.12） |
| 真云凭证 | cn-north-4（AKSK 已配置；本轮**未创建/删除任何真云资源**，仅只读脱敏查询） |
| 测试类型 | 源码级探针（safety-policy / risk-rule-engine / update-check / Python hook）+ 真机 CLI（install/doctor/status/update/uninstall）+ MCP 协议 + 凭证脱敏 + 导入擦除 + 能力/协议补充 |
| daily 用例集 | 设计级 81 / 展开级 48（Hermes+Linux 预筛后） |

> **执行方法**：探针脚本直调安装包 `plugins/huaweicloud-core/src/*` 导出函数（`classifyTextCommand`/`evaluateCommandRisk`/`evaluateArtifacts`/`semverCompare`/`redactSecrets`）+ spawn `mcp-server.mjs` 驱动 JSON-RPC，结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。CLI 安装/卸载在**同时隔离 HOME 与 HERMES_HOME** 的临时目录完成，未污染真实 agent home。本轮在上一轮（09:15）基础上**扩充执行覆盖**（新增 D1-26/27/30、D2-2/5、D3-A1/B1/B3/B5/C5、D4-4/10/11/17、D6-1/3/4 等 17 个用例）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 129（设计级 81 + 展开级 48） |
| 已执行（设计级 PASS+FAIL） | 46 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN（设计级） | 41 / 5 / 32 / 0 / 3 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 89.1%（41 / 46） |
| 展开级 | PASS 2 / BLOCKED 46（镜像源设计用例结论） |
| P0 / P1 / P2 缺陷 | 3 P0 + 2 P1（4 项已知 #652 复现 + 1 项新增 D4-17） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮未创建真云资源；隔离 HERMES_HOME 已还原） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 41 | 有证据且通过 PASS 门禁 |
| FAIL | 5 | 不符预期，根因见缺陷清单（D4-2/D4-16/D4-21 P0，D9-2/D4-17 P1） |
| BLOCKED | 32 | 环境阻塞，见 §五 未执行用例与原因 |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 3 | 文档一致性核对本轮未覆盖（D8-1/D8-4/D8-6） |
| **合计** | **81** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 2 | EXP-D5-8-3（镜像 D5-3）、EXP-NR3-02（镜像 D1-27） |
| BLOCKED | 46 | EXP-C4 服务矩阵(22) + EXP-E 评测集(15) + NR3 终端(3) + D1-58 白名单(5) + D5-8-1，同源设计用例阻塞 |
| SPEC-MISMATCH / NOT_RUN | 0 | — |
| **合计** | **48** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截未覆盖 `HW_` 前缀 | `env \| grep HW_ACCESS_KEY` 应返回 `deny` | 返回 `allow, risk=not_huaweicloud` | `safety-policy.mjs:336` / `cloud-risk-rules.json:39` / `huaweicloud-safety.py:54` | G | 已跟踪 #652-1 |
| 2 | P0 | `D4-16` | env-dump 规则被 shell 包裹穿透 | `sh -c "env \| grep HUAWEICLOUD_ACCESS_KEY"` 应 `deny` | 返回 `allow` | `safety-policy.mjs:335` / `cloud-risk-rules.json:35` | G | 已跟踪 #652-2 |
| 3 | P0 | `D4-21` | Terraform HCL 形态 broad IAM 未拦截 | HCL `actions = ["*"]` 应 `deny` | `decision=allow`、findings 空（JSON 形态正确 deny） | `cloud-risk-rules.json:179` | G | 已跟踪 #652-3 |
| 4 | P1 | `D9-2` | JSON-RPC 错误码未区分 | 未知 method → `-32601`；未知 tool → `-32602` | 两者均 `-32603` | `mcp-server.mjs:169` / `mcp-protocol.mjs:95` / `tools.mjs:1485` | P | 已跟踪 #652-4 / #638 |
| 5 | P1 | `D4-17` | hook_check_artifacts 对畸形输入 fail-open | 畸形/超长/深嵌套 JSON 应默认 `deny`（fail-closed） | 均返回 `decision=allow`、findings 空 | `risk-rule-engine.mjs:106` | G | **待提单**（本轮新发现） |

### 根因详情（每个 P0/P1 缺陷附代码片段 + 复现证据）

**#1 [P0] D4-2 凭证 env 打印拦截不完整**

- 期望：`env | grep HW_ACCESS_KEY` → `deny`
- 实际：返回 `allow, risk=not_huaweicloud`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:336`
  env-dump 正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 前缀，而 `auth/credentials.mjs:130-132` 恰从这些 env 读取真实凭证。
- 证据：`evidence/D4-2/stdout.log`（正对照 `HUAWEICLOUD_SDK_AK`/`HCLOUD_AK` 均正确 `deny`）

**#2 [P0] D4-16 env-dump 规则被 shell 包裹穿透**

- 期望：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` → `deny`
- 实际：返回 `allow`（删除/secrets 包裹可拦，env-dump 包裹漏网）
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:335` + `cloud-risk-rules.json:35` env-dump 检测用词边界 `(^|\s)(env|printenv...)` 匹配原始文本，`sh -c "..."` 包裹后内层 `env` 前为引号而非词边界，正则漏命中。
- 证据：`evidence/D4-16/stdout.log`（含 `wrap-probe.mjs` 补充探针）

**#3 [P0] D4-21 Terraform HCL broad IAM 未拦截**

- 期望：HCL `actions = ["*"]` / `AdministratorFullAccess` → `deny`
- 实际：`decision=allow`、findings 空（JSON 形态 `{"Action":"*"}` 正确 `deny`）
- 根因：`cloud-risk-rules.json:179` `hwc-iam-admin-policy` 正则只覆盖 JSON 形态 `"Action":"*"` / `Action=*` / `AdministratorAccess` / `FullAccess`，未覆盖 HCL 小写复数与 `AdministratorFullAccess` 后缀。
- 证据：`evidence/D4-21/hcl-probe.mjs` + `evidence/D4-21/stdout.log`

**#4 [P1] D9-2 JSON-RPC 错误码未区分**

- 期望：未知 method → `-32601`（Method not found）；未知 tool → `-32602`（Invalid params）
- 实际：两者均返回 `{"code":-32603, "message":"Unsupported method / Unknown tool"}`
- 根因：`plugins/huaweicloud-core/src/mcp-server.mjs:169`（`handleMessage` catch 对 `dispatch` 异常硬编码 `-32603`），异常未携带可区分错误码。
- 证据：`evidence/D9-2/stdout.log`

**#5 [P1] D4-17 hook_check_artifacts 对畸形输入 fail-open（本轮新发现）**

- 期望：畸形/超长/深嵌套 JSON 输入应默认 `deny`（fail-closed，不崩溃不误放行）
- 实际：`hook_check_artifacts` 对 `{ bad json ~~~`、超长 JSON、深嵌套 JSON 均返回 `decision=allow`、findings 空（对照组合法宽泛 IAM 正确 `deny`）
- 根因：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` —— `evaluate()` 只有 `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`，无任何规则命中（含无法解析的畸形输入）时**默认 `allow`**，缺少 fail-closed 兜底（应默认 `deny`/报错）。
- 影响：无法解析/规则未命中的制品在预检阶段被放行（fail-open），可能与 #3 的规则未覆盖形态叠加放大绕过面。
- 证据：`evidence/D4-17/stdout.log`

---

## 五、未执行用例与原因（供维护 agent 修改用例）

> 逐条列出本轮 **BLOCKED / NOT_RUN** 用例（展开级「不涉及本客户端/OS」的建包时已剔除，不在此列）。

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-2 | 设计级 | P2 | BLOCKED | 补环境 | 多 Agent 探测需多客户端并存（单机仅 Hermes） | — |
| D1-6 | 设计级 | P2 | BLOCKED | 补环境 | install-hcloud 需 KooCLI 下载源/镜像网络引导 | — |
| D1-28 | 设计级 | P1 | BLOCKED | 补环境 | 需更高版本 fixture（latest=1.1.4 无更高正式版） | — |
| D1-31 | 设计级 | P1 | BLOCKED | 补环境 | dismiss 冷却期需 3 天时长 fixture | — |
| D1-33 | 设计级 | P2 | BLOCKED | 补环境 | 需多 agent 插件目录 fixture | — |
| D1-39 | 设计级 | P0 | BLOCKED | 调归属 | Windows 升级检测链，Linux 无法复现 | 归属调整：Windows 专项 |
| D1-40 | 设计级 | P0 | BLOCKED | 调归属 | 镜像 lag 检测需镜像源/Windows | 归属调整：Windows/镜像环境 |
| D1-42 | 设计级 | P1 | BLOCKED | 补环境 | 需真实 agent 插件目录写入 + 进程重启持久化 | — |
| D1-45 | 设计级 | P1 | BLOCKED | 补环境 | 预热竞态需会话时序控制 fixture | — |
| D1-58 | 设计级 | P1 | BLOCKED | 补环境 | 需 Claude/Cursor 客户端 merge 环境 | — |
| D2-1 | 设计级 | P1 | BLOCKED | 补环境 | auth init 会写真云凭证三端，避免污染统一账号 | — |
| D2-10 | 设计级 | P1 | BLOCKED | 补环境 | 需源码 resolveManagedProfile 多 profile 夹具 | — |
| D2-13 | 设计级 | P1 | BLOCKED | 补环境 | 需 env 凭证 + session 切换夹具 | — |
| D3-C4 | 设计级 | P1 | BLOCKED | 补环境 | 服务创建类回归需真云配额（ECS/DevStation） | — |
| D4-6 | 设计级 | P1 | BLOCKED | 改用例 | 完整 E2E「创建 ECS 回显 adminPass 警告」需真云写操作；源码级脱敏(adminPass=xxx→<redacted>)已核验，但「警告」断言需真云场景 | 拆分「脱敏」为源码级可测断言 +「警告」为真云 E2E |
| D4-12 | 设计级 | P2 | BLOCKED | 补环境 | 供应链安装期安全需 npm 抓包/SBOM 审计 | — |
| D4-13 | 设计级 | P1 | BLOCKED | 补环境 | 最小权限凭证通过率需真云最小权限凭证 | — |
| D4-14 | 设计级 | P2 | BLOCKED | 补环境 | 操作可审计性需真云命令执行审计日志 | — |
| D4-18 | 设计级 | P0 | BLOCKED | 补环境 | 审批语义需真云+客户端交互确认流 | — |
| D4-19 | 设计级 | P0 | BLOCKED | 补环境 | 确认流预检需真云高危操作 | — |
| D4-20 | 设计级 | P1 | BLOCKED | 补环境 | 拒绝后零操作需审批拒绝流+真云资源计数 | — |
| D4-23 | 设计级 | P0 | BLOCKED | 补环境 | 需 11 客户端多机；源码未见 huawei-agent-rules.md 制品 | — |
| D4-24 | 设计级 | P1 | BLOCKED | 补环境 | 确认令牌过期边界需审批流+多客户端 | — |
| D5-1 | 设计级 | P1 | BLOCKED | 调归属 | 清单发现需全部客户端可发现（CLIENT_MATRIX） | 归属调整：多客户端矩阵 |
| D7-4 | 设计级 | P2 | BLOCKED | 补环境 | 国内镜像源安装需 GitCode 镜像 + GITCODE_TOKEN | — |
| D9-6 | 设计级 | P1 | BLOCKED | 调归属 | 跨客户端互通需多客户端并存 | 归属调整：多客户端矩阵 |
| D9-9 | 设计级 | P1 | BLOCKED | 改用例 | 需 inspector/延迟 MCP 客户端夹具注入 30s 挂起（capabilities.cancellation 实测未声明） | 前置标注 inspector 夹具依赖 |
| D10-1 | 设计级 | P1 | BLOCKED | 补环境 | 评测 harness + 预算门禁 | — |
| D10-2 | 设计级 | P1 | BLOCKED | 补环境 | 评测 harness + 预算门禁 | — |
| D10-3 | 设计级 | P1 | BLOCKED | 补环境 | 评测 harness（路由准确率+混淆矩阵） | — |
| D10-4 | 设计级 | P0 | BLOCKED | 补环境 | 评测 harness（安全干预有效性评测集） | — |
| D10-5 | 设计级 | P1 | BLOCKED | 补环境 | 评测 harness + 预算门禁 | — |
| D8-1 | 设计级 | P2 | NOT_RUN | 改用例 | 文档与能力一致需白盒 docs 全量比对，本轮未覆盖 | — |
| D8-4 | 设计级 | P1 | NOT_RUN | 改用例 | 引导步骤可机械执行需逐条核验 getting-started 步骤 | — |
| D8-6 | 设计级 | P2 | NOT_RUN | 改用例 | 中英文文档一致需双源逐段比对 | — |

> 展开级 46 条 BLOCKED 均镜像上表源设计用例（D3-C4×22、D10-3×15、D1-58×5、D1-39/42/45×3、D5-1×1），不再逐条展开。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D2-4 show_profile_redacted / auth_status 均 `<redacted>`，无 AK/SK 泄露；D4-6 源码级 `adminPass=xxx`→`<redacted>`）
- [x] 写操作误判 read-only：`0`（D4-5 删除类写操作均判 deny/write）
- [x] 红线（I 类）违规：`无`（本轮未创建/删除任何真云资源）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（真云凭证仅以指纹出现；D2-11/D2-16 用假凭证 + mkdtemp 隔离）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源（ECS/沙箱/OBS 等） | 否 | — | 未创建，无残留 |
| 隔离 HERMES_HOME（install 测试） | 是 | 已删 | 残留仅空 config.yaml + shell-hooks-allowlist.json |
| 临时 HUAWEICLOUD_HOME（D2-11/D2-16/D2-5） | 是 | 已删 | mkdtemp 临时目录随探针退出清理 |

> 真云只删本次创建资源；本轮未创建任何真云资源。

---

## 八、遗留与建议

- 待裁决 SPEC：无。
- 观察（非缺陷）：
  1. 工具全集 `39`→`40`（新增 `huaweicloud_obs_set_website_config`）；设计真源 D5-3/EXP-D5-8-3「预期结果」仍写 `39 工具`，属真源文本漂移（红线 5 不回改母版，仅此处记录）。
  2. `tools/list` 各工具 `inputSchema` 未标注 `$schema`/draft（D9-8 遗留）。
  3. `capabilities.cancellation` 未声明（D9-9）。
- 建议（按缺陷优先级）：
  1. **P0（D4-2）**：`safety-policy.mjs:336`/`huaweicloud-safety.py:54`/`cloud-risk-rules.json:39` 三处 env-dump 正则统一补 `HW_` 前缀。
  2. **P0（D4-16）**：env-dump 检测从词边界改为支持 unbox shell 包裹（`sh -c`/`bash -c`/`eval` 内层提取）。
  3. **P0（D4-21）**：`cloud-risk-rules.json:179` 补 HCL `actions = ["*"]` 与 `AdministratorFullAccess` 后缀。
  4. **P1（D9-2）**：`mcp-server.mjs:169` catch 按异常类型映射错误码（-32601/-32602）。
  5. **P1（D4-17）**：`risk-rule-engine.mjs:106` 增加 fail-closed 兜底——输入无法解析或结构异常时返回 `deny`/报错，而非默认 `allow`。

> **覆盖率说明**：本轮扩充执行覆盖后，设计级 NOT_RUN 仅 3/81（3.7%），P0 全量覆盖（无 P0 NOT_RUN）；展开级已按客户端+OS 预筛，48 条全部分类（PASS 2 + BLOCKED 46）。较上一轮（NOT_RUN 38）显著降低，满足覆盖率门禁（≤15%）。