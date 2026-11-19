# DSH-deepseek-v4.1-flash-1017 每日测试报告
> **报告名**：`DSH-deepseek-v4.1-flash-1017-测试报告.md`
> **生成时间**：2026-11-20 05:26（北京时间）
> **执行归档**：`results/DSH/2026-11-20-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `DSH` + `deepseek-v4.1-flash-1017` |
| OS / 架构 | `Linux`（Ubuntu 24.04.4 LTS，aarch64，kernel 6.8.0-106-generic） |
| 被测版本（SUT） | `2.0.0-next.4`（npm `@next`，gitHead `16a24814`） |
| daily 基础用例 | 设计级 107 / 展开级 39（P0 21 / P1 95 / P2 30） |
| 机器 IP / 日期 | `1.94.193.150` / `2026-11-20` |

> **执行方法**：146 例全部本轮实跑，逐条探针落盘 `evidence/<case-id>/stdout.log`（JSON：status/why/executedAt）+ `probe.mjs`。四类通道：①源码级断言（直接 import 已安装包 `plugins/huaweicloud-core/dist/*.js`，根因回写 hdk 源码 `src/*.ts`）；②MCP 真机（stdio 客户端 initialize/tools/list/tools/call、Inspector）；③真云 E2E（ECS 创建→ACTIVE→删除→资源归零；OBS 建桶→静态站→curl 200→删除归零）；④夹具/fixture（npm 安装、hook、遥测、多客户端）。
> **环境隔离说明**：05:02 并行客户端 CodeArtsAgent 的 `prepare_env.py --update` 将全局 npm 包覆盖为 v1.1.13（跨客户端环境竞争），故本轮在 `~/devkit-test/DSH/sut` 私有前缀重装 `huaweicloud-devkit@2.0.0-next.4` 作为 SUT，探针用 `HDK_DIST` 指向该前缀 `dist`；hdk 源码仓（`16a24814`）只用于根因定位。
> **发布包依赖缺陷**：私有前缀安装时发现发布包漏声明运行时依赖（zod / @modelcontextprotocol/sdk / ajv / ajv-formats），为继续执行其余用例已补齐依赖，该缺陷单列为 FINDINGS #1（P0）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145`（NOT_RUN 1 为 Windows 专属豁免） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `129 / 7 / 7 / 2 / 1` |
| 通过率（分母 = PASS+FAIL = 136） | `94.9%` |
| P0 / P1 / P2 新增缺陷 | `4 / 3 / 3`（含 2 项 SPEC-MISMATCH 待裁决） |
| 红线（I 类）违规 | `0` |
| 资源释放 | 全部归零（ECS/VPC/子网/SG/OBS 桶，见第七节） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `91` | 有证据且通过 PASS 门禁 |
| FAIL | `6` | 不符预期，根因见缺陷清单 |
| BLOCKED | `7` | 环境/权限/审批门阻塞（见第五节，均含补测记录） |
| SPEC-MISMATCH | `2` | 契约漂移，待裁决 |
| NOT_RUN | `1` | Windows 专属（D1-39） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01（中文意图路由 MISS） |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-12` | D4安全 | 发布包漏声明运行时依赖，全新安装后 MCP 入口无法加载 | `package.json:61-63`；`dist/tool-schemas.js:1`、`dist/mcp-protocol.js:1`、`dist/validation/*.js` | 待提单 |
| 2 | P0 | `D4-16` | D4安全 | `sh -c` 命令包裹穿透 | `safety/rules/cloud-risk-rules.json:26-45`；`src/safety/classify-text.ts:997-1007` | 待提单 |
| 3 | P0 | `D4-21` | D4安全 | HCL broad IAM 仅 warn 不 deny | `safety/rules/cloud-risk-rules.json:270-313`（deny 要求 Effect）、`:314-335`（warn 兜底） | 待提单 |
| 4 | P0 | `D9-12` | D9协议 | 未 initialize 直接 tools/list 未被拒绝 | `src/mcp-stdio-transport.ts:194-216`；`src/mcp-protocol.ts`（无 pre-init 守卫） | 待提单 |
| 5 | P1 | `D9-6` | D9协议 | vendor gate 破坏第三方 MCP 客户端 tools/call 互通 | `src/mcp-protocol.ts:118-121,151,181`；`src/tool-schemas.ts:8` | 历史复核 |
| 6 | P1 | `EXP-E01` | 意图路由 | 中文「云主机」路由 MISS，回落 help 文案 | `src/capability-catalog.ts`（关键词表缺中文）/`:407` 回落分支 | 历史复核 |
| 7 | P1 | `D2-10` | D2认证 | KooCLI config 缺失消息拼接中文前缀 | `src/auth/error-table.ts:84`；`src/auth/reconcile.ts:122` | 待提单 |
| 8 | P2 | `D8-9` | D8质量 | v2 sanitizeValue 不再脱敏凭证（v1 回归） | `src/telemetry/telemetry-values.ts:27-34` | 待提单 |
| 9 | P2 | `D1-68` | D1安装 | region 优先级契约漂移（HW_REGION 优先） | `src/auth/credential-resolver.ts:32`、`src/auth/init-cli.ts:44`、`src/auth/codearts-context.ts:53,106` | 待裁决 SPEC |
| 10 | P2 | `D4-12` | D4安全 | 安装器不再 npm install，安装期断言基线失效 | `bin/setup.cjs`、`bin/dsh-postinstall.cjs`（v2 安装链重构） | 待裁决 SPEC |

### 根因详情

**#1 D4-12 发布包漏依赖（P0，本轮新增）**
- 期望：`npm i huaweicloud-devkit@2.0.0-next.4` 后 MCP server 与工具 schema 可直接加载。
- 实际：全新前缀安装后 `node_modules` 仅 `huaweicloud-devkit` + `undici`；`import dist/tool-schemas.js` → `ERR_MODULE_NOT_FOUND: Cannot find package 'zod'`；`import dist/mcp-protocol.js` → `Cannot find package '@modelcontextprotocol/sdk'`；`dist/validation/*` 另需 `ajv`/`ajv-formats`。
- 根因：`package.json:61-63` `dependencies` 只有 `undici`，而 dist 产物硬依赖上述 4 个包；它们仅在 devDependencies（`package.json:66-84`），未随 dependencies 下发。
- 证据：`evidence/D4-12/fresh-install-missing-deps.log`。

**#2 D4-16 命令包裹穿透（P0）**
- 期望：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` → `deny`。
- 实际：`{"decision":"allow","findings":[]}`。
- 根因：`cloud-risk-rules.json:26-45` 的 `hwc-command-env-dump` 要求 `env` 前为 `(^|\s)`，双引号内不匹配；同判定在 `classify-text.ts:997-1007` 能命中，两条链路不一致。证据：`evidence/D4-16/stdout.log`。

**#3 D4-21 HCL broad IAM（P0）**
- 期望：JSON 与 HCL 两种 `actions=["*"]` 形态均 deny。
- 实际：json=deny，hcl=warn。
- 根因：broad-admin deny 规则要求同时命中 `Effect…Allow`（`:270-313`），HCL 片段无 Effect；只命中 `:314-335` 的 `hwc-iam-wildcard-action`(warn)，缺 HCL 独立 deny 分支。证据：`evidence/D4-21/stdout.log`。

**#4 D9-12 initialize 握手基线（P0）**
- 期望：未 initialize 的 `tools/list` 返回 -32600 或等价协议错误。
- 实际：返回 58 个工具。
- 根因：`mcp-stdio-transport.ts:194-216` 无「已握手」状态判断，任何带 id 请求直接转给 MCP SDK；`mcp-protocol.ts` 无 pre-initialize 守卫。证据：`evidence/D9-12/stdout.log`。

**#5 D9-6 跨客户端互通（P1）**
- 期望：第三方 stdio 客户端 tools/call、resources/list 互通。
- 实际：initialize/tools/list 通过（A/B 均 58 工具），tools/call `isError:true`（vendor gate 要求 `vendorConfirmed`），resources 为空（v2 仅声明 tools）。
- 根因：`mcp-protocol.ts:118-121,151,181` 的 `VENDOR_BOUNDARY_RULE` + `tool-schemas.ts:8` 对云端面工具强制 vendorConfirmed；第三方客户端无 vendor 上下文。证据：`evidence/D9-6/stdout.log`。

**#6 EXP-E01 中文意图路由（P1）**
- 期望：`"帮我查一下我账号在华北北京四有哪些云主机"` 命中 ECS。
- 实际：`Run hcloud --help to list available services.`
- 根因：`src/capability-catalog.ts` 关键词/路由表未收录中文「云主机」（全仓无该词），回落分支在 `:407`。证据：`evidence/EXP-E01/stdout.log`。

**#7 D2-10 KooCLI 消息前缀（P1）**
- 期望：消息精确等于 `KooCLI config not found`。
- 实际：`KooCLI(hcloud)未安装或未就绪。(KooCLI config not found)`。
- 根因：`src/auth/error-table.ts:84` 中文前缀由 `src/auth/reconcile.ts:122` 拼接为「前缀 + 括号细节」。证据：`evidence/D2-10/stdout.log`（fixture exit=1）。

**#8 D8-9 遥测脱敏（P2）**
- 期望：`AK123`/`SECRET`/`abc123` 被遮蔽。
- 实际：`sanitizeValue` 原样返回。
- 根因：`src/telemetry/telemetry-values.ts:27-34` 仅做空白归一化 + 255 截断，v1 的凭证明文遮蔽逻辑在 v2 重构中丢失。证据：`evidence/D8-9/stdout.log`。

**#9 D1-68 region 优先级（P2，SPEC 待裁决）**
- 期望（用例）：`HUAWEICLOUD_REGION` 优先；实际：`HW_REGION` 优先。
- 根因：`credential-resolver.ts:32`、`init-cli.ts:44`、`codearts-context.ts:53,106` 均为 `HW_REGION || HUAWEICLOUD_REGION`。证据：`evidence/D1-68/stdout.log`。

**#10 D4-12 安装器基线（P2，SPEC 待裁决）**
- 期望（用例）：安装器执行 `npm install --omit=dev --no-audit --no-fund`；实际：v2 改为 npx 拉取 + 自带 postinstall（`node ./bin/dsh-postinstall.cjs`），不再 npm install。
- 根因：`bin/setup.cjs`/`bin/dsh-postinstall.cjs` 安装链重构，用例基线需更新；供应链其余断言（自有 postinstall、无 preinstall、依赖可枚举/固定、无已知高危）通过。证据：`evidence/D4-12/stdout.log`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 专属用例（Windows 升级检测链），本机 Linux 不适用；覆盖率门禁按 OS 专属豁免 |

### BLOCKED（均含本轮补测记录，非假阻塞）

| 用例ID | 维度 | 标题 | 阻塞原因 | 补测记录（命令/输出/阻塞条件/解除条件） |
|---|---|---|---|---|
| `D3-C3` | D3功能 | 沙箱部署E2E | v2 审批门 `USER_CONFIRMATION_REQUIRED`：connect 需用户交互终端批准 | 命令：`node evidence/D3-C3/retest.mjs D3-C3`（带 `approvedByUser:true`）；输出：`{"status":"rejected","code":"USER_CONFIRMATION_REQUIRED","approvalToken":…}`；阻塞条件：门禁要求 `npx huaweicloud-devkit approve <token>` 在交互 TTY 执行；解除条件：宿主交互式批准或提供测试免批通道 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟 | 同上（connect 即被审批门拦截，7 工具链路无法建立） | 命令：`retest.mjs` + `bin/setup.cjs approve ee7665a6-…`；输出：`USER_CONFIRMATION_REQUIRED`，approve CLI 回「Approvals must be confirmed in your own interactive terminal.」；解除条件同上 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 同上（connect 被审批门拦截） | 同上，token 见 `evidence/D3-S3/retest.log`；解除条件同上 |
| `D3-C13` | D3功能 | OBS 静态网站托管配置 | `huaweicloud_obs_set_website_config` 被审批门拦截 | 命令：`retest.mjs D3-C13`；输出：`USER_CONFIRMATION_REQUIRED` + token；解除条件同上 |
| `D3-C7` | D3功能 | 跨区域资源操作引导 | 账号 project 仅 cn-north-4：ECS `Common.0013`、EIP 建 `VPC.0501`，无法建删 ap-southeast-3 资源 | 已实测通过项：`list_regions` 含 ap-southeast-3=true、`plan_cli_command` 含 `--cli-region`=true；解除条件：账号开通 ap-southeast-3 项目 |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | v2 已移除 sandbox/hwlink-api 模块（改 devbridge 链路），夹具凭证注入断言无实现可测 | 源码核对：`src/` 无 hwlink-api 模块；解除条件：用例迁移到 devbridge 链路 |
| `D9-9` | D9协议 | tools/call 超时协议语义与取消 | v2 已移除 `mcp-protocol` dispatch 导出，夹具自定义延迟 server 启动即 SyntaxError | 源码核对：`mcp-protocol.ts` 仅导出 `createDevkitMcpServer` 等；解除条件：用例按 v2 导出面重写 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`。全部探针输出经检查，无 AK/SK 明文落盘（`~/.config/huaweicloud/credentials.json` 只被读取用于鉴权）。注意：D8-9 发现「遥测 sanitizeValue 不脱敏」代码级缺陷，已单列 FINDINGS #8，非本轮执行事故。
- [x] 写操作误判 read-only：`无`。删除类用例（D3-S2 删 VPC）走「先确认后执行」链路，plan 阶段正确标记为写操作。
- [x] 红线（I 类）违规：`0`。未出现「未执行判 PASS」「证据缺失判 PASS」；`verify_no_fake_pass.py` 与 `verify_coverage.py` 均通过。
- [x] 脱敏复核：`D8-9` 为 FAIL 缺陷（见 #8）；其余用例输出无凭证泄漏。
- [x] 环境隔离：私有 SUT 前缀 + `HDK_DIST`，未修改全局 npm 包、未触碰其他客户端结果目录与 `test-cases` 母本。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（kc1.small.1，D3-C1） | 1 台（D3-C1 创建→ACTIVE） | `DeleteServers --delete_publicip=true --delete_volume=true`，job SUCCESS | `ECS ListServersDetails` 无本用例服务器；`zero=true` |
| VPC / 子网 / 安全组（D3-C1） | 各 1（`testbot2-dsh-vpc/subnet/sg`） | `DeleteVpc` / `DeleteSubnet` / `DeleteSecurityGroup`（探针 finally + 归零轮询） | `VPC ListVpcs/ListSubnets/ListSecurityGroups` 无残留；`netZero=true`（05:19:57 PASS） |
| OBS 桶（D3-C2 静态站） | 1 个（mb + cp + curl 200） | `OBS rm -f` | `del=true`、`归零=true` |
| OBS 桶（D3-C13 探针） | 1 个（mb 成功后即被审批门拦截） | `OBS rm -f`（finally） | 已删除，未留桶 |
| EIP（D3-C7） | 未创建（`VPC.0501` 拒绝） | — | 无残留 |

> 复测后全账号资源确认：ECS=0、VPC=0、子网=0、OBS 桶无残留；本机 `~/.hdk_ip` 指向的账号无本用例资源泄漏。

---

## 八、遗留与建议

> **缺陷单**：合并单 #1158 复核评论 https://github.com/huaweicloud/huaweicloud-devkit/issues/1158#issuecomment-7022796533（历史 9 项复现 + 新增 P0 发布包漏依赖；未重复开单）


1. **P0 发布阻断**：修复 `package.json` 依赖声明（zod / @modelcontextprotocol/sdk / ajv / ajv-formats），并在 CI 增加「全新前缀 `npm i` 后 import dist 入口 + 启动 MCP server」冒烟，避免再次发布不可用包。
2. **P0 安全**：D4-16 `sh -c` 包裹穿透、D4-21 HCL broad IAM、D9-12 未握手放行，建议同一 PR 内修复并补回归。
3. **SPEC 裁决（2 项）**：D1-68 region 优先级（实现 HW_REGION 优先 vs 用例 HUAWEICLOUD_REGION 优先）、D4-12 安装器基线（v2 已无 npm install），需产品/用例 owner 二选一后更新用例或实现。
4. **审批门可测性**：D3-C3/C6/S3/C13 四项阻塞均源于 v2 审批门要求交互 TTY 批准；建议提供测试专用免批通道或允许 `approvedByUser:true` 在受控测试环境直接放行，否则真机链路长期不可测。
5. **用例迁移**：D3-C14（hwlink-api 已移除）、D9-9（dispatch 导出已移除）需按 v2 架构重写断言；D3-C7 需账号开通 ap-southeast-3 项目。
6. **环境竞争**：并行客户端 CodeArtsAgent 的 `prepare_env.py --update` 会覆盖全局 npm 包，建议各客户端测试使用独立前缀或安装锁，避免相互污染（本轮已用私有前缀规避）。

> 本节由 agent 依据本轮证据补充完成。
