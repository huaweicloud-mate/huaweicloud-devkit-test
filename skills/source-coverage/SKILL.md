---
name: source-coverage
description: "huaweicloud-devkit 源码能力 ↔ 用例覆盖核对：提取 src/*.mjs 的 export/CLI/env 能力清单 → 对照用例「关联工具/指引来源 实:/预期结果」→ 正确性核对(函数名/字段/错误码/常量) + 覆盖缺口识别(硬/弱分级) → 落用例(新ID+优先级+门禁更新)。Use when: 收到「覆盖核对」提示语，需核对测试用例是否覆盖源码能力、源码版本更新后补覆盖、发现设计字段与源码不符。"
version: 1.0.0
tags: [testing, huaweicloud, devkit, coverage, source-audit, test-design]
---

# huaweicloud-devkit 源码能力 ↔ 用例覆盖核对

对 huaweicloud-devkit 插件做**源码能力 vs 测试用例覆盖**的系统核对。完整测试设计流程见 `skills/test-design/SKILL.md`（本能力是其中「源码核对」环节的独立展开，可单独触发）。

## 触发语

```
覆盖核对                      # 全量核对所有维度
覆盖核对 <维度>               # 定向核对，如：覆盖核对 D2 / 覆盖核对 认证
```

出现「覆盖核对」即触发本能力。

## 前置

两仓库已 clone（源码仓 `../hdk/` 相对测试仓根），环境自检 `python scripts/prepare_env.py --update`。源码真源根 = `../hdk/plugins/huaweicloud-core/src/`。

## 一、源码文件地图（维度 → 源码真源）

| 维度 | 核心源码文件 |
|---|---|
| D1 安装/升级提醒 | `update-check.mjs`、`setup-cli.mjs`、`mcp-protocol.mjs`、`mcp-server.mjs` |
| D2 认证 | `auth/credentials.mjs`、`auth/reconcile.mjs`、`auth/service.mjs`、`auth/credential-validator.mjs`、`auth/agent-registration.mjs`、`auth/project-id.mjs`、`hcloud-probe.mjs` |
| D3 功能 | `search-market.mjs`、`icon-library.mjs`、`detect-framework.mjs`、`hcloud-cli.mjs`、`sandbox/session-manager.mjs` |
| D4 安全 | `risk-rule-engine.mjs`、`safety-policy.mjs`、`hooks/huaweicloud-safety.py`（Python hook） |
| D9 协议 | `mcp-server.mjs`、`mcp-server-remote.mjs` |
| D5/D6/D7/D8/D10 | `telemetry/agent-registry.mjs`、`telemetry/agent-detect.mjs`、`sandbox/*`、`koocli-version.mjs` |

## 二、核对四步

1. **提取源码能力清单**：搜 `^export (function|const|async function)` + 各文件顶层 `const [A-Z_]+`（常量）+ CLI `case 'xxx'`（setup-cli.mjs 子命令）+ `process.env.XXX`（环境变量）。
   ```bash
   grep -rE '^export (function|const|async function)' ../hdk/plugins/huaweicloud-core/src/   # Windows 无 grep 时用 Select-String 或 Git Bash 的 grep
   ```
2. **提取用例覆盖点**：设计级 CSV「关联工具」列（39 工具 + CLI 命令）+「指引来源」的 `实:xxx`（源码函数引用）。
3. **正确性核对**：用例引用的函数名是否真实存在；返回字段名/错误码/常量值是否与源码一致。
4. **覆盖率核对**：源码能力 − 用例覆盖 = 缺口；分级——**硬缺口**（完全未覆盖的独立能力）/ **弱缺口**（仅间接覆盖、无直接断言）。

## 三、已验证的稳定事实（避免重复核对，可直接采信）

- `fingerprint(ak, sk)` = `sha256(ak+sk).hex.slice(0,8)` —— **无冒号直接拼接**（`reconcile.mjs:28`），非 `ak:sk`。
- `getAuthStatus().reconciled` = `{stores:{s1Fingerprint, currentFingerprint, s3Fingerprint}, inconsistencies, hasRuntime, runtimeFingerprint, inconsistent}` —— **无 `s1/s2/s3.ready` 字段**。
- `detect-framework.mjs` `FRAMEWORKS` = **13 个框架键 + monorepo**；但工具描述 `tools.mjs:463` 只列 11 个且漏 Static Site（文档-vs-实现差异）。
- `restartMessage(target)` 有 `officeace` 特殊文案分支（`update-check.mjs:353`）。
- remote transport `DEFAULT_PORT = 9528`、`DEFAULT_HOST = 127.0.0.1`（`mcp-server-remote.mjs:8-9`）。
- `applyUpdateHint` 跳过 `huaweicloud_check_update`/`huaweicloud_upgrade`（`update-check.mjs:342`）。
- `decorateResult`/`updatePrewarm` 是**内部函数**（非导出），对外入口分别是 `dispatch`/`runStdioServer`。
- 常量：`TTL_MS=60*60*1000`、`FAIL_THROTTLE_MS=5*60*1000`、`COOLDOWN_DAYS=3`（`update-check.mjs:14-16`）。
- Node(`risk-rule-engine.mjs`) 与 Python(`huaweicloud-safety.py`) 读同一规则文件 `safety/rules/cloud-risk-rules.json`。

## 四、缺口落用例规范

- **ID**：按维度顺延（D1-59、D2-22、D3-C10、D4-25、D9-10...），一个硬缺口一用例、相关缺口可合并（如 env+路径）。
- **优先级**：硬缺口多 P2（边缘能力），核心协议/安全能力 P1。
- **字段**：指引来源必写 `实: 文件.函数(行号)`；预期结果基于源码精确行为（错误码/阈值/字段名）；关联工具用 39 工具简称或 CLI 命令。
- **门禁联动**：新增用例后 `verify_new.py` 的「设计级行数 == N」必须同步更新（落用例时 163→179）。
- **缺口清单**：`test-cases/coverage-gaps.md` 记录缺口 + 落用例映射，随核对累计。

## 五、交付纪律

- 只改生成器 `gen_matrix.py`（不手改 CSV），重跑 `gen_matrix.py` + `gen_tracing.py` + `verify_new.py`（exit 0）+ `scan_gaps.py`（GATE-PASS）。
- 定向验证用临时脚本逐条断言「新文本就位 / 旧文本零残留」，**跑完即删**。
- 核对结论二元记录：`已修正（正确性）` / `缺口（覆盖）`，不宣称「已核对」而无原子落点。

## 六、陷阱

- 函数名 vs 导出：源码里大量内部函数（`decorateResult` 等）**不导出**，用例「指引来源 `实:xxx`」引用它们不算错误，但要确认对外入口（`dispatch`/`runStdioServer`）写对。
- 常量/错误码要逐字符核对（`hex.slice(0,8)` 是 8 位、冒号拼接与否），一处差即断言失效。
- 改生成器后门禁行数断言必须同行更新，否则 `verify_new.py` 报行数不符。