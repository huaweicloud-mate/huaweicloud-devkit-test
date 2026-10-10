# FINDINGS — Hermes Windows 每日测试 2026-10-11

## 缺陷 1: Windows spawnSync EINVAL (P0)

- **用例**: D1-39, EXP-NR3-09
- **级别**: P0
- **描述**: Windows 下 `spawnSync('npm.cmd', args, { encoding, timeout, windowsHide })` 不带 `shell: true` 触发 EINVAL 错误，导致升级检测链静默失败
- **断言**: `r.error.code === 'EINVAL'` 且 `r.status === null` (期望无 error 且 status=0)
- **根因**: `plugins/huaweicloud-core/src/update-check.mjs` `queryDistTagsSync` 函数，Windows 下 `npm.cmd` 是批处理文件，`spawnSync` 不带 `shell: true` 无法执行
- **修复方向**: 在 `queryDistTagsSync` 的 `spawnSync` 选项中添加 `shell: true`
- **关联 issue**: #554
- **证据**: `evidence/D1-39/stdout.log`, `evidence/EXP-NR3-09/stdout.log`

## 缺陷 2: serviceCatalog 中文意图路由 MISS (P1, 已知基线)

- **用例**: EXP-E01, EXP-E02, EXP-E03, EXP-E04, EXP-E05, EXP-E07, EXP-E08, EXP-E10, EXP-E11, EXP-E12, EXP-E13, EXP-E14
- **级别**: P1
- **描述**: serviceCatalog 路由层对 15 条中文意图评测集命中率仅 21.4% (3/15 HIT)，大部分意图返回 generic help 消息而非路由到对应华为云服务
- **断言**: 15 条意图中 12 条 MISS/N/A (期望 HIT)
- **根因**: `plugins/huaweicloud-core/src/mcp-server.mjs` `serviceCatalog` 路由逻辑对中文自然语言意图识别能力不足
- **证据**: `eval/results/eval-run-20261010020740.csv`, 各 `evidence/EXP-E*/stdout.log`

## 缺陷 3: D2-10 KooCLI profile 环境依赖 (P1)

- **用例**: D2-10
- **级别**: P1
- **描述**: `resolveManagedProfile()` 返回空，因本机无 KooCLI profile 配置
- **断言**: `hasProfiles === false` (期望 true)
- **根因**: `auth/reconcile.mjs:44` `readKooCliProfiles()` 读 `~/.hcloud/config.json`，本机无该文件
- **证据**: `evidence/D2-10/stdout.log`

## 缺陷 4: D2-16 import 文件擦除功能缺失 (P1)

- **用例**: D2-16
- **级别**: P1
- **描述**: `auth/reconcile.mjs` 无 import 文件擦除函数导出
- **断言**: `hasImport === false` (期望 true)
- **根因**: `auth/reconcile.mjs` 模块未导出 import 文件擦除逻辑
- **证据**: `evidence/D2-16/stdout.log`

## 缺陷 5: D3-A1 skill 检索完整性不足 (P1)

- **用例**: D3-A1
- **级别**: P1
- **描述**: `search-market.mjs` 仅检索到 1 个技能，需 ≥20 才覆盖完整
- **断言**: `skillCount === 1` (期望 ≥20)
- **根因**: 环境依赖 — 本机 hdk 技能目录仅含少量 SKILL.md
- **证据**: `evidence/D3-A1/stdout.log`

## 缺陷 6: D3-S1 serviceCatalog 不可源码直调 (P1)

- **用例**: D3-S1
- **级别**: P1
- **描述**: `tools.mjs` 无独立 `serviceCatalog` 导出，需通过 MCP 协议调用
- **断言**: `hasServiceCatalog === false` (期望 true)
- **根因**: 探针限制 — serviceCatalog 是 MCP 工具内部路由逻辑
- **证据**: `evidence/D3-S1/stdout.log`

## 缺陷 7: D6-3 MCP 冷启时间不可源码度量 (P2)

- **用例**: D6-3
- **级别**: P2
- **描述**: `mcp-server.mjs` 导出为 0，源码级导入无法度量进程启动时间
- **断言**: `hasServer === false` (期望 true)
- **根因**: 探针限制 — 需 spawn 子进程才能度量冷启时间
- **证据**: `evidence/D6-3/stdout.log`
