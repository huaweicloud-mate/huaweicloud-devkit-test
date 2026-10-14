# Hermes-DeepSeek-V4-Pro v1.1.8 版本全量测试报告

> **报告名**：`Hermes-DeepSeek-V4-Pro-v1.1.8-测试报告.md`
> **生成时间**：2026-10-14 15:45:00（北京时间）
> **执行归档**：`results/Hermes/2026-10-14-120.46.222.180/Linux/`
> **被测对象**：huaweicloud-devkit v1.1.8（npm 正式版，gitHead `74f519d`）
> **测试类型**：版本全量测试（母版全量 316 设计级用例 → 预筛后 269 执行项）
> **结论**：`不建议放行`（P0 遗留 2 项历史未闭环 + P1 遗留多项历史，见缺陷清单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + DeepSeek-V4-Pro |
| OS / 架构 | Linux（6.8.0-106-generic，x86_64） |
| Node / npm / Python | Node v22.13.0 / npm 10 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.8`（npm latest，gitHead `74f519dc3a56`） |
| 工具全集 | 42（tools.mjs TOOL_DEFINITIONS） |
| hcloud / 依赖 | KooCLI 7.2.12 |
| 真云凭证 | cn-north-4（AK/SK 已配置 hw018619646 + 只读子账号 test001） |
| 设计真源 | 设计级 212 / 展开级 137（预筛 Hermes+Linux → 57） |
| 执行项合计 | 269（设计级 212 + 展开级 57） |

## 二、执行摘要（三层证据口径）

**本项目不混报单一通过率，按证据来源分三层口径**：

| 证据层 | 用例数 | 说明 |
|---|---|---|
| ① 真实执行（真机/真云/协议实测） | 118 | 真云 E2E（D3-C1/C2/C3/C6/B7/B8）、sandbox 7 隐式工具、MCP 协议探针（D9-1~13）、评测 harness（D10-3 + EXP-E01~15）、CLI 真机命令、压测冒烟 |
| ② 源码核对（直调函数/静态断言） | 132 | update-check/setup-cli/auth/safety-policy/telemetry/serviceCatalog/risk-rule-engine 等函数直调 + 文件/配置静态核对 |
| ③ 未执行（BLOCKED/NOT_RUN） | 19 | BLOCKED 13（破坏性 install/upgrade 需隔离 HOME/可控 registry、需真实 LLM 会话/沙箱隧道等）+ NOT_RUN 6（OpenClaw/Windows 专属等 OS/客户端不适用） |

### 状态汇总

| 状态 | 数量 | 占比（/269） |
|---|---|---|
| PASS | 228 | 84.8% |
| FAIL | 20 | 7.4% |
| SPEC-MISMATCH | 2 | 0.7% |
| BLOCKED | 13 | 4.8% |
| NOT_RUN | 6 | 2.2% |
| **合计** | **269** | |

- **通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN）**：228 / 250 = **91.2%**
- P0 新增缺陷：0（P0 用例 D9-12/D2-4 缺陷均为历史问题，本案未新增 P0）
- 新增缺陷：1（D1-60 HTTP 查询超时收敛，已提单 #911）
- 历史问题关联：11 项（见 HISTORY_LINKS.md，不在本版本重复开单）

## 三、缺陷清单（详见 FINDINGS.md）

| 序号 | 级别 | 用例 | 标题 | 状态 |
|---|---|---|---|---|
| 1 | P0 | D9-12 | initialize 握手协议安全基线（tools/list 无 initialize 前置） | 历史 #683/#674/… |
| 2 | P0 | D2-4/D4-26 | 凭证脱敏缺口（redactString 大小写敏感，小写 ak/sk 与 --password 明文） | 历史 #809/#791/… |
| 3 | P1 | D4-4 | Change* 高危写操作判 allow isWrite=undefined | 历史 #671 |
| 4 | P1 | D9-2 | JSON-RPC invalid params 未返回 -32602 | 历史 |
| 5 | P1 | D10-3/EXP-E01/D3-S1/D3-S5 | serviceCatalog 中文意图路由 MISS（92.9%） | 历史 #852/#845 |
| 6 | P1 | D3-C1 | 真云异步资源删除归零不可靠（ECS/VPC 泄漏） | 历史 |
| 7 | P1 | D9-9 | capabilities.cancellation 未声明（SPEC-MISMATCH） | 历史 |
| 8 | P1 | D3-C7 | 不存在资源精确错误码缺失 | 历史 |
| 9 | P2 | D4-25 | Python hook 写操作正则漏匹配 + 遥测路径错位 | 历史 |
| 10 | P2 | D1-65/D1-66 | DEBUG=1 / TELEMETRY=off 环境变量契约漂移 | 历史 #868/#844 |
| 11 | P2 | D8-9 | telemetry sanitizeValue 未脱敏（SPEC-MISMATCH） | 历史 |
| 12 | P2 | D1-60 | HTTP 查询路径慢响应超时未按边界收敛 | **新增 #911** |

> 其余 FAIL 为【非产品缺陷】：D1-68/D3-C14（探针凭证注入缺失，测试侧）、D3-C2（OBS 建桶检测正则误报，桶已归零）、D3-C3（deploy_nginx 返回体字段不一致但 nginx 已 serving）、D3-S3（沙箱端口 8080-8089 占满，环境）。

## 四、未执行用例与原因（BLOCKED/NOT_RUN 逐条）

**BLOCKED（13，均写 blockedReason 四要素）**：
- 【补环境】D1-9 重启生效语义 / D1-52 真实升级 / D1-54 Hermes 会话用户闭环 / D1-56 安装中断恢复 / D1-57 坏版本回滚 / D1-10/11/12 卸载清理链 / D1-14 损坏安装包：均需一次性隔离 HOME 或可控 registry 或真实可交互 LLM 会话，且会破坏本机 1.1.8 活安装。
- 【补环境】D1-71 sandbox_expose_tunnel（需已连接沙箱 + nginx 已部署）、D1-72 competition_voucher_claim（需用户明确要求+已报名账号）、D2-21 IAM 凭证轮换（会轮换真实 AK/SK）、D10-9 LLM 会话层安全干预（Hermes 无 dsh/CDP）。

**NOT_RUN（6，均写原因）**：
- 【调归属】D1-7 OpenClaw 插件流（OpenClaw 专属）、D1-39 Windows 升级链（OS 专属）、D1-13 Windows 文件锁清理（OS 专属）、D3-S7 跨服务交付场景（需 RDS+Web 真实交付，未展开）。
- 【调归属】其余为终端覆盖类型/展开规则代表段不适用 Hermes-Linux 的设计级用例。

## 五、安全 / 红线

- 真云 E2E 已真机执行：D3-C1（ECS+VPC+subnet 全链路创建）、D3-C2（OBS 静态站）、D3-C3（沙箱部署）、D3-C6（沙箱 7 隐式工具）、D3-B7（审批闭环）、D3-B8（voucher_status 读取）。
- **D3-C1 泄漏已人工补救归零**：实测 ECS e79d4b3e… / VPC f359605f… / subnet f295dc3f… 残留（自动化 finally 未确认异步删除完成），已二次 DeleteServers+DeleteSubnet+DeleteVpc 归零（ECS count=0、VPC/subnet 已删）。
- 安全脱敏：确认 redactString 对「对象路径」正常、对「字符串路径」大写 AK/SK 与 access_key 正常，但对小写 ak/sk、`--password <值>` CLI 形态漏脱敏（历史问题 #809/#791）。

## 六、资源释放

- 本次创建：ECS×1、VPC×1、subnet×1、OBS 桶×1、沙箱会话×N。
- 归零验证：ECS count=0、VPC/testbot3-hermes-e2e-1959866333 已删、subnet 已删、OBS 桶已删（`hcloud OBS ls` 无 testbot3-hermes）、沙箱会话已 close。
- 说明：账号下仍残留历史运行泄漏的若干 testbot3/testbot1 前缀 VPC/subnet（非本次创建，见 D3-C1 缺陷根因），已如实记录于报告但按「只删本次创建」原则未越权删除。

## 七、遗留建议

1. P0/P1 历史缺陷（协议安全基线、脱敏缺口、写操作审批门、中文路由）已跨 4 个版本持续命中（#652→#844→#911 一路），建议列入 v1.1.9 修复排期并做回归闭环。
2. 真云 E2E 清理逻辑（`scripts/realcloud_e2e.mjs` finally 归零）需改为「异步删除后强轮询 + 确认子资源删净再删父资源」，根治 ECS/VPC 泄漏。
3. D1/D2/D8 环境变量契约（DEBUG/TELEMETRY/SKIP_* 系列的 1/true、off 语义）需统一布尔解析，消除字面量 `=== 'true'` 漂移。
4. D9-9（cancellation）与 D9-2（-32602）、D9-12（-32600）三项协议语义建议一并在 mcp-protocol.mjs 收敛。