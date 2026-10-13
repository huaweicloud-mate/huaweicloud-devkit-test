# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-10-10 05:23（北京时间）
> **执行归档**：`results/Hermes/2026-10-10-1.92.93.23/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **被测版本**：v1.1.8-next.2（npm @next，gitHead `681895da`，PR #874）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项；上一轮 8 项 P0 缺陷中 4 项已修复）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux x86_64` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `v1.1.8-next.2 (gitHead 681895da)` |
| 工具全集 | `41`（tools.mjs TOOL_DEFINITIONS，新增 huaweicloud_obs_set_website_config） |
| hcloud / KooCLI | `hcloud 7.2.12`（doctor 确认已配置） |
| 真云凭证 | `cn-north-4`（管理员 AK/SK + 只读子账号 test001 均就绪） |
| daily 基础用例 | 设计级 102 / 展开级 43（HWT 预筛后） |

> **执行方法**：① 源码级探针（.mjs/.py/.sh）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（classifyTextCommand/classifyHcloudArgs/redactSecrets/serviceCatalog/judgeUpdate/runApprovedCommand 等），决策落 `fresh-*.txt`/`stdout.log`；② CLI 真机执行（install/doctor/status/uninstall）；③ MCP 协议探针（stdio + remote HTTP/WS + initialize 时序）；④ `eval/harness/run-eval.mjs` 15 条中文意图路由评测；⑤ 真云 E2E（建删归零：VPC/OBS/FunctionGraph/沙箱/只读子账号 CTS）。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `145`（设计级 102 + 展开级 43） |
| 已执行 | `143`（2 条 NOT_RUN：D1-39 OS 专属、D3-S7 RDS 时间窗口） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `117 / 20 / 0 / 6 / 2` |
| 通过率（分母 = PASS+FAIL = 137） | `85.4%` |
| P0 / P1 / P2 产品缺陷 | `5 / 9 / 3`（另有 3 项测试侧） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（VPC/OBS/FunctionGraph 建删归零，沙箱 close_session，只读子账号零写） |

> **版本对比亮点**：v1.1.7 → v1.1.8-next.2 大幅修复——D4-16 命令包裹穿透、D4-23 全局规则注入、D1-70 no_proxy CIDR、D4-2 env 双路径拦截均已修复；serviceCatalog 中文意图路由准确率从 21.4% 提升至 92.9%。

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `78` | 有证据且通过 PASS 门禁 |
| FAIL | `17` | 不符预期（含 D3-C4 测试侧 1 项），根因见 §四 |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `5` | 契约漂移（D1-68/D8-9/D5-3/D9-1/D9-10） |
| NOT_RUN | `2` | D1-39 OS 专属、D3-S7 RDS 时间窗口 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `39` | 含 EXP-C4 20 项 / EXP-E 14 项 / EXP-NR3 4 项 / EXP-D5-8-1 |
| FAIL | `3` | EXP-C4-14/18（测试侧）、EXP-E01（云主机 miss） |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `1` | EXP-D5-8-3（工具数 41） |
| NOT_RUN | `0` | 无 |
| **合计** | **`43`** | |

---

## 四、缺陷清单（详见 FINDINGS.md，file_issue.py 提单输入）

| # | 级别 | 用例ID | 缺陷描述 | 根因（文件:行号） |
|---|---|---|---|---|
| 1 | P0 | `D2-11` | R2 冲突门先于 R3 STS 检查 | tools.mjs auth_switch 1214-1228 先于 1237 |
| 2 | P0 | `D2-4` | 小写 ak=/sk= 不脱敏 | safety-policy.mjs:45 正则大小写敏感 |
| 3 | P0 | `D4-3` | ShowSecret 元数据被过度拦截 | safety-policy.mjs:564 正则过宽 |
| 4 | P0 | `D4-5` | Change* 写操作误判只读 | policy.json:27 缺 Change 前缀 |
| 5 | P0 | `D9-12` | initialize 非法时序未拒绝 -32600 | mcp-server.mjs:175-187 未跟踪 initialize |
| 6 | P1 | `D4-4` | Change* 审批门漏拦截 | policy.json:27 缺 Change |
| 7 | P1 | `D4-8` | Python/Node 钩子策略不一致 | hooks/huaweicloud-safety.py 写/凭证检查未 deny |
| 8 | P1 | `D4-11` | 自然语言提示注入夹带写命令仍绕过 | safety-policy.mjs:553-561 |
| 9 | P1 | `D4-17` | 畸形输入 fail-open | hooks/*.mjs:46-48 JSON.parse 静默 return |
| 10 | P1 | `D4-27` | 双路径脱敏缺口（小写 ak/sk + 文本路径） | safety-policy.mjs:45 |
| 11 | P1 | `D3-S1` | 中文「查云主机」路由 miss | tools.mjs serviceCatalog ECS 关键词缺「云主机」 |
| 12 | P1 | `D3-S3` | 沙箱预览公网 URL 不可达 | sandbox/session-manager.mjs DevBridge 隧道未建 |
| 13 | P1 | `D10-3` | 中文路由准确率 92.9% 仍 1 条 miss | tools.mjs serviceCatalog ECS 缺「云主机」 |
| 14 | P1 | `EXP-E01` | 「查云主机」意图 miss | tools.mjs serviceCatalog（同 #11） |
| 15 | P2 | `D3-S5` | 复合中文意图未拆分命中 | tools.mjs serviceCatalog |
| 16 | P2 | `D4-25` | Python hook 写操作遥测落 cli:invoke | hooks/huaweicloud-safety.py:46-111 |
| 17 | P2 | `D4-26` | findings.evidence 明文泄漏 AK/SK | risk-rule-engine.mjs:19 |
| 18 | P2 | `D1-68` | HW_REGION 优先于 HUAWEICLOUD_REGION（SPEC） | auth/credentials.mjs |
| 19 | P2 | `D8-9` | sanitizeValue 未脱敏敏感值（SPEC） | telemetry/telemetry.mjs |
| 20 | P2 | `D5-3/D9-1/D9-10` | 工具全集 40→41 契约漂移（SPEC） | tools.mjs TOOL_DEFINITIONS 41 |
| 21 | 测试侧 | `D3-C4/EXP-C4-14/18` | DMS/DEW 聚合服务无单服务路由（改用例） | 用例设计映射缺失 |

> 根因详情、现象、唯一断言、证据路径均见 `FINDINGS.md`（file_issue.py 逐条解析）。

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链（.cmd/EINVAL 语义）为 Windows 专属，本机 Linux 无法执行 | Linux 侧已由展开级 EXP-NR3-10 通用断言覆盖（PASS），无需改用例 |
| `D3-S7` | 设计级 | P1 | NOT_RUN | 补环境 | 跨服务编排需真机创建 RDS 实例（单次 provisioning 10~20 分钟 + 按需计费），每日单轮时间窗口内无法安全建删归零 | 排独立补测轮执行；或改用例为「只读规划 + 模拟归零」验证编排顺序 |

> 其余 143 条均执行回填，无 BLOCKED。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（真云与探针全程未回显明文 AK/SK；D2-4/D4-26/D4-27 为「产品未脱敏」缺陷而非本机泄漏）
- [x] 写操作误判 read-only：`1 项缺陷（D4-5 Change* 误判为只读，已记根因）`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（真云探针日志已脱敏，credentials 文件由安全 hook 拦截读取）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（D3-S2 hdk1-s2-* / D4-14 hdk1-audit-*） | 是 | 已删 | ListVpcs 不再含本次 vpcId ✅ |
| OBS 桶（D3-C13 hdk1-s13-*） | 是 | 已删 | rm -r -f 归零 ✅ |
| FunctionGraph（D3-S6 hdk1-s6-* + TIMER 触发器） | 是 | 已删 | ListFunctions 不再含 ✅ |
| 沙箱会话（D3-S3） | 是 | close_session | 无计费资源残留 ✅ |
| 只读子账号（D4-13） | 否 | — | 写操作被拒零资源创建 ✅ |

> 真云只删本次创建资源（`hdk1-` 前缀 + 唯一时间戳）；删除前已盘点，未动既有/他人资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D1-68`（region 优先级）、`D8-9`（sanitizeValue）、`D5-3/D9-1/D9-10`（工具数 41）——建议维护方裁决并更新母版数字。
- 本轮未覆盖：`D3-S7`（RDS 跨服务编排真机）、`D1-39`（Windows 专属，Linux 由 NR3 覆盖）。
- 建议：① serviceCatalog ECS 关键词补「云主机」同义词（一处改动可同时修复 D3-S1/D10-3/EXP-E01 三项）；② policy.json writeOperationPrefixes 补 `Change`（同时修复 D4-4/D4-5 两项）；③ hooks Python 路径补写操作 deny 决策，对齐 Node（D4-8/D4-17/D4-25 三项）。