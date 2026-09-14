# 开发设计方案存档（上游输入）

本目录存档**开发侧**提供的 huaweicloud-devkit 设计方案（原始稿，**原样留档不改写**），作为 Hermes 测试设计的**输入依据**。

## 定位

- 本目录 = **上游输入**（开发侧设计文档），与测试侧自产文档（docs/ 下 01~06）分层，呼应仓库红线「与上游解耦」「版本化可追溯」。
- 后期据此做测试设计：按 `skills/test-design/SKILL.md`（测试设计能力）从这里读设计文档。

## 目录结构

```
upstream-designs/
├── README.md                 # 本文件
└── <版本号或功能名>/          # 按版本/功能归档
    └── <开发设计方案>.md      # 开发侧原始稿（原样留档）
```

## 与测试资产的下游对应（输入 → 输出）

| 环节 | 落点 |
|---|---|
| 开发设计方案（本目录） | `docs/upstream-designs/<版本>/` |
| 测试设计评审 | `reviews/ITER-<NNN>-<YYYYMMDDHHmmss>/`（Hermes 产初版 → Codex 评审至 `TEST_DESIGN_READY`） |
| 用例真源（演进） | `test-cases/design/` + `expanded/`（生成器 + 门禁，字节级可复现） |
| 版本冻结快照 | `test-cases/versions/<版本>/`（迭代测试设计.md + CSV 快照） |
| 测试验证 | `results/<客户端>/<日期>-<IP>/<OS>/` |

## 命名规则

- 子目录名用稳定版本号（如 `v1.1.4`）或功能 slug（如 `auth-reconcile`）。
- 文件名保留开发侧原始命名（原样留档，不改写）。
- 时间戳规范同全仓：文档正文 `YYYY-MM-DD HH:mm:ss`，文件名/目录紧凑 `YYYYMMDDHHmmss`。