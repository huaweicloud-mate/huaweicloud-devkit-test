# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-15 18:15:00（初版）→ 2026-09-15 22:03:00（补测 BLOCKED 回填版）
> **执行归档**：`results/CodeArtsAgent/2026-09-15-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`，npm latest v1.1.4，gitHead 9b67256）
> **结论**：`PARTIAL`（有 P0/P1 缺陷，不得标 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsAgent（CodeArts CLI）+ deepseek-v4-pro-0813 |
| OS / 架构 | Linux (aarch64) |
| Node / npm / Python | Node v22.13.0 / npm 11 / Python 3.12 |
| 被测版本（SUT） | v1.1.4（npm latest 正式版，gitHead 9b67256） |
| 工具全集 | 40（tools.mjs TOOL_DEFINITIONS）；源码 spawn 实测 40；CodeArts 框架 MCP 实际暴露 37 |
| hcloud / 依赖 | hcloud 7.2.12（check_cli installed+authenticated） |
| 测试类型 | MCP 黑盒直调（huaweicloud_* 工具）+ CLI（install/status/doctor/uninstall）+ 源码级 node 函数直调 + 评测 harness |
| 设计真源 | 设计级 77（daily 精选全量下发）/ 展开级 17（预筛后） |

> **补测说明**：本轮（22:00）针对 18:15 初版标 BLOCKED 的 50 条用例逐条深挖，将「假阻塞」实际执行回填——D10 评测集走 `eval/harness/run-eval.mjs`、D6 压测走 `supplement-probe.mjs`、check_update 语义直调 `judgeUpdate`、协议域走 `protocol-probe.mjs`、install/uninstall 隔离 HOME 实测。最终 BLOCKED 从 50 降为 13（设计级 12 + 展开级 1，均为真·外部依赖）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 94（设计级 77 + 展开级 17） |
| 已执行（非 BLOCKED） | 81（设计级 65 + 展开级 16） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 56 / 22 / 13 / 3 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 69.1%（56/81） |
| P0 / P1 / P2 新增缺陷 | 0 / 2 / 1（#10 D9-2、#11 D10-3、#12 D9-9；其余为历史复现 #673/#685） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮未创建真云资源；隔离 HOME 探针已清理） |

---

## 三、状态汇总

### 3.1 设计级（77）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 52 | 有证据且通过 PASS 门禁 |
| FAIL | 10 | 原 8（D4-2/5/6/15/17/23、D1-26、D8-7）+ 新 2（D9-2 错误码、D10-3 中文路由 21.4%） |
| BLOCKED | 12 | 真·外部依赖（Windows 专属/PTY 审批流/只读凭证缺失/多客户端/镜像网络/LLM harness），均写四要素 blockedReason |
| SPEC-MISMATCH | 3 | D5-3、D9-1（与 D1-26 同源）+ 新 D9-9（cancellation 缺失） |
| NOT_RUN | 0 | 无 |
| **合计** | **77** | |

### 3.2 展开级（17）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 4 | EXP-D5-3-1 + EXP-E06/E09/E15（serviceCatalog 路由 HIT） |
| FAIL | 12 | EXP-D5-3-3 + EXP-E01/02/03/04/05/07/10/11/12/13/14（serviceCatalog 中文意图 MISS） |
| BLOCKED | 1 | EXP-E08（explain_error 诊断路由需 LLM harness） |
| SPEC-MISMATCH | 0 | 无 |
| NOT_RUN | 0 | 无 |
| **合计** | **17** | |

---

## 四、缺陷清单（详尽）

### 4.1 历史复现（#1~#9，均为 #673/#685 二次复核，详见 FINDINGS.md）

| # | 级别 | 用例ID | 缺陷 | 状态 |
|---|---|---|---|---|
| 1 | P0 | D4-5 | framework Apply* 写误判（版本漂移） | 复现 #685 |
| 2 | P0 | D4-2 | 凭证 env 打印拦截不完整（HW_ 前缀） | 复现 #673 |
| 3 | P0 | D4-15 | hook ANSI-C 编码绕过 | 复现 #673 |
| 4 | P0 | D4-23 | 全局规则未注入（孤儿文件） | 复现 #673 |
| 5 | P0 | D8-7 | meta 技能指引断链 | 复现 #673 |
| 6 | P1 | D1-26 | 工具暴露漂移 40 vs 37 | 复现 #673 |
| 7 | P1 | D4-6 | adminPass 明文回显无警告 | 复现 #673 |
| 8 | P1 | D4-17 | hook 畸形输入 fail-open | 复现 #673 |
| 9 | P1 | D5-3/D9-1/EXP-D5-3-3 | 工具枚举漂移（与 #6 同源） | 复现 #673 |

### 4.2 本轮新增（#10~#12，源码 spawn + harness 实测发现）

| # | 级别 | 用例ID | 缺陷 | 根因 |
|---|---|---|---|---|
| 10 | P1 | D9-2 | JSON-RPC 错误码 -32603 未区分 -32601/-32602 | `mcp-server.mjs:169` + `mcp-protocol.mjs:95` |
| 11 | P1 | D10-3 + EXP-E01~15 | serviceCatalog 中文意图路由 MISS（准确率 21.4%） | `tools.mjs:1784` routeMap 缺 CJK 关键词 + `tools.mjs:1884` 中文分词失效 |
| 12 | P2 | D9-9 | capabilities.cancellation 未暴露（SPEC-MISMATCH） | `mcp-protocol.mjs:62-65` |

> 各缺陷的「现象/断言/根因/影响/证据」详见 `FINDINGS.md`。

---

## 五、BLOCKED 用例与原因（真·外部依赖，四要素）

| 用例ID | 优先级 | 缺什么资源 | 影响 |
|---|---|---|---|
| D1-2 | P2 | 多客户端共存安装环境 | 无法验证 auto-detect 覆盖多客户端 |
| D1-6 | P2 | KooCLI 下载源/国内镜像网络 | 无法验证 install-hcloud 引导闭环 |
| D1-39 | P0 | Windows 环境（EINVAL 专属） | 本机 Linux 无法验证 Windows 升级检测链 |
| D4-18/19/20 | P0/P0/P1 | 真云 PTY 交互审批流 | 无法验证 confirm/deny 审批语义与预检 |
| D2-1 | P1 | 真云三端 E2E 凭证 + 隔离凭证库 | 无法验证 auth init 三端 API 实际可用 |
| D4-12 | P2 | npm 安装期抓包/SBOM 审计基建 | 无法审计供应链安装期安全 |
| D4-13 | P1 | 只读子账号 credentials.readonly.json（文件缺失） | 无法验证最小权限凭证通过率 |
| D7-4 | P2 | GitCode/国内镜像网络 + GITCODE_TOKEN | 无法验证镜像源安装 |
| D9-6 | P1 | 多客户端并存环境 | 无法验证跨客户端协议互通 |
| D10-4 | P0 | LLM 评测 harness | 无法验证高危意图自动走审批 |
| EXP-E08 | P1 | LLM 评测 harness | serviceCatalog 层无法代理 explain_error 诊断路由 |

> 上述 BLOCKED 均已在 CSV 的 blockedReason 列写明「实测时间 + 缺什么资源 + 影响 + 解除条件」四要素。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0
- [x] 写操作误判 read-only：本轮发现 framework 层 1 处（D4-5 Apply*，复现 #685）
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志
- [x] 隔离探针清理：install/uninstall 隔离 HOME、skip 文件隔离 HOME 均已删除，无环境残留

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS/OBS/沙箱等真云资源 | 否 | — | 本轮未创建，残留 0 |
| 隔离 HOME 临时目录 | 是（探针用） | 已 rm -rf | 无残留 |

---

## 八、遗留与建议

- 待裁决：D5-3/D9-1/EXP-D5-3-3（框架层 37 vs 源码 40 过滤是否为设计意图）；D4-23（规则注入契约 .md vs .mdc）；D9-9（cancellation 取消能力声明）
- 本轮修复关注（新增 #10~#12）：① JSON-RPC 错误码按规范区分 -32601/-32602；② serviceCatalog routeMap 补中文关键词 + 中英分词，消除中文意图大面积 MISS；③ initialize capabilities 声明取消能力
- 建议：优先升级 CodeArts 框架集成插件版本使 #644 修复生效（D4-5 Apply*）；补 env-dump 正则 `HW_ACCESS_KEY|HW_SECRET_KEY|HW_SECURITY_TOKEN` 前缀（D4-2）
