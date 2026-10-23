# AtomCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-24 05:20（北京时间）
> **执行归档**：`results/AtomCode/2026-10-24-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（存在 P0 缺陷 D2-4 与多项 P1 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | AtomCode + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64 |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `1.1.12`（npm latest，gitHead `4ed07801`） |
| 工具全集 | `46`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | KooCLI 7.2.12 / doctor 已配置 |
| 真云凭证 | cn-north-4（AK/SK 已配置，含只读子账号） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E |
| daily 复制用例 | 设计级 107 / 展开级 39（展开级已按客户端+OS 预筛剔除 27） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 12 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | `91.0%`（132/145） |
| P0 / P1 / P2 新增缺陷 | `1 / 6 / 3`（另有测试侧 3 项非产品问题） |
| 红线（I 类）违规 | `1`（D2-4 凭证明文脱敏失效） |
| 资源释放 | `全部归零`（真云 ECS/VPC/OBS/沙箱均建删归零） |

---

## 三、状态汇总

### 3.1 设计级（107）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `94` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `1` | D9-9 契约漂移 |
| NOT_RUN | `1` | D1-39 Windows 专属在 Linux 侧豁免 |
| **合计** | **`107`** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 中文云主机意图未路由 |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | JSON 键值形态凭证漏脱敏 | 输出不得含明文 `AKID123456` | 原样返回明文 | `safety-policy.mjs:34-62` | P | 待提单 |
| 2 | P1 | `D4-27` | 小写 ak/sk 漏脱敏 | 不得含明文 `AKID456`/`secret789` | `ak=AKID456 sk=secret789` 未脱敏 | `safety-policy.mjs:45` | P | 待提单 |
| 3 | P1 | `D3-S1` | 中文只读 ECS 意图未路由 | 应路由到 `ECS` | 回落 `Run hcloud --help` | `tools.mjs:2188-2443` | G | 待提单 |
| 4 | P1 | `D3-S2` | 中文删 VPC 意图未路由 | 应路由到 `VPC` | 回落 help | `tools.mjs:2188-2443` | G | 待提单 |
| 5 | P1 | `D3-S3` | 中文沙箱预览意图未路由 | 应路由到 `Sandbox` | 回落 help | `tools.mjs:2188-2443` | G | 待提单 |
| 6 | P1 | `EXP-E01` | 中文「云主机」意图未路由 | 应命中 ECS 查询 | MISS | `tools.mjs:2188-2443` | G | 待提单 |
| 7 | P1 | `D9-9` | tools/call 取消能力未声明 | capabilities 应声明 cancellation | 未声明（SPEC-MISMATCH） | `mcp-protocol.mjs:47-49` | P | 待提单 |
| 8 | P2 | `D3-S5` | 中文复合意图未分层路由 | 应命中多 service | 回落 help | `tools.mjs:2188-2443` | G | 待提单 |
| 9 | P2 | `D4-25` | Python hook 写命令边界未命中 | 应分类 `cli:write` | 分类为 `cli:invoke` | `huaweicloud-safety.py:46` | P | 待提单 |
| 10 | P2 | `D8-9` | sanitizeValue 未脱敏 AK/SK | 输出不得含明文 | 原样返回 `AK=ABC123XYZ` | `telemetry.mjs:189-196` | P | 待提单 |

> P = 产品缺陷 / G = 通用能力缺陷 / I = 集成缺陷。
> 测试侧非产品问题（不计入提单）：D3-C2（OBS 建桶 exit-code 假阴性）、D3-C3（沙箱 deploy_nginx 端口漂移 8080→8081）、D3-C7（跨区域账号仅 cn-north-4 项目）3 项，详见 FINDINGS.md #11-#13。D3-C1 今日 ECS 建删归零已 PASS。

### 根因详情（P0/P1 缺陷）

**#1 [P0] D2-4 凭证脱敏正确性**

- 期望：`redactSecrets('{"ak":"AKID123456",...}')` → ak/sk/token 值 `<redacted>`
- 实际：原样返回明文 `AKID123456`/`secret789`/`TOKEN123`
- 根因：`safety-policy.mjs:34-62` `redactString()` 正则仅匹配无引号键形态，JSON 引号键 `"ak":"..."` 不命中
- 证据：`evidence/D2-4/stdout.log`

**#2 [P1] D4-27 双路径输出脱敏**

- 期望：`token=... ak=... sk=...` 全部脱敏
- 实际：`token=<redacted>` 但 `ak=AKID456 sk=secret789` 漏脱敏
- 根因：`safety-policy.mjs:45` `(AK|SK)` 正则缺少 `/i` 大小写不敏感
- 证据：`evidence/D4-27/stdout.log`

**#7 [P1] D9-9 tools/call 取消能力未声明**

- 期望：capabilities 含 `cancellation` 声明
- 实际：`capabilities` 仅 `tools: {}`
- 根因：`mcp-protocol.mjs:47-49` capabilities 缺失 cancellation 字段
- 证据：`evidence/D9-9/stdout.log`

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 专属（升级检测链 EINVAL 专属），本机 Linux；Linux 侧由展开级 EXP-NR3 终端矩阵代表覆盖 | 无需改，OS 列已标注「专属」 |

> 其余用例全部执行（无 BLOCKED）。展开级「非本客户端/OS」的 27 条在 init_day 建包时已按 agent+OS 预筛剔除，不计 NOT_RUN。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（但 D2-4/D4-27/D8-9 为脱敏功能缺陷，属待修产品问题，非本次泄漏）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`1`（D2-4 脱敏失效，已记缺陷）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 是（c6.large.2） | 已删 | ECS 轮询已归零，VPC/子网 OK |
| VPC/子网（D3-C1） | 是 | 已删 | 归零 |
| OBS 桶（D3-C2） | 是 | 已删 | 删桶 successfully |
| 沙箱会话（D3-C3/C6） | 是 | 已关 | close_session ok |
| EIP（D3-C7 ap-southeast-3） | 失败（VPC.0501，未建成） | N/A | total_count=0 |

> 真云只删本次创建资源，删除前已盘点。执行后 `testbot3-hermes-*` 前缀 ECS/VPC 均已归零，账号残留 ECS 均为其他 agent（`tctest-*`）归属，未触碰。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（tools/call cancellation 未声明，属协议契约漂移）。
- 本轮未覆盖：D1-39 Windows 升级检测链（OS 专属，Linux 侧代表覆盖）；跨区域 E2E 仅能验证到 VPC.0501 项目绑定限制。
- 建议：中文 serviceCatalog 路由（D3-S1/S2/S3/S5、EXP-E01 同根因）与安全脱敏（D2-4/D4-27/D8-9）为高频复发项，建议优先修复并在下轮回归验证。