# FINDINGS — 缺陷发现清单（AtomCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/AtomCode/2026-11-13-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：2026-11-13 06:30:00（北京时间）
> **被测对象**：huaweicloud-devkit `v2.0.0-next.3`（npm @next，gitHead `4b718720`）
> **执行归档**：`results/AtomCode/2026-11-13-120.46.222.180/Linux/`

> 版本跳变说明：本日 SUT 由 `v1.1.14-next.2` 跳变至 `v2.0.0-next.3`（源码 .mjs → .ts → 编译 dist/*.js，并引入 vendor gate / 审批姿态 / packs 分层）。以下缺陷均基于 v2 源码真实执行复现，根因指向 .ts 源文件（行号以 hdk checkout `4b718720` 为准）。

---

## #1【P1】D3-S1/D3-S2/EXP-E01 serviceCatalog 中文意图含英文服务名（ECS/VPC 等）时路由 miss，返回 fallback

- **现象**：意图「列出cn-north-4的ECS，只读不改」「帮我查一下我账号在华北北京四有哪些云主机」经 `huaweicloud_service_catalog` 后返回 `recommendedServices=["Run hcloud --help to list available services."]`（未命中路由）。
- **断言**：含 ECS/云主机等明确服务语义的中文意图应命中对应服务，不得返回 fallback。
- **根因**：`plugins/huaweicloud-core/src/capability-catalog.ts:264` 分词 `it.split(/[\s,./-]+/)` 对「中文+英文无空格」不切分英文 token，英文关键词仅走 `tokens.has(kw.toLowerCase())` 全等匹配（非 CJK 关键词不走 `it.includes` 子串匹配，见 :267-274）；叠加关键词覆盖缺口（如「云主机」缺失），命中为空 → fallback `capability-catalog.ts:405-407`。
- **影响**：真实场景中文意图路由准确率下降，Agent 无法路由到正确 service/skill。
- **证据**：`evidence/D3-S1/stdout.log`、`evidence/D3-S2/stdout.log`、`evidence/EXP-E01/stdout.log` 及各自 `probe.mjs`
- **状态**：待提单

## #2【P1】D10-3 vendor gate 使路由评测 harness 全程 MISS（准确率 0%）

- **现象**：`node eval/harness/run-eval.mjs <dist>/mcp-server.js` 对 15 条中文意图全部返回 `(空)`，`HIT=0 MISS=14 N/A=1 acc=0.0%`（基线 21.4% MISS）。
- **断言**：确定性 serviceCatalog 路由层（无需真实 LLM）应能对评测集返回真实路由结论。
- **根因**：`plugins/huaweicloud-core/src/vendor-gate.ts:49` 将 `huaweicloud_service_catalog` 加入 `VENDOR_GATED_TOOLS`，`enforceVendorGate`（vendor-gate.ts:82）要求 `args.vendorConfirmed` 非空 quote；评测 harness `eval/harness/run-eval.mjs` 仅传 `{intent}`、未传 `vendorConfirmed`，所有调用被 gate 拒绝 → 路由层评测 100% MISS。
- **影响**：D10-3 路由层评测通道被 vendor gate 阻断，文档化的确定性评测路径（AGENTS.md「D10 评测集执行路径」）失效。
- **证据**：`evidence/D10-3/stdout.log`、`evidence/D10-3/probe.mjs`、`eval/results/eval-run-*.csv`
- **状态**：待提单

## #3【P2】D8-9 安装 ID 与遥测值脱敏：`sanitizeValue` 完全不脱敏任何键值（仅截断空白/长度）

- **现象**：`sanitizeValue("AK=ABC123XYZ")` 返回 `AK=ABC123XYZ` 原样，`ABC123XYZ` 泄露。
- **断言**：遥测 sanitize 含 `AK=...`/`SK=...` 时，输出不得包含明文值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry-values.ts:27-31` `sanitizeValue()` 仅做控制字符→空格 与 `MAX_VALUE_LENGTH` 截断，未实现任何 `AK`/`SK`/secret 键名脱敏。
- **影响**：遥测上报路径对敏感键值不脱敏，存在凭证/安装 ID 泄露风险。
- **证据**：`evidence/D8-9/stdout.log`、`evidence/D8-9/probe.mjs`
- **状态**：待提单

## #4【P1】D9-9 tools/call 超时协议语义与取消：mcp-protocol 未声明 cancellation/notifications/cancel（SPEC-MISMATCH）

- **现象**：`mcp-protocol.ts` 源码不包含 `cancellation`/`notifications`/`cancel` 任一能力声明。
- **断言**：MCP 协议实现应在协议能力面声明取消/超时语义。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.ts` 未实现/未声明 tools/call 超时与取消语义（SPEC-MISMATCH，契约漂移待裁决）。
- **影响**：tools/call 长时间调用无法由客户端取消，超时协议语义缺失。
- **证据**：`evidence/D9-9/stdout.log`、`evidence/D9-9/probe.mjs`
- **状态**：待提单

## #5【P1】D3-C7 跨区域资源操作引导：目标区域写操作因 IAM token 项目绑定不匹配失败，引导未提前预警

- **现象**：`get_regional_availability(ecs,ap-southeast-3)` 返回 `available=true`、`plan` 带 `--cli-region=ap-southeast-3`，但最小 EIP 创建返回 `VPC.0501`（token 项目 cn-north-4 与目标区域不匹配）创建失败。
- **断言**：跨区域写操作前，产品应识别目标区域与 token 项目不匹配并引导切换，而非直接放行失败。
- **根因**：`plugins/huaweicloud-core/src/services/availability.ts:36-49` 仅静态 cache 校验服务级可用性（`sourcedFrom: static cache`），虽在 :51 附免责声明但 `huaweicloud_plan_cli_command` 未据此对目标区域 IAM 项目绑定做预检引导。
- **影响**：跨区域资源创建/引导场景失败，用户按 `available=true` 继续会得到 backend 报错。
- **证据**：`evidence/D3-C7/stdout.log`、`evidence/D3-C7/probe.mjs`
- **状态**：待提单

## #6【P2】D1-3 doctor 自检：`npm install -g` 后未物化 skills-tree，doctor 报 3 项失败

- **现象**：`huaweicloud-devkit doctor` 输出 `Results: 11 pass, 5 warn, 3 fail`，含 `[FAIL] Skills-tree permission seam`、`[FAIL] Skills tree (server data...)`，不再出现 `All checks passed`；`prepare_env` 的 sync_agent_plugin 同步步亦返回 `Not installed. Use "install" command first.`
- **断言**：标准 `npm install -g huaweicloud-devkit@next` 后，doctor 应通过或明确给出一次性 install 指引而非残留 3 项失败。
- **根因**：`plugins/huaweicloud-core/src/setup-cli.ts:1126-1141`（skills tree / permission seam 检查）与 `doctor-native.ts:162-167`（installed payload 无 skills tree）判定失败；v2 引入 skills-tree 需额外 `npx huaweicloud-devkit install` 步骤，但 `npm install -g`（及 prepare_env 流程）未自动物化该树。
- **影响**：新装机/每日环境医生自检红灯，安装流程文档与脚本未对齐 v2 的 install 步骤。
- **证据**：`evidence/D1-3/stdout.log`、`evidence/D1-3/probe.mjs`
- **状态**：待提单

## #7【测试侧】D3-C1 真云 ECS 生命周期 E2E：finally 归零轮询未确认 ECS 删除，本轮由测试侧手动补删归零

- **现象**：`finally归零(校验真实删除)` 返回 false，detail=`ECS:提交删除 ECS轮询:仍在/未确认 subnet:OK vpc:OK`（异步删除 150s 轮询窗口内未确认 ECS 进入 DELETED）。
- **说明**：`scripts/realcloud_e2e.mjs` finally 归零在有限轮询窗口内未确认 ECS 删除即判失败，属测试脚本清理/判停缺陷，非产品缺陷。**本轮资源已由测试侧补删并归零验证通过**：ECS `1a36ba8c-9418-4f87-9a94-e812d435f11f` 经 `hcloud ECS ListServersDetails` 确认已删除；subnet/VPC 已由 e2e finally 删除。见 `evidence/D3-C1/zeroing-verify.json`。
- **证据**：`evidence/D3-C1/stdout.log`、`evidence/D3-C1/probe.mjs`、`evidence/D3-C1/zeroing-verify.json`

## #8【测试侧】D3-C2 OBS 静态站部署 E2E：「OBS建桶」断言误判 false（建桶实际成功，后续 set/get/删桶归零均 PASS）

- **现象**：`OBS建桶` `pass=false`，但 detail 明确返回 `Create bucket [...] successfully`（request id 非空），`set静态站`/`get静态站`/`删桶归零` 均 `pass=true`，桶最终成功删除归零。
- **说明**：`scripts/realcloud_e2e.mjs`「OBS建桶」断言对返回结构/关键字匹配有误，属测试脚本断言缺陷，非产品缺陷。桶 `testbot3-hermes-obs-4521140794` 已删除归零。
- **证据**：`evidence/D3-C2/stdout.log`、`evidence/D3-C2/probe.mjs`