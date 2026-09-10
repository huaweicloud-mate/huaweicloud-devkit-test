# ITER-004-2026-09-10 变更影响分析（T0.5）

> 基线：`608b120`（1.1.2-next.4）→ `306c633`（dev @ 2026-09-10）
> 规模：24 commits / 19 文件 +728/−32（`git diff 608b120..origin/dev --stat`）

## 一、变更主题 → 影响维度映射

| # | 变更主题 | 涉及文件 | 影响用例维度 | 风险等级 |
|---|---|---|---|---|
| 1 | **auth: project-id 自动解析**（新增 project-id.mjs，hcloud spawn 无 shell） | auth/project-id.mjs(+68)、auth/service.mjs、setup-cli.mjs(+13)、tools.mjs(+80) | D2 凭证/认证、D5 工具面、auth_switch 链路 | ⚠️ 高（认证核心路径改动；tools +80 需 D5-3 工具枚举复跑） |
| 2 | **auth: 凭证注入沙箱前校验 + 自动 set project_id**（#259/#262） | auth/service.mjs、test/credential-validator.test.mjs(+104) | D2-17 非 TTY 守卫、R 规则链、hook 预检 | ⚠️ 高（可能影响 auth_init/auth_sync 行为语义） |
| 3 | **telemetry: proxy 路由 + 客户端分类 + userHash 重生成 + 捕获限界/重试隔离** | telemetry/*.mjs(+60 左右)、proxy/proxy-agent.mjs(+7) | D6 观测性、隐私合规、失败隔离 | 中（新增 telemetry.test.mjs +52） |
| 4 | **docs: #518 镜像滞后回退官方源说明**（#566） | README 相关 | D8 文档一致性 | 低（文档侧，D8-1 检查项 ④ 分支同步需复跑） |
| 5 | 测试补充：credential-validator/project-id/telemetry/hook-plugin/tools | test/*.mjs(+310) | T1 上游单测 | 低 |

## 二、受影响用例集（映射）

- **必测（受影响）**：
  - D2 凭证/认证族：auth_init/auth_sync/auth_status/auth_switch（project-id 解析与凭证预校验改动直接落在这些工具路径）
  - D5-3 工具枚举：tools.mjs +80 行 → **复跑 tools-enum，确认工具数/名称/schema 是否变化**（37→?）
  - D2-17 非 TTY 守卫：auth 子命令行为变化可能性
- **固定安全基线（P0，每迭代必跑）**：
  - D4-18/19/20 plan 门语义、hook_check_command 探测、规则引擎冒烟
  - D3-B7 审批闭环契约（特别是 **#578 报审批 token 跨调用失效**——与我方契约验证对账）
- **冒烟**：D3-C5 真云只读冒烟（project-id 自动解析是否影响 hcloud 查询）
- D8-1 README 4 项一致性检查（#566 文档变更后必跑）

## 三、风险观察点

1. **1.1.2 正式版今天 09:22 刚发布**——与 next 线 1.1.3-next.2 并存；正式版冒烟按技能 §23 执行（安装→版本→status→技能数），**勿用镜像源**（`--registry=https://registry.npmjs.org`）
2. **#578（critical，非我方提交）**：报「MCP 审批 token 跨调用失效（plan→approve→run 端到端不可达）」——与我方 D3-B7 实测（token 一次性但闭环可通）口径不同，**需对账**：是版本差异（对方测 1.1.2/next？）还是新复现路径
3. dev 的 project-id 自动解析 = hcloud spawn 改无 shell——Windows spawn 坑（skill §三.1 shim 教训）需关注新测试是否兼容 Windows
4. 本机 Hermes 插件目录缺失（ENV-1）——若需本机 MCP 工具测试，先 `npx --yes huaweicloud-devkit@next install --target hermes` 重装 + 重启

## 四、结论

- 增量集中在 auth/telemetry 两条链路，D2/D5/D6 维度为受影响集；安全基线 P0 复跑 + D8 文档检查为固定项
- 今日执行优先级建议：① 正式版 1.1.2 冒烟（低成本高时效）② D5-3 工具枚举复跑确认 tools +80 是否动工具面 ③ #578 对账 ④ auth 增量功能测试（project-id 自动解析）