# ITER-001-2026-09-05 AK/SK 架构方案 v4 —— NR2 测试设计与执行结果

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
| D2-14 | **R2 冲突交互仲裁（confirmToken）** | P1 | ✅ **MCP 实测完整闭环**：假 AK 导入触发 `needs_confirmation`+`confirmToken`+双选项 → `auth_confirm(s1)` → outcome=aborted「保持 S1 现有账号，未覆盖」→ S1 真值完好/导入文件擦除/测试污染清零 |
| D2-15 | auth_switch 行为矩阵抽查 | P1 | ✅ temporary/clear/persist(rejected) 均与矩阵一致 |
| D2-16 | import 文件读取后擦除 | P1 | ✅ **真机：读后无条件擦除**（exists=False） |
| D2-17 | cmdAuthReconcile 非 TTY 守卫 | P1 | ✅ **真机实测**：非 TTY 跑 `auth reconcile` → "Non-interactive session. Cannot run interactive reconciliation..." + 2.3s 退出不 hang（isTTY 卫卫生效） |
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

## 五、真机新发现（2026-09-07 补充）

### AK-FP-2（P2 候选）HUAWEICLOUD_HOME 场景 S2 被漏检（R6）

- **现象与双机实证**：设置 HUAWEICLOUD_HOME 后 `readKooCliProfiles()` → "KooCLI config not found"（真实 `~/.hcloud/config.json` 存在）；Windows/Linux 一致
- **根因**：readKooCliProfiles 用 `join(baseHome(), '.hcloud')` 定位 S2，但 KooCLI 配置固定在 `$HOME/.hcloud`（与 HUAWEICLOUD_HOME 无关）→ R6 场景 S2 漏检
- **与方案冲突**：方案 §九 T1 断言 3（"S2 固定 ~/.hcloud 不受 HUAWEICLOUD_HOME 影响"）——实测**实现不符**（S1/S3 迁移 ✓ 正确，S2 映射错误）
- **影响**：R6 环境（WSL 重定向）下 reconcile 对 S2 的比对/同步全部失效
- **建议**：readKooCliProfiles 固定用 homedir()/.hcloud，与 baseHome 解耦
- **处置**：已追加评论 #501

### AK-FP-1（P 类候选）authEncrypt 环境下 S2 指纹恒假不一致

- **现象**：persist 同步后 `hcloud configure show` 确认 S2 current 档已写入新值（HPU****YXD）；但 `getAuthStatus.reconciled` 的 S2 current 指纹永远 ≠ S1（本机 f4571d59 vs caae65f2），`inconsistent: true` 恒存
- **根因链**：① 本机 KooCLI `authEncrypt=true`（默认）→ `~/.hcloud/config.json` 为整文件加密结构（crypter/nonce/localDea），AK/SK 均密文 ② `readKooCliProfiles()` 按方案 T2 设计"非 spawn 直读文件"→ 读到**密文** ③ `fingerprint(密文AK, 密文SK)` 与 S1 真实指纹必然不同 → **S2 恒 inconsistent**
- **影响**：① getAuthStatus 恒告警（误导"当前账号不一致"）② sync 每次触发 R4 重写 S2（写入后指纹仍不匹配 → **无效循环重写**）
- **与方案关系**：方案自带待测点 T2（"authEncrypt=true 时 configure list 输出 ****"）已覆盖掩码场景，但**未覆盖"文件直读遇到密文"**——readKooCliProfiles 非 spawn 设计与 authEncrypt 冲突
- **验证证据**：fingerprint(真实)=caae65f2 ✓；fingerprint(掩码)=c6de8701 ≠；直读密文路径一致匹配 f4571d59
- **建议**：① authEncrypt 环境改用 `hcloud configure list`（解密输出）取 fingerprint ② 或检测 authEncrypt 后跳过 S2 指纹比对（仅比对 current 名与存在性）③ 方案 T2 补充 authEncrypt 不可读文件场景
- **处置**：追加评论至 #501（证据链归档）