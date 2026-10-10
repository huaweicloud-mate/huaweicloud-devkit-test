# 录制回放（Record & Playback）

对齐 `test-panorama-plan.md §6.2-6.4` 的 AI 测试核心机制。

## 组成

| 文件 | 职责 |
|---|---|
| `recordings/serviceCatalog-v1.jsonl` | 录制基线：`id / prompt / expectedServices / expectedTools / orderSensitive` |
| `compare.mjs` | 语义差异分类器（纯函数，无 IO）：对实际调用序列 ↔ 基线做比较，输出分类结论 |
| `replay.mjs` | 回放驱动：加载基线 → spawn mcp-server → 逐条调 `huaweicloud_service_catalog(intent)` → 分类 → 落盘 CSV |

## 差异分类口径（§6.4）

| 分类 | 含义 | 判定 |
|---|---|---|
| `SEMANTIC_EQUIVALENT` | 序列完全一致 | PASS |
| `ORDER_CHANGE` | 集合一致但顺序不同（顺序无关场景） | PASS |
| `MINOR_FORMAT_CHANGE` | 差异无法归类但非缺失/多出/泄漏 | PASS |
| `MISSING_TOOL` | 缺少基线中要求的调用 | FAIL |
| `UNEXPECTED_TOOL` | 多出基线外的调用（体系漂移） | FAIL |
| `SECRET_LEAK` | 输出含敏感信息（AK/SK/token/password） | FAIL |
| `BASELINE_INVALID` | 基线/实际序列为空（fail-closed） | FAIL |

PASS = `SEMANTIC_EQUIVALENT | ORDER_CHANGE | MINOR_FORMAT_CHANGE`（`isPass()`）。

## 运行

```bash
# 传 mcp-server 路径，或设置 HDK_PATH / HUAWEICLOUD_DEVKIT_HOME / sibling ../hdk
node eval/replay/replay.mjs [mcp-server.mjs 路径] [--recording ...] [--outdir ...]
# npm 快捷方式
npm run test:replay
```

结果落 `eval/replay/results/replay-<ts>.csv`，退出码：全部通过=0，任一失败=1。

## 当前基线（2026-10-10）

EXP-E15（代金券）SEMANTIC_EQUIVALENT；EXP-E01~E14 MISSING_TOOL（serviceCatalog 中文意图路由
未命中，与 `run-eval.mjs` 的 21.4% MISS 基线一致——**被测对象已知缺陷**，非 harness 问题）。
回放用于持续量化该缺陷直至修复，`contract-unit-tests.yml` 的 `replay-trend` job 记录趋势、
不阻断合并。