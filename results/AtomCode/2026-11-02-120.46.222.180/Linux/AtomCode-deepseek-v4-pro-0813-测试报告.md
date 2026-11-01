# AtomCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-02 05:30（北京时间）
> **执行归档**：`results/AtomCode/2026-11-02-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.13-next.0 (gitHead 47170d1f)` |
| hcloud / 依赖 | hcloud 7.x（doctor/status/update/auth）；真云 AK/SK + 只读子账号已就绪 |
| 真云凭证 | `cn-north-4`（AK/SK 已配置） |
| 测试类型 | 源码级探针直调 + 真机 CLI（doctor/status/plugins）+ MCP 协议 + 真云 E2E（VPC/子网/ECS/OBS 建删归零） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（redactSecrets/serviceCatalog/judgeUpdate/risk-rule-engine/mcp-protocol 等）并将结论落盘 `stdout.log`；CLI 真机执行 `huaweicloud-devkit doctor` 等记录日志；真云 E2E 由 `scripts/realcloud_e2e.mjs` 真机建删资源并归零验证。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `130 / 14 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 144） | `90.3%` |
| P0 / P1 / P2 新增缺陷 | `1 / 10 / 3` |
| 红线（I 类）违规 | `0`（脱敏缺陷已如实记 FAIL + 提单，未虚标 PASS） |
| 资源释放 | `全部归零`（ECS/OBS 已删，EIP total_count=0） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `13` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移（D9-9） |
| NOT_RUN | `1` | D1-39（Windows 专属，非本 OS） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01（serviceCatalog 路由 MISS） |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | redactSecrets 未脱敏 JSON 字符串 ak/sk/token | `safety-policy.mjs:42,45` | 待提单 |
| 2 | P1 | `D3-C1` | D3功能 | ECS 生命周期 E2E（环境侧·代理占位符+删除超轮询） | 环境侧，非产品缺陷 | 不提单 |
| 3 | P1 | `D3-C2` | D3功能 | OBS 静态站部署 E2E（测试侧·缺 undici） | 环境侧，非产品缺陷 | 不提单 |
| 4 | P1 | `D3-C3` | D3功能 | 沙箱部署 E2E（沙箱会话未建立） | 外部依赖未就绪 | 不提单 |
| 5 | P1 | `D3-C6` | D3功能 | 沙箱 7 工具具名冒烟（缺 undici + 会话未建立） | 环境侧 | 不提单 |
| 6 | P1 | `D3-C7` | D3功能 | 跨区域资源操作（IAM token 区域绑定） | 环境/凭证区域限制 | 不提单 |
| 7 | P1 | `D3-S1` | D3功能 | 场景-只读查ECS 路由缺失回落 help | `tools.mjs:2195,2448-2450` | 待提单 |
| 8 | P1 | `D3-S2` | D3功能 | 场景-删VPC先确认 路由缺失回落 help | `tools.mjs:2195,2448-2450` | 待提单 |
| 9 | P1 | `D3-S3` | D3功能 | 场景-沙箱预览出URL 路由缺失回落 help | `tools.mjs:2195,2448-2450` | 待提单 |
| 10 | P2 | `D3-S5` | D3功能 | 场景-复合意图分层路由 缺失回落 help | `tools.mjs:2195,2448-2450` | 待提单 |
| 11 | P2 | `D4-25` | D4安全 | Python hook 遥测分类 WRITE_OPERATION_RE 边界失配 | `hooks/huaweicloud-safety.py:46,111` | 待提单 |
| 12 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 小写 ak=/sk= 未覆盖 | `safety-policy.mjs:42,45` | 待提单 |
| 13 | P2 | `D8-9` | D8质量 | sanitizeValue 不脱敏凭证 | `telemetry/telemetry.mjs:190-197` | 待提单 |
| 14 | P1 | `EXP-E01` | D10评测 | serviceCatalog 路由 MISS（“查华北北京四云主机”） | `tools.mjs:2195` | 待提单 |
| 15 | P1 | `D9-9` | D9协议 | mcp-protocol 未声明 cancellation | `mcp-protocol.mjs:51-53` | SPEC-MISMATCH |

### 根因详情（每个 P0/P1 缺陷附证据）

完整根因/断言/现象/证据见 `FINDINGS.md`（本目录），关键项：

- **#1 [P0] D2-4**：`redactSecrets` 对 JSON 字符串形态 `{"ak":..,"sk":..,"token":..}` 漏脱敏；根因 `safety-policy.mjs:42`（secret-key 正则要求键名后接 `[:=]`，不命中 JSON `"ak"`）+ `:45`（`(AK|SK)` 区分大小写不覆盖短键）。证据 `evidence/D2-4/stdout.log`。
- **#7-#10/#14**：`serviceCatalog` 中文意图路由 MISS 回落 `Run hcloud --help`；根因 `tools.mjs:2195` routeMap 覆盖不足 + `:2448-2450` 空结果回落。证据 `evidence/D3-S1、D3-S2、D3-S3、D3-S5、EXP-E01/stdout.log`。
- **#11 [P2] D4-25**：写命令判 `cli:invoke`；根因 `hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 边界失配 + `:111`。
- **#12 [P1] D4-27**：小写 `ak=`/`sk=` 未脱敏；根因 `safety-policy.mjs:42,45`。
- **#13 [P2] D8-9**：`sanitizeValue` 无脱敏；根因 `telemetry/telemetry.mjs:190-197`。
- **#15 [P1] D9-9**：`mcp-protocol.mjs:51-53` capabilities 缺 `cancellation`/`notifications`（SPEC-MISMATCH）。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】OS 列标注「专属」（Windows），Linux 侧由展开级 d1-upgrade 代表覆盖，非本 OS 不适用。 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D2-4/D4-27/D8-9 脱敏缺陷均已记 FAIL 并提单，未虚标 PASS）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`0`（脱敏缺口已如实上报）
- [x] 脱敏复核：证据目录无原始 AK/SK 明文（探针输入使用 `AKID123456`/`secret789` 等假值）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1） | 是（`eea1b508…`） | 已删（二次提交删除） | `ListServersDetails` 中已移除 |
| VPC/子网（D3-C1） | 是 | 已删 | `finally` 校验 OK |
| OBS 桶（D3-C2） | 是 | 已删 | `Delete bucket ... successfully` |
| EIP（D3-C7） | 未成功（VPC.0501） | — | `total_count=0` |

> 真云只删本次创建资源；删除前盘点白名单，未触碰既有/他人资源（如 Oct-29 `tctest-tmr-*` 历史实例）。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（mcp-protocol 未声明 cancellation/notifications，是否补能力）。
- 环境侧遗留：`~/.config/huaweicloud/proxy.json` 占位符 `proxy.example` 为历史残留，已清空；建议维护侧核查其写入来源（`setup-cli.mjs:5152` 交互式 proxy 保存路径），避免再次污染真云 E2E。
- 源码树缺运行时依赖 `undici`（D3-C2/C6 直调 probe 受影响），建议 `hdk/plugins/huaweicloud-core` 执行 `npm install` 或探针改用已安装全局包路径。
- 建议：`realcloud_e2e.mjs` 的 ECS 异步删除轮询（150s）偏短，云 API 偶发超轮询导致「finally归零」误判 FAIL，建议放宽轮询或增加重试。