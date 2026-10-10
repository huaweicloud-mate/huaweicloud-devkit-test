# FINDINGS — huaweicloud-devkit 每日测试缺陷清单

- 测试日期: 2026-10-10
- 客户端: Hermes (GLM-5.2)
- OS: Windows

## 缺陷列表 (13 项)

### 缺陷 1: Windows spawnSync('npm.cmd') EINVAL — 升级检测链静默失败

- **级别**: P0
- **关联用例**: D1-39, EXP-NR3-09
- **描述**: Windows 下 `spawnSync('npm.cmd', [...])` 不加 `shell:true` 时返回 `error.code === 'EINVAL'`，导致升级检测链静默失败。加 `shell:true` 后正常工作。
- **唯一断言**: `spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'])` 返回 `error.code === 'EINVAL'` (无 shell:true)；加 `shell:true` 后 `status === 0` 且返回有效 JSON。
- **根因**: `plugins/huaweicloud-core/src/update-check.mjs` — `queryDistTagsSync` 调用 `spawnSync('npm.cmd')` 时未传 `shell: true`，Windows 上 `npm.cmd` 是批处理文件，Node.js 无法直接 spawn。
- **证据**: `evidence/D1-39/stdout.log`, `evidence/EXP-NR3-09/stdout.log`

### 缺陷 2: serviceCatalog 中文意图路由未命中 (11 条 MISS)

- **级别**: P1
- **关联用例**: EXP-E01, EXP-E02, EXP-E03, EXP-E04, EXP-E05, EXP-E07, EXP-E10, EXP-E11, EXP-E12, EXP-E13, EXP-E14
- **描述**: `serviceCatalog(intent)` 对 11/15 条中文意图返回通用帮助消息（`Run hcloud --help to list available services.`）或错误服务，路由准确率仅 21.4%（HIT=3, MISS=11, N/A=1）。
- **唯一断言**: `serviceCatalog('帮我查一下我账号在华北北京四有哪些云主机')` 返回 `recommendedServices` 不含 `ECS`；期望应包含。
- **根因**: `plugins/huaweicloud-core/src/tools.mjs:1815` `serviceCatalog` 函数对中文意图的关键词匹配覆盖不足，多数意图未命中服务关键词。
- **证据**: `evidence/EXP-E01/stdout.log` ~ `evidence/EXP-E15/stdout.log` (eval harness 全量结果)
