# WorkBuddy-glm-5.2 每日测试报告 — 2026-10-05

## 一、测试概述

- **客户端**：WorkBuddy（Windows）
- **模型**：glm-5.2
- **执行日期**：2026-10-05（北京时间）
- **机器 IP**：188.239.14.150
- **OS**：Windows Server 2022 Standard
- **被测包**：huaweicloud-devkit@1.1.8-next.1（源码 commit ffd7b474）
- **执行 agent**：testbot4-win-Workbuddy
- **执行模式**：daily（每日测试）
- **执行时长**：约 40 分钟

## 二、执行摘要

| 层级 | 总数 | PASS | FAIL | BLOCKED | NOT_RUN |
|---|---|---|---|---|---|
| 设计级 | 102 | 99 | 3 | 0 | 0 |
| 展开级 | 39 | 38 | 1 | 0 | 0 |
| **合计** | **141** | **137** | **4** | **0** | **0** |

**通过率**：137/141 = 97.2%

**门禁校验**：
- `verify_no_fake_pass.py`：PASS（所有 PASS 用例均有 evidencePath 且证据存在）
- `verify_coverage.py`：PASS（P0 无 NOT_RUN/空，NOT_RUN+空占比 0.0%）

## 三、状态汇总

### 按优先级

| 优先级 | 总数 | PASS | FAIL |
|---|---|---|---|
| P0 | 21 | 20 | 1 |
| P1 | 90 | 87 | 3 |
| P2 | 30 | 30 | 0 |

### 按维度

| 维度 | 总数 | PASS | FAIL |
|---|---|---|---|
| D1 安装 | 12 | 11 | 1 |
| D2 认证 | 9 | 8 | 1 |
| D3 功能 | 11 | 11 | 0 |
| D4 安全 | 18 | 17 | 1 |
| D5 客户端 | 4 | 4 | 0 |
| D6 性能 | 4 | 4 | 0 |
| D8 质量 | 4 | 4 | 0 |
| D9 协议 | 11 | 11 | 0 |
| D10 评测 | 16 | 15 | 1 |
| 展开级 | 39 | 38 | 1 |

## 四、缺陷清单

详见 `FINDINGS.md`，共 4 个缺陷：

1. **【P0】D1-39** Windows 升级检测链失效：`parseDistTagsOutput` 拒绝 `npm view` 数组输出 `[{...}]`，导致 `queryDistTagsSync()` 返回 null。根因：`update-check.mjs:81-94` `Array.isArray(parsed)` 提前返回 null。
2. **【P1】D2-12** R10 runtime 非空禁止落盘未在代码层强制执行。根因：`tools.mjs:1199-1280` auth_switch persist 路径未检查 `hasRuntimeCredentials()`。
3. **【P1】D4-6** adminPass 空格分隔参数未拦截（`hwc-command-secret-in-arg` 规则盲区）。根因：`cloud-risk-rules.json` regex `[=:]` 不匹配空格分隔的 hcloud CLI 参数语法。
4. **【P1】EXP-E01** serviceCatalog 路由 MISS：「帮我查一下我账号在华北北京四有哪些云主机」未路由到 ECS。根因：`tools.mjs` serviceCatalog 对「云主机」中文意图未命中 ECS 关键词。

## 五、未执行用例与原因

无 NOT_RUN / BLOCKED 用例。所有用例均已实际执行并落盘证据。

## 六、安全/红线

- **真云用例**：本次无真云建删资源用例（daily 精选集主要为源码级/工具级验证）。
- **PASS 门禁**：所有 PASS 用例均①实测②证据落盘③evidencePath 回填，`verify_no_fake_pass.py` 通过。
- **凭证安全**：D2-11 R3 STS token 拒绝落盘验证 PASS；D2-4 凭证脱敏 PASS；D4-1/2/3 凭证拦截 PASS。
- **目录权限**：只提交 `results/WorkBuddy/`，未碰 Summary / 其他客户端 / test-cases 母版。

## 七、资源释放

- runtime 凭证已 `clearRuntimeCredentials()` 清除
- import 文件（`creds-import.json`）已擦除
- credentials.json 已从备份恢复
- 无云端资源创建（本次无真云用例）

## 八、遗留建议

1. **D1-39 P0 缺陷**：`parseDistTagsOutput` 应兼容 npm view 数组输出，建议改为 `Array.isArray(parsed) ? parsed[0] : parsed` 后再解析。
2. **D2-12 R10 强制**：建议在 `auth_switch` persist 路径入口加 `if (hasRuntimeCredentials()) return { status:'error', scope:'rejected', error:'R10: runtime credentials active' }`。
3. **D4-6 规则修复**：`hwc-command-secret-in-arg` regex 应将 `[=:]` 改为 `[=:\s]` 以覆盖空格分隔参数。
4. **EXP-E01 路由**：serviceCatalog 中文同义词映射应补充「云主机→ECS」。

## 九、门禁通过确认

- `verify_no_fake_pass.py WorkBuddy Windows`：✅ PASS
- `verify_coverage.py WorkBuddy Windows`：✅ PASS
- 3 份 CSV 已回填执行状态+执行时间+evidencePath
- 测试报告.md 已生成
- FINDINGS.md 已生成（4 缺陷）
- PASS 证据 141 份均已落盘 `evidence/<case-id>/stdout.log`
