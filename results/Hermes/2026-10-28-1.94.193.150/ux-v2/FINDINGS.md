# UX 体验用例（D11）v2 分支夹具专项 — FINDINGS（shim 修复后重跑）

- 客户端：Hermes（Linux, aarch64 ECS，IP 1.94.193.150）
- 被测对象：`huaweicloud/huaweicloud-devkit` **v2 分支 @ fcfe047f**（`npm ci && npm run build` 产物 `plugins/huaweicloud-core/dist/`）
- 夹具：`eval/harness/fixtures/d11-*.mjs`（41 个）+ v2 适配 shim `eval/harness/fixtures/v2/`（只读执行，未改动任何夹具/运行器/shim 源码）
- 本轮性质：**shim 修复后重跑**。上轮 FINDINGS 指出 `v2/setup-cli.mjs` 是 TS 源码逐字拷贝、D11-2/20/23/43 spawn 直接 SyntaxError；维护者已改为「双用文件」（commit `27907a9ebc`：顶部 bridge 透传 `V2_DIST/setup-cli.js` + 末尾逐行注释附源码副本），本目录同日同 IP 覆盖式回填。
- 执行方式：`V2_DIST=<v2仓库>/plugins/huaweicloud-core/dist node eval/harness/fixtures/run-ux.mjs eval/harness/fixtures/v2 --evid ... --json ...`
- 构建注意：v2 的 `package.json` `engines.node >= 22.18`（`sync-skills.mjs` 直接 `import …/src/lib/skill-tree.ts`，依赖无参数 TypeScript type-stripping）。本机默认 node 22.13 会在 `npm run build` 末尾的 skills 树生成步报 `ERR_UNKNOWN_FILE_EXTENSION ".ts"`（dist 仍已正确产出，仅 skills/ 树未刷新）。本轮改用 `~/node22/bin/node`（v22.23.2）完整成构：`dist rebuilt; server entry bundled; skills tree regenerated (30 skill(s), 134 file(s))`，exit 0。
- shim 校验（跑夹具前）：`V2_DIST=… setup-cli.mjs --version` 输出真实 `HuaweiCloud DevKit CLI: 2.0.0` + 已装 agent 插件列表，无 SyntaxError；`setup-cli.provenance.json` 记 v2Commit=fcfe047f、sourceSha256、1607 行 target。

## 汇总

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 5 | D11-1、D11-37、D11-41、D11-42、D11-44 |
| NOT_IMPLEMENTED | 21 | 需求验收未达标（重点见下） |
| BLOCKED | 2 | D11-19（缺 hook 脚本）、D11-35（需沙箱/devbridge 真机） |
| NOT_RUN | 13 | 契约依赖待冻结（D11-3/4/5/6/8/9/13/14/16/28/30/34/38） |
| HARNESS_ERROR | 0 | 无夹具崩溃 |

## 核心结论 0：shim 修复已验证，4 条 spawn CLI 夹具现可归因 v2（本重跑焦点）

上轮 4 条夹具（D11-2/20/23/43）失败是因为 spawn 了「TS 源码逐字拷贝」，断言读到 `SyntaxError: Unexpected identifier 'DependencyId'`。本轮改用 bridge 版 `setup-cli.mjs` 后，**全 evidence 目录 grep 无任何 `SyntaxError` / `Unexpected identifier` / `setup-cli bridge` 报错文本**。逐条：

| 夹具 | pass/fail | 断言是否读到真实 CLI 输出 | 判定 |
|---|---|---|---|
| D11-2 非交互引导 | 4 / 1 | ✅ 是——读到 `HuaweiCloud DevKit v2.0.0` 横幅 + 完整 stdout（exit=1、含 creds-import.json、含 huaweicloud_auth_switch、含中文均 PASS） | 唯一 FAIL 是真实 v2 行为：反断言「不出现英文 Non-interactive session detected.」命中英文整句 |
| D11-20 安装后重启提示 | 1 / 3 | ✅ 是——`doctor-ran` 现 PASS（doctor 真实输出），其余断言读到真实判定行 | 3 条 FAIL 均真实：重启提示为英文整句 |
| D11-23 无客户端询问 | 2 / 2 | ✅ 是——non-TTY 报错读到真实横幅（中文✅、无英文唯一提示✅）；`lists-targets` 同时读到嵌入源码候选（9 个 target）与运行时报错文本 | 2 条 FAIL 真实：报错只列 `all`/`hermes` 而非全部 9 个 target；3 条路径存在但非中文 |
| D11-43 终端环境矩阵 | 3 / 1 | ✅ 是——exit=1、`creds-import.json` 关键标识均来自真实 CLI（langc✅、cols✅、exit✅） | 唯一 FAIL 真实：NO_COLOR=1 下仍检测到 ANSI 转义（未尊重 NO_COLOR 约定） |

**结论：再无夹具读到报错文本。4 条夹具的 FAIL 全部来自真实 v2 CLI 行为，可归因 v2。** 证据：`evidence/D11-2|D11-20|D11-23|D11-43/{result.json,stdout.txt}`。

## 核心发现 1：vendor gate 导致 cloud 工具路由/能力面整体失效（重点）

v2 给 cloud-facing 工具加了双确认门（源码 `plugins/huaweicloud-core/src/vendor-gate.ts`，`VENDOR_GATED_TOOLS`）：`huaweicloud_service_catalog`、`huaweicloud_plan_cli_command`、`huaweicloud_auth_switch`、`huaweicloud_list_regions`、`huaweicloud_run_approved_command`、`huaweicloud_sandbox_connect` 等。未传 `vendorConfirmed` 时这些工具抛「Vendor gate: … Pass vendorConfirmed」。

v1 夹具没有 `vendorConfirmed` 概念，shim `v2/tools.mjs` 把 gate 拒绝桥接为空结果。后果：

- **D11-17 路由命中率 0%（0/20）**：`huaweicloud_service_catalog` 空返回 → 20 条中文口语意图全部空路由；`classifyRawCommand` 直调返回 `risk=not_huaweicloud`（`No Huawei Cloud safety rule matched`）。v1 基线 21.4%，v2 因 gate 归零。
- **D11-18 路由未命中无中文澄清兜底**：返回体无澄清字段、无候选列表、静默空路由。
- **D11-25 能力发现面**：service catalog 侧 catalog 空。
- **D11-7 一次性冲突选择闭环**：`huaweicloud_auth_switch`（gated）→ `status`/`needs_confirmation`/`confirmToken` 全 null、候选 label 0 条。
- **D11-31 region 边界**：非法 region 空返回，无中文提示、空串不回退 cn-north-4。
- **D11-33 审批拒绝/超时路径**：`huaweicloud_run_approved_command`（gated）→ 空；且 hook 侧 `huaweicloud-safety.py` 在 shim 布局下不可达（见 BLOCKED）。
- **D11-24 码道沙箱 KooCLI**：`sandbox_connect`（gated）→ 空，无中文「沙箱阻止」说明。

结论：这些 FAIL 是 v2 的真实行为（gate 拦截）经 shim 如实反映，**定性为【测试侧/契约更新】或 SPEC-MISMATCH，非 P0 产品缺陷**——根因落 v2 有意的安全增强（vendor-gate），并非「工具坏了」。

## 核心发现 2：契约字段漂移（v1 夹具读不到的字段）

- **D11-15 凭证安全披露**：`auth_status` 无 `security`/`privacy` 披露字段（无明文 AK/SK 反断言仍 PASS，但披露面字段缺失）。
- **D11-21 登录后空态引导**：onboarding 未给出「≥3 条示例任务」。
- **D11-29 切号即时生效「无需重启」文案**：3 端指纹正确，但无「已生效，无需重启会话」用户可见提示。
- **D11-12 IAM 401 失败提示母语化**：仍返回英文 `IAM rejected the credentials (HTTP 401: …)` 整句。
- **D11-26 术语母语化**：47 处工具/参数描述为纯英文整句。
- **D11-27 只读结果中文摘要**：`dispatch('tools/call')` 无资源标识/名称/状态三项中文字段映射、长输出无截断提示。
- **D11-22 KooCLI 隐私协议引导**：`privacy_pending` 归因正确（PASS），但下一步只给 `npx huaweicloud-devkit install-hcloud`（英文命令），缺中文「隐私协议」说明与两条代答路径。

## 核心发现 3（上轮）已闭环：shim `v2/setup-cli.mjs` 未桥接 → 已修复

上轮定性：`v2/setup-cli.mjs` 是 v2 TS 源码逐字拷贝，direct spawn 报 `SyntaxError: Unexpected identifier 'DependencyId'`，D11-2/20/23/43 不可归因 v2。

本轮状态：维护者已修复为「双用文件」（commit `27907a9ebc`）。provenance 对账通过（fcfe047f / sourceSha256 / target 1607 行），`--version`/`doctor` 输出真实 CLI 文本，4 条夹具现全部读到真实 CLI 输出（见「核心结论 0」），原 SyntaxError 归因缺陷消除。

## BLOCKED 明细（如实，不粉饰）

- **D11-19**：夹具找 `eval/harness/fixtures/hooks/huaweicloud-safety.py`（未入库 test repo；v2 源码侧该 hook 在 `plugins/huaweicloud-core/hooks/`）。shim 布局无 `hooks/` 桥接，环境不可判定 → BLOCKED。
- **D11-35**：需沙箱 + devbridge 通道真机，`sandbox_check_user` 探针未就绪（返回「未配置华为云凭证,需要先完成登录。」）→ 本机不可判定 → BLOCKED。

## 证据

逐夹具 stdout + result.json 见 `results/Hermes/2026-10-28-1.94.193.150/ux-v2/evidence/<D11-*>/`（28 个已执行夹具，每个含 result.json + stdout.txt，均为真实 stdout）；结构化四态汇总见 `UX专项-v2-2026-10-28.json`（summary: pass=5 / not_implemented=21 / blocked=2 / not_run=13 / harness_error=0 / 共 41 夹具）；完整真实 stdout 见 `run-ux.stdout.txt`。