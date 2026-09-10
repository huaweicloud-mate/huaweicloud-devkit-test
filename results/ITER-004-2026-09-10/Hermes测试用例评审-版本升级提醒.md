# Hermes 测试用例评审：版本升级提醒

> 评审对象：`hdk/docs/version-upgrade-design.md` 对应的 Hermes 用例 D1-26~D1-40  
> 评审范围：`C:\Users\Administrator\devkit-test` 全量测试资产、ITER-004 执行证据，以及当前 `hdk` 实现与单测  
> 评审结论：**可以继续让 Hermes 完善用例并执行，但必须按下述口径修正结果。**

## 一、总体判断

Hermes 的测试方向是正确的，已经覆盖版本判断、冷却、缓存、兜底、升级语义和 Windows `npm.cmd` 问题。但当前结果不能直接表述为“逻辑层完整、14/15 通过”：

- 15 条设计级用例均有执行留痕；
- 更准确的当前结果是：**13 条达到现有断言预期，1 条发现设计与实现不一致，1 条 Windows P0 失败**；
- D1-31、D1-34、D1-36、D1-37、D1-38、D1-40 等主要是函数级、源码级、mock 级或当前环境观察，尚未形成完整用户闭环证据；
- NR3 在原展开级矩阵中没有客户端/会话展开，展开级覆盖仍为 **0/15**；
- D1-29 在设计文档未裁决前不能同时算“通过”和“差异观察”；D1-40 当前没有构造真实镜像 lag，只能标记为未充分执行或 BLOCKED。

## 二、必须保留的发现

| 优先级 | 发现 | 处理 |
|---|---|---|
| P0 | Windows 下 `npm.cmd` 检测链出现 `EINVAL`，`check_update` 静默落入 `check_failed`，存量用户收不到提醒 | 保留并关联 #554；修复后重跑检测和真实 MCP |
| P1 | `dismiss:true` 没有真实 MCP 闭环证据，未证明 skip 文件落盘和重启进程后仍生效 | 补 D1-42 |
| P1 | 兜底只验证 `applyUpdateHint`，未验证同一 MCP 会话“首个非检查工具一次性消费” | 补 D1-45 |
| P1 | 升级只做 mock，未验证真实命令、目标 agent、文件同步、失败恢复和重启生效 | 补 D1-49~52 |
| P1 | 镜像 lag 场景没有固定夹具；当前源一致不等于 lag 场景通过 | 补 D1-53 |
| P1 | `getCachedUpdateInfo` 的 TTL 边界、Promise reject、失败后恢复未覆盖 | 补 D1-46 |
| P2 | 同一 server 多会话的 `hintConsumed`、缓存和 dismiss 隔离未验证 | 补 D1-48、D1-55 |

## 三、已补入矩阵的用例

已在唯一真源 `test-cases/design/gen_matrix.py` 中新增 D1-41~D1-55，并重新生成：

| 文件 | 结果 |
|---|---|
| `test-cases/design/用例矩阵-设计级.csv` | 153 条 |
| `test-cases/expanded/用例矩阵-展开级.csv` | 107 条，现阶段仍未展开 NR3 客户端矩阵 |

新增用例覆盖：

- 真实 MCP `check_update` 返回契约；
- dismiss 持久化、参数边界和跨进程复查；
- 冷却时间精确边界；
- 兜底一次性消费和预热竞态；
- cache TTL、失败节流、Promise 异常恢复；
- current 版本变化后的缓存重算；
- 多 agent / 多进程路径隔离；
- upgrade handler 守卫、命令参数、失败恢复、真实隔离升级；
- 可控 registry 的镜像 lag；
- Hermes 真实会话行为和多会话隔离。

## 四、Hermes 下一轮执行要求

1. 先固定测试对象：分别记录 1.1.2、dev、next 的 commit、package 版本、执行时间和命令；证据脚本不能只动态指向当前工作副本。
2. 优先执行 D1-39、D1-41、D1-42、D1-45、D1-49、D1-53；其中 D1-39 修复前应保留 FAIL 证据。
3. 使用隔离 `HOME`、npm cache 和 plugin 目录；真实升级只能在一次性环境执行，不能污染日常安装。
4. 真实 MCP 链路至少包含：
   `initialize → tools/list → check_update → 普通工具第一次调用 → 普通工具第二次调用 → dismiss → 再次 check_update`。
5. 报告中严格区分 `PASS`、`SPEC-MISMATCH`、`FAIL`、`BLOCKED`，不要把 mock 通过写成真实升级通过。
6. D1-29 先让开发确认 prerelease 规则，再决定更新设计文档还是调整实现和预期。
7. D1-40 必须注入滞后 dist-tags；只观察当前镜像与官方源一致不能作为通过依据。

## 五、验收建议

在 #554 修复、D1-42/D1-45 真实 MCP 闭环、D1-52 隔离升级和 Hermes 会话验证完成前，建议结论保持：

> **条件验收，不建议按完整版本升级提醒能力通过发布验收。**

函数级主路径已经有较好基础，但 Windows 主平台和真实用户闭环仍是发布阻断项。
