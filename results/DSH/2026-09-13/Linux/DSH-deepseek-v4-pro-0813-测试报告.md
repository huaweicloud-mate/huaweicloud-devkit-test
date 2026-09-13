# DSH-deepseek-v4-pro-0813 每日测试报告

| 字段 | 值 |
|------|-----|
| 客户端 | DSH |
| 模型 | deepseek-official/deepseek-v4-pro-0813 |
| 操作系统 | Linux (aarch64, Ubuntu) |
| 执行日期 | 2026-09-13（北京时间） |
| 被测版本 | huaweicloud-devkit@1.1.4-next.3（npm @next，gitHead 3b6290bc） |
| Node.js | v22.13.0 |
| Python | 3.12.3 |
| KooCLI (hcloud) | 7.2.12（已安装 + credentials 已配置） |
| 真云凭证 | ~/.config/huaweicloud/credentials.json（已配置，未用于写操作） |

---

## 1. 执行摘要

### 1.1 总体统计（设计级 163 条）

| 状态 | 数量 | 占比 |
|------|------|------|
| PASS | 39 | 23.9% |
| FAIL | 4 | 2.5% |
| BLOCKED | 22 | 13.5% |
| SPEC-MISMATCH | 0 | 0% |
| NOT_RUN | 98 | 60.1% |
| **合计** | **163** | **100%** |

### 1.2 按优先级统计（设计级）

| 优先级 | PASS | FAIL | BLOCKED | NOT_RUN | 合计 |
|--------|------|------|---------|---------|------|
| P0 | 10 | 3 | 5 | 0 | 18 |
| P1 | 20 | 1 | 17 | 58 | 96 |
| P2 | 9 | 0 | 0 | 40 | 49 |

### 1.3 关键结论

- **P0**：18 条全覆盖 —— 10 PASS（有证据）、3 FAIL（D4-2/D4-16/D4-23，均记根因）、5 BLOCKED（需真云/互动/Windows 专属）。无 NOT_RUN。
- **P0 安全核心**：凭证脱敏（D2-4）、凭证文件拦截（D4-1）、secret API 拦截（D4-3）、写操作判定（D4-5）、公开暴露/破坏性预检（D4-9）、hook 绕过（D4-15）、hook_check_artifacts（D4-21）、hook_check_deploy_plan（D4-22）**全部通过**。
- **本日新增 PASS / 状态修复**：
  - D4-15（hook 绕过）由历史 FAIL → **PASS**（大小写/URL 编码/参数拆分变体均被正确拦截）。
  - D1-46（缓存 TTL 边界）由历史 SPEC-MISMATCH → **PASS**（TTL 复用/过期重查/失败节流/异常恢复均按约定）。
- **本日 3 个 P0 缺陷**（根因见 FINDINGS.md）：D4-2 凭证 env 打印拦截缺口、D4-16 shell 包裹穿透、D4-23 全局规则未注入。

---

## 2. 缺陷清单（根因 + 证据，详见 FINDINGS.md）

| # | 用例 | 优先级 | 根因（文件:行） | 证据 |
|---|------|--------|------------------|------|
| 1 | D4-2 | P0 | safety-policy.mjs:334-343 env-dump 规则未覆盖 `HW_ACCESS_KEY/HW_SECRET_KEY` 及 `echo $VAR` | evidence/d4-security/stdout.log |
| 2 | D4-16 | P0 | safety-policy.mjs:67-87 仅剥离行首 hcloud，shell 包裹绕过写分类 | evidence/d4-security/stdout.log |
| 3 | D4-23 | P0 | rules/huawei-agent-rules.mdc 未入 npm files 白名单 + setup-cli 无注入逻辑 | evidence/dsh-install/stdout.log |
| 4 | D9-2 | P1 | mcp-protocol.mjs:95 unknown method 抛普通 Error，无 -32601 | evidence/d9-protocol/stdout.log |

---

## 3. 阻塞项（BLOCKED）

| 类别 | 用例 | 阻塞原因 |
|------|------|----------|
| Windows 专属 | D1-39, D5-6, D7-3 | 需 Windows 环境（EINVAL/文件锁/better-sqlite3） |
| 真实升级+重启 | D1-52 | 会替换当前安装版本，不在本机执行 |
| 真云三端/凭证 | D2-1, D2-8, D2-11, D2-21 | 需真云 AK/SK 写入/STS securityToken/轮换 |
| 真云 E2E | D3-C1~C5, D3-C7~C9 | 需真云资源创建→删除→归零（红线：不得留资源） |
| 沙箱 | D3-C3, D3-C6 | 需沙箱环境 |
| 互动确认流 | D4-18, D4-19, D4-20, D4-24 | 需互动客户端 + 真云写确认流 |
| 真实 Agent 评测 | D10-4 | 需真实 Agent 互动驱动 plan→审批 |

---

## 4. PASS 用例清单（39 条，按证据目录）

### evidence/cli-readonly（3）
D1-3（doctor 自检）、D1-4（status）、D1-6（install-hcloud）

### evidence/d1-upgrade（15）—— 升级检测链源码级
D1-26、D1-27、D1-28、D1-30、D1-31、D1-32、D1-33、D1-34、D1-35、D1-37、D1-40、D1-44、D1-46、D1-47、D1-53

### evidence/d4-security（12）—— P0 安全核心 + 凭证
D2-4、D4-1、D4-3、D4-4、D4-5、D4-6、D4-7、D4-9、D4-15、D4-17、D4-21、D4-22

### evidence/d9-protocol（5）—— MCP 协议 + 枚举
D5-3、D9-1、D9-3、D9-4、D9-8

### evidence/dsh-install（4）—— DSH 安装/清单/规则
D1-1（install --target dsh 闭环）、D5-1（清单发现加载）、D5-2（安装落点）、D8-7（7 个 meta 技能 7/7 可机械加载）

---

## 5. 展开级（137 条）

本次**未逐条展开执行**，`execution_status` 全部回填 `NOT_RUN`（避免虚报）。设计级已覆盖核心语义；展开级留待后续迭代。

---

## 6. 环境信息

- **doctor 自检**：10 pass / 1 fail（缺 `pip3 install mcp` —— Hermes MCP Python SDK，不影响 DSH）
- **auth status**：Credentials vault / OBS config / KooCLI 均已配置；DSH MCP 注册 = [OK]（本次 install 前为 MISSING）
- **hcloud**：7.2.12（已安装）
- **proxy**：无代理配置
- **skills**：29 个（6 meta `huaweicloud-*` + 1 `huawei-getting-started` + 22 服务 skill）

---

## 7. 资源清理声明

- 本次未创建任何真实云资源（真云 E2E 用例全部 BLOCKED 未执行），无需归零验。
- 本机仅新增/修改：`~/devkit-test/DSH/`（测试/源码仓库 clone + 结果）、`~/.dsh/huaweicloud-plugins/`（DSH install 产物）、`~/.dsh/skills/`（29 skills，install 产物）。无云资源、无凭据入库（evidence 仅记录脱敏后的决策字段，stdout.log 均掉入 gitignore 的 `*.log` 规则）。

---

*报告生成时间：2026-09-13（北京时间）*
*执行者：DSH（deepseek-official/deepseek-v4-pro-0813）*
