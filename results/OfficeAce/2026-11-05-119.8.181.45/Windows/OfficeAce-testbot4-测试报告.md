# OfficeAce-testbot4 每日测试报告
> **报告名**：`OfficeAce-testbot4-测试报告.md`
> **生成时间**：2026-11-05 06:00:00（北京时间）
> **执行归档**：`results/OfficeAce/2026-11-05-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷 3 项，均为历史问题的连续复现，本轮不重复提单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OfficeAce` + `testbot4` |
| OS / 架构 | `Windows 11` |
| Node / npm / Python | `v22.22.2` / `12.1.0` / `3.11.9` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.13-next.5`（gitHead `4ab34ed`，PR #1096） |
| KooCLI（hcloud） | `7.3.12`（doctor 自检通过） |
| 真云凭证 | `cn-north-4`（AKSK 已配置；沙箱/E2E 用例因无 DevStation 上游连接而 BLOCKED，未发起真云写操作） |
| 测试类型 | 源码级探针 / 真机 CLI（doctor/status）/ MCP 协议 / 真云 E2E（readonly 路由） |
| 设计真源 | 设计级 107 / 展开级 39 / 追踪表 216 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一归档 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `138 / 3 / 5 / 0 / 0` |
| 通过率（分母 = PASS + FAIL = 141） | `97.9%` |
| P0 / P1 / P2 新增缺陷 | `2 / 1 / 0`（均命中历史单，不重复提单） |
| 红线（I 类）违规 | `1`（D2-4 小写 ak=/sk= 凭证明文泄漏） |
| 资源释放 | `无真云写操作（沙箱/E2E 用例 BLOCKED），无资源残留` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `100` | 有证据且通过 PASS 门禁 |
| FAIL | `2` | 不符预期，根因见缺陷清单 |
| BLOCKED | `5` | 环境阻塞（沙箱/DSH 专属），见阻塞清单 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 本轮未覆盖 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 本轮未覆盖 |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性（小写 ak=/sk= 明文泄漏） | `safety-policy.mjs:45` `redactString` 的 AK/SK 正则 `/(AK|SK).../g` 未加 `i` 忽略大小写 | 历史问题，不重复提单（见 HISTORY_LINKS.md） |
| 2 | P0 | `D4-3` | D4安全 | 明文 secret API 拦截（KMS DecryptData 返回 allow） | `safety/policy.json` `blockedSecretOperations` 未含 `DecryptData`；`safety-policy.mjs:249` 拦截仅依赖该列表 | 历史问题，不重复提单（见 HISTORY_LINKS.md） |
| 3 | P1 | `EXP-E01` | 路由基线 | serviceCatalog 中文「云主机」未识别 ECS | `tools.mjs:2287` ECS 路由 keywords 缺「云主机」（仅有「云服务器」） | 历史问题，不重复提单（见 HISTORY_LINKS.md） |

### 根因详情（每个缺陷附代码片段 + 复现证据）

```markdown
**#1 [P0] D2-4 小写 ak=/sk= 凭证明文泄漏**

- 期望：`config: ak=TESTAK... sk=TESTSK...` 中 AK/SK 值应被脱敏
- 实际：`redactSecrets` 处理后 `akLeak=true skLeak=true`，返回样本仍含 ak=/sk= 明文
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:45`
  ```javascript
  .replace(/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g, '$1=<redacted>')
  ```
  正则未加 `i` 标志，仅命中大写 `AK=`/`SK=`，小写 `ak=`/`sk=` 被绕过
- 证据：`evidence/D2-4/stdout.log`（`akLeak=true skLeak=true`）
```

```markdown
**#2 [P0] D4-3 KMS DecryptData 未拦截**

- 期望：KMS `DecryptData`（返回明文密钥料）应返回 `deny`
- 实际：`classifyTextCommand` 返回 `decision=allow`
- 根因：`safety/policy.json` `blockedSecretOperations` = ShowSecret/ShowSecretVersion/DownloadSecret/GetSecretValue，未含 `DecryptData`；`safety-policy.mjs:249` 按该列表逐个匹配 action
- 证据：`evidence/D4-3/stdout.log`（`decision=allow`）
```

```markdown
**#3 [P1] EXP-E01 中文「云主机」未路由 ECS**

- 期望：prompt「帮我查一下我账号在华北北京四有哪些云主机」应命中 ECS
- 实际：返回 `Run hcloud --help to list available services.`，未命中路由
- 根因：`plugins/huaweicloud-core/src/tools.mjs:2287` ECS routeMap keywords 仅含「云服务器」，缺「云主机」；`serviceCatalog` 对「云主机」无匹配
- 证据：`evidence/EXP-E01/stdout.log`（`verdict=MISS expect=[ECS]`）
```

---

## 五、未执行用例与原因（BLOCKED）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| `D1-67` | 设计级 | P2 | BLOCKED | 调归属 | `AGENT_TOOLKIT_MODE=local` 为 DSH 客户端专属，OfficeAce 客户端不适用 |
| `D3-C3` | 设计级 | P2 | BLOCKED | 补环境 | 沙箱 E2E 需 DevStation 上游网络连接（本轮真实网络沙箱不可用） |
| `D3-C14` | 设计级 | P2 | BLOCKED | 补环境 | 沙箱 HDKit 需 DevStation 上游 |
| `D3-S3` | 设计级 | P2 | BLOCKED | 补环境 | 沙箱需 DevStation 上游 |
| `D3-S7` | 设计级 | P2 | BLOCKED | 补环境 | 沙箱需 DevStation 上游 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`1`（D2-4 小写 ak/sk 明文泄漏，历史问题连续复现）
- [x] 写操作误判 read-only：`无`
- [x] 红线（I 类）违规：`1`（D2-4 大小写绕过，凭证脱敏失效）
- [x] 脱敏复核：D2-4 未通过（小写 ak=/sk= 泄漏）；其余脱敏项通过

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源 | 0 | 0 | 未涉及（沙箱/E2E 用例 BLOCKED，无真云写操作） |

---

## 八、遗留与建议

- 3 项 FAIL（D2-4 / D4-3 / EXP-E01）均命中上游仓历史单，本轮不重复开单；已生成 `HISTORY_LINKS.md` 记录强关联单链接。
- 建议修复方向：
  - D2-4：`safety-policy.mjs:45` AK/SK 正则加 `i` 标志，或并入统一键名/值脱敏路径。
  - D4-3：将 KMS `DecryptData` 纳入 `policy.json` 的 `blockedSecretOperations`。
  - EXP-E01：为 `tools.mjs` ECS 路由补充中文关键词「云主机」。
- 沙箱相关 4 例 BLOCKED（D3-C3/C14/S3/S7）需在具备 DevStation 上游网络环境（真实沙箱）时补跑；D1-67 属 DSH 客户端专属，建议在母版中调整归属。