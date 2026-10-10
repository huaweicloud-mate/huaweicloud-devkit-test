# AI 驱动的测试编排架构设计

---

## 核心原则：三层生成模型

Test Manager **不生成**完整测试用例。采用分层生成，各司其职：

```
┌──────────────────────────────────────────────────────────────────┐
│  Layer 1: 测试策略 (Strategy)                                     │
│  生成者: Test Manager Agent                                      │
│  输出:   影响域分析 + 风险定级 + 测试范围 + 优先级                │
│  粒度:   粗 — "safety-policy 有变更，安全回归必测"               │
└────────────────────────────────┬─────────────────────────────────┘
                                 │ 传递给调度器
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│  Layer 2: 测试使命 (Mission)                                      │
│  生成者: Test Manager Agent (调度器)                              │
│  输出:   每个 Worker 的任务描述 (scope + constraints + criteria) │
│  粒度:   中 — "测 sandbox_connect 在各种认证状态下的行为"        │
└────────────────────────────────┬─────────────────────────────────┘
                                 │ 分发给 Worker
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│  Layer 3: 测试用例 (Case)                                         │
│  生成者: Worker Agent (自主展开)                                  │
│  输出:   具体步骤 + 输入数据 + 预期结果                           │
│  粒度:   细 — "step1: 调 sandbox_check_user → mock未实名 → 验证异常"│
│               "step2: 调 sandbox_sign_agreement → 验证返回200"   │
│               "step3: 调 sandbox_connect → 验证返回 sessionId"   │
└──────────────────────────────────────────────────────────────────┘
```

**优势:**
- Test Manager 不成为瓶颈 — 只做决策不写细节
- Worker 有领域上下文 — 安全 Worker 知道攻击面，自行设计攻击用例
- 并行效率最大化 — 5 个 Worker 各自生成+执行用例
- 每个 Worker 的用例可针对此环境自适应（如 Win 下生成路径分隔符测试）

---

## 一、架构总览

```
┌──────────────────────────────────────────────────────────────────┐
│                    AI Test Manager (Agent)                       │
│                                                                  │
│  ┌──────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │  决策引擎          │  │  任务调度器     │  │  质量分析器     │   │
│  │  LLM-based       │  │  Mission       │  │  语义断言       │   │
│  │  输出: 策略+使命  │  │  Dispatcher    │  │  差异分类       │   │
│  └────────┬─────────┘  └───────┬────────┘  └───────┬────────┘   │
│           │                    │                    │            │
│           │  test-strategy.md  │  missions/*.yaml   │  reports   │
└───────────┼────────────────────┼────────────────────┼────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                     测试执行层 (Worker Agents)                      │
│                                                                  │
│  ┌──────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │  Worker A        │  │  Worker B      │  │  Worker C      │   │
│  │  场景测试 Agent   │  │  安全测试 Agent │  │  回归测试 Agent │   │
│  │                  │  │                │  │                │   │
│  │  收到 Mission →  │  │  收到 Mission→ │  │  收到 Mission→ │   │
│  │  自主展开用例 →  │  │  自主展开用例→ │  │  展开录制回放→ │   │
│  │  执行 → 上报结果  │  │  执行 → 上报结果│  │  执行 → 上报结果│   │
│  └──────────────────┘  └────────────────┘  └────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                     数据层                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │ 场景仓库  │ │ 录制基线  │ │ 测试报告  │ │ 质量指标时序库   │    │
│  │ YAML/JSON│ │ JSONL    │ │ Markdown │ │ InfluxDB-like   │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 二、核心组件设计

### 2.1 AI Test Manager Agent

**定位：** 整个测试流程的"测试主管" — 负责定策略、分任务、判结果，不做执行细节

**输入：**
- `test-panorama.yaml` — 测试全景计划（分层定义、场景库）
- `test-results/` — 各 Worker 返回的历史 & 当前结果
- Git diff / changelog — 版本变更内容
- `recordings/` — 基线录制数据

**输出（分两层）：**

| 输出 | 格式 | 说明 |
|------|------|------|
| 测试策略 | `test-strategy.yaml` | 影响域、风险等级、测试范围、关注点 |
| 测试使命清单 | `missions/*.yaml` | 每个 Worker 的任务描述（Scope + Constraints + Criteria）|

**关键约束：Test Manager 不生成具体的测试用例步骤。** 用例由 Worker Agent 根据 Mission 自主展开。以此确保：
- Test Manager 不被细节淹没
- Worker 在其领域内做最合适的用例设计
- 各 Worker 可并发展开+执行，无瓶颈

#### MCP Tool 定义

```typescript
// 注册为 MCP Server，供主 Agent 调用
{
  name: 'tm_plan_test_run',
  description: '根据版本变更和测试计划，生成本次测试任务清单',
  inputSchema: {
    type: 'object',
    required: ['version', 'changeScope'],
    properties: {
      version: { type: 'string' },
      changeScope: { 
        type: 'object',
        properties: {
          changedFiles: { type: 'array', items: { type: 'string' } },
          changedTools: { type: 'array', items: { type: 'string' } },
          riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] }
        }
      },
      previousResults: { type: 'string' }
    }
  }
}

{
  name: 'tm_analyze_result',
  description: '对测试结果进行语义分析，给出 Pass/Fail/NeedReview 决策',
  inputSchema: {
    type: 'object',
    required: ['taskId', 'actualOutput', 'expectedBehaviors'],
    properties: { /* ... */ }
  }
}

{
  name: 'tm_generate_report',
  description: '生成结构化测试报告',
  inputSchema: {
    type: 'object',
    required: ['runId', 'tasks'],
    properties: { /* ... */ }
  }
}

{
  name: 'tm_update_baseline',
  description: '在人工确认后，更新录制基线',
  inputSchema: {
    type: 'object',
    required: ['scenarioId', 'newRecording'],
    properties: { /* ... */ }
  }
}

{
  name: 'tm_query_quality_trend',
  description: '查询质量指标趋势',
  inputSchema: {
    type: 'object',
    properties: {
      metric: { type: 'string' },
      from: { type: 'string' },
      to: { type: 'string' }
    }
  }
}
```

### 2.2 决策引擎（LLM-based）

```
┌───────────────────────────────────────────────┐
│              决策引擎                              │
│                                                   │
│  输入: test-panorama + changeScope               │
│                                                   │
│  Step 1: 影响域分析                                │
│  └─ "变更涉及 sandbox/session-manager.mjs"        │
│     → 影响 Layer 3 沙箱集成测试 + E2E-04~E2E-07  │
│                                                   │
│  Step 2: 风险定级                                  │
│  └─ "变更 safety-policy.mjs" → 高安全风险         │
│     → 全量安全测试回归                             │
│                                                   │
│  Step 3: 策略输出                                  │
│  └─ 输出 test-strategy.yaml                       │
│     ├─ 影响模块列表 + 风险等级                    │
│     ├─ 建议测试范围 + 可跳过项                    │
│     └─ 关键关注点 + 风险提示                      │
│                                                   │
│  Step 4: 使命生成                                  │
│  └─ 输出 missions/*.yaml (每个 Worker 一个)       │
│     ├─ Mission-001: 安全策略验证                  │
│     │  scope: 凭证脱敏 + 命令分类 + 写拦截        │
│     │  constraints: 仅本地Mock, 不用真实hcloud    │
│     │  criteria: 所有输出无raw AK/SK              │
│     ├─ Mission-002: 沙箱部署流程                   │
│     │  scope: sandbox_connect→exec→deploy_nginx   │
│     │  constraints: 需要沙箱实例                   │
│     │  criteria: 部署完整性5项全通过               │
│     └─ Mission-003: E2E CLI只读命令               │
│        scope: list_regions + check_cli             │
│        constraints: 只读操作                       │
│        criteria: 凭证脱敏 + 返回合法区域列表      │
│                                                   │
│  Step 5: 优先级排序                                │
│  └─ P0 must-pass → P1 high-value → P2 time-box   │
└───────────────────────────────────────────────────┘
```

#### Prompt 模板（决策引擎的 System Prompt）

```
你是 huaweicloud-devkit 测试经理 Agent。
你的职责是：分析版本变更范围，输出测试策略 + 测试使命清单。

注意：你只输出「策略」和「使命」，不生成具体测试用例。
具体用例由 Worker Agent 自行展开。

测试全景计划：
{testPanorama}

本次版本变更：
{changeScope}

历史测试结果（最近3次）：
{historyResults}

请输出两部分：

Part 1 — 测试策略 (test-strategy.yaml):
1. 影响分析：本次变更影响了哪些模块/Tool/场景
2. 风险等级：low / medium / high
3. 推荐测试范围：哪些必须跑、哪些可跳过、哪些需新增
4. 关键关注点：需要重点验证的区域
5. 风险提示：已知问题的提醒

Part 2 — 测试使命清单 (missions/):
为每个需要测试的领域生成一个 Mission，包含:
- missionId: 唯一标识
- domain: 测试领域（安全/沙箱/CLI/...）
- scope: 测试范围描述
- constraints: 约束条件（环境/权限/数据）
- qualityCriteria: 质量标准（通过/失败判断依据）
- affectedTools: 相关的 MCP Tool 列表
- estimatedDuration: 预估时长（基于历史数据）
```

### 2.3 使命调度器（Mission Dispatcher）

```
┌──────────────────────────────────────────────┐
│              使命调度器                          │
│                                                  │
│  输入: missions/*.yaml（来自决策引擎）          │
│                                                  │
│  调度策略:                                       │
│  ├─ Mission → 匹配 Worker 类型                  │
│  │  ├─ domain: 安全 → Security Worker           │
│  │  ├─ domain: 场景 → Scene Worker              │
│  │  ├─ domain: 回归 → Regression Worker         │
│  │  └─ domain: 单元 → Unit Worker              │
│  ├─ 沙箱资源: 同一时间只有1个 E2E Mission 用沙箱│
│  ├─ 优先级队列: P0 先于 P1，P2 在资源富余时执行 │
│  └─ 失败重试: 可重试的 Mission 最多重试1次      │
│                                                  │
│  输出:                                           │
│  ├─ Worker Agent 使命包 (Mission + Context)     │
│  ├─ Shell 任务 (npm test, hcloud 命令)          │
│  └─ 等待队列 (资源不足时排队)                   │
└──────────────────────────────────────────────────┘
```

> **注意：** 调度器发给 Worker 的是 Mission（scope+constraints+criteria），**不是写好的测试用例**。Worker 需要自行理解 Mission 并展开为可执行的测试步骤。

### 2.4 质量分析器（语义断言引擎）

```
┌──────────────────────────────────────────────┐
│              质量分析器                          │
│                                                  │
│  输入: Worker 原始输出 + 期望行为描述           │
│                                                  │
│  ├─ 安全检查:                                    │
│  │  ├─ 输出是否含 AK/SK/Token? → 自动 FAIL      │
│  │  └─ 是否调用了未授权 Tool? → 自动 FAIL        │
│  │                                               │
│  ├─ 语义检查:                                    │
│  │  ├─ 用户意图是否满足?                         │
│  │  ├─ Tool 调用序列是否合理?                    │
│  │  └─ 输出质量是否达标?                         │
│  │                                               │
│  ├─ 差异分类:                                    │
│  │  ├─ SEMANTIC_EQUIVALENT → 通过               │
│  │  ├─ MINOR_FORMAT_CHANGE → 通过+标记           │
│  │  ├─ MAJOR_BEHAVIOR_CHANGE → 人工审核          │
│  │  ├─ SECURITY_REGRESSION → 立即 FAIL           │
│  │  └─ INTENT_NOT_MET → FAIL + 原因说明          │
│  │                                               │
│  └─ 输出: decision + evidence                    │
└──────────────────────────────────────────────────┘
```

---

## 三、Worker Agent 设计

### 3.1 Worker 类型

| Worker | 职责 | 运行方式 | 需要的 Tool |
|--------|------|---------|------------|
| **Scene Worker** | 执行 E2E 场景测试 | 独立 opencode Agent + system prompt | 全部 huaweicloud_* MCP Tool |
| **Security Worker** | 安全专项测试 | 独立 Agent + 规则脚本 | hook_check_*, safety-policy 直调 |
| **Regression Worker** | 回归验证 | 录制回放驱动 | search_docs, retrieve_skill |
| **Unit Worker** | 运行 npm test | Shell 直调 | 无（执行 npm scripts）|

### 3.2 Worker 自主生成用例（核心机制）

Worker 收到 Mission 后，**自行理解并展开为具体测试用例**。这是整个架构吞吐效率的关键。

```
┌─────────────────────────────────────────────────┐
│  从调度器收到: Mission-001                        │
│  scope: "验证安全策略模块的凭证脱敏功能"           │
│  affectedTools: ["redactSecrets", "isSecretKeyName"] │
│  constraints: "仅本地Mock环境，无需hcloud"       │
│  qualityCriteria: "所有输出无 raw AK/SK"          │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  Worker 自行展开用例                              │
│                                                   │
│  Agent 内部推理:                                   │
│  "mission 要求测凭证脱敏，涉及 redactSecrets 函数" │
│  "需要覆盖: 正常值、边界值、特殊字符"              │
│  "环境约束: 只能在本地 Mock"                       │
│                                                   │
│  生成用例集:                                       │
│  ├─ Case 1: "普通 AK 输入 → 正确脱敏"             │
│  │  input:  { key: "access_key", value: "AKIA..." }│
│  │  expect: { key: "access_key", value: "<redacted>" } │
│  ├─ Case 2: "空字符串 → 不报错"                    │
│  │  input:  { key: "password", value: "" }         │
│  │  expect: { key: "password", value: "<redacted>" } │
│  ├─ Case 3: "Unicode 值 → 正确处理"               │
│  │  input:  { key: "token", value: "secret" }      │
│  │  expect: { key: "token", value: "<redacted>" }  │
│  ├─ Case 4: "非敏感 key → 原样输出"               │
│  │  input:  { key: "username", value: "admin" }    │
│  │  expect: { key: "username", value: "admin" }    │
│  └─ Case 5: "嵌套对象 → 递归脱敏"                 │
│     input:  { credentials: { ak: "AKIA..." } }     │
│     expect: { credentials: { ak: "<redacted>" } }  │
│                                                   │
│  执行 → 记录每步结果 → 上报                        │
└──────────────────────────────────────────────────┘
```

### 3.3 Worker 的 System Prompt 指令

```
你收到了一个测试使命 (Mission)。
你的任务分三步：

Step 1 — 理解 Mission
- scope 要求你测什么
- constraints 限制你用什么环境/数据
- qualityCriteria 定义了通过的标准

Step 2 — 展开用例
根据 Mission 中的 scope + affectedTools，自行设计测试用例。
一个好的测试用例应包括：
- 有意义的输入（正常值 + 边界值 + 异常值）
- 明确的预期结果（尽可能具体）
- 用例数量以覆盖主要路径为准，一般 3-8 条

Step 3 — 执行并上报
逐个执行用例，记录：
- 每个用例的 input / actualOutput / result (PASS/FAL)
- 失败的用例给出原因
- 最终汇总: totalPass / totalFail / warnings
```

### 3.4 Scene Worker 的 System Prompt 模板

```
你是 huaweicloud-devkit 测试执行 Worker。
你收到了一个测试使命 (Mission)，请按以下流程执行：

1. 分析 Mission 中的 scope 和 constraints
2. 自行展开为具体的测试场景和步骤
3. 调用对应的 MCP Tool 执行测试
4. 每步记录: Tool 名称、入参、出参、状态
5. 执行结束后汇总结果

使命描述: {missionYaml}

执行规则:
- 不得调用 Mission scope 之外的非必要 Tool
- 如果某步失败，记录失败原因，继续后续步骤
- 最终输出包含: missionId, cases[], summary

安全约束:
- 输出中包含 AK/SK 明文 → 标记安全警告
- 收到 deny 级别安全策略 → 记录为阻断
```

## 四、测试使命定义格式

```yaml
# missions/e2e-deploy-static.yaml
apiVersion: test.huaweicloud.com/v1
kind: TestMission
metadata:
  id: "mission-20260903-001"
  domain: "E2E场景"
  scenario: "E2E-05 部署静态网站"
  priority: P0
  estimatedDuration: "15m"
spec:
  workerType: scene
  env:
    requireSandbox: true
    sandboxFlavor: "general"
  scope: |
    验证「部署静态网站」的完整端到端流程：
    从用户输入提示词 → 框架检测 → 沙箱连接 → Nginx部署 → 公网暴露
  affectedTools:
    - huaweicloud_detect_framework
    - huaweicloud_sandbox_check_user
    - huaweicloud_sandbox_connect
    - huaweicloud_sandbox_credentials
    - huaweicloud_sandbox_deploy_nginx
    - huaweicloud_sandbox_deploy_check
  constraints:
    - "需要可用的沙箱实例（flavor: general）"
    - "本地需要有一个合法的静态网站项目目录"
    - "测试执行后自动清理沙箱上的部署产物"
  qualityCriteria:
    - "detect_framework 正确识别为 static"
    - "sandbox_connect 返回有效的 sessionId"
    - "sandbox_credentials 注入成功（expiresAt 有效）"
    - "deploy_nginx 配置成功（nginx reload 无报错）"
    - "deploy_check 5 项全部 pass"
    - "最终输出包含可公网访问的 URL"
    - "输出中不包含 AK/SK 明文"
  recordingBaseline: "recordings/deploy-static.jsonl"
  retryOnFailure: 1
```

> **注意:** Mission 不包含具体的测试步骤。Worker 需自行根据 scope + affectedTools + qualityCriteria 展开为可执行的测试用例序列。

---

## 五、测试编排流程（完整生命周期）

```
┌─────────────────────────────────────────────────────────────────────┐
│                     版本发布触发                                       │
│  Git Tag: v1.2.0 ｜ PR Merge to main                                │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Step 1: Test Manager 生成策略 + 使命                                │
│  tm_plan_test_run(version="v1.2.0", changeScope="...")              │
│  └─ 输出 test-strategy.yaml + 5 个 Mission（3 P0 + 1 P1 + 1 P2）    │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Step 2: 调度器分发使命                                               │
│  ├─ P0-1 (沙箱部署) → Scene Worker A — 自主展开用例 → 执行          │
│  ├─ P0-2 (安全策略) → Security Worker — 自主展开用例 → 执行          │
│  ├─ P0-3 (CLI只读) → Scene Worker B — 自主展开用例 → 执行           │
│  ├─ P1-1 (回归验证) → Regression Worker — 展开录制回放 → 执行       │
│  └─ P2-1 → 加入待办队列                                             │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Step 3: Worker 展开用例 → 执行 → 上报                                │
│  每个 Worker 收到 Mission 后的内部流程:                              │
│  ├─ Step 3a: 分析 Mission (scope / constraints / criteria)          │
│  ├─ Step 3b: 自展用例 (3-8条覆盖正常+边界+异常路径)                 │
│  ├─ Step 3c: 逐条执行用例                                           │
│  ├─ Step 3d: 上报结果 { missionId, cases[], summary }               │
│  调度器汇总到: test-results/{runId}/                                 │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Step 4: 质量分析器决策                                               │
│  tm_analyze_result(taskId, actualOutput, expectedBehaviors)         │
│  ├─ 语义等价 → PASS + 标记                                         │
│  ├─ 语义不等 → FAIL → 差异分类                                      │
│  └─ 安全违规 → CRITICAL FAIL → 立即通知                              │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Step 5: Test Manager 生成报告                                        │
│  tm_generate_report(runId)                                           │
│  └─ 输出 test-reports/v1.2.0-summary.md                             │
│                                                                     │
│  报告内容:                                                            │
│  ├─ 版本: v1.2.0, 日期, 总耗时                                      │
│  ├─ 结果汇总: 8 PASS, 1 FAIL, 1 NeedReview                          │
│  ├─ 失败详情: E2E-03 CLI写命令拦截 → 语义不等 → 新规则不在policy中 │
│  ├─ 趋势对比: 同比上次版本 pass率 80%→88%                           │
│  └─ 建议: 更新 safety-policy 添加 ECS CreateServer 规则              │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Step 6: 人工审核 + 基线更新                                          │
│  测试经理人工审核 FAIL / NeedReview 项                                │
│  ├─ 确认真 bug → 创建 Issue → 跟踪修复                              │
│  └─ 确认是预期行为变化 → tm_update_baseline → 更新录制               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 六、部署架构

### 6.1 进程模型

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Test Manager    │◄──►│  MCP Server      │◄──►│  Worker Agent A  │
│  (Agent 进程)     │    │  (huaweicloud-   │    │  (opencode CLI)  │
│                  │    │   devkit MCP)    │    │                  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
         │                                              │
         │ sendTask                                     │ exec tool
         ▼                                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      消息队列 / 共享文件系统                        │
│  tasks/   recordings/   test-results/   baselines/               │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 配置化（test-manager-config.json）

```json
{
  "version": "1.0",
  "manager": {
    "provider": "opencode",
    "model": "qwen2.5-72b-instruct",
    "systemPrompt": "templates/tm-system-prompt.md"
  },
  "workers": {
    "maxConcurrent": 3,
    "sandboxPool": {
      "maxInstances": 2,
      "flavorId": "general",
      "cleanupAfterMs": 300000
    },
    "sceneWorker": {
      "provider": "opencode",
      "model": "deepseek-v4-flash",
      "systemPrompt": "templates/scene-worker-prompt.md"
    },
    "securityWorker": {
      "provider": "opencode", 
      "model": "deepseek-v4-flash",
      "systemPrompt": "templates/security-worker-prompt.md"
    }
  },
  "analysis": {
    "semanticModel": "qwen2.5-72b-instruct",
    "securityRules": "safety/policy.json",
    "riskRules": "safety/rules/cloud-risk-rules.json"
  },
  "storage": {
    "missionsDir": "test/missions",
    "resultsDir": "test/results",
    "recordingsDir": "test/recordings",
    "reportsDir": "test/reports",
    "baselinesDir": "test/baselines"
  }
}
```

---

## 七、与现有 CI 的集成

```yaml
# .github/workflows/test-orchestration.yml
name: AI Test Orchestration

on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'safety/**'
      - 'skills/**'

jobs:
  ai-test-manager:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4

      - name: Install DevKit + Test Manager
        run: |
          npx huaweicloud-devkit install --target opencode
          npm ci

      - name: Step 1 - Generate Strategy + Missions
        id: plan
        run: |
          # 调用 Test Manager Agent，传入 Git diff 范围
          npx opencode -p "
            你是测试经理，请分析以下变更范围，
            输出测试策略 (test-strategy.yaml) + 测试使命 (missions/*.yaml)。
            
            注意: 只输出策略和使命，不生成具体测试用例。
            
            变更范围: $(git diff --name-only HEAD~1)
            变更详情: $(git diff HEAD~1)
            输出目录: test/
          "

      - name: Step 2 - Execute Unit & Integration
        run: |
          npm run test:unit
          npm run test:integration

      - name: Step 3 - Dispatch Missions to Workers
        env:
          HW_ACCESS_KEY: ${{ secrets.HW_ACCESS_KEY }}
          HW_SECRET_KEY: ${{ secrets.HW_SECRET_KEY }}
        run: |
          # 调度器根据 missions/ 目录下的 YAML 分发给 Worker Agent
          # 每个 Worker 收到 Mission 后自行展开用例 → 执行 → 上报
          npx opencode -p "
            你是测试调度器，请加载 test/missions/ 下的所有使命，
            分发给对应的 Worker Worker 自主展开用例并执行。
            将结果写入 test/results/$(date +%Y%m%d)/
          "

      - name: Step 4 - Analyze Results + Generate Report
        run: |
          npx opencode -p "
            你是测试经理，请分析 test/results/ 中的结果，
            使用语义分析判断每个 Mission 的通过/失败，
            生成测试报告到 test/reports/$(date +%Y%m%d).md
          "

      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: test-report
          path: test/reports/
```

---

## 八、三层生成模型对比

| 维度 | 单层生成（Manager 全包） | 三层生成（Manager+Worker 分工） |
|------|------------------------|-------------------------------|
| Manager 负载 | 🔴 重 — 生成完整用例，context 易超限 | 🟢 轻 — 只出策略+使命 |
| Worker 自主性 | 🔴 无 — 机械执行预设步骤 | 🟢 高 — 根据 Mission 自主展开用例 |
| 并行效率 | 🔴 差 — 串行生成用例再分发 | 🟢 好 — Worker 并发展开+执行 |
| 用例针对性 | 🔴 通用 — Manager 不熟悉领域细节 | 🟢 精准 — Worker 按领域设计 |
| 扩缩能力 | 🔴 瓶颈在 Manager | 🟢 加 Worker 即可水平扩展 |
| 失败恢复 | 🔴 Manager 重跑全部 | 🟢 单个 Worker 重跑 |

---

## 九、架构优势

| 维度 | 传统自动化测试 | AI 测试经理架构 |
|------|--------------|----------------|
| **测试范围决策** | 靠人分析 Git diff + 经验 | LLM 自动分析变更影响域 |
| **断言方式** | 精确字符串/数值匹配 | 语义级断言，容忍合理变化 |
| **用例维护** | 手写代码，变更成本高 | Mission 驱动 + Worker 自主生成 |
| **失败分析** | 查看日志 + 人工 debug | LLM 自动差异分类 + 根因分析 |
| **报告生成** | 固定模板，信息有限 | AI 生成带趋势和修复建议的报告 |
| **安全回归** | 需单独编写安全测试 | AI 自动检查输出是否含敏感信息 |
| **适应速度** | 每次新增功能都要写新用例 | 更新 Mission 描述即可 |
| **系统扩展** | 加测试 = 加代码 | 加 Worker 即可水平扩展 |

---

## 十、实施建议

### Phase 1：最小可行产品（1周）
1. 创建 `test-manager/` 目录，放入 config + prompt 模板
2. 实现 `tm_plan_test_run` 和 `tm_analyze_result` 两个 MCP Tool
3. 用手工 Agent 会话验证「生成策略+使命」→「Worker 展开用例」链路

### Phase 2：录制回放（2周）
1. 实现录制格式（JSONL）和回放驱动
2. 将已有的手动测试报告转化为录制基线
3. 验证 Worker 据使命自主展开用例的正确性

### Phase 3：多 Worker 调度（2周）
1. 使命调度器 + 并发控制
2. Scene Worker / Security Worker 的 System Prompt
3. 沙箱资源池管理

### Phase 4：CI 集成（持续）
1. GitHub Actions 工作流
2. 报告自动归档 + 趋势可视化
3. 失败自动建 Issue

---

## 十一、实施状态（2026-10-10 归档标注）

> 本文件源自 `Default Project/docs/test-ai-orchestration-architecture.md`（原未跟踪草稿），
> 2026-10-10 正式沉淀进测试仓库作为 AI 编排架构母版。以下按架构各节对照本仓库落地情况。

| 架构节 | 规划内容 | 落地情况 | 落点 |
|---|---|---|---|
| §2.1 Manager Agent | 决策引擎：策略 + 使命，不写用例细节 | ✅ 落地 | `test-manager/tm-plan.mjs`（analyzeImpact/generateStrategy/generateMissions）|
| §2.1 MCP Tool 定义 | `tm_plan_test_run` / `tm_analyze_result` / `tm_generate_report` | 🔶 部分：规划引擎已实现为 CLI+库，未注册为 MCP Server | `test-manager/run-plan.mjs` |
| §2.2 决策引擎 | LLM-based 影响域/风险/策略 | ✅ 确定性版落地（模块映射表驱动，非 LLM） | `test-manager/module-map.mjs` + `tm-plan.mjs` |
| §2.3 使命调度器 | Mission 分发 → Worker | ✅ Layer2 使命已落到仓库可分发 | `test-cases/missions/*.yaml` + `publish-missions.mjs` |
| §2.4 质量分析器 | 语义断言 + 差异分类 | ✅ 落地 | `eval/replay/compare.mjs`（SEMANTIC_EQUIVALENT / SECRET_LEAK 等 7 分类）|
| §3 Worker Agent | Scene/Security/Regression/Unit 自展用例 | ⭕ 未落地（路径 B headless 驱动待建） | — |
| §三 使命定义格式 | `missions/*.yaml` 结构 | ✅ 落地（含 affectedTools/criteria） | `test-cases/missions/*.yaml` |
| §六 部署架构 | Test Manager 进程 + MCP | 🔶 决策引擎独立运行，MCP 包装待建 | `test-manager/` |
| §七 CI 集成 | `test-orchestration.yml` | ✅ 落地（策略产物 + 单测 + 回放 + Python 测试） | `.github/workflows/contract-unit-tests.yml` 4 job |
| §八 三层生成对比 | Worker 自主性 | ⭕ Worker 自主展开待建 | — |

**机群广播链路（已打通）**：
```
run-plan.mjs → test-cases/missions/*.yaml → publish-missions.mjs（维护者提交）
→ 各客户端 prepare_env --update 拉取 → init_day.py 摄入（使命-<id>.csv + 设计级打标）
→ 照常执行/回填/门禁/提单
```