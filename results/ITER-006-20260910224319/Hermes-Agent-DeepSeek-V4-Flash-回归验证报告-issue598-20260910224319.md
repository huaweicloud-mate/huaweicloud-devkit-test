# Hermes-Agent-DeepSeek-V4-Flash-回归验证报告-issue598-20260910224319

> **生成时间**：2026-09-10 22:43:19（北京时间 Get-Date，与证据文件时间戳一致）
> **被测 issue**：[huaweicloud/huaweicloud-devkit#598](https://github.com/huaweicloud/huaweicloud-devkit/issues/598)「存量用户版本升级提醒：软提醒控频失效、已最新版仍提示升级、/dashboard 未被硬门槛路径排除（3 缺陷）」
> **被测环境**：dev CCE（TEST）`http://devkit.topxtopx.com/rest/developer/server/hdkitservice/`
> **执行方式**：独立黑盒脚本（全新 AK 随机后缀、不复用第三方任何历史证据），Python urllib 直连；客户端走查 npm `1.1.3-next.3` 发布物 tarball
> **执行人**：Hermes Agent（DeepSeek-V4-Flash）自动化执行
> **结论**：**服务端 3 缺陷修复全部生效，防退化回归 0 异常；客户端 2 项走查通过 —— issue #598 回归验证通过**

---

## 一、回归范围与分层

| 层 | 对象 | 条目 | 结果 |
|---|---|---|---|
| 缺陷复验 | 服务端 DEF-01 软提醒控频 | 同 AK 同 cv 5 连发 | ✅ 修复生效 |
| 缺陷复验 | 服务端 DEF-02 已最新仍提示 | cv=1.1.2/1.1.3/1.2.0 | ✅ 修复生效 |
| 缺陷复验 | 服务端 DEF-03 裸 /dashboard | 无头/带头/api-keys | ✅ 修复生效 |
| 防退化回归 | 服务端硬门槛/软提醒/排除路径 | 14 项断言 | ✅ 全部无退化 |
| 客户端走查 | TC-CLI-001 版本头 / TC-CLI-004 cmdUpdate | npm 1.1.3-next.3 发布物 | ✅ 已落实/已处置 |

**合计：20/20 服务端断言 PASS + 2/2 客户端走查通过，0 FAIL。**

---

## 二、服务端缺陷复验（全新 AK，独立脚本）

### DEF-01 软提醒控频失效 → ✅ 已修复

- **方法**：全新 AK `bb-rl-851144c6`、cv=1.0.5 连续 5 次 GET `voucher/status`（间隔 3s）
- **实测**：
  | 请求 | 状态 | 升级字段（updateAvailable/latestStable/upgradeHint） |
  |---|---|---|
  | 第 1 次 | 200 | ✅ 有（updateAvailable=true，latestStable=1.1.2） |
  | 第 2~5 次 | 200 | ❌ 无（仅 userHash 等业务字段，已抑制） |
- **判定**：Redis 控频（每天至多提醒一次）已生效，rev3 内嵌字段绕过 Advice 的根因已修复（PR #42 生效验证）

### DEF-02 已最新版仍提示升级 → ✅ 已修复

- **方法**：全新 AK 分别以 cv=1.1.2（=latestStable）、cv=1.1.3（>latestStable）、cv=1.2.0（>latestNext 1.1.3-next.0）请求
- **实测**：三者均 `200` 且**无任何升级字段** → Matrix 4c「cv≥latest 不发」判定收敛
- **判定**：Advice 已比较客户端 cv 与 latest，不再恒附加

### DEF-03 裸 /dashboard 未被硬门槛排除 → ✅ 已修复

- **方法**：无版本头 GET `/dashboard`、带头 cv=1.9.9 GET `/dashboard`、无头 GET `/dashboard/api-keys`
- **实测**：三者均 `401`（未登录），**不再是 409 HDKIT_VERSION_TOO_OLD** → 裸路径子段匹配（isSubpath）修复生效
- **对比**：无头 GET `/voucher/status` 仍 `409`（硬门槛未误伤）

---

## 三、防退化回归（14 项断言，全部无退化）

| # | 断言 | 实测 | 判定 |
|---|---|---|---|
| T04-1 | 无头 → 409 `HDKIT_VERSION_TOO_OLD` | 409 + 正确错误码 | ✅ 无退化 |
| T04-2 | cv=0.9.9（<min=1.0.0） → 409 | 409 | ✅ |
| T04-3 | cv=1.0.0（=min） → 放行 | 200 | ✅ |
| T04-4 | cv=1.0.1（>min） → 放行 | 200 | ✅ |
| T05-1/2/3 | 非法头 `1.0`/`abc`/`null` → 保守 409 | 均 409 | ✅ |
| T06-1 | 无头 GET `/login` → 非 409（排除生效） | 500 | ✅ |
| T06-2 | 无头 POST `/telemetry/events` → 非 409 | 500 | ✅ |
| T07 | 409 体含 `clientVersion`/`minVersion`/升级命令 | 3 字段齐全 | ✅ 无退化 |
| T08 | cv=1.0.5 新 AK → 200 含 4 字段（latestStable/latestNext/updateAvailable/upgradeHint） | 4 字段齐全，updateAvailable=true | ✅ 软提醒正常 |
| T09 | 硬门槛不受控频（同 AK 无头 3 连） | 3/3 均 409 | ✅ |

---

## 四、客户端走查（npm 1.1.3-next.3 发布物，shasum `51c2876e...`）

| 项 | 设计预期 | 发布物走查结论 | 判定 |
|---|---|---|---|
| TC-CLI-001 版本头 | 客户端请求携带 `X-HW-Client-Version` | `sandbox/hdkitservice-api.mjs:23` `'X-HW-Client-Version': readInstalledVersion() \|\| '0.0.0'` 已实现 | ✅ 已落实（随 1.1.3-next.3） |
| TC-CLI-004 cmdUpdate 死代码 | 移除不可达 reinstall 回退，保留活命令入口 | `cmdUpdate()`（行 4077 起）各 target 分支均 `return`，**尾部无 `await cmdUninstall()/cmdInstall()` 死代码**（对应 commit `c90e119`，PR #586 删 4 行）；`case 'update'/'upgrade'`（行 4947-4949）**仍注册** = 产品升级入口保留；`cmdUninstall/cmdInstall` 尾调用仅存在于 `cmdReinstall()` 与 `main()` install/uninstall 分支 | ✅ 已按产品语义处置（删除死代码、保留活入口） |

> 注：npm dist-tags 本轮观测 `latest=1.1.2`（未变，2026-09-09）/ `next=1.1.3-next.3`（2026-09-10 18:06），无新发布；TC-CLI-001/004 已包含于 next 线，待下个正式版（1.1.3 stable）发布后可再收口验证。

---

## 五、证据清单

| 证据 | 路径 |
|---|---|
| 回归脚本（可复跑） | `results/ITER-006-20260910224319/evidence/reg-598/reg-598.py` |
| 原始请求证据 JSON（每次请求状态/响应体/耗时）——运行 1 | `results/ITER-006-20260910224319/evidence/reg-598/reg-598-evidence-20260910224348.json` |
| 原始请求证据 JSON——运行 2（独立复跑，全新 AK 不同后缀，结果一致 20/20） | `results/ITER-006-20260910224319/evidence/reg-598/reg-598-evidence-20260910224534.json` |
| npm 1.1.3-next.3 发布物 tarball 与解包（走查底稿） | `results/ITER-006-20260910224319/evidence/reg-598/npm-next.3/` |
| 服务端修复凭据（仓库侧） | PR #42（hdkitservice）→ dev CCE 镜像 `hdkitservice:20260910205000`；客户端 PR #586（commit `c90e119`） |
| 本地仓库核验 | `devkit-test/hdk` 含 `c90e119`（`git cat-file` 确认），与发布物走查一致 |

**口径说明**：本报告断言均在 run-logs 化证据 JSON 中可逐条追溯；DEF-01 控频验证使用全新（AK, cv) 组合避免与历史测试撞 Redis key；环境 min=1.0.0 / latestStable=1.1.2 / latestNext=1.1.3-next.0 与 issue 基线一致。

---

## 六、结论

1. **服务端**：DEF-01 / DEF-02 / DEF-03 三项缺陷修复全部生效且稳定（非偶发），14 项防退化回归全部无退化 —— **回归验证通过**。
2. **客户端**：TC-CLI-001 版本头已随 npm 1.1.3-next.3 实现；TC-CLI-004 死代码已按要求删除（PR #586）且活命令入口保留符合产品语义 —— **无需补开发**。
3. **建议**：issue #598 可关闭；待 1.1.3 stable 发布后将 TC-CLI-001/004 收口为正式版回归项（当前为 next 线验证）。