# UX 体验用例（D11）v2 分支夹具专项 — FINDINGS

- 客户端：Hermes（Linux, aarch64 ECS）
- 被测对象：`huaweicloud/huaweicloud-devkit` **v2 分支 @ fcfe047f**（`npm ci && npm run build` 产物 `plugins/huaweicloud-core/dist/`）
- 夹具：`eval/harness/fixtures/d11-*.mjs`（41 个） + v2 适配 shim `eval/harness/fixtures/v2/`（只读执行，未改动）
- 执行方式：`V2_DIST=<v2仓库>/plugins/huaweicloud-core/dist node eval/harness/fixtures/run-ux.mjs eval/harness/fixtures/v2 --evid ... --json ...`

## 汇总

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 5 | D11-1、D11-37、D11-41、D11-42、D11-44 |
| NOT_IMPLEMENTED | 21 | 需求验收未达标（重点见下） |
| BLOCKED | 2 | D11-19（缺 hook 脚本）、D11-35（需沙箱/devbridge 真机） |
| NOT_RUN | 13 | 契约依赖待冻结（D11-3/4/5/6/8/9/13/14/16/28/30/34/38） |
| HARNESS_ERROR | 0 | 无夹具崩溃 |

## 核心发现 1：vendor gate 导致 cloud 工具路由/能力面整体失效（重点）

v2 给 14 个 cloud-facing 工具加了双确认门（源码 `plugins/huaweicloud-core/src/vendor-gate.ts` 的 `VENDOR_GATED_TOOLS`）：
`huaweicloud_service_catalog`、`huaweicloud_plan_cli_command`、`huaweicloud_auth_switch`、`huaweicloud_list_regions`、`huaweicloud_run_approved_command`、`huaweicloud_sandbox_connect` 等。未传 `vendorConfirmed` 时这些工具抛「Vendor gate: … Pass vendorConfirmed」。

v1 夹具没有 `vendorConfirmed` 概念，shim `v2/tools.mjs` 把 gate 拒绝桥接为 `{}`（空对象）。后果：

- **D11-17 路由命中率 0%（0/20）**：`huaweicloud_service_catalog` 返回 `{}` → 20 条中文口语意图全部空路由。`classifyRawCommand` 直调返回 `risk=not_huaweicloud`（`No Huawei Cloud safety rule matched`），不背路由。v1 基线 21.4%，v2 因 gate 归零 → 需求验收不达标。
- **D11-18 路由未命中无中文澄清兜底**：返回体无澄清字段、无候选列表、静默空路由。
- **D11-25 能力发现面**：`service_catalog` 侧 catalog 空（retrieve_skill 侧正常但不含中文）。
- **D11-7 一次性冲突选择闭环**：`huaweicloud_auth_switch`（gated）→ `status`/`needs_confirmation`/`confirmToken` 全 null、候选 label 0 条。
- **D11-31 region 边界**：非法 region 返回 `{}`，无中文提示、无候选、空串不回退 cn-north-4。
- **D11-33 审批拒绝/超时路径**：`huaweicloud_run_approved_command`（gated）→ `{}`；且 hook 侧 `huaweicloud-safety.py` 在 shim 布局下不可达（见核心发现 3）。
- **D11-24 码道沙箱 KooCLI**：`sandbox_connect`（gated）→ `{}`，无中文「沙箱阻止」说明、无恢复路径。

结论：这些 FAIL 是 v2 的真实行为（gate 拦截）经 shim 如实反映，非夹具缺陷。路由失效是 UX-R16 验收的直接阻断。

## 核心发现 2：契约字段漂移（v1 夹具读不到的字段）

- **D11-15 凭证安全披露**：`auth_status` 无 `security`/`privacy` 披露字段（返回体全正文无明文 AK/SK 反断言仍 PASS，但披露面字段缺失）。
- **D11-21 登录后空态引导**：onboarding 未给出「≥3 条示例任务」，三条分类（只读查询/资源创建/沙箱预览）全缺。
- **D11-29 切号即时生效的「无需重启」文案**：切换/区域确实即时生效（3 端指纹正确），但 `tools.mjs` 无「已生效，无需重启会话」用户可见提示。
- **D11-12 IAM 401 失败提示母语化**：仍返回英文 `IAM rejected the credentials (HTTP 401: …)` 整句，未中文化、未给可执行动作。
- **D11-26 术语母语化**：47 处工具/参数描述为纯英文整句（`huaweicloud_check_cli`、`huaweicloud_plan_cli_command`、`huaweicloud_run_*` 等）。
- **D11-27 只读结果中文摘要**：`dispatch('tools/call')` 无资源标识/名称/状态三项中文字段映射、长输出无截断提示。
- **D11-22 KooCLI 隐私协议引导**：`privacy_pending` 归因正确（PASS），但下一步只给 `npx huaweicloud-devkit install-hcloud`（英文命令），缺中文「隐私协议」说明、缺「stdin=y 代答 + 用户终端」两条路径。

## 核心发现 3：shim `v2/setup-cli.mjs` 未桥接（harness/shim 缺陷，非 v2 需求缺口）

`eval/harness/fixtures/v2/setup-cli.mjs` 是 v2 TypeScript 源码 `src/setup-cli.ts` 的**逐字拷贝**（已 diff 确认相同），仍保留 `.ts` 兄弟 import（`./mcp-config-backup.ts`、`./auth/cli.ts`…）与 `import type`/`type X` 语法。Node 直接 spawn 报：

```
SyntaxError: Unexpected identifier 'DependencyId'  (setup-cli.mjs:48)
```

受影响的是 4 个 spawn CLi 的夹具（`node <hdkSrc>/setup-cli.mjs …`）：**D11-2、D11-20、D11-23、D11-43**。它们的 FAIL 断言混合了 shim 的 SyntaxError 输出（而非真实 v2 CLI 输出），**不可据此判 v2 需求缺口**。

- D11-2（非交互引导）、D11-23（无客户端询问）、D11-43（终端环境矩阵）：`node setup-cli.mjs …` 直接 SyntaxError，断言读到的是报错文本。
- D11-20（安装后重启提示）：`node setup-cli.mjs doctor` exit=1（SyntaxError），`doctor-ran` 判 FAIL。

建议维护者：把 `v2/setup-cli.mjs` 桥接到 `V2_DIST/setup-cli.js`（与 `tools.mjs`/`mcp-protocol.mjs` 同法），或提供一个可 spawn 的 CLI 入口。此项属 shim 资产待修复，非本执行人改动范围。

## BLOCKED 明细（如实，不粉饰）

- **D11-19**：夹具找 `eval/harness/fixtures/hooks/huaweicloud-safety.py`（未入库 test repo；v2 源码侧该 hook 在 `plugins/huaweicloud-core/hooks/`）。shim 布局无 `hooks/` 桥接，环境不可判定 → BLOCKED。
- **D11-35**：需沙箱 + devbridge 通道真机，`sandbox_check_user` 探针未就绪（返回「未配置华为云凭证」）→ 本机不可判定 → BLOCKED。

## 证据

逐夹具 stdout + result.json 见 `results/Hermes/2026-10-28-1.94.193.150/ux-v2/evidence/<D11-*>/`；结构化四态汇总见 `UX专项-v2-2026-10-28.json`；完整真实 stdout 见 `run-ux.stdout.txt`。