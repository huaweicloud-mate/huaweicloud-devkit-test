> ✅ 已提交独立 issue #563（2026-09-09）

## 现象（1.1.2-next.4 基线实测）

全局安全规则文件 `rules/huawei-agent-rules.mdc`（1.1.2-next.4 由 `.md` 改 `.mdc`）存在且内容完整，但**无任何代码加载/注入机制**：

| 检查项 | 结果 |
|---|---|
| 文件存在性 | ✅ `plugins` 外根 `rules/huawei-agent-rules.mdc`（内容含 MUST 级约束：csms/kms 禁直连、禁建 long-term AK/SK、**MUST load the `huawei-dew` skill**、双语匹配等） |
| src 引用 | ❌ `plugins/huaweicloud-core/src/**` 0 处含 "agent-rules" |
| hooks 引用 | ❌ `plugins/huaweicloud-core/hooks/**` 0 处含 "agent-rules" |
| 全仓代码引用（mjs/py/json/js） | ❌ 0 处 |
| 安装分发 | ⚠️ 未发现 setup-cli 等安装脚本复制/注入该文件到 11 个客户端目标 |

- 基线：**1.1.2-next.4（608b120）**；与 1.1.1 的 `huawei-agent-rules.md`（P1-2 记录）一致——**孤儿文件状态延续，仅扩展名变化**
- 即：规则文件中的「MUST 级安全约束」（禁直连 csms/kms、禁建长期 AK/SK、密钥任务必先加载 huawei-dew skill、双语匹配）**从未被任何代码读取或注入任何 agent 上下文**

## 根因

- `huawei-agent-rules.**` 是静态文档，无 loader/injector
- 官方三层安全模型（skills teach → hooks block → MCP/CLI wrappers enforce）中的「teach」层依赖规则被注入 agent 上下文/系统提示，当前该注入**不存在** → 规则"存在但未生效"
- 11 个安装目标（claude/codex/cursor/hermes/workbuddy/openclaw/opencode/officeace/codeartsspace 等）均无该规则注入痕迹

## 影响

- Agent 在会话中拿不到 MUST 约束（如"密钥任务必须先加载 huawei-dew skill"、"禁直连 DEW/CSMS"）→ teach 层安全指引整体缺失
- 与 OBS-9/10/11（会话级写门禁缺口）叠加：既没有 teach 层约束，也没有足够 enforce 层门禁的客户端（WorkBuddy/DSH/OfficeAce）→ 最薄弱链路
- 需要区分：本报告是「注入缺失」；文件本身内容质量（含 MUST 项、双语）正常

## 修复建议

1. 实现规则注入器：安装时把 `huawei-agent-rules.mdc` 内容注入各客户端（agent 系统提示/SKILL 前置/LLM 上下文均可），至少覆盖 11 个安装目标
2. 或内置为 `huawei_getting_started/SKILL.md` 的强前置引用（agent 打开即加载）
3. `doctor`/`status` 增加规则注入状态检查（rules-injected 判定），验证闭环
4. 单测覆盖：`test/global-rules-inject.test.mjs`（注入后 agent 上下文含 MUST 关键字）

## 同族关联

- P1-2（ITER-001 记录"孤儿文件"——本报告为其在 1.1.2-next.4 的延续确认）
- OBS-12/13（同批规则引擎层盲区，已另提）