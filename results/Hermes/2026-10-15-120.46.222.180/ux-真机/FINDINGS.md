# FINDINGS — UX 体验用例真机专项缺陷清单（Hermes / Linux / testbot1-Linux-Hermes）

> **落盘路径**：`results/Hermes/2026-10-15-120.46.222.180/ux-真机/FINDINGS.md`
> **生成时间**：2026-10-15（北京时间）
> **被测版本**：huaweicloud-devkit v1.1.9-next.0（npm 官方源 `@next`，按 `scripts/prepare_env.py` 取版规则自动取 latest/next 最高）
> **执行方式**：真机（真云凭证环境，cn-north-4），`node eval/harness/fixtures/run-ux.mjs <插件 src> --evid ... --json ...`
> **夹具全集**：24 个 D11 夹具，结果 pass=4 / not_implemented=19 / blocked=1 / harness_error=0
> **两条「必须真机」用例**（本专项目标）：D11-13、D11-34 —— 均判 NOT_IMPLEMENTED（需求未实现，非 harness 故障），明细如下。

---

## #1【P1】D11-13 登录后自检五项与中文体检摘要未实现（UX-R3）

- **现象**：真机 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 已导出（运行器隔离 HOME、只读 env）时，`getAuthStatus()` 自检五项仅 1/5 ready——凭据=false、OBS=false、KooCLI 版本=true、project-id=false、MCP 注册=false；返回体无 `selfCheck`/中文体检摘要字段；`kooCliNextStep` 非空、`onboarding.scenario=4`（仍在催促登录）。
- **断言**：登录后自检五项（凭据 / OBS / KooCLI 版本 / project-id / MCP 注册）全部 ready，且 nextStep 为空；返回中文体检摘要（逐项中文 + 状态）且不含内部代号（S1/S2/A+C）。
- **根因**：`auth/service.mjs:163` `getAuthStatus()` 的 `credentialsConfigured`（:181，取 `readGlobalCredentials()` 的 S1）、`obsConfigured`（:187，取 `obsConfigPath()`）、`mcpSettingsConfigured`（:183，取 `readCodeArtsCredentials()` 的 S4）均只读落盘文件、不读 `HW_*` 环境变量；返回体（:179–:196）无 `selfCheck`/体检摘要字段。「登录后五项自检 + 中文体检摘要」整体未实现。
- **影响**：真机登录后用户 / Agent 拿不到中文体检摘要，无法一眼判断登录是否完整可用，仍需人工逐项排查；未登录态与已登录态的体验分层缺失。
- **证据**：`results/Hermes/2026-10-15-120.46.222.180/ux-真机/evidence/D11-13/stdout.txt`、`.../evidence/D11-13/result.json`
- **复现命令**：
  ```bash
  export HW_ACCESS_KEY=<管理员AK> HW_SECRET_KEY=<管理员SK> HW_REGION=cn-north-4
  cd ~/devkit-test/Hermes/huaweicloud-devkit-test
  node eval/harness/fixtures/run-ux.mjs \
    ~/devkit-test/Hermes/.ux-pkg-2026-10-15/package/plugins/huaweicloud-core/src \
    --evid results/Hermes/2026-10-15-120.46.222.180/ux-真机/evidence \
    --json results/Hermes/2026-10-15-120.46.222.180/ux-真机/UX专项-2026-10-15.json
  ```

## #2【P1】D11-34 资源归零中文报告未实现（UX-R12）

- **现象**：真机只读复核可执行（ECS/EIP/EVS 三类列表均返回），但 `huaweicloud_run_readonly_command` 的返回仅为 hcloud 原始 JSON，无「已释放 / 未释放 + 剩余计数」中文归零报告、无「无残留 / 已归零」结论、无未释放项的逐资源补删命令。
- **断言**：清理后返回中文归零报告（逐资源列出「已释放 / 未释放」+ 剩余计数），未释放项附唯一补删命令；只读列表复核返回空（无残留）。
- **根因**：源码全域检索无「归零 / 已释放 / 未释放 / 无残留 / 补删」等文案——`tools.mjs:1148` `huaweicloud_run_readonly_command` 直接透传 `runHcloud()` 原始输出，无任何「资源归零报告」封装层，UX-R12 整体未实现。
- **影响**：用户 / Agent 无法获得「测后资源已清理」的中文确认与残留补删指引；真云资源清理结果对用户不可见，误删 / 残留风险无提示。
- **证据**：`results/Hermes/2026-10-15-120.46.222.180/ux-真机/evidence/D11-34/stdout.txt`、`.../evidence/D11-34/result.json`
- **真机归零 e2e（本次已真建真删并复核为空，无残留）**：`results/Hermes/2026-10-15-120.46.222.180/ux-真机/evidence/D11-34-真机-e2e/e2e.log`（创建 1 个最小按需 EIP `ea5ecafa-810e-47d3-885c-553721da3f9f` → 列表核验(总数 2→3) → 删除 → 复核回到基线 2，`finally` 清理确认无残留）
- **复现命令**：
  ```bash
  export HW_ACCESS_KEY=<管理员AK> HW_SECRET_KEY=<管理员SK> HW_REGION=cn-north-4
  cd ~/devkit-test/Hermes/huaweicloud-devkit-test
  node eval/harness/fixtures/run-ux.mjs \
    ~/devkit-test/Hermes/.ux-pkg-2026-10-15/package/plugins/huaweicloud-core/src \
    --evid results/Hermes/2026-10-15-120.46.222.180/ux-真机/evidence \
    --json results/Hermes/2026-10-15-120.46.222.180/ux-真机/UX专项-2026-10-15.json
  # 真机建删归零（hcloud EIP，最低配置按需）见 evidence/D11-34-真机-e2e/
  ```

---

### 附：夹具全集汇总（context，非新增缺陷）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 4 | D11-1 / D11-37 / D11-41 / D11-44 |
| NOT_IMPLEMENTED | 19 | 含 D11-13、D11-34（本专项两条真机用例）；其余 17 条为 UX-R2/R4/R5/R7/R9/R13/R17/R18/R19/R20 文案/契约缺口，已在每日测试门禁跟踪 |
| BLOCKED | 1 | D11-42（夹具自身异常，非产品缺口，不计入 PASS/FAIL） |
| HARNESS_ERROR | 0 | — |