# AtomCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-31 21:25（北京时间）
> **执行归档**：`results/AtomCode/2026-10-31-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（存在 P0 缺陷 D2-4 凭证脱敏 + P1 缺陷，P0 铁律：不写 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | AtomCode + deepseek-v4-pro-0813 |
| OS / 架构 | Linux x64（IP 120.46.222.180） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.13-next.0`（npm @next，gitHead `47170d1f`） |
| 工具全集 | `46`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 已配置（`~/bin/hcloud`），真云凭证 `cn-north-4` 就绪 |
| 真云凭证 | `cn-north-4`（AK/SK，真机建删资源归零） |
| 测试类型 | 源码级探针 / 真机 CLI（doctor/status/install）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 81（副本 107 行，含历史行）/ 展开级 71（预筛后 39 行） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；真云用例走 `scripts/realcloud_e2e.mjs` 真机建删并归零验证；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `107`（设计级）+ `39`（展开级） |
| 已执行（有 stdout.log） | `146`（100%） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `131 / 13 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 NOT_RUN） | `90.3%` |
| P0 / P1 / P2 新增缺陷 | `1 / 3 / 2` |
| 红线（I 类）违规 | `1`（D2-4 凭证明文泄漏） |
| 资源释放 | `全部归零`（ECS/VPC/子网/OBS 建删后 count=0） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `93` | 有证据且通过 PASS 门禁 |
| FAIL | `12` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `1` | D9-9 cancellation 未声明 |
| NOT_RUN | `1` | D1-39（Windows 专属 OS 用例） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 serviceCatalog 未命中 |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | 凭证脱敏不覆盖 JSON 字符串形态 ak/sk/token | 输出不得含 `AKID123456`/`secret789`/`TOKEN123` | 三字段全部明文 | `safety-policy.mjs:42,45` | P | 待提单 |
| 2 | P1 | `D4-27` | 双路径脱敏遗漏小写 ak=/sk= | `ak=`/`sk=` 替换为占位符 | `ak=AKID456 sk=secret789` 明文 | `safety-policy.mjs:42,45` | P | 待提单 |
| 3 | P1 | `D3-S1/S2/S3/S5`+`EXP-E01` | serviceCatalog 对多类中文意图回落 help | 路由到对应服务且非空 | 回落 `Run hcloud --help...` | `tools.mjs:2195,2448-2450` | P | 待提单 |
| 4 | P2 | `D4-25` | Python hook 写命令遥测分类错误 | DeleteServers 命中 cli:write | 判为 cli:invoke | `hooks/huaweicloud-safety.py:46,111` | P | 待提单 |
| 5 | P2 | `D8-9` | sanitizeValue 不脱敏遥测凭证 | `AK=ABC123XYZ` 替换占位符 | 原样返回明文 | `telemetry/telemetry.mjs:190-197` | P | 待提单 |
| 6 | P1 | `D9-9` | mcp-protocol 未声明 cancellation | capabilities 含 cancellation/notifications | 仅 `tools:{}` | `mcp-protocol.mjs:51-53` | P | 待提单 |

### 根因详情（P0/P1 缺陷附代码片段 + 复现证据）

```markdown
**#1 [P0] D2-4 凭证脱敏不完整**

- 期望：`redactSecrets('{"ak":"AKID123456",...}')` → ak/sk/token 均 `<redacted>`
- 实际：输出 `{"ak":"AKID123456","sk":"secret789","token":"TOKEN123"}` 全明文
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:42,45`
  - `:42` secret-key 正则要求键名后紧接 `[:=]`，无法命中 JSON 引号形态 `"token"`/`"ak"`/`"sk"`
  - `:45` `(AK|SK)` 区分大小写且不覆盖短键 `ak`/`sk`

​```javascript
.replace(/((?:access[_-]?key|...|token|...|credential)\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,;]+)/gi, '$1<redacted>') // ← 只匹配键名+[:=]，JSON 引号形态漏网
.replace(/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g, '$1=<redacted>')                                               // ← 仅大写 AK/SK，小写 ak/sk 漏网
​```

- 证据：`evidence/D2-4/stdout.log`
```

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属用例（OS 列标注「专属」），Linux 无法执行 EINVAL 语义 | 由 Linux 侧 d1-upgrade 代表覆盖（无需改） |

> 其余 FAIL 项（D3-C2/C3/C6/C7）均已真机执行并归零，环境/测试侧原因已在 FINDINGS #7-#10 说明，不属 NOT_RUN/BLOCKED。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`1`（D2-4 脱敏缺陷，属被测对象缺陷，非执行侧泄露）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`1`（D2-4 凭证明文）
- [x] 脱敏复核：证据目录无原始 AK/SK/token 明文日志，真云 E2E 资源归零验证通过

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 是（testbot3-hermes 前缀） | 已删 | ECS 轮询已归零 |
| VPC / 子网（D3-C1） | 是 | 已删 | subnet:OK vpc:OK |
| OBS 桶（D3-C2） | 是 | 已删 | 删桶归零 success |
| EIP（D3-C7） | 尝试建（VPC.0501 区域绑定阻断） | 无残留 | total_count=0 |
| 沙箱会话（D3-C3/C6） | 未建立 | 无需清理 | 无残留 |

> 真云只删本次创建资源（唯一时间戳前缀名）；删除前反序删除 + 归零验证，不碰既有资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（tools/call 取消/超时语义 cancellation 未声明）
- 本轮未覆盖（说明范围）：Windows 专属用例（D1-39）、跨客户端/跨 OS 专属展开级（建包已预筛剔除 27 条）
- 建议：修复 `safety-policy.mjs` 凭证脱敏正则（覆盖 JSON 引号形态 + 小写 ak/sk）为最高优先级；补齐 serviceCatalog 中文意图路由覆盖。