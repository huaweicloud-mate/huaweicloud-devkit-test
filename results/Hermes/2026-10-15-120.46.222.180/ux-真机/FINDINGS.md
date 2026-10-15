# FINDINGS — UX 体验用例真机专项缺陷清单（Hermes / Linux / testbot1-Linux-Hermes · 第 2 批）

> **落盘路径**：`results/Hermes/2026-10-15-120.46.222.180/ux-真机/FINDINGS.md`
> **生成时间**：2026-10-15（北京时间，第 2 批补齐）
> **被测版本**：huaweicloud-devkit v1.1.9-next.0（npm 官方源 `@next`，按 `scripts/prepare_env.py` 取版规则自动取 latest/next 最高：next 1.1.9-next.0 > latest 1.1.8）
> **执行方式**：真机（真云凭证环境，cn-north-4，管理员 AK/SK），`node eval/harness/fixtures/run-ux.mjs <插件 src> --evid ... --json ...`
> **夹具全集**：41 个 D11 夹具，结果 pass=4 / not_implemented=34 / blocked=3 / harness_error=0

---

## 本批（第 2 批）重点用例结论

| 用例 | 结论 | 说明 |
|---|---|---|
| D11-13 登录后自检五项 | NOT_IMPLEMENTED | 已在缺陷单 **#916** 跟踪（`getAuthStatus()` 自检仅 1/5 ready，无中文体检摘要） |
| D11-34 资源归零 | NOT_IMPLEMENTED | 已在缺陷单 **#916** 跟踪（无归零中文报告）；**真机真建真删本轮已复核为空、无残留** |
| D11-24 码道沙箱阻断 KooCLI | BLOCKED | 本机无码道环境（无 `~/.codeartsdoer` / `~/.codeartswork` / `CODEARTS_*`），须由码道客户端机器（如 testbot5-win-CodeArtsIDE）执行 |
| D11-35 沙箱连不通排障 | BLOCKED | 本机无沙箱/devbridge 通道（`huaweicloud_sandbox_check_user` 探针返回未登录态），须由具备 devbridge 通道的客户端执行 |
| D11-38 独立观测双轨（范式③三轨一致） | NOT_IMPLEMENTED | **新发现**，见下方缺陷 #1（缺陷单 **#917**） |

---

## #1【P1】D11-38 独立观测双轨 / 三轨一致未实现（UX-R2/R4 范式③）

- **现象**：真机 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 已导出（运行器隔离 HOME）时，三轨核对无法闭合：
  - **自述轨空**：`getAuthStatus()` 返回体无 `effective.fingerprint` / `effective.source` 字段（均为 null；`credentialPanel.s1.fingerprint` 也因隔离 HOME 无落盘 S1 而返回 null）；
  - **独立文件/env 轨可反推**：`sha256(ak+sk)[:8] == caae65f2`（绕过插件自述）；
  - **独立连通轨可证真**：`huaweicloud_run_readonly_command`（ECS `ListServersDetails`）真实只读调用成功（`count:1`，服务器列表返回）；
  - **核对结论**：自述轨(null) ≠ 独立反推(caae65f2)，范式③「不以自述自证」断言 FAIL（三轨一致 FAIL）。
- **根因**：`auth/service.mjs:163` `getAuthStatus()` 的返回体（:179–:196）没有 `effective.{fingerprint,source}` 顶层契约字段；`credentialPanel.s1.fingerprint`（:174）只读落盘 S1（`readGlobalCredentials()`），不读 `HW_*` 运行时环境凭证。故插件无法自述其当前生效账号指纹/来源，独立观测面的三轨核对无法闭合。
- **影响**：Agent 无法用独立观测面（文件/env 反推 + 真实只读连通）去证伪工具自述的「已登录」结论；生效账号身份仅能靠落盘文件侧推断，UX-R2/R4「生效账号来源显式可见」与范式③「不以自述自证」未落地。
- **证据**：`results/Hermes/2026-10-15-120.46.222.180/ux-真机/evidence/D11-38/stdout.txt`、`.../evidence/D11-38/result.json`
- **复现命令**：
  ```bash
  export HW_ACCESS_KEY=<管理员AK> HW_SECRET_KEY=<管理员SK> HW_REGION=cn-north-4
  cd ~/devkit-test/Hermes/huaweicloud-devkit-test
  node eval/harness/fixtures/run-ux.mjs \
    ~/devkit-test/Hermes/.ux-pkg-2026-10-15/package/plugins/huaweicloud-core/src \
    --evid results/Hermes/2026-10-15-120.46.222.180/ux-真机/evidence \
    --json results/Hermes/2026-10-15-120.46.222.180/ux-真机/UX专项-2026-10-15.json
  ```

---

## 真机归零 e2e（D11-34，本轮，真建真删，无残留）

- 创建前基线：EIP 总数 = 1（`02fb8998-83b2-41e3-a1ff-4b85187b4d22` / 121.36.54.113）
- 创建 1 个最小按需 EIP：`88e17837-1091-46dd-a14a-23e95043ed83`（IP 123.249.16.246，type=5_bgp / share_type=PER / size=1 / charge_mode=traffic）
- 建后列表核验：总数 1 → 2，新 EIP 与 IP 均在列表 ✅
- 删除 → 复核：新 EIP 不再存在，总数回到基线 1（归零=True）✅
- `finally` cleanup：无残留 ✅
- 证据：`results/Hermes/2026-10-15-120.46.222.180/ux-真机/evidence/D11-34-真机-e2e/`（00-before-eip-list.json / 01-create.command.txt+stdout / 02-after-create-list.json / 03-delete.command.txt+stdout / 04-after-delete-list.json / e2e.log）

---

### 附：夹具全集汇总（context，非新增缺陷）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 4 | D11-1 / D11-37 / D11-41 / D11-44 |
| NOT_IMPLEMENTED | 34 | 含本批三条真机用例 D11-13（#916）、D11-34（#916）、D11-38（#917 新）；其余 31 条为 UX-R2/R4/R5/R7/R9/R13/R17/R18/R19/R20 文案/契约缺口，已在每日测试门禁跟踪 |
| BLOCKED | 3 | D11-24（本机无码道环境）、D11-35（本机无沙箱/devbridge）、D11-42（夹具自身异常，非产品缺口，不计 PASS/FAIL） |
| HARNESS_ERROR | 0 | — |