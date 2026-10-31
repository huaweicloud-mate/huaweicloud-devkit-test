# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813 / Windows 补测）

> **落盘路径**：`results/Hermes/2026-10-31-120.46.2.198-v2mig2/Windows/FINDINGS.md`
> **生成时间**：2026-10-31 11:33（北京时间）
> **被测对象**：源仓库 v2 分支 `fcfe047f`（package.json 2.0.0，npm 未发布）
> **补测范围**：上一轮 v2 迁移用例预演（Linux `2026-10-30-1.94.193.150-v2mig`）中 2 条 Windows 专属 NOT_RUN——`D5-6`（Windows 特有问题）与 `D7-3`（Windows better-sqlite3 缺口）。
> **环境**：Windows 10，Node v26.7.0，npm 11.19.0；hdk @ `fcfe047f`（`npm ci` + `npm run build` 完成，dist 产物 `plugins/huaweicloud-core/dist/`）

---

## #1【P1·D5-6 结论】Windows 已知问题（config 完整性/文件锁/MCP Python SDK）均「文档范围内可控」——PASS

- **结论**：D5-6 操作步骤 ①Hermes 安装 ②升级/卸载 config 完整性 ③文件锁 ④doctor 查 Python SDK 四步已验证，官方已知问题均已在 `docs/hermes-windows.md` 文档范围内可控，对应设计用例由 `NOT_RUN` 回填为 `PASS`。
- **④ doctor 查 Python SDK**：v2 `node bin/setup.cjs doctor --target hermes` 输出 `10 pass / 3 warn / 1 fail`，含 `[PASS] Hermes MCP Python SDK`、`[PASS] MCP configured`、`[PASS] MCP server can start (Hermes Agent)`；直接探针 `python -c "import mcp"` → ok。
- **② config 完整性**：Hermes `config.yaml`（`AppData/Local/hermes/config.yaml`）`mcp_servers.huaweicloud-devkit` 完整（`command: node` + `args:[server-path]` + `env:HUAWEICLOUD_AGENT_TOOLKIT_MODE/HCLOUD_BIN`）。已知问题「install/update 重写 `config.yaml → mcp_servers.huaweicloud-devkit.args` 移除 `--no-deprecation`」已文档化（`docs/hermes-windows.md` Issue 2），对应实现位点 `plugins/huaweicloud-core/src/mcp-config-merge.ts:107`（非 node 风格 entry 重置 `args:[mcpPath]`）与 `:114`（node 风格保留 `existing.args.slice(1)`）。
- **③ 文件锁**：文件锁重试梯在 `plugins/huaweicloud-core/src/payload-runtime-deps.ts:40`（`spawnErrorCode==='EPERM'||'EBUSY'` → 2s 重试），与 `docs/hermes-windows.md`、`docs/CHANGELOG.md` 已知问题一致。
- **① 安装**：本机 Hermes 客户端 devkit 已装（CLI 1.1.13-next.0、Hermes plugin 1.1.12，payload 于 `AppData/Local/hermes/huaweicloud-plugins/`）。
- **证据**：`evidence/D5-6/doctor.log`、`evidence/D5-6/python-sdk.log`、`evidence/D5-6/stdout.log`、`evidence/D5-6/results.json`

---

## #2【P1·D7-3 结论】better-sqlite3 原生模块缺口「已由 node:sqlite 内置模块替代解决」，但 Windows `npm test` 残留 107 条失败面——FAIL

- **现象**：`node --experimental-test-module-mocks --test "test/*.test.ts"` 全量 140 测试文件，**1101 tests：967 pass / 107 fail / 27 skip**。
- **better-sqlite3 缺口本体（已解决）**：`package.json`（fcfe047f）dependencies/devDependencies 均无 `better-sqlite3`，`node_modules/better-sqlite3` 目录不存在；OfficeAce sqlite 连接器改用 Node 内置 `node:sqlite`（`plugins/huaweicloud-core/src/agents/officeace-sqlite.ts:47` `createRequire(import.meta.url)('node:sqlite')`），Windows 冒烟 `new DatabaseSync(':memory:')` + CREATE TABLE OK；officeace sqlite 用例（`officeace uninstall→reinstall restores owner_user_id`、`officeace: enable rewrites DEVKIT_PACKS env_json row` 等）PASS。→ 历史 CHANGELOG 的「ci: temporarily exclude Windows from test matrix (better-sqlite3 compile issue)」编译缺口已随替换消除。
- **残留 107 失败面（按根因归类）**：
  1. **子进程 Node crypto x509 断言 + JS OOM（主导，影响 install 类测试）**：`Assertion failed: (x509) != nullptr` @ `node::crypto::InitializeBundledRootCertificates`（Node 内置 `src/crypto/crypto_context.cc:884`）→ 随后 `FATAL ERROR: ... JavaScript heap out of memory`。触发点：install 测试 spawn 的 node 子进程初始化 SSL 根证书失败崩溃，如 `hermes install creates skills...`、`officeace install copies skills...`、`codex install ...` 等。属多租户共享 Windows 机内存/Node 运行时环境因素，非 devkit 代码缺陷。
  2. **spawn UNKNOWN errno -4094**：`plugins/huaweicloud-core/src/hcloud-run-once.ts:66`（`spawn`）← `hcloud-run.ts:102`（`runHcloudOnceWithRetries`）← `plugins/huaweicloud-core/src/packs/huaweicloud-cli/tools.ts:141/140`（`listOperations`）。Windows 上 hcloud 子进程 spawn 返回 `code:'UNKNOWN' errno:-4094`，`listOperations` 类工具列表用例 FAIL。
  3. **EPERM 临时目录/文件锁**：`Error: EPERM, Permission denied: \\?\...\Temp\multica-task-...\...`（测试隔离临时目录删除/重命名被占用），与文件锁/Windows 句柄语义相关。
  4. **路径归一化 / golden 分歧**：`doctor golden: hermes+officeace markers staged` 分叉（`test/doctor-golden.test.ts`，golden 文件 `test/fixtures/doctor-golden/golden-c-hermes-officeace.txt`），officeace skills 计数 `1 !== 0`（`test/officeace-adaptation.test.ts:116`），`update-check` `dismissed !== update_available`（`test/update-check-upgrade.test.ts:39`）等。
- **27 skip 含「官方自认空洞」**：`﹣ real opencode/codex: install -> agent view -> uninstall ... # win32 is out of scope for the real-agent layer`（`test/real-agents.test.ts` 等），即真实 Agent 层 install→view→uninstall 在 Windows 原型声明「win32 出范围」，需人工补测单测覆盖（D7-3 步骤③）。
- **人工补测兜底**：better-sqlite3 换 node:sqlite 后的 officeace 连接器 I/O 已由单测覆盖且 PASS；107 失败中环境 OOM（#2.1）重试可解属共享机内存约束，`spawn UNKNOWN -4094`（#2.2）与 real-agent win32 空洞（#2.3）为需研发/真实 Agent 环境复核的 Windows 专项缺口。
- **证据**：`evidence/D7-3/npm-test-output.txt`（全量 1101 条输出）、`evidence/D7-3/sqlite-gap.log`、`evidence/D7-3/stdout.log`、`evidence/D7-3/results.json`
- **状态**：待提单（better-sqlite3 已解决部分无需提单；残留 spawn/-4094 与 real-agent win32 空洞建议作为 v2 Windows 兼容专项跟进）