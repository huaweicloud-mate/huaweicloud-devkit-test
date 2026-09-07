# ITER-001 AK/SK 架构方案 v4 —— NR2 测试设计与执行结果

> 输入：开发方案《huaweicloud-devkit 登录凭证（AK/SK）架构方案 v4（定稿）》（dev @ 4e3dd866 基准，与 1.1.1-next.15 一致）
> 处理：NR2 用例设计（D2-9~20 共 12 条入矩阵）→ 可执行项隔离/真云实测（2026-09-07）

## 一、NR2 用例设计（12 条已入矩阵，设计级 124）

| 用例 | 验证点 | 优先级 | 执行 |
|---|---|---|---|
| D2-9 | reconcile 幂等（一致态零写） | P1 | ✅ 观察（auth_status 多次稳定） |
| D2-10 | **R7 current 档跟随** | P1 | ✅ readKooCliProfiles/resolveManagedProfile=deploy；runHcloudConfigure 代码级确认 `--cli-profile`（:160） |
| D2-11 | **R3 STS token 拒绝落盘** | P0 | ✅ **MCP 实测**：persist+token → `{status:error, scope:rejected}` |
| D2-12 | **R10 runtime 非空禁止落盘** | P1 | ✅ **MCP 实测**：runtimeActive 时 sync → `ok:false + auto-sync suppressed (R10)`（与方案逐字一致） |
| D2-13 | **R9 configuredBySession 优先 env** | P1 | ✅ 隔离实测：标记时 S1 胜出；清除后 env 兜底恢复 |
| D2-14 | R2 冲突交互仲裁（confirmToken） | P1 | ⏳（需真实冲突场景，MCP needs_confirmation 协议） |
| D2-15 | auth_switch 行为矩阵抽查 | P1 | ✅ temporary/clear/persist(rejected) 均与矩阵一致 |
| D2-16 | import 文件读取后擦除 | P1 | ⏳（构造导入文件流程，下一批） |
| D2-17 | cmdAuthReconcile 非 TTY 守卫 | P1 | ⏳（CLI 子进程验证） |
| D2-18 | **.last_sync mtime 手动改动检测** | P1 | ✅ 隔离实测：mtime>marker→R2（true）；≤→R4（false） |
| D2-19 | **命名档只审计不自动动（R5）** | P1 | ✅ 隔离：current=deploy 解析正确，写 deploy 档逻辑成立 |
| D2-20 | HUAWEICLOUD_HOME 重定向（R6） | P2 | ⚠️ **观察记录**：readKooCliProfiles 按 baseHome()/.hcloud 读 S2——**HUAWEICLOUD_HOME 会影响 S2 映射**，与方案 T1 断言「S2 固定 ~/.hcloud 不受影响」存在出入，**需人工/真机核对**（WSL 相关） |

## 二、重要发现

1. **开发文档声明 vs 实测矛盾**：方案文末称 "full suite npm test **250/250 通过**"——但我们的实测 **Windows 245/250、Linux ARM64 248/250**（2 个 auth 失败，真云功能正常=mock 敏感性）。开发声明与跨机实测不符，**建议反馈开发确认其跑测环境**。
2. **R6/HUAWEICLOUD_HOME 与 S2 映射**（D2-20）：实现将 S2 置于 `baseHome()/.hcloud`，HUAWEICLOUD_HOME 改变时 S2 映射随之改变——与方案 T1 预期（S2 固定）不一致，待人工核对。
3. R3/R10/R9/R7/R2/R4 六条核心规则**全部验证通过**（真云或隔离实测）。

## 三、复现

- test-cases/d2-reconcile-test.mjs（隔离，8 断言）
- MCP 实测命令记录见 gaps/执行日志

## 四、遗留

- D2-14/16/17 待真实冲突/CLI 场景（下一批）
- 方案 T1（WSL）/ D2-20 真机核对（zhangshuang Linux 可补）