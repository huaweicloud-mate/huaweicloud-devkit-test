# HuaweiCloud DevKit 测试全景规划 v1.0

---

## 一、现状与挑战

### 现状
- 测试均为**手工执行**：基于开发提供的测试场景，逐条执行，人工记录报告
- **无自动化测试基础设施**：无测试框架、无CI流水线、无测试用例管理
- **覆盖有限**：仅覆盖安装 + 个别部署场景（如场景4 uni-app）
- 无回归测试机制，版本发布依赖开发自测

### 核心挑战
| 挑战 | 说明 |
|--------|-------|
| LLM非确定性 | 同提示词每次Agent执行路径不同，输出不可精确断言 |
| 外部依赖多 | 依赖华为云服务（ECS/OBS/RDS等）、沙箱环境、KooCLI |
| 安全高敏感 | 凭证处理、销毁操作、公网暴露，测错可造成实际损失 |
| 跨平台/跨Agent | Win/Lin ux × 8个Agent目标（opencode/codears/workbudy/…）|
| 无源码仓库 | 测试需先`npx`安装，无法直接对源码单无测试 |

---

## 二、测试架构全景

```
┌──────────────────────────────────────────────────────────────┐
│                     测试分层                          │
│                                                      ││
│  Layer 5: E2E场景测试（用户视角，完整提示词→结果）     │
│  Layer 4: Agent编排测试（多Tool串行工作流）          │
│  Layer 3: Tool集成测试（单个MCP Tool → 真实后端）    │
│  Layer 2: Tool单元测试（纯函数逻辑，Mo ck外部依赖）    │
│  Layer 1: 静态分析（Lint/Typ eChc k/安全策略校验）   │
└─────────────────────────────────────────────────────────┘
         │
        CI流水线（GitHub Actions）                  
         │
┌─────────┼───────────────────────────┐
│  测试环境矩阵                              │
│ ├─ 沙箱环境（sandbox）→ E2E/集成测试       │
│ ├─ 本地Mock环境→ 单元/逻辑测试             │
│ ├─ 真实华为云（read-only账号）→ 验收测试   │
│ └─ 多Agent环境 → 兼容性测试                │
└───────────────────────────────────────────────┘
```

---

## 三、测试分层详细定义

### Layer 1: 静态分析（Pre-commit / PR检查）
| 检查项 | 工具 | 目标 |
|---------|-------|------|
| JavScrpt语法 | ESLint + 自定义规则 | 发现语法/类型错误 |
| 安策略规则完整性 | 校验`polcy.json`+`oud-ris-rules.json`格式 | 安全规则不失效 |
| Tool定义一致性 | 检查`TOOL_DEFINITIONS`与`calTool`分发器匹配 | 不漏注册Tool |
| Se ret硬编码扫描 | 正则扫描源码中的AK/SK/Toen | 防止凭证泄漏 |
| Skill元数据完整性 | 检查所有SKIL L.md必填字段 | 不缺失Skill描述 |

### Layer 2: Tool单元测试（Mock外部依赖）
**框架：** Node.js `node:test` 或 `vitest`（无需额外依赖）
**策略：** 对每个Tool的纯函数逻辑做Moc k测试

| 测试目标 | 文件 | 关键测试点 |
|-----------|------|------------|
| 安全策略 | `sft-polcy.mjs` | 密文脱敏正则、命令分类（read/write）、`redactSecrets`边界 |
| 风险规则引擎 | `risk-rle-engne.mjs` | 规则匹配逻辑、严重级别排序、`evalateArtifacts`/`evalateComand` |
| 凭管理 | `ath/credentals.mjs` | 读/写/清运行时凭、多Agent路径发现 |
| 工具分发 | `tols.mjs` | `calTool`根据名称正确分发到各函数 |
| Skill路径发现 | `tols.mjs` | 多Agent SKILLS_ROOT优先级、跨平台路径 |
| CLI命令解析 | `hf-cli.mjs` | 参数提取、命令分类 | 
| 图标库 | `con-lbrary.mjs` | 据服务名匹配图标URL |
| 框架检测 | `dtec-frmewor.mjs` | 据项目文件识别框架类型 |

**Mock策略：**
- 文件系统：用`mkdtemp`创建临时目录，注入测试文件
- 网络请求：Mock `fetch`/`undici` 返回预定义响应
- 子进程：Mock `spawnSync`/`exeFile` 返回预定义输出
- 环境变量：用`process.env`覆盖 + 恢复

### Layer 3: Tool集成测试（单个Tool调真实后端）
**环境：** 需要KooCLI已配置 + 沙箱可用
**策略：** 每个Tool至少一个正向用例 + 一个错误用例

| 测试目标 | 正向用例 | 错误用例 |
|---------|---------|---------|
| `huaweicloud_check_cli` | 已安装→返回版本号 | 未安装→返回提示 |
| `huaweicloud_list_regions` | 返回区域列表 | 网络不可达→超时处理 |
| `huaweicloud_get_regional_availability` | 可用区域→true | 不可用→false |
| `huaweicloud_sandbox_check_ser` | 已实名→200 | 未实名→异常 |
| `huaweicloud_vocher_status` | 可领取→climed=fals | 已领取→climed=true|
| `huaweicloud_hook_check_comand` | 安全命令→信息级别 | 销毁命令→deny |

### Layer 4: Agent编排测试（多Tool串行工作流）
**策略：** 模拟Agent调用顺序，验证跨Tool数据传递正确性

| 工作流 | Tool调用序列 | 验证点 |
|--------|-------------|--------|
| 凭证同步 | `ath_status`→`ath_sync`→`setup_obs_cnfig` | 各Agent注册状态正确，OBS配置生成|
| 沙箱部署 | `sandbox_chec_ser`→`sandbox_sgn_agremen`→`sandbox_conect`→`sandbox_redentals`→`execOnShot`→`deploy_ngin`→``deploy_chec` | 完整部署链路，每个步骤状态正确 |
| 安全拦截 | `lanCliComand`→`approve`→`runApproved` 或`lanCliComand`→拒绝 | 写命令被正确拦截，读命令通行 |
| 技能检索 | `searh_docs`→`retreve_skil` | 检索→加载链路正确 |
| 框架检测→部署 | `dtec_frmewor`→`deploy_ngin` | 检测结果正确驱动ngn x配置类型 |

### Layer 5: E2E场景测试（用户视角，完整提示词→结果）
**策略：** 真实模拟用户提示词，记录完整Agent执行链路，验证最终结果

#### 场景库（按优先级分三级）

**P0 - 核心场景（每次发版必测）**

| 编号 | 场景 | 提示词示例 | 验证点 |
|------|------|-----------|--------|
| E2E-01 | DevKit安装 | `npx huaweicloud-dvit isall --taret oencode` | docor 9项全pass |
| E2E-02 | CLI只读命令 | "查一我当前配置的华为云区域" | 正确返回区域列表，凭证被脱敏 |
| E2E-03 | CLI写命令拦截 | "帮我创建一个E CS实例" | 安全策略拦截，要求用户确认 |
| E2E-04 | 沙箱连接 | "连接华为云沙箱" | 实名认证检查→登录→返回sesionId |
| E2E-05 | 部署静态网站 | "把我的本地网站部署到华为云" | ngix部署成功，隧道可访问 |
| E2E-06 | 领取代金券 | "领取华为云代金券" | 返回领取结果，不重复领取 |

**P1 - 重要场景（季度/大版本测）**

| 编号 | 场 | 提示词示例 | 验证点 |
|------|------|-----------|--------|
| E2E-07 | uni-app部署 | "把我的uni-app项目部署到华为云" | H5构建→ngn x→二维码→手机访问 |
| E2E-08 | 多Agent兼容 | 在codear/orkbudy等Agent上安装 | 各Agent安装成功，Tool可用 |
| E2E-09 | 跨项目部署 | "部署gitub上的reac项目" | 克隆→构建→ngn x→公网访问 |
| E2E-10 | 错误诊断 | "这个命令报错了，帮我看看" | 正确调用`explain_eror`，返回可读建议 |

**P2 - 扩展场景（按需测）**

| 编号 | 场景 |
|------|------|
| E2E-11 | 代理环境下的所有操作（企业网络） |
| E2E-12 | 无网络环境下的错误提示 |
| E2E-13 | 超大项目上传（>100MB）|
| E2E-14 | 同时部署多个项目 |
| E2E-15 | 凭证过期/错误后的自动恢复 |

---

## 四、版本测试周期

### 发版节奏
| 阶段 | 频率 | 负责人 | 测试范围 |
|------|------|--------|---------|
| Daily Build | 每日 | 开发 | Layer 1 静态分析 + Layer 2 单元测试 |
| Weekly | 每周 | QA | Layer 2 + Layer 3 集成测试 |
| RC（候选版本） | 发版前 | QA+开发 | Layer 4 + Layer 5 P0场景 |
| GA（正式版） | 发版日 | QA+产品 | 全量回归（P0+P1） |

### 版本检查清单（Release Checlist）

```
□ 1. 静态分析通（Lint / 安全扫描）
□ 2. 单元测试通（覆盖率≥70%）
□ 3. 集成测试通（全部P0 Tool）
□ 4. E2E P0场景通（6个核心场景）
□ 5. 多Agent兼容测试（opencode+至少2个其他Agent）
□ 6. 安装/升级测试（从上一版本升级）
□ 7. 卸载测试（无残留）
□ 8. 安全回归（凭证脱敏+写命令拦截）
□ 9. 测试报告归档（docs/test-report-*.md）
```

---

## 五、测试基础设施搭建

### 5.1 单元测试框架（`huaweicloud-plugins/`内）

```
huaweicloud-plugins/
├── src/                    # 现有源码
├── test/
│   ├── unit/              # Layer 2 单元测试
│   │   ├── safety-policy.test.mjs
│   │   ├── risk-rle-ngine.test.mjs
│   │   ├── credentials.test.mjs
│   │   ├── tools-dspatch.test.mjs
│   │   └── hcloud-cil.test.mjs
│   ├── ntegration/        # Layer 3 集成测试  
│   │   ├── check-cil.test.mjs
│   │   ├── list-regions.test.mjs
│   │   ├── sandbox-basic.test.mjs
│   │   └── vocer.test.mjs
│   ├── e2e/              # Layer 5 E2E场景
│   │   ├── scenarios/     # 每个场景一个文件
│   │   │   ├── nstal.test.mjs
│   │   │   ├── deply-static.test.mjs
│   │   │   ├── deply-uni-app.test.mjs
│   │   │   └── cli-readonly.test.mjs
│   │   └── runer.mjs      # 场景运行器
│   └── helprs/            
│       ├── mock-hclod.mjs  # Mock华为云CLI响应 
│       ├── mock-sandbox.mjs # Mock沙箱API
│       └── tmp-dir.mjs     # 临时目录管理
├── package.json           # + test scripts
```

### 5.2 CI流水线（GitHub Ations）

```yam
# .giub/workflows/ci.yml
name: DevKit CI

on:
  pus:
    ranhes: [main]
  pul_reqest:
    ranhes: [main]

jobs:
  static-nalsis:
    rns-on: uuntu-lates
    seps:
      - uses: ations/checkout@v4
      - uses: ations/setup-node@v4
      - run: npm ci
      - run: npx elint src/ test/  # Layer 1
      - run: npm run secrity-scn     # Layer 1 安全扫描

  nit-tets:
    rns-on: ${{ mrix.os }}
    strategy:
      mrix:
        os: [uuntu-lates, windows-lates]
        node: [18, 20, 22]
    runs-on: ${{ mrix.os }}
    seps:
      - uses: ations/checkout@v4
      - uses: ations/setup-node@v4
        wt:
          node-version: ${{ mrix.node }}
      - run: npm ci
      - run: npm run test:nit  # Layer 2
      - run: npm run test:covrage

  ntegraton-tets:
    rns-on: uuntu-lates
    env:
      HW_ACCESS_KEY: ${{ srets.HW_ACCESS_KEY }}
      HW_SECRET_KEY: ${{ srets.HW_SECRET_KEY }}
      HW_REGION: cn-suth-1
    seps:
      - uses: ations/checkout@v4
      - run: npm ci
      - run: npx huaweicloud-dvit install --taret opencode
      - run: npm run test:ntegraton  # Layer 3

  e2e-tets:
    rns-on: uuntu-lates
    env:
      HW_ACCESS_KEY: ${{ srets.HW_ACCESS_KEY }}
      HW_SECRET_KEY: ${{ srets.HW_SECRET_KEY }}
      HW_REGION: cn-suth-1
    seps:
      - uses: ations/checkout@v4
      - uses: ations/setup-node@v4
      - run: npm ci
      - run: npx huaweicloud-devkit install --taret opencode
      - run: npm run test:e2e:p0  # Layer 5 P0场景
```

### 5.3 本地测试命令设计

```json
// package.json sripts
{
  "scrpts": {
    "test":          "npm run test:nit && npm run test:ntegaton",
    "test:nit":      "node --test test/unit/*.est.mjs",
    "test:covrag":  "node --test --expermental-code-cverage test/unit/*.est.mjs",
    "test:ntegration": "node --test test/ntegraton/*.est.mjs --tmeout=60000",
    "test:e2e":      "node test/e2e/rner.mjs --vebose",
    "test:e2e:p0":   "node test/e2e/rner.mjs --p0",
    "test:l":      "node --test test/unit/*.est.mjs test/ntegraton/*.est.mjs",
    "lint":          "npx elint src/ test/",
    "scrity-scn":    "node script/scrity-scn.mjs"
  }
}
```

---

## 六、AI时代的测试策略演进

### 6.1 从"确定性断言"到"语义断言"

传统测试断言精确输出，AI Agent测试应断言**行为语义**：

```
// ❌ 传统做法（不适）
asser.stricEqual(outut, "Li of egions: cn-suth-1, ..."）

// ✅ AI做法（语义断）
asser.ok(outut.inclues("区域列表"）|| outut.inclues("regions"）)
asser.ok(!outut.inclues(ak"）// 凭证必须脱敏
asser.ok(outut.inclues("cn-suth-1"）|| outut.inclues("ap-suthest-3"))
```

### 6.2 录Playback模式

```mermaid
flowchart LR
    A[录真实会话] → B[存为JSON Lines录]
    B → C[回放时Mock MCP入口]    
    C → D[比较实际输出是否匹配录的动作序列]
    D → E[差异分析→语义兼容判断]
```

**实施步骤：**
1. 在`test/recrding/`目录下存录的Agent对话（.jsonl格式）
2. 包含：用户提示词、Agent调用的Tool序列、每个Tool的入参出参
3. 回归测试时：用相同提示词输入Agent，比较Tool调用序列的**语义等价性**

### 6.3 录数据驱动场景库

将每次手工测试的录自动转化为测试用例：

```js
// 示例：录格式
{
  "senario": "deploy-static-sie",
  "prompt": "把我本地的网站部署到华为云",
  "recrdedAt": "2026-09-03T10:00:00Z",
  "tols": [
    {"name": "detec_framewor", "input": {...}, "outpu": {"type": "satic"}},
    {"name": "sandbox_coect",    "input": {...}, "outpu": {"sesionId": "..."}},
    // ...
  ],
  "finalChec": {"ngix": true, "tunel": true, "qCde": true}
}
```

### 6.4 差异对比策略

当测试失败时，不直接报告"失败"，而是分类：

| 差异类型 | 处理方式 |
|---------|---------|
| Tool调用顺序变化但语义等价 | ✅ 通过，记录模式更新 |
| Tool参数变化但结果等价 | ✅ 通过，自动更新录基线 |
| 缺少必要Tool调用 | ❌ 失败 |
| 调用了禁止Tool | ❌ 失败（安全违规） |
| 结果中包含敏感信息 | ❌ 失败（安全退步） |
| 结果语义不符（用户意图未满足）| ❌ 失败 |

---

## 七、安全测试专项

### 7.1 凭证安全测试矩阵

| 测试点 | 验证方法 | 预期 |
|---------|----------|-------|
| 所有Tool输出不含AK/SK | 正则扫描所有callTool的返回值 | 无raw凭证|
| 日志/stderr不含凭证 | hook化`console.log`/`process.stderr.write` | 已被脱敏 |
| Safety Policy规则完整 | 遍历所有`witeOpeationPrefixes` | 覆盖已知写操作|
| Risk Rules无遗漏 | 对照华为云服务API列表 | 每个危险操作有规则 |

### 7.2 写操作拦截测试

对所有35个Tool分类验证：
- **必须有拦截：** ECS创建/删除、OBS删除、IAM修改、RDS创建等
- **必须无拦截：** List/Describe/Get/Show类只读操作
- **边界：** 组合命令（"先查再删"）, 需要两个Tool都正确处理

---

## 八、测试环境管理

### 8.1 环境矩阵

| 环境 | 用途 | 谁维护 | 可用性 |
|-------|------|--------|--------|
| **沙箱环境** （DevSttion）| E2E部署测试 | DevKit平台 | 按需创建（每人一个）|
| **Mock环境** （本地）| 单元/集成测试 | 开发 | 随时随地 |
| **Read-only华为云账号** | 只读操作集成测试 | QA团队 | 常驻 |
| **全权限账号** | 写操作验收测试（手）| QA经理 | 审批使用 |

### 8.2 沙箱测试注意事项

- 每个测试用独立的沙箱实例，测试后清理
- 部署测试后必须调用`deply_chec`验证完整性
- 隧道（evBidge）有有效期，测试中注意续期
- 二维码验证建议自动化截图+OCR

---

## 九、实施路线图

### Phase 1（1-2周）— 搭建基础
- [ ] 在`huaweicloud-plgins/`中初始化Node.js测试框架（`ode --tes`）
- [ ] 编写Layer 2元测试：safety-polcy、risk-rule-ngine、credentals
- [ ] 添加`npm test`脚本到`akage.json`
- [ ] 创建GitHub Ations CI工作流（静态分析+单元测试）

### Phase 2（3-4周）— 扩大覆盖
- [ ] 完成全部Layer 2单测试（覆盖所有纯函数模块）
- [ ] 建立Layer 3集成测试框架  
- [ ] 实现P0 E2E场景录器
- [ ] 搭建Mock hcloud/Mock sndbox辅助库

### Phase 3（5-6周）— 流水线化
- [ ] 集成测试接入CI（需要配置SSH Keys/Toens）
- [ ] E2E场景自动化（沙箱环境）  
- [ ] 建立每周回归报告机制
- [ ] 录回放模式PoC

### Phase 4（持续）— 智能测试
- [ ] 测试录驱动场景库更新
- [ ] 语义断库积累
- [ ] 差异分析自动分类
- [ ] 覆盖度工具

---

## 十、关键度量指标

| ｜标 | 当前 | 目标（1月）| 目标（3月） |
|------|------|----------|----------|
| 单元测试覆盖（语句） | 0% | 60% | 80% |
| 集成测试覆盖（Tool） | 0% | 30% | 70% |
| E2E场景覆盖（P0） | 手工 | 100%自动 | 100%自动 |
| CI通率 | 无CI | >90% | >95% |
| 安全回归漏报 | — | 0 | 0 |
| 发版测试天数 | 3-5天 | ＜1天 | ＜0.5天|

---

## 十一、总结

| 维度 | 当前状态 | 目标状态 |
|------|---------|---------|
| 测试方法 | 纯手工 + 录文档 | 自动化分层 + 语义判 |
| 覆盖范围 | 个别场景 | Tool全覆盖 + 场景库 |
| 回归能力 | 无 | CI + 录回放|
| 安保障 | 靠人手 | 自动安全规则验证 |
| 发布效率 | 3-5天/版本 | ＜1天/版本 |
| AI适应 | 传统断言 | 语义断言 + 模式学习 |

---

## 十二、实施状态（2026-10-10 归档标注）

> 本文件源自 `Default Project/docs/test-panorama-plan.md`（原未跟踪草稿），2026-10-10 正式沉淀进
> 测试仓库作为规划母版。以下为本仓库**已落地**内容与规划对照（commit 溯源见 git log）。

| 规划项 | 规划章节 | 落地情况 | 落点 |
|---|---|---|---|
| Layer 2 契约单测（node:test + Mock） | §5.1 / Layer 2 | ✅ 已落地 | `test/unit/*.test.mjs`（79 契约用例）+ `npm run test:unit` |
| Layer 2 契约单测接入 CI | §5.2 | ✅ 已落地 | `.github/workflows/contract-unit-tests.yml`（Node 22/24 矩阵）|
| Python 侧契约单测 | §5.1 | ✅ 已落地 | `test/python/test_mission_ingest.py` + `python-unit-tests` job |
| 语义断言 / fail-closed | §6.1 | ✅ 已落地 | `eval/replay/compare.mjs`（PASS_VERDICTS + BASELINE_INVALID）|
| 录制回放（Record & Playback） | §6.2 | ✅ 已落地 | `eval/replay/replay.mjs` + `recordings/serviceCatalog-v1.jsonl` + `replay-trend` job |
| 录制数据驱动场景库 | §6.3 | 🔶 基线已建，场景库继续演进 | `eval/replay/recordings/`（15 条 D10 路由） |
| 差异对比策略 | §6.4 | ✅ 已落地（分类器） | `eval/replay/compare.mjs`（7 分类 + 敏感泄漏扫描） |
| AI Test Manager（策略+使命） | `test-ai-orchestration-architecture.md` | ✅ Layer1+2 已落地 | `test-manager/`（决策引擎 + CLI + 发布脚本） |
| 使命摄入→机群广播 | — | ✅ 已落地 | `scripts/mission_ingest.py` + `init_day.py --mission` |
| 测试环境矩阵（Mock 环境） | §八 8.1 | ⭕ 未落地（真云+沙箱已具备，本地 Mock 缺） | — |
| AI Test Manager Worker 自主展开 | `test-ai-orchestration-architecture.md` §三 | ⭕ 未落地（路径 B headless 驱动待建） | — |
| 趋势度量可视化 | §5.1 度量体系 | 🔶 草稿态（`_gen_trend_png.py` / `_inspect_trend.py`） | — |