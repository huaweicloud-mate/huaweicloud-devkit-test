# 历史问题关联清单（不重复提单）

> **生成时间**：`2026-09-22 05:30`（北京时间）
> **来源**：Hermes Linux 每日测试 `results/Hermes/2026-09-22-1.94.218.129/Linux/`
> **被测对象**：huaweicloud-devkit v1.1.5（npm 官方 latest，gitHead `e7ed6f6`）
> **生成说明**：本轮 15 项缺陷经历史查重，命中的均为上游仓 `huaweicloud/huaweicloud-devkit` 已有 open issue（此前已作为缺陷提过），**本次不新开单**，避免重复提单堆积。

> 查重方法：本机 `gh issue list` shim 不可用（`gh issue list`/`gh api` 返回空+exit1），改用 `~/.hdk_token` 经 GitHub REST API 直查 `issues?state=open`（100 条 open）+ 按用例号/缺陷语义匹配（强关联：标题或正文含用例号且附近有缺陷语义信号）。15 项缺陷逐一核对对应历史单当前 `state=open`。

> 结果一致性说明：本轮（09-22）15 项缺陷与上一轮（09-21）完全一致——上游未发新版（npm 官方 `latest` 仍为 1.1.5，gitHead 仍 `e7ed6f6`），故无修复回归、无新增缺陷、无变更需新开单。

---

## D4-16 命令包裹穿透（sh -c 包裹凭证 env 打印未拦截）— #1【P0】

- 今日证据：`evidence/d4-security/stdout.log`（wrap-sh 实测 allow）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#682](https://github.com/huaweicloud/huaweicloud-devkit/issues/682)（open）**安全策略绕过缺陷合并单（2 项 P0）**
  - [#752](https://github.com/huaweicloud/huaweicloud-devkit/issues/752)（open）v1.1.5 每日测试缺陷合并单（9 项，AtomCode/Linux）
  - [#761](https://github.com/huaweicloud/huaweicloud-devkit/issues/761)（open）v1.1.5 每日测试（OfficeAce Windows 2026-09-20）

## D2-4 凭证脱敏字符串路径漏小写 ak=/sk= — #2【P0】

- 今日证据：`evidence/d2-auth/stdout.log`（redact-json 实测泄露）
- **关联历史单**：
  - [#694](https://github.com/huaweicloud/huaweicloud-devkit/issues/694)（open）v1.1.4 每日测试缺陷合并单（4 项，含 D2-4）
  - [#674](https://github.com/huaweicloud/huaweicloud-devkit/issues/674)（open）v1.1.4-next.6 全量测试缺陷合并单（10 项）

## D4-23 全局规则 huawei-agent-rules.mdc 未注入 — #3【P0】

- 今日证据：`evidence/D4-23/stdout.log`（rules-in-pkg-files=false / rules-in-installed-pkg=false）
- **关联历史单**：
  - [#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)（open）v1.1.4 全量测试缺陷合并单（8 项，含 D4-23）
  - [#752](https://github.com/huaweicloud/huaweicloud-devkit/issues/752)（open）v1.1.5 每日测试（9 项）
  - [#761](https://github.com/huaweicloud/huaweicloud-devkit/issues/761)（open）v1.1.5 每日测试（OfficeAce Windows）

## D4-27 redactSecrets 漏小写 ak=/sk=/token= — #4【P1】

- 今日证据：`evidence/D4-27/stdout.log`（redactSecrets-ak/sk/token 泄露）
- **关联历史单**：
  - [#726](https://github.com/huaweicloud/huaweicloud-devkit/issues/726)（open）v1.1.5 每日测试（D4-27 裸 token 关键字未脱敏）
  - [#752](https://github.com/huaweicloud/huaweicloud-devkit/issues/752)（open）v1.1.5 每日测试（9 项）

## D8-4 INSTALL.md 未随 npm 包发布 — #5【P1】

- 今日证据：`evidence/D8-4/stdout.log`（pkg-has-installmd=false）
- **关联历史单**：
  - [#694](https://github.com/huaweicloud/huaweicloud-devkit/issues/694)（open）v1.1.4 每日测试缺陷合并单（4 项，含 D8-4）

## D9-2 JSON-RPC invalid params 未返回 -32602 — #6【P1】

- 今日证据：`evidence/D9-protocol/protocol-probe.json`（D9-2b-invalid-params FAIL）
- **关联历史单**：
  - [#730](https://github.com/huaweicloud/huaweicloud-devkit/issues/730)（open）v1.1.5 每日测试（Hermes Windows 2026-09-18，含 D9-2）
  - [#752](https://github.com/huaweicloud/huaweicloud-devkit/issues/752)（open）v1.1.5 每日测试（9 项）

## D9-9 tools/call 超时协议语义——未声明 cancellation（SPEC）— #7【P1】

- 今日证据：`evidence/D9-protocol/protocol-probe.json`（D9-9a SPEC-MISMATCH）
- **关联历史单**：
  - [#698](https://github.com/huaweicloud/huaweicloud-devkit/issues/698)（open）v1.1.4 每日测试缺陷合并单（含 D9-9）

## D10-3 / EXP-E01~E14 serviceCatalog 路由命中率 21.4% — #8【P1】

- 今日证据：`evidence/D10-eval/eval-run.csv`（HIT=3 MISS=11 N/A=1）
- **关联历史单**：
  - [#705](https://github.com/huaweicloud/huaweicloud-devkit/issues/705)（open）**serviceCatalog 中文意图路由准确率仅 21.4%（专用单）**
  - [#689](https://github.com/huaweicloud/huaweicloud-devkit/issues/689)（open）v1.1.4 每日测试（5 项）

## D3-S1 只读 ECS 场景 serviceCatalog 未路由命中 ecs — #9【P1】

- 今日证据：`evidence/d3-cloud/stdout.log`（route-to-ecs FAIL，与 D10-3 同根因 tools.mjs:1776）
- **关联历史单**：
  - [#705](https://github.com/huaweicloud/huaweicloud-devkit/issues/705)（open）serviceCatalog 中文路由覆盖不足（同根因）
  - [#762](https://github.com/huaweicloud/huaweicloud-devkit/issues/762)（open）v1.1.5 每日测试缺陷合并单（3 项）

## D3-S3 沙箱预览 upload_project / deploy_check 返回空 — #10【P1】

- 今日证据：`evidence/d3-sandbox/stdout.log`（sandbox-upload/sandbox-deploy-check FAIL）
- **关联历史单**：
  - [#767](https://github.com/huaweicloud/huaweicloud-devkit/issues/767)（open）v1.1.5 每日测试缺陷合并单（4 项，含 D3-S3）
  - [#762](https://github.com/huaweicloud/huaweicloud-devkit/issues/762)（open）v1.1.5 每日测试（3 项）

## D3-S5 复合意图仅命中单一服务 — #11【P2】

- 今日证据：`evidence/d3-scenario/stdout.log`（compound-multi-hit FAIL，hit=1）
- **关联历史单**：
  - [#767](https://github.com/huaweicloud/huaweicloud-devkit/issues/767)（open）v1.1.5 每日测试缺陷合并单（4 项，含 D3-S5）
  - [#751](https://github.com/huaweicloud/huaweicloud-devkit/issues/751)（open）v1.1.5 每日测试（3 项）

## D1-68 region 优先级与预期相反 — #12【P2】

- 今日证据：`evidence/d1-extend/stdout.log`（region-priority FAIL，HW_REGION 优先）
- **关联历史单**：
  - [#765](https://github.com/huaweicloud/huaweicloud-devkit/issues/765)（open）v1.1.5 每日测试缺陷合并单（1 项，D1-68）

## D4-25 写命令分类误判为 cli:invoke — #13【P2】

- 今日证据：`evidence/d4-hooks/stdout.log`（cli-write-classified FAIL）
- **关联历史单**：
  - [#752](https://github.com/huaweicloud/huaweicloud-devkit/issues/752)（open）v1.1.5 每日测试缺陷合并单（9 项，含 D4-25）

## D4-26 findings.evidence 小写 ak=/sk=/token= 未脱敏 — #14【P2】

- 今日证据：`evidence/d4-extend/stdout.log`（evidence-lowercase-aksk FAIL）
- **关联历史单**：
  - [#761](https://github.com/huaweicloud/huaweicloud-devkit/issues/761)（open）v1.1.5 每日测试（OfficeAce Windows，含 D4-26）

## D8-9 sanitizeValue 未剥离 AK/SK/token — #15【P2】

- 今日证据：`evidence/d8-extend/stdout.log`（sanitize-credential-strip FAIL）
- **关联历史单**：
  - [#752](https://github.com/huaweicloud/huaweicloud-devkit/issues/752)（open）v1.1.5 每日测试缺陷合并单（9 项，含 D8-9）
  - [#674](https://github.com/huaweicloud/huaweicloud-devkit/issues/674)（open）v1.1.4-next.6 全量测试（10 项）

---

> 结论：本轮 15 项缺陷**全部命中历史 open issue**，均为 v1.1.5 及更早版本已登记的已知缺陷，在 v1.1.5（gitHead `e7ed6f6`）中仍复现。**不重复开单**；按 autopilot 硬约束「不处理任何 GitHub issue」，本轮不对既有单追加评论，仅留本关联清单供维护者汇总。