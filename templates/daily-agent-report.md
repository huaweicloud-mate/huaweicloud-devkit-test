# <客户端>-<模型> 每日测试报告

> **报告名**：`<客户端>-<模型>-测试报告.md`（例：`Hermes-DeepSeek-V4-Pro-测试报告.md`）
> **生成时间**：`YYYY-MM-DD HH:mm:ss`（北京时间）
> **执行归档**：`results/<客户端>/<日期>-<IP>/<OS>/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PASS / PARTIAL / FAIL`（有 FAIL 或 P0 缺口不得写 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `<OpenCode / Codex / CodeArtsAgent / ...>` + `<模型>` |
| OS / 架构 | `<Linux aarch64 / Windows 11 / ...>` |
| Node / npm / Python | `<Node v22.13.0 / npm 10 / Python 3.12>` |
| 被测版本（SUT） | `v<x.y.z-next.n>`（npm @next，gitHead `<8位>`，PR #`<n>`） |
| 工具全集 | `39`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `<hcloud 7.x / doctor 确认已配置>` |
| 真云凭证 | `cn-north-4（AKSK / 未使用）` |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| 设计真源 | 设计级 179 / 展开级 137 / 追踪表 10 列 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `N` |
| 已执行 | `N` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `N / N / N / N / N` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | `NN%` |
| P0 / P1 / P2 新增缺陷 | `N / N / N` |
| 红线（I 类）违规 | `N` |
| 资源释放 | `全部归零 / 残留 N 项` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `N` | 有证据且通过 PASS 门禁 |
| FAIL | `N` | 不符预期，根因见缺陷清单 |
| BLOCKED | `N` | 环境阻塞，见阻塞项 |
| SPEC-MISMATCH | `N` | 契约漂移，待裁决 |
| NOT_RUN | `N` | 本轮未覆盖（说明原因） |
| **合计** | **`N`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `N` | 有证据且通过 PASS 门禁 |
| FAIL | `N` | 不符预期，根因见缺陷清单 |
| BLOCKED | `N` | 环境阻塞，见阻塞项 |
| SPEC-MISMATCH | `N` | 契约漂移，待裁决 |
| NOT_RUN | `N` | 本轮未覆盖 |
| **合计** | **`N`** | |

---

## 四、逐用例结果（已执行项，含 PASS/FAIL/BLOCKED/SPEC）

| 用例 ID | 优先级 | 标题 | 结果 | 证据路径 | 备注 |
|---|---|---|---|---|---|
| `D4-2` | P0 | 凭证 env 打印拦截 | FAIL | `evidence/D4-2/stdout.log` | 根因见缺陷清单 #1 |
| `D1-1` | P1 | 全新安装 | PASS | `evidence/D1-1/stdout.log` | |
| ... | | | | | |

> **逐用例结果需与副本 CSV 的「执行状态」+「evidencePath」列完全一致**（同一来源，不手写不一致的状态）。

---

## 五、缺陷清单（详尽，每个缺陷一栏）

> **铁律**：缺陷必须真实执行后填写；未执行/推测的不得记为缺陷。字段完整到可让修复方直接定位。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证 env 打印拦截不完整 | `env \| grep HW_ACCESS_KEY` 应返回 `deny` | 返回 `allow`，`HW_*` 前缀未拦截 | `safety-policy.mjs:334-337` | P | 待提单 |
| ... | | | | | | | | |

### 根因详情（每个 P0/P1 缺陷附代码片段 + 复现证据）

```markdown
**#1 [P0] D4-2 凭证 env 打印拦截不完整**

- 期望：`env | grep HW_ACCESS_KEY` → `deny`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:334-343`
  `classifyTextCommand()` 的 env-dump 正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 前缀

​```javascript
if (/(^|\s)(env|printenv|...)/i.test(text) &&
    /HUAWEICLOUD|HWC_|HCLOUD|OS_/i.test(text))   // ← 缺 HW_ 前缀
​```

- 证据：`evidence/D4-2/stdout.log`，复现命令 `env | grep HW_ACCESS_KEY` 实测 `allow`
```

---

## 六、阻塞项

| 用例 ID | 阻塞原因 | 环境依赖 | 解除条件 |
|---|---|---|---|
| `D3-C3` | 沙箱需 DevStation 配额 | 待配沙箱环境 | 配额到位后复测 |
| ... | | | |

---

## 七、安全与红线合规

- [ ] 凭证泄漏事件：`0`
- [ ] 写操作误判 read-only：`0`
- [ ] 红线（I 类）违规：`无`
- [ ] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 八、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| `<ECS/沙箱/OBS 等>` | 是/否 | 已删/未删 | sha 前后一致 / 残留 0 |

> 真云只删本次创建资源；删除前全量盘点 + 白名单，禁删既有/他人资源。残留即 FAIL。

---

## 九、遗留与建议

- 待裁决 SPEC：`<D9-9 …>`
- 本轮未覆盖（说明范围）：`<真云 E2E / 多终端矩阵 / 审批流实时对话框 …>`
- 建议：`<一句话，可选>`