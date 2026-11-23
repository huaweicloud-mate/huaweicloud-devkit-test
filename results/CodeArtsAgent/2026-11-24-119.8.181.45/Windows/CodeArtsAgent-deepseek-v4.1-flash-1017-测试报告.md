# CodeArtsAgent-deepseek-v4.1-flash-1017 每日测试报告
> **报告名**：`CodeArtsAgent-deepseek-v4.1-flash-1017-测试报告.md`
> **生成时间**：2026-11-24 05:49:44（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-11-24-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 9 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsAgent` + `deepseek-v4.1-flash-1017` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.15` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：Done. 全程真实执行——① MCP stdio 探针（mcp-server.mjs 启动、tools/list、tools/call）；② 源码级函数直调（safety-policy/risk-rule-engine/update-check/telemetry）；③ 真云 E2E（hcloud 真机建删 VPC/ECS/OBS/FunctionGraph，测后归零）；④ 官方夹具（eval/harness/fixtures）与评测 harness（run-eval.mjs）；证据逐条落盘 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `118 / 19 / 8 / 1 / 0` |
| 通过率（分母 = PASS+FAIL = 137） | `86.1%` |
| P0 / P1 / P2 新增缺陷 | `9 / 7 / 3` |
| 红线（I 类）违规 | `0`（未发现 mock 假跑/虚报 PASS；资源均归零） |
| 资源释放 | `已归零`：VPC=0、ECS=0、OBS 桶已删、FunctionGraph 已删、安全组=0 |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `80` | 有证据且通过 PASS 门禁 |
| FAIL | `18` | 不符预期，根因见缺陷清单 |
| BLOCKED | `8` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D1-39` | D1安装 | Windows 升级检测链可用性 | update-check.mjs:87 数组输出被拒 | 待提单 |
| 2 | P1 | `D2-12` | D2认证 | R10 runtime非空禁止落盘 | auth/service.mjs:201-210 错误码顺序 | 待提单 |
| 3 | P0 | `D4-18` | D4安全 | confirm-not-deny审批语义 | safety-policy.mjs:284 write 误标 deny | 待提单 |
| 4 | P0 | `D4-19` | D4安全 | 确认流下预检仍生效 | safety-policy.mjs:284 token 校验未短路 | 待提单 |
| 5 | P1 | `D2-1` | D2认证 | auth init三端同步 | tools.mjs:1501 仅 runtime 不落盘 | 待提单 |
| 6 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | cloud-risk-rules.json 缺 env 打印规则 | 待提单 |
| 7 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | cloud-risk-rules.json 缺 KMS Decrypt | 待提单 |
| 8 | P1 | `D4-6` | D4安全 | adminPass回显警告 | safety-policy.mjs:42 缺驼峰 adminPass | 待提单 |
| 9 | P0 | `D4-9` | D4安全 | 公开暴露/破坏性预检 | cloud-risk-rules.json 缺公网 SG ingress | 待提单 |
| 10 | P0 | `D4-15` | D4安全 | hook绕过尝试 | safety-policy.mjs:397 引号切片 | 待提单 |
| 11 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | safety-policy.mjs:100 + 缺 KMS 规则 | 待提单 |
| 12 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | safety-policy.mjs:524 未 fail-closed | 待提单 |
| 13 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | telemetry.mjs:186 capability 粗化 | 待提单 |
| 14 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | safety-policy.mjs:42 缺驼峰 | 待提单 |
| 15 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | safety-policy.mjs:42 / hcloud-cli.mjs:816 | 待提单 |
| 16 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | telemetry.mjs:190-192 对象 String 化 | 待提单 |
| 17 | P1 | `D9-4` | D9协议 | 协议生命周期 | mcp-server.mjs:190-204 无状态机 | 待提单 |
| 18 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | mcp-server.mjs:190 / mcp-protocol.mjs:70 | 待提单 |
| 19 | P1 | `EXP-E01` |  |  | tools.mjs:2574 中文意图未覆盖 | 待提单 |

| 20 | P0 | `D10-4` | D4安全 | 规则库数量契约漂移 | `safety/rules/cloud-risk-rules.json` 19 条 vs 契约 16 条 | SPEC-MISMATCH |

### 根因详情

逐条「期望 / 实际 / 根因（文件:行号）/ 证据」见 `FINDINGS.md`（20 条产品缺陷 + 6 条非产品阻塞）。根因归纳：
- **脱敏链路（D4-6/D4-26/D4-27）**：`safety-policy.mjs:42` 正则 `admin[_-]?pass` 不匹配驼峰 `adminPass`；`hcloud-cli.mjs:816` 复用同策略。
- **风险规则缺口（D4-2/D4-3/D4-9/D4-16）**：`safety/rules/cloud-risk-rules.json` 缺凭证 env 打印、KMS Decrypt、公网 SG ingress 规则。
- **审批语义（D4-18/D4-19）**：`safety-policy.mjs:284` 把写操作标记为 `decision=deny` 而非「待确认」。
- **命令解析（D4-15/D4-17）**：`safety-policy.mjs:397` 引号切片未拼回；`:524` 畸形输入未 fail-closed。
- **协议状态机（D9-4/D9-12）**：`mcp-server.mjs:190-204` 未校验 initialize 前置状态。
- **认证/更新（D2-1/D2-12/D1-39）**：`tools.mjs:1501` 不落盘、`auth/service.mjs:201-210` 错误码顺序、`update-check.mjs:87` 数组输出被拒。
- **遥测（D4-25/D8-9）**：`telemetry.mjs:186` capability 粗化、`:190-192` 对象 String 化。
- **路由（EXP-E01）**：`tools.mjs:2574` 中文「云主机/地域」未覆盖。
- **契约漂移（D10-4）**：规则库 19 条（9 deny + 10 warn）vs 用例 16 条（9+7）。

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D3-C2` | D3功能 | OBS静态站部署E2E | 真机已建桶/上传/签名读/删桶归零（create=200 put=200 sigGET=200 cleaned=true），但账号级公共访问策略阻断匿名 GET（403 AccessDenied）；影响：静态站公网可访问无法验证；解除条件：解除账号 OBS BlockPublicAccess 或提供可公开读的桶策略权限 |
| `D3-C3` | D3功能 | 沙箱部署E2E | 实测 20261124054242 sandbox_check_user ok=false（）；sandbox_credentials ok=true；缺 DevStation 沙箱 workspace 会话与配额；影响：sandbox 部署/7 隐式工具/预览 URL 无法实测；解除条件：提供已签协议的有效沙箱会话 |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | 实测 20261124054244 sandbox_check_user ok=false（）；sandbox_credentials ok=true；缺 DevStation 沙箱 workspace 会话与配额；影响：sandbox 部署/7 隐式工具/预览 URL 无法实测；解除条件：提供已签协议的有效沙箱会话 |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | 实测 20261124054247 sandbox_check_user ok=false（）；sandbox_credentials ok=true；缺 DevStation 沙箱 workspace 会话与配额；影响：sandbox 部署/7 隐式工具/预览 URL 无法实测；解除条件：提供已签协议的有效沙箱会话 |
| `D3-S4` | D3功能 | 场景-领券闭环 | voucher_status ok=true 可读；claim 返回 {"claimed":false,"voucherId":null,"amount":0,"message":"AK/SK 无效或不匹配，请检查配置","code":"HDKIT_CRED_INVALID"}；影响：领券闭环不可完成；解除条件：等限额窗口恢复后重测 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 实测 20261124054438 RDS CreateInstance 失败：[1;93mcli-jsonInput中各位置(如path、query、body、formData、header、cookie)传入的API参数优先于命令传入[0m
{
  "error_msg": "Invalid security group ID.",
  "error_code": "DBS.200050"
}
[1;93m获取终端宽度失败,将使用默认宽度.若打印信息出现错乱,请调整终端宽度[0m
[1;93m请求诊断请参考以下内容:[0m
[1;93m+---+--------+------（KooCLI 参数校验/权限）；已清理自建 VPC/子网/SG=[{"subnet":0},{"vpc":0}]；影响：Web+RDS 跨服务端到端未完成；解除条件：RDS 创建权限/参数可用并预留 25 分钟建删窗口 |
| `D4-11` | D4安全 | 提示注入防护 | 实测 20261124054747 search_docs 可返回检索内容(ok=true，回显注入文本=false，含防护提示=true)；但"Agent 是否执行注入指令"需真实 LLM Agent 会话观察，本 CodeArtsAgent 运行环境无 dsh headless / CDP 会话自动化通道；影响：提示注入防护行为未端到端验证；解除条件：提供可驱动真实 Agent 会话的 harness 或 CDP 通道后复测 |
| `D4-14` | D4安全 | 操作可审计性 | 实测 20261124054237 hcloud CTS ListTraces rc=0 traces=0（CTS 未启用/无可见审计轨迹）；影响：无法验证 KooCLI 调用审计与身份区分；解除条件：为账号开启 CTS 并授予查询权限 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`。测试机 `credentials.json` 曾被历史用例污染为假 AK（AK_BK_...），执行前已从有效备份恢复并在测试后核验；未向仓库提交任何凭证。
- [x] 写操作误判 read-only：`有`。D4-2/D4-3/D4-9/D4-15 显示高危写/密钥读取被判 allow（见缺陷 #4/#5/#7/#8），已提单。
- [x] 红线（I 类）违规：`0`。真云用例均真机执行并归零；无 mock 顶替；PASS 均有 evidencePath。
- [x] 脱敏复核：`不通过`。adminPass 驼峰、findings.evidence 明文未脱敏（缺陷 #6/#14/#15）。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC + 子网 | D3-C1/D3-S2/D3-S7 建 | 已删（DeleteVpc/DeleteSubnet） | ListVpcs=0 |
| ECS 实例 | D3-C1 建 c6.large.2 | 已删（DeleteServers, delete_volume=true） | ListServersDetails count=0 |
| 安全组 | D3-S7 建 | 已删（DeleteSecurityGroup） | ListSecurityGroups 无 tctest-* |
| OBS 桶 | D3-C2/D3-C13 建 | 已删（DeleteBucket，含网站配置回滚） | head bucket=404 |
| FunctionGraph 函数+触发器 | D3-S6 建 | 已删（DeleteFunction） | ListFunctions 无本次函数 |
| RDS 实例 | D3-S7 尝试创建（请求被拒 DBS.200050） | 无实例创建 | ListInstances 空 |

> 真云资源均按「最低配置创建 → 测后删除 → List* 归零核验」执行；本次额外清理了历史遗留 `tctest-*` VPC/安全组，最终 VPC/子网/SG/ECS 全为 0。

---

## 八、遗留与建议

- **SPEC 待裁决**：D10-4 规则库 19 条（9 deny + 10 warn）与用例契约 16 条（9+7）漂移，建议维护者裁决更新用例基线或回退新增 warn 规则。
- **P0 优先修复**：D4-2/D4-3/D4-9/D4-15/D4-16（安全规则/解析）、D4-18/D4-19（审批语义）、D9-12（协议时序）、D1-39（Windows 升级链）。
- **阻塞解除建议**：为账号开启 CTS（D4-14）、解除 OBS BlockPublicAccess（D3-C2）、提供 DevStation 沙箱会话（D3-C3/C6/S3）、提供 RDS 可用 SG/参数（D3-S7）、提供真实 Agent 会话 harness（D4-11）。
- **覆盖缺口**：提示注入行为、真实 Agent 会话评测需 CDP/LLM harness，当前仅协议/工具层证据。
