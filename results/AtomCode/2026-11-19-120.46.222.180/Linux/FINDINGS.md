# FINDINGS — 缺陷发现清单（AtomCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/AtomCode/2026-11-19-120.46.222.180/Linux/FINDINGS.md`
> **被测对象**：huaweicloud-devkit `2.0.0-next.4`（npm @next，gitHead `16a24814`）
> **口径**：每条均经真机/源码级探针实测，证据落 `evidence/<case-id>/stdout.log`。

---

## #1【P1】D3-S1/D3-S2/EXP-E01 serviceCatalog 中文意图路由 MISS

- **现象**：`huaweicloud_service_catalog` 对「列出cn-north-4的ECS，只读不改」「删除测试VPC，先列命令确认」「帮我查一下我账号在华北北京四有哪些云主机」等中文意图，返回兜底 `recommendedServices: ["Run hcloud --help to list available services."]`，未命中 ECS/VPC。
- **断言**：`recommendedServices` 应包含 `ECS`（或对应 VPC），且不得为 `Run hcloud --help` 兜底。
- **根因**：`plugins/huaweicloud-core/src/capability-catalog.ts`（编译产物 `dist/capability-catalog.js`）`serviceCatalog` 的 `routeMap` 关键词覆盖缺口 + 分词器按 `[\s,./-]+` 分词，导致「云主机」（routeMap 仅 `弹性云服务器`/`云服务器`，缺 `云主机`）与「列出…ECS/删除…VPC」这类把服务名粘连在中文字句里的意图无法命中；兜底在 `dist/capability-catalog.js:391`。
- **影响**：服务目录路由层对高频中文查询 MISS，回退到 `hcloud --help`，降低意图→服务引导准确率。
- **证据**：`evidence/D3-S1/stdout.log`、`evidence/D3-S2/stdout.log`、`evidence/EXP-E01/stdout.log`

## #2【P2】D8-9 telemetry `sanitizeValue` 不再脱敏密钥

- **现象**：`sanitizeValue("AK=ABC123XYZ")` 返回原文 `AK=ABC123XYZ`，密钥明文进入遥测事件值。
- **断言**：`sanitizeValue("AK=ABC123XYZ")` 返回结果不得包含 `ABC123XYZ`（应脱敏）。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry-values.ts`（编译产物 `dist/telemetry/telemetry-values.js:21`）的 `sanitizeValue` 仅做空白折叠与长度截断，脱敏职责从该函数移出后未在遥测值路径上补齐。
- **影响**：遥测事件值可能携带密钥明文，存在隐私/审计风险。
- **证据**：`evidence/D8-9/stdout.log`

## #3【P1】D3-C1/D3-C2/D3-C3/D3-C6 真云 E2E 写操作被审批门阻断（SPEC-MISMATCH）

- **现象**：真云建删用例中，`huaweicloud_run_approved_command`（VPC/ECS 创建）、`huaweicloud_obs_set_website_config`（OBS 静态站）、`huaweicloud_sandbox_connect`（沙箱连接）均返回 `{"status":"rejected","code":"USER_CONFIRMATION_REQUIRED",...}`，自动化侧无法在无人值守下完成建资源；D3-C1 CreateVpc/CreateSubnet `undefined`，D3-C2 set 静态站被拒，D3-C3/D3-C6 sandbox connect 被拒。
- **断言**：携带 `approvalToken + approvedByUser:true`（或 DEVKIT_APPROVAL_MODE=ask）的写入类工具调用应能执行并真实返回资源 ID。
- **根因**：`plugins/huaweicloud-core/src/approval-gate.ts`（编译产物 `dist/approval-gate.js:53/77/91/99/578/587/596` 返回 `status:'rejected'`）+ `dist/packs/huaweicloud-cli/tools.js` `run_approved_command`（工具说明 L419）在 v2 收紧为默认 token 模式：必须用户在自有终端执行 `npx huaweicloud-devkit approve <token>`，`approvedByUser:true` 不再放行，真云 E2E 脚本的 `approve()` 旧契约失效。
- **影响**：真云 E2E 自动化建删流程回归，无法完成「建资源→删资源归零」闭环（本次未留残留：D3-C1 归零通过、D3-C2 删桶通过、D3-C6 无残留）。
- **证据**：`evidence/D3-C1/stdout.log`、`evidence/D3-C2/stdout.log`、`evidence/D3-C3/stdout.log`、`evidence/D3-C6/stdout.log`

## #4【P1】D1-3 `doctor` 输出契约变化 + 全新安装 skills-tree 缺失导致 2 fail

- **现象**：`huaweicloud-devkit doctor` 不再打印「All checks passed」，改印 `Results: 12 pass, 5 warn, 2 fail`，且报 `[FAIL] Skills-tree permission seam` 与 `[FAIL] Skills tree (server data...)`。
- **断言**：全新 `npm install -g huaweicloud-devkit@next` 后 `doctor` 应全绿（0 fail）或至少不报 skills-tree 缺失。
- **根因**：`plugins/huaweicloud-core/src/doctor-native.ts`（skills-tree 检查 L143 一带）依赖 `npx huaweicloud-devkit install` 预置 skills-tree 规则；`npm install -g` 未完成该预置，且 `prepare_env` 的 `sync_agent_plugin` 步骤返回「Not installed. Use install command first.」。
- **影响**：安装后首次 `doctor` 无法全绿，成功码契约变化，自动化健康检查误判。
- **证据**：`evidence/D1-3/stdout.log`

## #5【非产品缺陷】D3-C7 跨区域 EIP 建删受账号 IAM 区域范围限制

- **现象**：跨区域资源引导用例外加 ap-southeast-3 创建最小 EIP，返回 `VPC.0501`「The project name cn-north-4 carried by the token from IAM contains region information」；4/5 子断言通过（区域可用性、plan 含 `--cli-region`、只读查询、EIP 归零），仅「创建 EIP」因账号项目作用域失败。
- **断言**：无（账号项目绑定 cn-north-4，无法在 ap-southeast-3 建 EIP，非 devkit 缺陷）。
- **说明**：账号 IAM 项目作用域 cn-north-4，跨区 ap-southeast-3 建资源被云侧拒；devkit 的跨区引导与 `--cli-region` 参数断言均通过。归零已确认（`total_count=0`），不计入产品缺陷提单。
- **证据**：`evidence/D3-C7/stdout.log`