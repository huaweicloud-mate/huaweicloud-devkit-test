# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-18 05:32:14（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-09-18-124.70.78.131/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`，npm latest v1.1.5，gitHead e7ed6f66）
> **结论**：`PARTIAL`（有 P0/P1 缺陷，全部为历史 #673/#685/#650/#726 复现 + D9-9/D10-3 延续，本轮无新增产品缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | CodeArtsAgent（CodeArts CLI）+ deepseek-v4-pro-0813 |
| OS / 架构 | Linux (aarch64) |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | v1.1.5（npm latest 正式版，gitHead e7ed6f66） |
| 工具全集 | 40（tools.mjs TOOL_DEFINITIONS）；源码 spawn 实测 40；CodeArts 框架 MCP 实际暴露 37 |
| hcloud / 依赖 | hcloud 7.2.12（check_cli installed+authenticated，真云 AK/SK 可用） |
| 测试类型 | 源码级 node 直调 + spawn mcp-server 黑盒 + 框架 MCP tool_search + CLI 真机 + 真云 E2E |
| 设计真源 | 设计级 80（daily 精选全量下发）/ 展开级 39（预筛后） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + spawn mcp-server.mjs 驱动 JSON-RPC；CLI 真机（install/doctor/status/uninstall/auth sync/install-hcloud）隔离 HOME 执行；真云 E2E（OBS 建删归零 + 只读子账号 VPC + CTS 审计）真机执行。证据统一落 `evidence/<case-id>/` + `evidence/_probes/*.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 119（设计级 80 + 展开级 39） |
| 已执行（非 BLOCKED） | 112 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 86 / 22 / 7 / 4 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 76.8%（86/112） |
| P0 / P1 / P2 新增缺陷 | 0（全为历史 #673/#685/#650/#726 复现 + D9-9/D10-3 延续） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 本轮新增真云写资源：OBS 桶（建→删归零）+ 只读子账号 VPC（建→已删归零），无残留 |

---

## 三、状态汇总

### 3.1 设计级（80）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 60 | 含真云 OBS 建删归零、CTS 审计、D2-26 备份恢复（新增） |
| FAIL | 11 | 全部历史复现（#673/#685/#650/#726）+ D9-2/D10-3 延续 |
| BLOCKED | 6 | D1-2（多客户端共存）/ D1-39（Windows 专属） / D4-13（只读子账号权限过宽）/ D7-4（国内镜像）/ D9-6（跨客户端）/ D10-4（LLM harness） |
| SPEC-MISMATCH | 3 | D5-3、D9-1（工具枚举 40 vs 37）、D9-9（超时/取消未声明） |
| NOT_RUN | 0 | 无 |
| **合计** | **80** | |

### 3.2 展开级（39）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 26 | EXP-C4-01~22 服务矩阵 + EXP-D5-3-1 + 评测 HIT 3 条（E06/E09/E15） |
| FAIL | 11 | 评测集中文意图 MISS 11 条（D10-3 同源） |
| BLOCKED | 1 | EXP-E08（explain_error 诊断路由需 LLM harness） |
| SPEC-MISMATCH | 1 | EXP-D5-3-3（工具枚举 37 vs 40） |
| NOT_RUN | 0 | 无 |
| **合计** | **39** | |

---

## 四、缺陷清单（历史复现）

> 本轮无新增产品缺陷。11 条设计级 FAIL + 11 条展开级 FAIL + 4 条 SPEC，全部为历史 issue 复现或延续，见 FINDINGS.md。

| # | 级别 | 用例ID | 缺陷 | 关联历史单 |
|---|---|---|---|---|
| 1 | P0 | D4-2 | 凭证 env 打印拦截（hook 层 HW_ 缺覆盖） | #673 |
| 2 | P0 | D4-5 | framework Apply* 写误判（运行时 policy 缺 Apply） | #685 |
| 3 | P0 | D4-15 | hook ANSI-C 编码绕过 | #673 |
| 4 | P0 | D4-23 | 全局规则 huawei-agent-rules.mdc 孤儿未注入 | #673 |
| 5 | P0 | D8-7 | meta 技能指引 check_update/upgrade 断链 | #673 |
| 6 | P1 | D1-26/D5-3/D9-1 | 工具暴露漂移 40 vs 37 | #673 |
| 7 | P1 | D4-6 | adminPass 明文无告警 | #673 |
| 8 | P1 | D4-17 | hook 模糊 fail-open | #673 |
| 9 | P1 | D9-2 | JSON-RPC unknown tool -32603 未区分 -32602（-32601 已修） | #650 延续 |
| 10 | P1 | D9-9 | tools/call 超时/取消未声明（SPEC-MISMATCH） | 延续 |
| 11 | P1 | D10-3 | serviceCatalog 中文路由 MISS 21.4% | 上一轮 #11 延续 |
| 12 | P1 | D4-27 | redactSecrets 双路径脱敏缺裸 token 关键字 | #726 |

---

## 五、未执行用例与原因（BLOCKED 真·外部依赖 + 环境）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-2 | 设计级 | P2 | BLOCKED | 补环境 | 多客户端共存 auto-detect 安装环境缺失；不带 --target install 会触及 DSH/Hermes 等其他客户端目录（目录权限红线），本客户端专属目录仅 CodeArtsAgent | — |
| D1-39 | 设计级 | P0 | BLOCKED | 调归属 | Windows 专属（EINVAL/文件锁），Linux 由 NR3 终端矩阵展开级覆盖 | OS 列已标注「专属」，豁免 |
| D4-13 | 设计级 | P1 | BLOCKED | 补环境 | 只读子账号 test001 只读 API 100% 可用，但 CreateVpc 写操作成功（未被 IAM 拒绝）；已真机执行并归零删除。需维护者核查 readonly 组权限 | — |
| D7-4 | 设计级 | P2 | BLOCKED | 补环境 | 国内镜像源（GitCode/npm 华为云镜像）网络环境缺失 | — |
| D9-6 | 设计级 | P1 | BLOCKED | 补环境 | 真实多客户端并存互通冒烟环境缺失（协议层 clientInfo 互通已 PASS） | — |
| D10-4 | 设计级 | P0 | BLOCKED | 补环境 | 真实 Agent 高危请求行为评测需 LLM harness（ITER-004+ 待建），run-eval.mjs serviceCatalog 路由层无法代理安全干预层 | 建 LLM harness |
| EXP-E08 | 展开级 | P1 | BLOCKED | 补环境 | explain_error 诊断路由需真实 Agent 会话理解（LLM harness） | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0
- [x] 写操作误判 read-only：framework 层 1 处（D4-5 Apply*，复现 #685，源码 policy.json 已含 Apply 33 项，框架运行时滞后 32 项）
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：D4-2 show_profile_redacted 无原始凭证落盘；D4-27 裸 token= 未脱敏已记 #726（对象路径安全关键字无残留）
- [x] 真云资源红线：OBS 桶 + 只读子账号 VPC 均测后删除归零

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| OBS 桶（testbot3-hermes-obs-*） | 是 | 已删 | Delete bucket successfully |
| 只读子账号 VPC（tctest-d4-13-ro-*） | 是 | 已删 | ListVpcs 无残留（仅剩他人非本次 VPC） |
| 隔离 HOME 临时目录 | 是（探针用） | 已 rm | 无残留 |

## 八、遗留与建议

- 本轮新增用例 D2-26（backup/restore）PASS；D4-27（redactSecrets 双路径）FAIL（裸 token 关键字未脱敏，复现 #726）。
- 本轮解阻塞 2 项：D1-6（install-hcloud 真机安装 KooCLI 7.2.12 成功）、D4-12（供应链 postinstall 无恶意 + 版本一致 + npm sbom CycloneDX 1.5 可产），均已标 PASS。
- v1.1.5 修复验证：①D4-2 safety-policy 层 HW_ 已拦截（classifyTextCommand deny），但 hook 层 cloud-risk-rules.json 仍缺 HW_（分层修复不完整）；②D4-16 shell-wrap hook 层已有效（bash -c/sudo 内层 DeleteServer warn/deny）；③D9-2 -32601 已修、-32602 未修。
- 建议：cloud-risk-rules.json env-dump 规则补 HW_ 前缀；框架运行时 policy.json + MCP 暴露集同步源码（40 工具/33 项 Apply 前缀）；tools.mjs routeMap 补全 CJK 中文关键词；safety-policy.mjs redactString 补裸 token 关键字（#726）。
