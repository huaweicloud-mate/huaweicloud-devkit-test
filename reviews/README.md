# 设计评审归档

本目录保存测试设计阶段的评审产物，不保存实际执行结果。

## 目录规则

每个需求或评审迭代使用独立目录：

```text
reviews/
├── README.md
└── ITER-NNN-YYYYMMDDHHmmss/
    ├── hermes/                  # Hermes 测试设计交付物
    │   ├── test-design.md       # 测试设计说明
    │   ├── candidate-matrix.csv # 本轮候选用例
    │   ├── status.md            # Hermes 交接状态
    │   └── evidence/            # 设计验证证据，禁止放凭证
    ├── codex/                   # Codex 评审交付物
    │   ├── review-round-01.md   # Codex 第 1 轮评审
    │   ├── review-round-02.md   # 后续评审按轮次递增
    │   └── decision-log.md      # 规格冲突和用户决策记录
    ├── terminal-matrix.csv      # 多终端设计/执行范围矩阵
    └── FINAL_STATUS.md          # 是否达到 TEST_DESIGN_READY
```

## Hermes 应该放什么

Hermes 每轮完成的测试设计统一放在：

```text
reviews/ITER-NNN-YYYYMMDDHHmmss/hermes/
```

至少包含：

- `test-design.md`：测试目标、范围、用例层级、断言和执行策略；
- `candidate-matrix.csv`：本轮候选用例及 `COMMON / CLIENT_MATRIX / OS_MATRIX / AGENT_E2E / CROSS_PROCESS` 分类；
- `status.md`：当前状态、变更摘要、待 Codex 复核项；
- `evidence/`：源码、单测或设计验证证据，必须脱敏。

评审通过后，稳定的正式用例矩阵同步到 `test-cases/design/` 或 `test-cases/expanded/`；不要把 Hermes 的设计稿放到 `results/`。

## 三类目录边界

| 目录 | 负责内容 | 进入条件 |
|---|---|---|
| `reviews/.../hermes/` | Hermes 当前轮测试设计和候选用例 | 设计开始即创建 |
| `test-cases/design/`、`test-cases/expanded/` | 评审通过后的正式用例真源 | Codex 确认 `TEST_DESIGN_READY` |
| `results/ITER-.../` | 测试执行基线、日志、证据和结果 | 设计放行后才创建执行归档 |

## 保存范围

应保存：

- Hermes 提交的测试设计版本和变更摘要；
- Codex 每轮评审意见；
- 多终端覆盖矩阵；
- 规格冲突、用户决策和阻塞项；
- `TEST_DESIGN_READY` 最终放行结论；
- 指向测试用例母版、源码证据和执行入口的链接。

不应保存：

- 实际测试执行日志和原始证据；
- nightly 报告、客户端执行结果和资源清理记录；
- AK/SK、令牌或其他敏感凭证。

上述执行产物统一归档到：

```text
results/ITER-NNN-YYYYMMDDHHmmss/
```

评审完成后，只有达到 `TEST_DESIGN_READY` 的设计，才允许进入 `results/` 执行归档。
