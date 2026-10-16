# 录制回放（Record & Playback）

对齐 `test-panorama-plan.md §6.2-6.4` 的 AI 测试核心机制。

## 组成

| 文件 | 职责 |
|---|---|
| `recordings/serviceCatalog-v1.jsonl` | 录制基线：`id / prompt / expectedServices / expectedTools / orderSensitive` |
| `ux-replay.mjs` + `recordings/ux-baseline-v1.jsonl` | **体验（D11-39）回放**：场景 → spawn D11 夹具 → 采集用户可见文案 → 语义分类（见下节） |
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

### 体验回放（D11-39）

```bash
npm run test:ux-replay                                  # 回放（自动解析 hdk src：HUAWEICLOUD_DEVKIT_HOME / HDK_PATH / sibling ../hdk）
npm run test:ux-replay -- <插件 src> --record            # 重录基线（含敏感信息守卫：命中即拒写）
npm run test:ux-replay -- <插件 src> --json <path>       # 结构化汇总（供报告/看板消费）
```

结果落 `eval/replay/results/ux-replay-<ts>.csv`；退出码 `0` 无退化 / `1` 存在体验退化 / `2` 不可判定（夹具崩溃或全部 BLOCKED）。

- **文本来源**：场景夹具 sidecar（`result.json`）里各断言的 `actual` 拼接 —— 即夹具实际取到的用户可见文案。
  边界：若某夹具的断言 `actual` 只记录「位置清单」（如 D11-26 记录违规工具名），则该场景只能判「有无违规 / 违规项是否变化」，
  判不出具体文案措辞；这类场景在下面场景表中已标注。
- **场景定义在 `ux-replay.mjs` 的 `SCENARIOS`（规则唯一真源）**，基线 JSONL 只存文案快照（可重录，含 `sutVersion` + `recordedAt` 溯源）。

| 场景 | 用例 | 夹具 | 判据侧重 |
|---|---|---|---|
| `UX-NOLOGIN` | D11-1 | `d11-1-onboarding-first-touch.mjs` | 未登录引导文案（要求含正确根因 + 可执行下一步） |
| `UX-IAM401` | D11-12 | `d11-12-iam401-zh.mjs` | 401 凭据错误文案（中文 + 下一步） |
| `UX-CONFLICT` | D11-6 | `d11-6-conflict-dual-source.mjs` | 双来源冲突文案（含冲突根因） |
| `UX-TERMINOLOGY` | D11-26 | `d11-26-terminology.mjs` | 工具描述内部代号/英文整句（**位置清单口径**，见上边界） |
| `UX-SANDBOX-FAIL` | D11-35 | `d11-35-sandbox-unreachable-guide.mjs` | 沙箱排障文案（**环境门控**：无沙箱环境判 BLOCKED 不计入通过率） |

## 当前基线（2026-10-10）

EXP-E15（代金券）SEMANTIC_EQUIVALENT；EXP-E01~E14 MISSING_TOOL（serviceCatalog 中文意图路由
未命中，与 `run-eval.mjs` 的 21.4% MISS 基线一致——**被测对象已知缺陷**，非 harness 问题）。
回放用于持续量化该缺陷直至修复，`contract-unit-tests.yml` 的 `replay-trend` job 记录趋势、
不阻断合并。

## 体验文案分类口径（D11-39，`compare.mjs::classifyUxText`）

| 分类 | 含义 | 判定 |
|---|---|---|
| `SEMANTIC_EQUIVALENT` / `MINOR_FORMAT_CHANGE` | **PASS**：与基线语义等价 / 仅格式微差 | 复用既有 PASS 三态 |
| `MISLEADING_HINT` | 归因把用户带偏 | 命中误导词组，或（要求给根因时）缺正确根因关键词 |
| `INTERNAL_JARGON_LEAK` | 文案含内部代号 | S1/S2/S3、A+ C、`UX-R*`、`D*-*`、`cli-domain-id`、环境变量名 |
| `ENGLISH_RESIDUE` | 中文语境残留英文整句 | 连续英文 ≥ 6 词且以句末标点收尾 + 文本含中文 |
| `UNCLEAR_NEXT_STEP` | 缺可执行下一步 | 无命令形态（`hcloud`/`npx`/`huaweicloud_*`）也无动作指引（请执行/控制台…） |

分类前会先剥离**机器字段值**（`code/id/action/source/…` 键值对、`HDKIT_*` 错误码），避免把机器标识符误判为文案问题。

## 体验回放当前结论（2026-10-16，已知缺口态基线）

| SUT | 通过 | 体验退化 | BLOCKED |
|---|---|---|---|
| 1.1.8（正式版） | 2 | 2（`ENGLISH_RESIDUE` ×1、`UNCLEAR_NEXT_STEP` ×1） | 1 |
| 1.1.8-next.3（预发布） | 2 | 2（同上，**无新增退化**） | 1 |

- `UX-NOLOGIN` → `ENGLISH_RESIDUE`：未登录引导仍残留英文整句 `Huawei Cloud credentials are not configured.`（= 上游 #900 / UX-R1 已知缺口）。
- `UX-IAM401` → `UNCLEAR_NEXT_STEP`：401 文案为英文、未给中文可执行下一步（= D11-12 需求未实现）。
- 这两条是**需求缺口**而非 harness 故障；文案修复后本表应转 PASS，届时去掉 CI job 的 `continue-on-error` 即为硬门禁。
