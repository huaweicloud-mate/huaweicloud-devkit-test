# 历史问题关联清单（不重复提单）

> 生成说明：本轮 14 项缺陷经上游仓 `huaweicloud/huaweicloud-devkit` 历史 issue 查重，全部命中已有缺陷单（部分可上溯至 v1.1.4 / v1.1.5 多客户端合并单），本次**不新开单**。
> 生成时间：2026-09-22 05:35 CST（北京时间）｜被测版本：v1.1.6-next.0（gitHead faaefb8f）

---

## D2-4 凭证脱敏不完整（小写 ak=/sk= 明文泄漏）

- 今日证据：`evidence/d2-auth/stdout.log`（redact-json FAIL，`ak`/`sk` 键明文未脱敏）
- **关联历史单（复核，不重复提单）**：
  - [#761](https://github.com/huaweicloud/huaweicloud-devkit/issues/761)（open）OfficeAce Windows 2026-09-20 每日缺陷合并单
  - [#752](https://github.com/huaweicloud/huaweicloud-devkit/issues/752)（open）AtomCode/Linux 1.1.5 每日缺陷合并单
  - [#726](https://github.com/huaweicloud/huaweicloud-devkit/issues/726)（open）D4-27 裸 token 关键字未脱敏（同根因）

## D4-16 命令包裹穿透（sh -c 包裹 env-dump 未拦截）

- 今日证据：`evidence/d4-security/stdout.log`（wrap-sh FAIL=allow）
- **关联历史单**：
  - [#758](https://github.com/huaweicloud/huaweicloud-devkit/issues/758)（open）Hermes Windows 2026-09-20：D4-16 命令包裹穿透 + D4-23 规则未发布 + serviceCatalog 路由低
  - [#774](https://github.com/huaweicloud/huaweicloud-devkit/issues/774)（open）Hermes Windows 2026-09-21 每日缺陷

## D4-23 全局规则 huawei-agent-rules 注入未生效

- 今日证据：`evidence/_p0remaining-probe.mjs`（injection-wired FAIL=无注入引用）
- **关联历史单**：
  - [#758](https://github.com/huaweicloud/huaweicloud-devkit/issues/758)（open）Hermes Windows 2026-09-20（D4-23 规则未发布）
  - [#774](https://github.com/huaweicloud/huaweicloud-devkit/issues/774)（open）Hermes Windows 2026-09-21

## D4-27 双路径输出脱敏漏小写 ak=/sk=

- 今日证据：`evidence/deep-probe.stdout.log`（redactSecrets-lower-ak FAIL）
- **关联历史单**：
  - [#726](https://github.com/huaweicloud/huaweicloud-devkit/issues/726)（open）D4-27 裸 token 关键字未脱敏
  - [#761](https://github.com/huaweicloud/huaweicloud-devkit/issues/761)（open）OfficeAce Windows 2026-09-20

## D10-3 路由准确率 21.4%（中文意图路由大面积缺失）

- 今日证据：`eval/results/eval-run-20260921210948.csv`（MISS=11，准确率 21.4%）
- **关联历史单**：
  - [#758](https://github.com/huaweicloud/huaweicloud-devkit/issues/758)（open）serviceCatalog 路由低
  - [#733](https://github.com/huaweicloud/huaweicloud-devkit/issues/733)（open）CodeArtsWork Windows 2026-09-18
  - [#774](https://github.com/huaweicloud/huaweicloud-devkit/issues/774)（open）Hermes Windows 2026-09-21

## D9-2 JSON-RPC 非法参数无 -32602 错误对象

- 今日证据：`eval/results/protocol-probe-20260921210953.json`（invalid-params FAIL=无 error 对象）
- **关联历史单**：
  - [#752](https://github.com/huaweicloud/huaweicloud-devkit/issues/752)（open）AtomCode/Linux 1.1.5 每日缺陷合并单

## D3-S3 沙箱预览 URL 未就绪（deploy_check nginx_serving FAIL）

- 今日证据：`evidence/_scenarios3-probe.mjs` 输出（deploy-check-url nginx_serving=FAIL）
- **关联历史单**：
  - [#769](https://github.com/huaweicloud/huaweicloud-devkit/issues/769)（open）Hermes Linux 2026-09-21 每日测试（D3-S3 沙箱预览 URL 未就绪，同一缺陷仍复现）

## D4-25 Python hook 写命令遥测分类错误（cli:invoke ≠ cli:write）

- 今日证据：`evidence/_d4s25-probe.py` 输出（write-delete/write-create FAIL=cli:invoke）
- **关联历史单**：
  - [#752](https://github.com/huaweicloud/huaweicloud-devkit/issues/752)（open）AtomCode/Linux 1.1.5 每日缺陷合并单

## D4-26 findings 证据脱敏漏小写 ak=/sk=

- 今日证据：`evidence/deep-probe.stdout.log`（lower ak/sk 泄漏实测）
- **关联历史单**：
  - [#761](https://github.com/huaweicloud/huaweicloud-devkit/issues/761)（open）OfficeAce Windows 2026-09-20（与 D2-4 同根因）

## D8-9 sanitizeValue 不脱敏凭证

- 今日证据：`evidence/deep-probe.stdout.log`（sanitize-cred FAIL）
- **关联历史单**：
  - [#761](https://github.com/huaweicloud/huaweicloud-devkit/issues/761)（open）OfficeAce Windows 2026-09-20

## D8-1 文档与实现工具数漂移（39 vs 40）

- 今日证据：`evidence/_p0remaining-probe.mjs`（tool-count-doc-vs-impl FAIL doc=39 actual=40）
- **关联历史单**：
  - [#742](https://github.com/huaweicloud/huaweicloud-devkit/issues/742)（open）OfficeAce D8-1 proxy 命令未在 README 文档化

## D3-S5 复合意图分层路由不拆多服务

- 今日证据：`evidence/_d3s5-probe.mjs` 输出（composite-obs+sandbox FAIL、single-ecs FAIL）
- **关联历史单**：
  - [#774](https://github.com/huaweicloud/huaweicloud-devkit/issues/774)（open）（与 D10-3 同根因）
  - [#762](https://github.com/huaweicloud/huaweicloud-devkit/issues/762)（open）1.1.5 每日缺陷合并单
  - [#733](https://github.com/huaweicloud/huaweicloud-devkit/issues/733)（open）CodeArtsWork Windows 2026-09-18

## D9-9 tools/call 取消能力未声明（SPEC-MISMATCH）

- 今日证据：`eval/results/protocol-probe-20260921210953.json`（capabilities.cancellation 缺失）
- **关联历史单**：
  - [#774](https://github.com/huaweicloud/huaweicloud-devkit/issues/774)（open）Hermes Windows 2026-09-21（D9-9 取消能力未声明）
  - [#698](https://github.com/huaweicloud/huaweicloud-devkit/issues/698)（open）1.1.4 每日缺陷合并单

## D4-24 确认令牌精确 JSON 契约未实现（SPEC-MISMATCH）

- 今日证据：`evidence/d4-security/stdout.log` + 源码 tools.mjs auth_confirm 分支 vs 用例预期契约
- **关联历史单**：
  - [#745](https://github.com/huaweicloud/huaweicloud-devkit/issues/745)（open）1.1.5 每日缺陷合并单（D4-24 确认令牌 JSON 契约）

---

> 结论：14 项缺陷均为已知历史问题（跨 v1.1.4 / v1.1.5 多客户端合并单），v1.1.6-next.0 未修复，本次按「历史查重命中 → 不重复开单」处理，仅生成关联清单归档。相对 v1.1.5，D4-17（hook 模糊 fail-open）已由 #564 修复，为本轮唯一正向回归。