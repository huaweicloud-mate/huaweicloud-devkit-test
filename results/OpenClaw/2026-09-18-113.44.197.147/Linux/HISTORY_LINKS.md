# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经查重（上游仓 `huaweicloud/huaweicloud-devkit` open issues，2026-09-18 实测拉取）命中已有历史 issue，本次**不新开单**。
> 生成时间：2026-09-18 05:37（北京时间）；被测版本 v1.1.5（gitHead `e7ed6f6`）。

## 结论摘要

本轮「每日测试」强制完整重跑 40 探针 + 2 新增用例探针，13 项 FAIL/SPEC 全部命中上游 open issue，无新增缺陷，不重复提单。新增 2 条 daily 用例中，`D2-26` PASS；`D4-27` FAIL（裸 `token=` 关键字 + 小写 `ak=`/`sk=` 未脱敏），对应历史 #726 + #683。

---

## D4-2 凭证 env 打印拦截残留 — `env|grep HW_*` 仍放行
- 今日证据：`evidence/d4-security-core/probe-p0-security.stdout.log`
- **关联历史单（已作为缺陷提过）**：
  - [#694](https://github.com/huaweicloud/huaweicloud-devkit/issues/694)（open）每日测试缺陷合并单（OpenCode Windows）
  - [#690](https://github.com/huaweicloud/huaweicloud-devkit/issues/690)（open）Hermes Windows 每日测试
  - [#683](https://github.com/huaweicloud/huaweicloud-devkit/issues/683)（open）全量测试缺陷合并单（10 项）
  - [#681](https://github.com/huaweicloud/huaweicloud-devkit/issues/681)（open）全量测试缺陷合并单（4 项）
  - [#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)（open）全量测试缺陷合并单（8 项）
  - [#677](https://github.com/huaweicloud/huaweicloud-devkit/issues/677)（open）Hermes Windows P0 缺陷汇总
  - [#676](https://github.com/huaweicloud/huaweicloud-devkit/issues/676)（open）全量测试缺陷合并单（9 项）
  - [#675](https://github.com/huaweicloud/huaweicloud-devkit/issues/675)（open）全量测试缺陷合并单（4 项）
  - [#674](https://github.com/huaweicloud/huaweicloud-devkit/issues/674)（open）全量测试缺陷合并单（10 项）
  - [#673](https://github.com/huaweicloud/huaweicloud-devkit/issues/673)（open）全量测试缺陷合并单（6 项）
  - [#672](https://github.com/huaweicloud/huaweicloud-devkit/issues/672)（open）全量测试缺陷合并单（4 项）
  - [#671](https://github.com/huaweicloud/huaweicloud-devkit/issues/671)（open）Hermes 2 项新增缺陷补充单
  - [#652](https://github.com/huaweicloud/huaweicloud-devkit/issues/652)（open）全量测试缺陷合并单（4 项）
  - [#651](https://github.com/huaweicloud/huaweicloud-devkit/issues/651)（open）全量测试缺陷合并单（12 项，8 agent）
  - [#561](https://github.com/huaweicloud/huaweicloud-devkit/issues/561)（open）规则引擎对凭证 env 打印零覆盖

## D4-16 命令包裹穿透残留 — `sh -c "env|grep ..."` 文本路径未解包
- 今日证据：`evidence/d4-security-core/probe-p0-security.stdout.log`
- **关联历史单**：#694 / #690 / #683 / #681 / #679 / #677 / #676 / #675 / #674 / #673 / #672 / #671 / #652 / #651 / #561

## D4-17 hook 三工具畸形输入 fail-open
- 今日证据：`evidence/d4-security-core/probe-d4-17-hook.stdout.log`
- **关联历史单**：`#564`（畸形输入 fail-open，历史同源）、`#689`（每日测试 5 项合并单）

## D9-2 JSON-RPC -32602 invalid params 未区分
- 今日证据：`evidence/d9-protocol/probe-d9-2-invalid.stdout.log`、`eval/results/protocol-probe-*.json`
- **关联历史单**：`#672`（-32602 invalid params 根因）、`#651`（12 项合并单，JSON-RPC）

## D9-7 protocolVersion 不校验不回显（版本协商降级缺失）
- 今日证据：`evidence/d9-protocol/probe-d9-edge.stdout.log`
- **关联历史单**：`#702`（huaweicloud-devkit v1.1.5 每日测试缺陷合并单）

## D4-21 / D4-7 hook_check_artifacts 未拦截 HCL broad IAM（actions=["*"]）
- 今日证据：`evidence/d4-security-core/probe-p0-security.stdout.log`、`evidence/d4-security-core/probe-d4-7-hooks.stdout.log`
- **关联历史单**：`#651`（hook_check_artifacts 未检测 Terraform HCL 宽泛 IAM）、`#652`

## D4-23 全局规则 huawei-agent-rules.mdc 注入失效
- 今日证据：`evidence/d4-security-core/probe-d4-23-rules.stdout.log`
- **关联历史单**：`#651`/`#673`/`#674`/`#676`/`#679`

## D4-6 adminPass 空格形式回显未脱敏
- 今日证据：`evidence/d4-security-core/probe-d4-6-adminpass.stdout.log`
- **关联历史单**：`#712`（adminPass 参数回显无警告，CodeArtsWork 已提单）、`#651`/`#673`/`#679`、`#561`

## D10-3 / EXP-E 中文意图路由未命中（准确率 21.4%）
- 今日证据：`evidence/d10-routing/probe-d10-routing.stdout.log`、`evidence/d10-routing/run-eval.stdout.log`
- **关联历史单**：`#705`（serviceCatalog 中文路由准确率）、`#706`（EXP-E 路由 MISS）、`#714`（EXP-E01~E14 MISS）、`#689`

## D9-4 initialize 握手时序未强制
- 今日证据：`evidence/d9-protocol/probe-d9-edge.stdout.log`
- **关联历史单**：`#699`（协议生命周期，1.1.4 每日测试合并单）

## D9-9 capabilities.cancellation 未暴露（SPEC-MISMATCH）
- 今日证据：`evidence/d9-protocol/probe-d9-6-9-crossclient.stdout.log`
- **关联历史单**：`#698`（capabilities.cancellation 未声明）

## D4-27 redactSecrets/redactOutput 缺裸 token 关键字 + 小写 ak/sk（新增 daily 用例）
- 今日证据：`evidence/d4-security-core/probe-d4-27-redact.stdout.log`
- **关联历史单**：`#726`（D4-27 裸 token 关键字未脱敏，Hermes 2026-09-18 已提单）、`#683`（小写 ak=/sk= 未脱敏）