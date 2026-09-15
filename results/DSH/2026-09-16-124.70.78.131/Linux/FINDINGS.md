# FINDINGS — 缺陷发现清单（DSH-deepseek-v4-pro-0813 · 真云补测）

> **落盘路径**：`results/DSH/2026-09-16-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：2026-09-16 00:45（北京时间）
> **被测版本**：`huaweicloud-devkit@1.1.4`（npm latest，gitHead `9b67256e`）
> **说明**：本轮真云补测新增 1 项产品缺陷（D4-13）+ 2 项观察（D2-1 S3 漂移、D4-24 契约漂移）。除 I 类真云资源已全部归零外无新增高危。

## #1【P1】D4-13 最小权限动态切换失效（run-as-readonly.py 注入只读 env 仍解析为管理员）

- **现象**：`python scripts/run-as-readonly.py node probe.mjs` 注入 `HW_ACCESS_KEY`/`HW_SECRET_KEY`（只读 test001，ak 前缀 `HPUA3X`）后，`resolveCredentials()` 仍返回管理员（前缀 `HPUAN1`）。实测日志见 `evidence/D4-13/stdout.log`。
- **断言**：注入只读 env 后 `resolveCredentials()` 应返回 test001（ak 前缀 `HPUA3X`）；写操作应由 IAM 拒绝（实测 `VPC.0010 PolicyNotAuthorized`，此层正确）。
- **根因**：`hdk/plugins/huaweicloud-core/src/auth/credentials.mjs:152-160`（R9）：`stored.configuredBySession === true` 时无条件 `ak = stored.ak; sk = stored.sk`，覆盖 env 注入；而管理员 `credentials.json` 含 `configuredBySession: true`。`scripts/run-as-readonly.py` 仅依赖「完整三元组才让文件优先」门（`credentials.mjs:165-172`），未清理 `configuredBySession`，导致只读切换被 R9 覆盖。
- **影响**：最小权限（least privilege）调试/合规切账号路径失效——agent 试图切只读子账号时仍以管理员身份解析凭证。
- **证据**：`evidence/D4-13/stdout.log`（`run-as-readonly 动态切换生效: false` + `写被拒绝: true`）
- **状态**：待提单（历史查重：本客户端无 D4-13 同根因单）

## #2【P2】D2-1 三端同步 S3（obsutilconfig）账户漂移

- **现象**：`getAuthStatus` 显示 S1（`credentials.json`，admin，指纹 `caae65f2`）与 S3（`~/.obsutilconfig`，ak 前缀 `dxxQ`，指纹 `d87ea28b`）不一致；S2 KooCLI 为 authEncrypt 加密不可比、但 `hcloud ListVpcs` 真云 200 可用。
- **断言**：`auth init`/`auth sync` 后三端账户应一致（S1 指纹 == S3 指纹）。
- **根因**：`~/.obsutilconfig` 中残留旧账户（非当前管理员 hw018619646），`auth sync` 未在重发凭证后触发重新对齐。疑似测试环境状态（非本轮代码改动引入），需 `auth sync` 复测确认。
- **证据**：`evidence/D2-1/stdout.log`（`S1↔S3 指纹一致: false`）

## #3【P2·观察】D4-24 令牌过期/重复确认契约与实现漂移

- **现象/断言**：用例契约要求过期提交返回 `{status:'rejected', code:'CONFIRM_TOKEN_EXPIRED'}`、重复提交返回 `{status:'ok', outcome:'already_processed'}`；实现为 approvals.json 单次消费 + TTL 300s，第二次/过期统一返回「Invalid or expired approval token」。
- **根因**：`hdk/plugins/huaweicloud-core/src/hcloud-cli.mjs:84-96`（`consumeApprovalToken` 单次删除 + `APPROVAL_TTL_MS=300000`），无 CONFIRM_TOKEN_EXPIRED / already_processed 字段契约。
- **状态**：仍 BLOCKED（缺时钟注入夹具加速 TTL 作 E2E 断言），待回归按契约复测。
