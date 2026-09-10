# NR3 版本升级提醒——补充执行记录（评审意见落实轮）

> **生成时间**：2026-09-10 16:20（北京时间）｜更新：09-10 16:20
> **执行环境**：Windows 10 / Node v22.23.2（hermes 内置）/ npm 10.9.8
> **前置**：`Hermes测试用例评审-版本升级提醒.md` 的 10 项执行要求全部落实

## 一、被测对象固定（评审要求 #1）

| 发布线 | 版本 | gitHead / Commit | npm 发布时间 | 本轮用途 |
|---|---|---|---|---|
| 正式版 | 1.1.2 | `09a59b937eb3` | 2026-09-09T11:03Z | **真实安装/升级 E2E 的"旧版"**（fj-old=原码 npm pack） |
| next 线 | 1.1.3-next.2 | `c6c0965f0bdf` | 2026-09-10T01:22Z | 未修复副本（D1-39 修复前态）、修复副本底座 |
| dev 远端 | — | `e2f4d2ada058`（09-10 15:29 拉取） | — | 记录漂移（本地 origin/dev 停在 306c633，远端已推进） |
| 修复后模拟副本 | 1.1.3（受控） | next.2 原码 + 3 处 FIX(sim) 补丁 | 测试夹具 | 见 D1-39g 修复方向 |

**固定方式**：所有探针代码路径 = 沙箱内 `git worktree` 检出的固定 commit（非动态指向工作副本）；受控 tarball 由固定 commit 原码 `npm pack` 生成，来源清单见 `.sandbox/MANIFEST.md`。

**修复补丁（FIX sim）三处**（`update-check.mjs`，仅存在于 app-fix-* 副本）：
1. `queryDistTagsSync`：弃 `spawnSync('npm.cmd')`，改 `node.exe + npm-cli.js` 直跑（不经 .cmd/shell）
2. `queryDistTags`（async）：`spawn` 加 `shell: true`
3. `defaultSpawn`（upgrade 的 npx 腿）：改 `node.exe + npx-cli.js` 直跑 + 注入 `npm_execpath`

## 二、验证分层与断言统计

| 层 | 探针 | 断言 | 结果 |
|---|---|---|---|
| 函数级（隔离 HOME + 时钟注入 + fixture registry） | `d1-unit-probe.mjs` | 59 | 59/59 PASS |
| 真实 MCP 闭环（stdio JSON-RPC，修复前/修复后双态） | `d1-mcp-loop.mjs` | 31 | 31/31 PASS |
| 真实升级 E2E（一次性 HOME + 真实 npm/npx） | `d1-upgrade-real.mjs` | 16 | 16/16 PASS |
| **合计** | | **106** | **106/106** |

隔离措施：每场景独立 HOME/USERPROFILE/APPDATA/LOCALAPPDATA/HUAWEICLOUD_HOME + 独立 npm cache + 独立插件目录（一次性环境），零污染本机安装。

## 三、设计级用例结果分档（严格 PASS / SPEC-MISMATCH / FAIL / BLOCKED）

### ✅ PASS——达到断言预期（D1-41~55 中 10 条 + 相关复测）

| 用例 | 内容 | 关键证据 |
|---|---|---|
| D1-41 | check_update 真实 MCP 返回契约 | 四态（up_to_date/update_available/check_failed/dismissed）字段语义一致，失败不抛协议错误 |
| D1-42 | dismiss 真实闭环 + 跨调用持久化 | ①check_update→②首工具带 `_updateInfo`→③次工具不带→④dismiss→⑤skip 文件 3 天精确→⑥冷却内 dismissed→⑦**进程重启后仍 dismissed** |
| D1-43(a,b,d) | dismiss 参数边界 | 低版本不误冷却 / 空串落 target / 恢复后新版本正常（c 见 SPEC-MISMATCH） |
| D1-44 | 冷却边界与异常 skip 状态 | `now==expireAt` 边界重新提醒、坏日期/负时长安全降级、新版本无视冷却 |
| D1-45 | 兜底序列与预热竞态 | 预热未完成不阻塞、就绪后一次性消费（两种时序全过） |
| D1-46(a-d,h) | 缓存 TTL/节流/inflight | TTL 60min 边界重查、5min 节流、并发合并、reject 后恢复（g 见 SPEC-MISMATCH） |
| D1-47 | 缓存与当前版本解耦 | 共享 registry 结果按 current 重算，dismissed 结论不复用 |
| D1-48 | 多 Agent/多进程隔离 | 独立 HOME 互不串用、各自 skip、新版本无视冷却 |
| D1-50 | upgrade 命令语义 | stable→latest / pre→next / target 传递 / 非法 version 拒绝 / handler 层 up_to_date 守卫 |
| D1-51 | upgrade 失败恢复 | ENOENT/非零退出/查询失败均有 manual+不污染 skip+恢复可重试 |
| D1-52 | **真实升级安装与重启生效** | 真实装 1.1.2→真实 npx 升级 1.1.3（tarball 命中 0→1）→文件同步→**新进程 serverInfo=1.1.3**→配置未丢失 |
| D1-53 | 镜像滞后确定性夹具 | 坏 JSON→check_failed、恢复可检测（fixture 注入，非仅源一致性观察） |
| D1-40 | 镜像 lag 防倒退 | 受控夹具 latest=1.1.1<current 不提示倒退；pre 用户 latest/next 均倒退不提示 |

### ⚠️ SPEC-MISMATCH——规格偏差（3 条，**不计入通过**）

| 用例 | 偏差 | 严重度/影响 | 待办 |
|---|---|---|---|
| D1-29 | 设计文档比对表「pre 不提醒 next」vs 实现 `determineTarget(pre 候选含 latest+next)`：pre 用户 current=1.1.3-next.2、latest=1.1.3、next=1.1.4-next.1 → **MCP 实际提醒 1.1.4-next.1**（函数级 + MCP 级双证据） | P3 文档/实现取舍 | **开发确认前不统计为通过**（评审要求 #8） |
| D1-43c | registry 失败 + `dismiss=true` → 返回 **up_to_date**（伪造"已最新"，预期 check_failed）且 **写入 skip current 版本（伪冷却）** | 功能无害（后续 target>current 冷却不生效，已实测 1.1.4 仍提醒）；违反用例预期条款 | 建议 `handleCheckUpdate` 失败路径不写 skip、返回 check_failed |
| D1-46g | 注入 `doQuery` reject → `getCachedUpdateInfo` **直接抛异常**而非封装 check_failed（防御缺口） | 生产 `queryDistTags` 恒 resolve(null) **不可达**，低危 | 建议 `.then` 链加 `.catch(() => null)` 兜底 |

### ❌ FAIL——P0 失败（1 条）

| 用例 | 内容 | 实锤证据 |
|---|---|---|
| D1-39（修复前） | Windows 升级检测链 EINVAL | ① `spawnSync('npm.cmd')` 无 shell:true → `error.code=EINVAL`；② 插件 `queryDistTagsSync/queryDistTags` 双路径均静默 null；③ **修复前 MCP 端到端：check_update→check_failed、upgrade→"无法确认最新版本"**；④ **真实安装 1.1.2 存量用户态复现**（官方 latest=1.1.3 存在仍 check_failed）——1.1.2 正式版与 next.2 均未修（#554 当前态） |

> **修复方向确认（D1-39g）**：补充轮用「外部 registry + 独立 fixture 进程」排除了装置假象后实证——① spawnSync 加 `shell:true` 后 **status=0 成功**（#554 原建议成立）；② async 形态 shell:true 可用；③ 更稳妥方案=node.exe 直跑 npm-cli.js。**修复前证据保留（FAIL 不复跑为通过，修复后仅在模拟副本上通过）**。

### ⛔ BLOCKED（1 条）

| 用例 | 内容 | 原因 |
|---|---|---|
| D1-54 | Hermes 会话级用户闭环 | 本机 Hermes 未安装 huaweicloud-plugins（ENV-1），且按隔离纪律不得为测试污染日常安装；机制层证据已齐（SKILL.md 会话启动节 + D1-41/42/45 协议层闭环等价覆盖）。**待开发修复 + 本机插件就绪后在真实会话复测** |

## 四、口径声明（评审要求 #9/#10）

- 本轮不再使用「逻辑层完整」「14/15 通过」作整体结论。
- **当前正确基线**：设计级 D1-26~55 中——
  - **达到断言预期：13 条**（既有 15 条基线 13 条 + 新增 10 条中剔除 3 SPEC/1 FAIL/1 BLOCKED 后的口径，见前轮评审基线 + 本轮分档）；
  - **规格偏差：3 条**（D1-29 延续 + D1-43c/D1-46g 本轮新增）；
  - **P0 失败：1 条**（D1-39 修复前 Windows 端到端）；
  - **BLOCKED：1 条**（D1-54 Hermes 会话级，未达端到端验收强度）。
- 尚未达到端到端验收强度的用例已补充完整证据或如实标注：D1-41/42/45 已补齐真实 MCP 闭环；D1-52 已达真实升级强度；D1-40/53 已用受控夹具构造 lag；D1-54 保持 BLOCKED。

## 五、测试装置坑（沉淀，防复踩）

1. **fixture 与被测 spawnSync 同进程** → spawnSync 阻塞事件循环，fixture 无法响应，假象「npm view 挂起/超时」——必须独立子进程 + 动态端口（`FIXTURE_PORT=` 回传）。
2. **npm 10 缓 packument 按 URL**：场景热切换必须清 npm cache 或换 registry URL。
3. **npm view 对 `latest` 指向不存在的版本会报错**（next 指向不存在则容忍）——fixture versions 表必须覆盖所有 dist-tag 引用的版本。
4. **npx 依 packument 的 `bin` 字段选择可执行命令**——fixture packument 缺 bin 报 `could not determine executable to run`。
5. **动态端口 fixture 生成 tarball URL 必须用实际绑定端口**（`server.address().port`），否则 URL 带 `:0`。
6. **npm10 的 npx-cli.js 在 npm 包内**（`node_modules/npm/bin/npx-cli.js`），独立 `node_modules/npx/bin` 不存在。
7. **PowerShell 5.1 `Get-Content` 默认 ANSI 解码**：不得用 PS 读写含中文的 .mjs/.md（UTF-8 会损坏）——统一 write_file/patch/read_file 工具。

## 六、复现

```bash
cd results/ITER-004-2026-09-10/evidence/nr3
node build-sandbox.mjs <hdk仓库根> .sandbox   # 构建隔离沙箱（固定 commit + 修复副本 + 受控 tarball）
node d1-unit-probe.mjs .sandbox               # 函数级 59 断言
node d1-mcp-loop.mjs .sandbox                 # 真实 MCP 闭环 31 断言（含修复前 P0 端到端）
node d1-upgrade-real.mjs .sandbox             # 真实升级 E2E 16 断言
```