# FINDINGS — UX 体验用例真机专项缺陷清单（DSH / Linux / testbot2-DSH）

> **落盘路径**：`results/DSH/2026-10-15-1.94.193.150/ux-真机/FINDINGS.md`
> **生成时间**：2026-10-15（北京时间 CST）
> **被测版本**：huaweicloud-devkit v1.1.9-next.0（npm 官方源 `@next`，按 `scripts/prepare_env.py` 取版规则 latest/next 取最高：latest=1.1.8 < next=1.1.9-next.0）
> **执行方式**：真机（真云凭证，cn-north-4），`node eval/harness/fixtures/run-ux.mjs <插件 src> --evid ... --json ...`
> **夹具全集**：41 个 D11 夹具，结果 pass=4 / not_implemented=35 / blocked=2 / harness_error=0
> **本批重点五条**：D11-13（登录后自检五项）、D11-24（码道沙箱阻断 KooCLI）、D11-34（资源归零）、D11-35（沙箱连不通排障）、D11-38（独立观测双轨/三轨一致）

---

## #1【P1】D11-13 登录后自检五项与中文体检摘要未实现（UX-R3/R6）

- **现象**：真机导出 HW_ACCESS_KEY/HW_SECRET_KEY（运行器隔离 HOME、仅 env 注入）后调用 `getAuthStatus()`，自检五项仅 1/5 ready（凭据=false、OBS=false、KooCLI 版本=true、project-id=false、MCP 注册=false）；返回体无 `selfCheck`/`checkup` 字段（`selfCheck=null`），无中文体检摘要；`kooCliNextStep` 非空、`onboarding.scenario=4`（仍需导入配置）。
- **断言**：登录后自检五项（凭据/OBS/KooCLI 版本/project-id/MCP 注册）全部 ready 且 nextStep 为空；返回中文体检摘要（逐项中文 + 状态）且不含内部代号（S1/S2/A+C）。
- **根因**：`getAuthStatus()` 未实现「登录后五项自检 + 中文体检摘要」；`selfCheck` 字段缺席。凭据/OBS/project-id/MCP 四项在仅 env 注入（platform-injected）时未计为 ready，只有 KooCLI（hcloud 探测 v7.2.12）计为 ready；「契约依赖 checkup.{items,ready,nextStep} 待冻结」。
- **影响**：真机登录后用户/Agent 拿不到中文体检摘要，无法一眼判断登录是否完整可用，仍需人工逐项排查。
- **证据**：`results/DSH/2026-10-15-1.94.193.150/ux-真机/evidence/D11-13/stdout.txt`、`.../evidence/D11-13/result.json`
- **复现命令**：
  ```bash
  export HW_ACCESS_KEY=<管理员AK> HW_SECRET_KEY=<管理员SK> HW_REGION=cn-north-4
  cd ~/devkit-test/DSH/huaweicloud-devkit-test
  node eval/harness/fixtures/run-ux.mjs <今日 npm 包>/plugins/huaweicloud-core/src \
    --evid results/DSH/2026-10-15-1.94.193.150/ux-真机/evidence \
    --json results/DSH/2026-10-15-1.94.193.150/ux-真机/UX专项-2026-10-15.json
  ```

## #2【P1】D11-34 资源归零中文报告未实现（UX-R12）

- **现象**：真机只读复核可执行（ECS/EIP/EVS 三类列表均返回，`connected=3/3`），但 `huaweicloud_run_readonly_command` 的返回仅为 hcloud 原始 JSON，无「已释放/未释放 + 剩余计数」中文归零报告、无「无残留/已归零」结论、无未释放项的逐资源补删命令。
- **断言**：清理后返回中文归零报告（逐资源列出「已释放/未释放」+ 剩余计数），未释放项附唯一补删命令；只读列表复核返回空（无残留）。
- **根因**：`huaweicloud_run_readonly_command`（tools.mjs）直接透传 `runHcloud()` 原始输出，无「资源归零报告」封装层；源码全域无「已释放/未释放/无残留/补删」文案，UX-R12 未实现。
- **影响**：用户/Agent 无法获得「测后资源已清理」的中文确认与残留补删指引；真云资源清理结果对用户不可见，误删/残留风险无提示。
- **证据**：`results/DSH/2026-10-15-1.94.193.150/ux-真机/evidence/D11-34/stdout.txt`、`.../evidence/D11-34/result.json`
- **真机归零 e2e（本次已真建真删并复核为空，无残留）**：`results/DSH/2026-10-15-1.94.193.150/ux-真机/evidence/D11-34-真机-e2e/e2e.log`（创建 1 个最小按需 EIP `d7379c36-0503-4ca8-9546-89e0f31c3edd` / `123.249.16.246` → 列表核验 → 删除 → 复核 my-prefix=0，`finally` 清理确认无残留；前置基线 EIP 121.36.54.113 与带宽 hc-activity-* 为既有资源，未触碰）
- **复现命令**：
  ```bash
  export HW_ACCESS_KEY=<管理员AK> HW_SECRET_KEY=<管理员SK> HW_REGION=cn-north-4
  cd ~/devkit-test/DSH/huaweicloud-devkit-test
  node eval/harness/fixtures/run-ux.mjs <今日 npm 包>/plugins/huaweicloud-core/src \
    --evid results/DSH/2026-10-15-1.94.193.150/ux-真机/evidence \
    --json results/DSH/2026-10-15-1.94.193.150/ux-真机/UX专项-2026-10-15.json
  # 真机建删归零：hcloud EIP CreatePublicip/ListPublicips/DeletePublicip（5_bgp/PER/1Mbit，alias=tctest-ux-d11-34-*）见 evidence/D11-34-真机-e2e/
  ```

## #3【P1】D11-38 独立可观测面自述轨 effective 契约未实现（UX-R2/R4 三轨一致缺失）

- **现象**：隔离 HOME + env 三件套下 `getAuthStatus()` 的 `effective=null`（`selfFingerprint=null`、`selfSource=null`）；独立文件/env 反推指纹 `caae65f2` == SUT 内部 `reconciled.envFingerprint=caae65f2`；真实只读调用成功（ECS ListServersDetails 返回列表）。三轨中「①自述轨(effective)」缺失 → 三轨一致断言 FAIL。
- **断言**：独立观测面反推的账号标识 == 账号 A 真实标识，且与 `effective.source` 结论一致；三轨一致（自述 == 文件/env 反推 && 真实连通），不得仅以自述字段作唯一证据。
- **根因**：`effective.{source,fingerprint}` 契约字段未实现（恒返回 null，与 D11-3/4/5 同源，属「契约依赖 effective.{source,fingerprint,region,accountType} 待冻结」）；指纹可在 `reconciled.envFingerprint`/`credentialPanel.s1.fingerprint` 得到且与独立反推一致，但未沉淀到 public `effective` 契约。
- **影响**：范式③「不以自述自证」的独立观测面无法经 `effective` 契约对外呈现；三轨中自述轨缺失，仅剩独立反推 + 真实连通两轨可自动化。
- **证据**：`results/DSH/2026-10-15-1.94.193.150/ux-真机/evidence/D11-38/stdout.txt`、`.../evidence/D11-38/result.json`
- **复现命令**：
  ```bash
  export HW_ACCESS_KEY=<管理员AK> HW_SECRET_KEY=<管理员SK> HW_REGION=cn-north-4
  cd ~/devkit-test/DSH/huaweicloud-devkit-test
  node eval/harness/fixtures/run-ux.mjs <今日 npm 包>/plugins/huaweicloud-core/src \
    --evid results/DSH/2026-10-15-1.94.193.150/ux-真机/evidence \
    --json results/DSH/2026-10-15-1.94.193.150/ux-真机/UX专项-2026-10-15.json
  ```

---

### 环境门控与 BLOCKED 说明（环境边界，非新增产品缺陷，不重复提单）

- **D11-24 码道沙箱阻断 KooCLI**（夹具实测 NOT_IMPLEMENTED，但属环境边界）：本机存在 `~/.codeartsdoer`（码道目录，故夹具未判 BLOCKED），但 KooCLI 实际可正常安装/运行（`huaweicloud_check_cli` 返回 `Current KooCLI version: 7.2.12`、authenticated=ok），说明本机**并非「沙箱模式阻断 KooCLI」的阻断态**。阻断中文文案与恢复路径**已实现**于 `setup-cli.mjs`（install-hcloud 路径，`沙箱模式拦截了 KooCLI 自动安装…` + `码道外的终端安装…`）与 `README.zh-CN.md:119`；夹具探针 `huaweicloud_check_cli` 走不到该分支。→ 需真正开启码道沙箱阻断的码道机复测方可作最终判定。
- **D11-35 沙箱连不通排障**（BLOCKED）：`huaweicloud_sandbox_check_user` 探针 threw（返回「未配置华为云凭证」，本机无沙箱/devbridge 通道）。缺前置，如实 BLOCKED，不计 PASS/FAIL。
- **D11-42 编码契约**（BLOCKED）：子进程无输出（exit=0），头less Linux 环境下夹具自身未产出可判定输出，非产品缺口。

### 附：夹具全集汇总（context）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 4 | D11-1 / D11-37 / D11-41 / D11-44 |
| NOT_IMPLEMENTED | 35 | 含 D11-13、D11-34、D11-38（本批三条真机用例）；其余 32 条为 UX-R2/R4/R5/R7/R9/R13/R17/R18/R19/R20/R23 等文案/契约缺口，已在每日测试门禁跟踪 |
| BLOCKED | 2 | D11-35（无沙箱）、D11-42（夹具自身异常，不计 PASS/FAIL） |
| HARNESS_ERROR | 0 | — |
