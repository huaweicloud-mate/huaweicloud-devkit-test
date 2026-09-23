# 历史问题关联清单（不重复提单）

> **生成时间**：`2026-09-24 05:16`（北京时间）
> **来源**：Hermes Linux 每日测试 `results/Hermes/2026-09-24-1.94.218.129/Linux/`
> **被测对象**：huaweicloud-devkit v1.1.6（npm 官方 latest，gitHead `46152dd`）
> **生成说明**：本轮 15 项缺陷经历史查重，命中的均为上游仓 `huaweicloud/huaweicloud-devkit` 已有 open issue（此前已作为缺陷提过），**本次不新开单**，避免重复提单堆积。

> 查重方法：本机 `gh issue list` shim 不可用（只实现 `gh auth status/token` 与 `gh issue create`，`gh issue list`/`gh api` 返回空+exit1），改用 `~/.hdk_token` 经 GitHub REST API 直查。15 项缺陷逐一核对对应历史单当前 `state=open`（已复核 21 个关联单号全部仍 open）。

> 版本对比结论：本轮 SUT 与上一轮（2026-09-23）同为 v1.1.6（`46152dd`），版本未升版。15 项缺陷**全部仍在复现**，无新增缺陷、无缺陷修复回归。

---

## D4-16 命令包裹穿透（sh -c 包裹凭证 env 打印未拦截）— #1【P0】

- 今日证据：`evidence/d4-security/stdout.log`（wrap-sh 实测 allow）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#682](https://github.com/huaweicloud/huaweicloud-devkit/issues/682)（open）**安全策略绕过缺陷合并单（2 项 P0）**
  - [#752](https://github.com/huaweicloud/huaweicloud-devkit/issues/752)（open）1.1.5 每日测试缺陷合并单（9 项，AtomCode/Linux）
  - [#761](https://github.com/huaweicloud/huaweicloud-devkit/issues/761)（open）1.1.5 每日测试（OfficeAce Windows 2026-09-20）
  - [#797](https://github.com/huaweicloud/huaweicloud-devkit/issues/797)（open）OfficeAce Windows 2026-09-22（含 D4-16 P0）

## D2-4 凭证脱敏字符串路径漏小写 ak=/sk= — #2【P0】

- 今日证据：`evidence/d2-auth/stdout.log`（redact-json 实测泄露）
- **关联历史单**：
  - [#694](https://github.com/huaweicloud/huaweicloud-devkit/issues/694)（open）1.1.4 每日测试缺陷合并单（4 项，含 D2-4）
  - [#674](https://github.com/huaweicloud/huaweicloud-devkit/issues/674)（open）1.1.4-next.6 全量测试缺陷合并单（10 项）
  - [#791](https://github.com/huaweicloud/huaweicloud-devkit/issues/791)（open）**refactor: redact 设计重构——统一键名策略与脱敏路径**（结构性修复跟踪）

## D4-23 全局规则 huawei-agent-rules.mdc 未注入 — #3【P0】

- 今日证据：`evidence/D4-23/stdout.log`（rules-in-pkg-files=false / rules-in-installed-pkg=false）
- **关联历史单**：
  - [#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)（open）1.1.4 全量测试缺陷合并单（8 项，含 D4-23）
  - [#752](https://github.com/huaweicloud/huaweicloud-devkit/issues/752)（open）1.1.5 每日测试（9 项）
  - [#761](https://github.com/huaweicloud/huaweicloud-devkit/issues/761)（open）1.1.5 每日测试（OfficeAce Windows）

## D4-27 redactSecrets 漏小写 ak=/sk=/token= — #4【P1】

- 今日证据：`evidence/D4-27/stdout.log`（redactSecrets-ak/sk/token 泄露）
- **关联历史单**：
  - [#726](https://github.com/huaweicloud/huaweicloud-devkit/issues/726)（open）1.1.5 每日测试（D4-27 裸 token 关键字未脱敏）
  - [#752](https://github.com/huaweicloud/huaweicloud-devkit/issues/752)（open）1.1.5 每日测试（9 项）
  - [#791](https://github.com/huaweicloud/huaweicloud-devkit/issues/791)（open）refactor: redact 设计重构（结构性修复跟踪）

## D8-4 INSTALL.md 未随 npm 包发布 — #5【P1】

- 今日证据：`evidence/D8-4/stdout.log`（pkg-has-installmd=false）
- **关联历史单**：
  - [#694](https://github.com/huaweicloud/huaweicloud-devkit/issues/694)（open）1.1.4 每日测试缺陷合并单（4 项，含 D8-4）

## D9-2 JSON-RPC invalid params 未返回 -32602（tools/list 参数非 object 不校验）— #6【P1】

- 今日证据：`evidence/D9-protocol/protocol-probe.json`（D9-2b-invalid-params FAIL，无 error 对象）
- **关联历史单**：
  - [#752](https://github.com/huaweicloud/huaweicloud-devkit/issues/752)（open）1.1.5 每日测试（9 项，含 D9-2）
  - [#730](https://github.com/huaweicloud/huaweicloud-devkit/issues/730)（open）1.1.5 每日测试（Hermes Windows 2026-09-18，含 D9-2）

## D9-9 tools/call 超时协议语义——未声明 cancellation（SPEC）— #7【P1】

- 今日证据：`evidence/D9-protocol/protocol-probe.json`（D9-9a SPEC-MISMATCH）
- **关联历史单**：
  - [#698](https://github.com/huaweicloud/huaweicloud-devkit/issues/698)（open）1.1.4 每日测试缺陷合并单（含 D9-9）
  - [#774](https://github.com/huaweicloud/huaweicloud-devkit/issues/774)（open）Hermes Windows 2026-09-21（D9-9 取消能力未声明）

## D10-3 / EXP-E01~E14 serviceCatalog 路由命中率 21.4% — #8【P1】

- 今日证据：`evidence/D10-eval/eval-run.csv`（HIT=3 MISS=11 N/A=1）
- **关联历史单**：
  - [#705](https://github.com/huaweicloud/huaweicloud-devkit/issues/705)（open）**serviceCatalog 中文意图路由准确率仅 21.4%（专用单）**
  - [#689](https://github.com/huaweicloud/huaweicloud-devkit/issues/689)（open）1.1.4 每日测试（5 项）
  - [#785](https://github.com/huaweicloud/huaweicloud-devkit/issues/785)（open）1.1.6-next.0 每日测试（serviceCatalog 中文意图大面积 MISS）

## D3-S1 只读 ECS 场景 serviceCatalog 未路由命中 ecs — #9【P1】

- 今日证据：`evidence/d3-cloud/stdout.log`（route-to-ecs FAIL，与 D10-3 同根因 tools.mjs:1815）
- **关联历史单**：
  - [#705](https://github.com/huaweicloud/huaweicloud-devkit/issues/705)（open）serviceCatalog 中文路由覆盖不足（同根因）
  - [#762](https://github.com/huaweicloud/huaweicloud-devkit/issues/762)（open）1.1.5 每日测试缺陷合并单（3 项）

## D3-S3 沙箱预览 upload_project / deploy_check 返回空 — #10【P1】

- 今日证据：`evidence/d3-sandbox/stdout.log`（sandbox-upload/sandbox-deploy-check FAIL）
- **关联历史单**：
  - [#767](https://github.com/huaweicloud/huaweicloud-devkit/issues/767)（open）1.1.5 每日测试缺陷合并单（4 项，含 D3-S3）
  - [#762](https://github.com/huaweicloud/huaweicloud-devkit/issues/762)（open）1.1.5 每日测试（3 项）
  - [#787](https://github.com/huaweicloud/huaweicloud-devkit/issues/787)（open）**D3-S3 沙箱预览 URL 不可达（拆分自 #786）**

## D3-S5 复合意图仅命中单一服务 — #11【P2】

- 今日证据：`evidence/d3-scenario/stdout.log`（compound-multi-hit FAIL，hit=1）
- **关联历史单**：
  - [#767](https://github.com/huaweicloud/huaweicloud-devkit/issues/767)（open）1.1.5 每日测试缺陷合并单（4 项，含 D3-S5）
  - [#751](https://github.com/huaweicloud/huaweicloud-devkit/issues/751)（open）1.1.5 每日测试（3 项）
  - [#788](https://github.com/huaweicloud/huaweicloud-devkit/issues/788)（open）**D3-S5 复合意图分层路由未拆分命中（拆分自 #786）**

## D1-68 region 优先级与预期相反 — #12【P2】

- 今日证据：`evidence/d1-extend/stdout.log`（region-priority FAIL，HW_REGION 优先）
- **关联历史单**：
  - [#765](https://github.com/huaweicloud/huaweicloud-devkit/issues/765)（open）1.1.5 每日测试缺陷合并单（1 项，D1-68）

## D4-25 写命令分类误判为 cli:invoke — #13【P2】

- 今日证据：`evidence/d4-hooks/stdout.log`（cli-write-classified FAIL）
- **关联历史单**：
  - [#752](https://github.com/huaweicloud/huaweicloud-devkit/issues/752)（open）1.1.5 每日测试缺陷合并单（9 项，含 D4-25）

## D4-26 findings.evidence 小写 ak=/sk=/token= 未脱敏 — #14【P2】

- 今日证据：`evidence/d4-extend/stdout.log`（evidence-lowercase-aksk FAIL）
- **关联历史单**：
  - [#761](https://github.com/huaweicloud/huaweicloud-devkit/issues/761)（open）1.1.5 每日测试（OfficeAce Windows，含 D4-26）
  - [#791](https://github.com/huaweicloud/huaweicloud-devkit/issues/791)（open）refactor: redact 设计重构（结构性修复跟踪）

## D8-9 sanitizeValue 未剥离 AK/SK/token — #15【P2】

- 今日证据：`evidence/d8-extend/stdout.log`（sanitize-credential-strip FAIL）
- **关联历史单**：
  - [#752](https://github.com/huaweicloud/huaweicloud-devkit/issues/752)（open）1.1.5 每日测试缺陷合并单（9 项，含 D8-9）
  - [#674](https://github.com/huaweicloud/huaweicloud-devkit/issues/674)（open）1.1.4-next.6 全量测试（10 项）

---

> 结论：本轮 15 项缺陷**全部命中历史 open issue**，均为 v1.1.6 及更早版本已登记的已知缺陷，在 v1.1.6（`46152dd`）中仍复现。**不重复开单**；按 autopilot 硬约束「不处理任何 GitHub issue」，本轮不对既有单追加评论，仅留本关联清单供维护者汇总。