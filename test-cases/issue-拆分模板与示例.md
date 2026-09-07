# Issue 拆分模板与填写示例（§6.4 落地）

> **用途**：闭环工作流（测试→报告→修复提示词→issue→回归）的标准输入。
> **铁律**：以下示例均为**演示形态**，正式 issue 必须在真实测试执行后填写实际证据（回显/日志/截图/commit），禁止直接照抄示例内容冒充测试结果。
> 编号规则：issue 内引用用例 ID（Dx-y）与"依据"列，增强说服力。

---

## 模板（复制此骨架填写）

```markdown
## 缺陷描述
[P0/P1/P2] <维度> <一句话缺陷>

## 环境
- 客户端：<Hermes / OpenCode / ...>
- OS / Node：<Windows 11 / Ubuntu 24.04 / Node 22>
- 插件 commit：<git rev-parse HEAD 结果>

## 复现步骤
1. <步骤一>
2. <步骤二>

## 期望结果
<插件应表现的行为>（引用依据：【仓】safety-model.md 第X条 / 工具描述 / README 承诺）

## 实际结果
<实际行为 + 证据>

## P/G/I 标注
- [ ] P：插件承诺但失效（插件缺陷）
- [ ] G：插件缺失，自行解决（记录缺口）
- [ ] I：测试者擅自联想/猜测（测试违规，不计缺陷）

## 严重度
- [ ] P0：立即停测上报（凭证泄漏/误删/越权）
- [ ] P1：本周修复
- [ ] P2：排期或 backlog

## 建议修复方向（可选，供修复 Agent 消费）
<一句话指向可能根因>
```

---

## 示例 A：P1 功能缺陷（演示形态，待真实证据）

```markdown
## 缺陷描述
[P1] D3-B2 plan_cli_command 生成的 ECS 创建命令缺少 project_id 参数，导致人工审批后执行失败

## 环境
- 客户端：Hermes（deepseek 模型）
- OS / Node：Windows 11 / Node 22
- 插件 commit：<执行时 git rev-parse HEAD 填写>

## 复现步骤
1. 使用 prompt："在 cn-north-4 创建一台 2C4G Ubuntu 服务器"
2. 等待 Agent 调用 plan_cli_command 生成命令
3. 人工审查生成的 hcloud 命令

## 期望结果
命令包含完整 project_id 与 region 参数，审批后可直接执行（依据：safety-model 默认写路径"returns a command for review"，命令质量决定审批可行性）

## 实际结果
命令未携带 project_id，hcloud 需额外补参才能执行；表现为"引导半成品"，Agent 需自行联想补参（触发 I 类风险）

## P/G/I 标注
- [x] P：插件承诺但失效

## 严重度
- [x] P1：插件指引不完整导致无法完成目标云操作

## 建议修复方向
tools.mjs plan_cli_command 组装参数时从 auth 上下文自动注入 project_id/region；可复用 D2 凭证上下文
```

---

## 示例 B：P0 安全缺陷（演示形态，待真实证据）

```markdown
## 缺陷描述
[P0] D4-5 删除类写操作被插件误判为 read-only/allow，绕过审批门

## 环境
- 客户端：OpenCode
- OS / Node：Ubuntu 24.04 / Node 22
- 插件 commit：<执行时 git rev-parse HEAD 填写>

## 复现步骤
1. 输入：`hcloud ECS DeleteServer --server_id xxxx`
2. 调用 plan_cli_command 规划
3. 检查插件对该命令的安全判定

## 期望结果
该命令被标记为写操作并强制转审批门（依据：safety-model 第4条写动词清单明文包含 delete；nightly 铁律4 定义该失效模式为高危缺口）

## 实际结果
插件判定为 allow/read-only，命令可直接执行，未经过审批

## P/G/I 标注
- [x] P：插件承诺但失效（安全护栏穿透）

## 严重度
- [x] P0：写被误判只读并执行 → 立即停测，当日上报

## 建议修复方向
risk-rule-engine 的写动词清单是否漏配 DeleteServer 系列；核对 CloudWAF 拦截规则与 policy.json 的一致性（参考 D4-8 双路径对齐用例）
```

---

## 候选真实缺口线索（来自仓库既有技能，可先行验证再开 issue）

> 以下来自既有 nightly skill 记录的历史踩坑位，**属"待验证线索"而非已确认缺陷**——测试时优先回归，复现即开 issue。

| 线索 | 来源 | 关联用例 | 验证要点 |
|---|---|---|---|
| OBS 独立配置曾缺失（G14：obsutil 无法无人值守交互配置） | nightly 阶段1 第7步 | D2-6 | setup_obs_config 后 obsutil ls 是否直通 |
| Windows 上 npm test 被跳过（better-sqlite3） | ci.yml 注释 | D7-3 | Windows 手动跑 npm test 的失败面 |
| 国内镜像 npm 源下载异常 | README 中国镜像节 | D7-4 | 镜像源安装是否可用 |