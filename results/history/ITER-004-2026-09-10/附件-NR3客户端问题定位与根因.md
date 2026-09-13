# NR3 客户端升级链路问题——定位过程与根因分析（附件）

> 归档：2026-09-10 21:05（北京时间）
> 关联合并问题单：#614（huaweicloud/huaweicloud-devkit）
> 覆盖：原独立单 #606（D1-55b）、#607（D1-43c）、#608（D1-46g）、#609（D1-29）、#610（remote 部署约束×3）
> 探测基线：huaweicloud-devkit 1.1.2@09a59b937eb3 / 1.1.3-next.2@c6c0965f0bdf；Node v22.23.2 / npm 10.9.8；Windows 10 x64 + Ubuntu 24.04 aarch64（testbot3）双平台
> 探针套件：evidence/nr3/{d1-unit-probe,d1-mcp-loop,d1-49-d1-55-ext}.mjs（受控 fixture registry，可复现）

---

## 1. D1-55b：升级提示按进程共享而非按会话隔离（P1，原 #606）

### 现象
同一 MCP server 进程内两组请求序列：A 会话首个工具调用消费 `_updateInfo`（拿到升级提示）；B 会话首个工具调用**拿不到提示**。dismiss 同样按 server 共享；发布新版本并重启后才恢复提醒。

### 定位过程
1. `d1-49-d1-55-ext.mjs` 构造 remote transport 双请求序列（A 消费 `_updateInfo` → B 首工具）→ A 消费后 B 返回中无 `_updateInfo`；
2. 协议探测：remote `initialize` 响应**无 `MCP-Session-Id` 头**，mcp-server-remote.mjs 为单请求无会话模型；
3. 源码定位：`grep hintConsumed plugins/huaweicloud-core/src/` → 命中 `mcp-protocol.mjs` **模块顶层 `let hintConsumed = false`**，首次工具调用 `decorateResult` 后置位、此后永不复位；
4. 双平台复现：Windows + Ubuntu 24.04 aarch64 同一断言均输出 `OBSERVED_SPEC_MISMATCH`。

### 根因
- `mcp-protocol.mjs` 的 `hintConsumed` 是**模块级单例**（进程级状态），无会话维度 key；
- remote transport 无 session 标识与状态绑定（HTTP 单请求模型），进程即会话边界；
- 设计文档承诺「会话中第一个 tool 调用附加」未在实现层落实。

### 影响与建议
多客户端/多会话共享 server 部署下提示消费互相吞掉；建议：hintConsumed 按会话 key（remote 补 `MCP-Session-Id` 或 stdio 按连接实例）隔离，或产品明确收敛为「进程级语义」并修订文档。

---

## 2. D1-43c：失败态 dismiss 返回伪 up_to_date 并写 current 伪冷却（P1，原 #607）

### 现象
registry 查询失败（注入 error500）时调用 `check_update` 带 `dismiss:true`：返回 `result=dismissed`/`updateAvailable=false`（伪 up_to_date 形态），且 skip 文件写入 **current 版本**（伪冷却，3 天）。

### 定位过程
1. `d1-mcp-loop.mjs` 四态契约测试：`/__set` 注入 `error500` → 调 check_update（dismiss:true）→ 断言返回值形态；
2. 返回 `dismissed`（设计上应为 `check_failed` 或明确「失败时 dismiss 无效」）——与正常 `check_failed` 态无法区分；
3. 读 skip 文件：`dismissedVersion` = current（1.1.2 或 1.1.3-next.2），`expireAt`=+3 天——**用户从未被告知有更新却进入冷却**；
4. 源码核对：update-check 的 dismiss 分支在 registry 查询失败路径之后仍执行（失败未阻断 dismiss 落盘，且版本兜底用 current）。

### 根因
失败态与 dismiss 组合缺少防御性校验：查询失败时应返回 `check_failed` 且**不落 skip**（或落 skip 但 dismissedVersion 置 null 语义=「跳过本次检测」而非「拒绝该版本」）。

### 影响与建议
真实用户丢失提醒机会；建议：#607 裁决两项——(a) 失败+dismiss → check_failed 且不写 skip；(b) 若保留 dismiss 语义，dismissedVersion 不得用 current（无版本可比）。

---

## 3. D1-46g：doQuery 异常直接 reject 上抛（P2，原 #608）

### 现象
`upgradePackage` 的 `doQuery` 依赖若 reject（registry/网络异常路径），异常向工具调用方**直接上抛**，非结构化返回。

### 定位过程
1. `d1-unit-probe.mjs` 用 `doQuery: async () => { throw new Error('boom') }` 注入 → 观察到异常穿透 upgradePackage 到达调用栈（无 check_failed 封装）；
2. 对比同文件其他路径：check_update 的 doQuery 失败均已封装为 `check_failed`/null 返回（D1-39 系列），upgrade 路径是唯一未封装点。

### 根因
upgradePackage 内 doQuery 调用点缺失 try/catch 封装（周边路径有封装，此路径遗漏）。

### 影响与建议
Agent/调用方收到裸异常；建议与 #607 一并裁决：统一封装为 `check_failed` 结构返回。

---

## 4. D1-29：pre 发布线提醒策略文档口径缺失（P3，原 #609）

### 现象
设计文档未定义 pre（next 订阅）用户的提醒策略；实现按用户当前发布线过滤 tag（pre 用户仅提醒 next 线最新版，latest 线变化不提醒）。

### 定位过程
1. `d1-unit-probe.mjs` tag 路由断言（spawn 记录器验证 `huaweicloud-devkit@next` vs `@latest`）；
2. 跨线观察：pre 用户在 latest 线发布新版本时无 dist-tags 变化触发（doQuery 按当前线 tag 查询）。

### 根因
文档未定义双线策略；实现对「用户当前线」的单一 tag 路由是合理默认，但 pre 用户可能错过 latest 线安全/紧急修复提醒。

### 影响与建议
产品明确策略（按当前线 / 双线提醒 / 可配置）并补文档；实现与文档对齐。

---

## 5. remote transport 部署约束 3 项（P3，原 #610）

### 现象与定位

**5.1 无 updatePrewarm（D1-55c2）**
- 定位：`d1-49-d1-55-ext.mjs` remote 段——仅调普通工具（不先 check_update）时响应中永不出现 `_updateInfo`；源码核对 mcp-server-remote.mjs 无 prewarm 调用点（stdio transport 有）。
- 根因：remote 为单请求解码+装饰模型，未实现 stdio 的 prewarm 机制。
- 影响：远程部署的「第二层兜底」（首工具附带提示）不可达，须先调 check_update。

**5.2 dismiss skip 按 server 进程共享（D1-55d）**
- 定位：remote 双请求序列中 A dismiss 后 B 的 check_update 立即返回 dismissed；skip 路径 `join(baseHome(), '.config/huaweicloud/devkit-skip.json')` 为进程内单 HOME 单文件。
- 根因：单进程单 HOME 部署下 skip 为部署级状态，无会话/用户维度。
- 影响：多用户共享部署需每用户独立 HOME/进程才可隔离。

**5.3 cachedDistTags 外部变更不同步（D1-55e2）**
- 定位：`d1-49-d1-55-ext.mjs` 外部改 dist-tags（/__set）后同进程内 check_update 仍返回旧 latest；源码确认 `cachedDistTags` 模块级缓存 TTL 1h（或重启才刷新）。
- 根因：进程级缓存设计（避免重复 npm view）。
- 影响：新版本发布后至多 1h 内提醒滞后（设计行为，记录为部署约束）。

---

## 附件引用（GitHub 链接）
- 附件本体（定位与根因报告）：https://github.com/huaweicloud-mate/huaweicloud-devkit-test/blob/main/results/ITER-004-2026-09-10/%E9%99%84%E4%BB%B6-NR3%E5%AE%A2%E6%88%B7%E7%AB%AF%E9%97%AE%E9%A2%98%E5%AE%9A%E4%BD%8D%E4%B8%8E%E6%A0%B9%E5%9B%A0.md
- 探针原始日志（Windows）：https://github.com/huaweicloud-mate/huaweicloud-devkit-test/tree/main/results/ITER-004-2026-09-10/evidence/nr3/run-logs/
- Linux 补跑日志：https://github.com/huaweicloud-mate/huaweicloud-devkit-test/tree/main/results/ITER-004-2026-09-10/evidence/nr3/linux-logs/
- 执行记录（裁决清单 §八、观察 §三）：https://github.com/huaweicloud-mate/huaweicloud-devkit-test/blob/main/results/ITER-004-2026-09-10/NR3%E7%89%88%E6%9C%AC%E5%8D%87%E7%BA%A7%E6%8F%90%E9%86%92-%E8%A1%A5%E5%85%85%E6%89%A7%E8%A1%8C%E8%AE%B0%E5%BD%95.md
- 测试报告：https://github.com/huaweicloud-mate/huaweicloud-devkit-test/blob/main/results/ITER-004-2026-09-10/Hermes-Agent-DeepSeek-V4-Flash-%E6%B5%8B%E8%AF%95%E6%8A%A5%E5%91%8A-20260910205303.md