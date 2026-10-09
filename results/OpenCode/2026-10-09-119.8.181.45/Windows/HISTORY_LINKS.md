# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经查重命中上游仓已有历史 issue，本次**不新开单**。
> 客户端：OpenCode-glm-5.2 / Windows / 2026-10-09 / 被测版本 v1.1.8-next.1

---

## D4-16 命令包裹穿透

- 今日证据：`evidence/D4-16/stdout.log`
- 今日现象：`sh -c "printenv HW_ACCESS_KEY"` / `sh -c "cat credentials.json"` / `eval "env"` 均返回 `riskDecision=allow`，risk-rule-engine 未识别内层命令
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#852](https://github.com/huaweicloud/huaweicloud-devkit/issues/852)（open）**[每日测试] serviceCatalog 中文意图路由覆盖不足 + safety-policy 安全检测覆盖不足 - Hermes Windows 2026-10-05**
  - [#797](https://github.com/huaweicloud/huaweicloud-devkit/issues/797)（open）**[每日测试] OfficeAce Windows 2026-09-22: 22 FAIL / 1 BLOCKED (v1.1.5)**
  - [#752](https://github.com/huaweicloud/huaweicloud-devkit/issues/752)（open）**[测试报告] AtomCode Linux 2026-09-20 daily 缺陷合并单** — 文中明确 D4-16→#731 历史关联
  - [#677](https://github.com/huaweicloud/huaweicloud-devkit/issues/677)（open）**[test] Hermes Windows P0 缺陷汇总 (v1.1.4-next.6, 2026-09-14): D1-39/D4-2/D4-3/D4-15/D4-16**
  - [#674](https://github.com/huaweicloud/huaweicloud-devkit/issues/674)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（10 项）**
  - [#683](https://github.com/huaweicloud/huaweicloud-devkit/issues/683)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（10 项）**
  - [#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（8 项）**

---

## EXP-E01 serviceCatalog 路由未命中"云主机"意图

- 今日证据：`evidence/EXP-E01/stdout.log`
- 今日现象：意图"帮我查一下我账号在华北北京四有哪些云主机" → `recommendedServices: ["Run hcloud --help to list available services."]`（兜底），未路由到 ECS
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#866](https://github.com/huaweicloud/huaweicloud-devkit/issues/866)（open）**[每日测试] Hermes-GLM-5.2 Windows 2026-10-09 daily 缺陷合并单（2 项历史复现）**
  - [#864](https://github.com/huaweicloud/huaweicloud-devkit/issues/864)（open）**[每日测试] CodeArtsSpace-GLM-5.2 Windows 2026-10-09 daily 缺陷合并单（8 项）**
  - [#858](https://github.com/huaweicloud/huaweicloud-devkit/issues/858)（open）**[daily-test] CodeArtsSpace Windows 2026-10-07: 8 缺陷 (4 P0 + 4 P1)**
  - [#856](https://github.com/huaweicloud/huaweicloud-devkit/issues/856)（open）**[每日测试] huaweicloud-devkit 1.1.8-next.1 daily 缺陷合并单（2 项新增）**
  - [#852](https://github.com/huaweicloud/huaweicloud-devkit/issues/852)（open）**[每日测试] serviceCatalog 中文意图路由覆盖不足（11/14 MISS, 21.4% HIT）- Hermes Windows 2026-10-05**
  - [#845](https://github.com/huaweicloud/huaweicloud-devkit/issues/845)（open）**[daily-test] safety-policy 安全检测覆盖不足 + serviceCatalog 中文路由缺失 (8 FAIL: P0x4 P1x4)**
  - [#844](https://github.com/huaweicloud/huaweicloud-devkit/issues/844)（open）**[测试报告] Hermes Linux 2026-10-02（6 项）** — 含 D3-S1 中文「云主机」路由未命中
  - [#841](https://github.com/huaweicloud/huaweicloud-devkit/issues/841)（open）**[测试报告] CodeArtsSpace Windows 2026-10-01（8 项历史）**
  - [#828](https://github.com/huaweicloud/huaweicloud-devkit/issues/828)（open）**[测试报告] huaweicloud-devkit v1.1.7 版本全量测试缺陷合并单（5 项）**
  - [#826](https://github.com/huaweicloud/huaweicloud-devkit/issues/826)（open）**[测试报告] huaweicloud-devkit 1.1.7 每日测试缺陷合并单（1 项）**
  - [#805](https://github.com/huaweicloud/huaweicloud-devkit/issues/805)（open）**[每日测试] Hermes-GLM-5.2 2026-09-23 测试发现：D4-23 SPEC-MISMATCH + EXP-E01~E14 路由基线**
  - [#785](https://github.com/huaweicloud/huaweicloud-devkit/issues/785)（open）**[测试报告] huaweicloud-devkit 1.1.6-next.0（1 项）** — EXP-E01~E15 路由大面积 MISS
  - [#784](https://github.com/huaweicloud/huaweicloud-devkit/issues/784)（open）**[测试报告] huaweicloud-devkit 1.1.6-next.0（1 项）** — serviceCatalog 路由准确率低 21.4%
  - [#761](https://github.com/huaweicloud/huaweicloud-devkit/issues/761)（open）**[测试报告] OfficeAce Windows 2026-09-20（8+11 项）**
  - [#730](https://github.com/huaweicloud/huaweicloud-devkit/issues/730)（open）**[测试报告] Hermes Windows 2026-09-18（4 项）**
  - [#714](https://github.com/huaweicloud/huaweicloud-devkit/issues/714)（open）**[测试报告] huaweicloud-devkit 1.1.5（2 项）** — EXP-E01~E14 路由准确率低 11/14 MISS
  - [#705](https://github.com/huaweicloud/huaweicloud-devkit/issues/705)（open）**[serviceCatalog] 中文意图路由准确率仅 21.4%（3/14 HIT），中文关键词覆盖严重不足**
  - [#674](https://github.com/huaweicloud/huaweicloud-devkit/issues/674)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（10 项）**
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#689, #680

---

## 待查重项（未能确定历史关联，标注待 file_issue.py 查重）

以下 SPEC-MISMATCH / FAIL 用例在今日上游仓 open issues 中未找到明确单号关联，待 `scripts/file_issue.py --dry-run` 自动查重后确定是否新开单：

| 用例ID | 状态 | 级别 | 缺陷描述 | 根因 |
|---|---|---|---|---|
| D4-3 | SPEC-MISMATCH | P0 | csms show-secret 被分类为 read_only 未拦截 | `safety-policy.mjs classifyTextCommand` csms show-secret 未列入 deny 规则 |
| D4-17 | FAIL | P1 | hook 对非法/截断 stdin JSON fail-open（静默 return） | `huaweicloud-safety.mjs:47-49` catch 块未 fail-closed |
| D2-12 | SPEC-MISMATCH | P1 | R10 设计预期 sync 返回 ok:false+suppressed，实际返回 needs_confirmation | `tools.mjs auth_switch handler` runtime 非空走 R2 而非 R10 |
| D8-9 | SPEC-MISMATCH | P2 | sanitizeValue 仅截断长度/去空白，不脱敏 AK/SK | `telemetry.mjs:sanitizeValue` 无敏感字段脱敏逻辑 |
