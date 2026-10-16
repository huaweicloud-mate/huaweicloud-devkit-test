# -*- coding: utf-8 -*-
"""D11 体验用例（设计稿）生成器 v2。

v2 变更（2026-10-13 覆盖自审后补强）：
  - 新增 D11-22 ~ D11-35（14 条）：安装/首次使用、可发现性/可读性、凭据生命周期、
    审批全路径、资源归零、沙箱排障、以及方法论补强（状态转换/边界值/错误推测）。
  - 既有 21 条补反断言（不含英文原文/不含内部代号），弱断言升级为双向断言。
  - 依赖新契约的用例在「依赖」列显式标注 `契约依赖: <字段> 待冻结`，避免与
    「设计完整（DESIGN_COVERED）」口径混淆——设计完整 ≠ 可执行。

列结构仍与母版 test-cases/design/用例矩阵-设计级.csv 完全一致（27 列）。

分区：本文件属 **test-cases/ux/（UX 体验用例独立分区）**，不与 design/ 母版混放。
      评审通过后并入 design/ 母版，届时 design/ 恢复为唯一真源、本分区降级为归档。

运行：python test-cases/ux/gen_ux.py
输出：test-cases/ux/用例矩阵-体验级.csv（UTF-8-SIG）
"""
import csv
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "用例矩阵-体验级.csv")
TS = "2026-10-13"

HEADER = ["ID", "维度", "标题", "优先级", "前置条件", "测试数据", "操作步骤", "预期结果", "指引来源",
          "关联工具", "自动化建议", "展开规则", "生成时间", "设计状态", "终端覆盖类型", "terminal",
          "agent", "OS", "Node/npm", "shell", "TTY", "installLayout", "mcpTransport", "hookSupport",
          "requiredEvidence", "owner", "依赖"]

BASE = {
    "terminal": "Hermes 代表终端; fake/fixture",
    "agent": "Hermes 代表终端; stdin/hook 注入",
    "OS": "Windows/Linux；macOS 若声明支持则单独举证",
    "Node/npm": "Node >=22；npm/npx 按 OS 记录",
    "shell": "PowerShell（Windows）/bash（Linux）",
    "TTY": "TTY + non-TTY",
    "installLayout": "隔离 HOME + HUAWEICLOUD_HOME fixture + 空 plugin 目录",
    "mcpTransport": "stdio（适用时）；函数/fixture 层否则",
    "hookSupport": "未涉及则 n/a",
    "owner": "测试负责人",
    "依赖": "需求来源与前置条件；独立 manifest；finally 清理",
}

ROWS = []


def add(cid, title, pri, pre, data, steps, expect, src, tools, auto, expand, tct="COMMON", **meta):
    d = dict(BASE)
    d.update(meta)
    # 已落地可执行载体登记（单一登记处，避免与夹具文件名两处真源不一致）
    if cid in LANDED:
        auto = f"fixture:{LANDED[cid]}"
    d["requiredEvidence"] = d.get("requiredEvidence") or "强断言：按预期结果字段逐项判定（正断言 + 反断言）；保留脱敏日志、返回体 JSON、前后快照"
    ROWS.append([cid, "D11体验", title, pri, pre, data, steps, expect, src, tools, auto, expand,
                 TS, "DESIGN_COVERED", tct] + [d[k] for k in HEADER[15:]])


def dep(field, req):
    return f"契约依赖: {field} 待冻结（{req}）；需求来源与前置条件；独立 manifest；finally 清理"


# ==================== 已落地可执行载体登记（用例 -> 夹具路径） ====================
# 登记即代表：该用例有可执行载体（L2 夹具，`npm run test:ux` 自动发现），
# 「自动化建议」列随之变为 `fixture:<路径>`，看板「载体」列显示为「夹具 <文件名>」。
# 批次沿革：D11-37/41/42/43/44 为 2026-10-13 首批；其余为 2026-10-14「P1 纸面用例落实」批次。
LANDED = {
    "D11-1": "eval/harness/fixtures/d11-1-onboarding-first-touch.mjs",
    "D11-2": "eval/harness/fixtures/d11-2-noninteractive-guidance.mjs",
    "D11-3": "eval/harness/fixtures/d11-3-effective-runtime.mjs",
    "D11-4": "eval/harness/fixtures/d11-4-effective-s1.mjs",
    "D11-5": "eval/harness/fixtures/d11-5-effective-env.mjs",
    "D11-6": "eval/harness/fixtures/d11-6-conflict-dual-source.mjs",
    "D11-7": "eval/harness/fixtures/d11-7-conflict-one-click.mjs",
    "D11-8": "eval/harness/fixtures/d11-8-switch-temporary-explicit.mjs",
    "D11-9": "eval/harness/fixtures/d11-9-switch-persist-clear.mjs",
    "D11-10": "eval/harness/fixtures/d11-10-authinit-prompt-zh.mjs",
    "D11-11": "eval/harness/fixtures/d11-11-region-explicit.mjs",
    "D11-12": "eval/harness/fixtures/d11-12-iam401-zh.mjs",
    "D11-13": "eval/harness/fixtures/d11-13-post-login-selfcheck.mjs",
    "D11-14": "eval/harness/fixtures/d11-14-single-end-locate.mjs",
    "D11-15": "eval/harness/fixtures/d11-15-credential-safety-disclosure.mjs",
    "D11-16": "eval/harness/fixtures/d11-16-error-cards.mjs",
    "D11-17": "eval/harness/fixtures/d11-17-routing-hitrate.mjs",
    "D11-18": "eval/harness/fixtures/d11-18-route-miss-clarify.mjs",
    "D11-19": "eval/harness/fixtures/d11-19-approval-explainable.mjs",
    "D11-20": "eval/harness/fixtures/d11-20-post-install-restart-hint.mjs",
    "D11-21": "eval/harness/fixtures/d11-21-post-login-nextsteps.mjs",
    "D11-22": "eval/harness/fixtures/d11-22-koocli-privacy.mjs",
    "D11-23": "eval/harness/fixtures/d11-23-no-client-ask.mjs",
    "D11-24": "eval/harness/fixtures/d11-24-codearts-sandbox-koocli.mjs",
    "D11-25": "eval/harness/fixtures/d11-25-capability-discoverable.mjs",
    "D11-26": "eval/harness/fixtures/d11-26-terminology.mjs",
    "D11-27": "eval/harness/fixtures/d11-27-cn-summary.mjs",
    "D11-28": "eval/harness/fixtures/d11-28-sts-expiry-actionable.mjs",
    "D11-29": "eval/harness/fixtures/d11-29-switch-effective-now.mjs",
    "D11-30": "eval/harness/fixtures/d11-30-auth-state-machine.mjs",
    "D11-31": "eval/harness/fixtures/d11-31-region-boundary.mjs",
    "D11-32": "eval/harness/fixtures/d11-32-unwritable-home.mjs",
    "D11-33": "eval/harness/fixtures/d11-33-approval-paths.mjs",
    "D11-34": "eval/harness/fixtures/d11-34-zeroing-report.mjs",
    "D11-35": "eval/harness/fixtures/d11-35-sandbox-unreachable-guide.mjs",
    "D11-37": "eval/harness/fixtures/d11-37-guidance-closure.mjs",
    "D11-38": "eval/harness/fixtures/d11-38-independent-observation.mjs",
    "D11-41": "eval/harness/fixtures/d11-41-misleading-attribution.mjs",
    "D11-42": "eval/harness/fixtures/d11-42-encoding-contract.mjs",
    "D11-43": "eval/harness/fixtures/d11-43-terminal-env-matrix.mjs",
    "D11-44": "eval/harness/fixtures/d11-44-fault-injection.mjs",
}


# ==================== 第一批：登录体验专题（D11-1 ~ D11-21） ====================

add("D11-1", "未登录首触中文引导", "P1",
    "隔离 HOME：S1 不存在、HW_ACCESS_KEY/HW_SECRET_KEY/HW_SECURITY_TOKEN 均未设、非码道上下文",
    "huaweicloud_run_readonly_command args=[\"ecs\",\"ListServersDetails\"]",
    "①清空 ~/.config/huaweicloud/credentials.json 与 HW_* 环境变量 ②调用 huaweicloud_run_readonly_command ③读取返回错误对象",
    "err.code==\"HDKIT_CRED_MISSING\" 且 err.onboarding.scenario==3 且 err.onboarding.message 含中文字符且不含英文整句 \"Huawei Cloud credentials are not configured\" 且 steps[] 同时含 action==\"obtain-aksk\"(label 含\"控制台\")与 action==\"auth-init\"",
    "P: UX-R1 首触登录引导(本改善需求); 实: resolveCredentials(credentials.mjs:266-304); 上游 #900",
    "run_readonly_command", "函数/fixture",
    "COMMON|<代表: Hermes 隔离进程>|<证据: HDKIT_CRED_MISSING 错误对象字段>|<阻塞: 无>")

add("D11-2", "未登录·非交互会话引导", "P1",
    "非 TTY 终端；无 env 凭证",
    "npx huaweicloud-devkit auth init（stdin 非 TTY）",
    "①在非 TTY 环境执行 auth init ②捕获 stdout/stderr/exitCode",
    "exitCode==1 且 stderr 同时含 \"creds-import.json\" 与 \"huaweicloud_auth_switch\" 且提示文本含中文字符且不含 \"Non-interactive session detected.\" 英文原文",
    "P: UX-R1; 实: cmdAuthInit(setup-cli.mjs:4797-4811); 上游 #900",
    "auth", "脚本",
    "COMMON|<代表: Windows/Linux 非 TTY>|<证据: exitCode + stderr 文案>|<阻塞: 无>",
    TTY="non-TTY")

add("D11-3", "auth_status 生效来源=runtime", "P1",
    "MCP 会话已起；隔离 HOME",
    "ak=AKTEST0000000000001, sk=SKTEST0000000000001, region=cn-north-4",
    "①huaweicloud_auth_init(ak,sk,region) ②huaweicloud_auth_status ③读 effective 字段",
    "effective.source==\"runtime\" 且 effective.fingerprint==sha256(ak+sk)[:8] 且 effective.region==\"cn-north-4\"；返回体不含 ak/sk 明文",
    "P: UX-R2 生效账号可见(本改善需求); 实: getAuthStatus(service.mjs:165) + resolveCredentialsWithRuntime(credentials.mjs:396)",
    "auth_init,auth_status", "函数/fixture",
    "COMMON|<代表: Hermes 隔离进程>|<证据: effective.source/fingerprint/region 字段>|<阻塞: 无>",
    **{"依赖": dep("effective.{source,fingerprint,region,accountType}", "UX-R2")})

add("D11-4", "auth_status 生效来源=S1(无会话标记)", "P1",
    "隔离 HOME；仅 S1 存在；HW_* env 未设",
    "S1={ak:AKS1..., sk:SKS1..., region:cn-north-4}",
    "①写 S1(无 configuredBySession) ②huaweicloud_auth_status ③读 effective.source",
    "effective.source==\"s1\" 且 effective.fingerprint==该 S1 指纹",
    "P: UX-R2; 实: resolveCredentials(credentials.mjs:232-240)",
    "auth_status", "函数/fixture",
    "COMMON|<代表: 隔离 HOME>|<证据: effective.source=s1>|<阻塞: 无>",
    **{"依赖": dep("effective.source", "UX-R2")})

add("D11-5", "auth_status 生效来源=env 三件套(平台注入)", "P1",
    "隔离 HOME；S1 不存在；env 设完整真三件套",
    "HW_ACCESS_KEY/HW_SECRET_KEY/HW_SECURITY_TOKEN 均为非占位真值",
    "①设置 env 三件套真值 ②huaweicloud_auth_status ③读 effective",
    "effective.source==\"env\" 且 effective.accountType==\"temporary\"",
    "P: UX-R2; 实: computeOnboarding(service.mjs:72-77)",
    "auth_status", "函数/fixture",
    "COMMON|<代表: 隔离进程 + env 注入>|<证据: effective.source=env/accountType=temporary>|<阻塞: 无>",
    **{"依赖": dep("effective.accountType", "UX-R2")})

add("D11-6", "auth_status 冲突态双账号对照", "P2",
    "S1(账号A) 与 env(账号B) 同时存在且 A≠B",
    "S1 指纹=A；env 真三件套 指纹=B",
    "①构造双账号冲突 ②huaweicloud_auth_status ③读 effective 与 onboarding",
    "onboarding.scenario==2 且 onboarding 携带两组 {fingerprint,region,source}（分别指向 S1 与 env）；effective.source 取唯一值",
    "P: UX-R3 冲突可视化(本改善需求); 实: computeOnboarding(service.mjs:94-129)",
    "auth_status", "函数/fixture",
    "COMMON|<代表: 隔离 HOME + env>|<证据: scenario=2 + 双账号对照字段>|<阻塞: 需构造双账号>",
    **{"依赖": dep("onboarding.accounts[] 对照字段", "UX-R3")})

add("D11-7", "冲突一键选择(中文标签+确认闭环)", "P2",
    "同 D11-6 冲突态",
    "auth_switch{mode:\"import\",action:\"persist\"}",
    "①冲突态调用 auth_switch persist ②读 needs_confirmation ③huaweicloud_auth_confirm(decision) ④huaweicloud_auth_status",
    "首次返回 needs_confirmation==true 且含 confirmToken 且两个候选 label 均为中文并各自含账号指纹（不含裸代号 \"S1\"）；confirm 后 S1/env/S3 三端指纹一致",
    "P: UX-R3; 实: huaweicloud_auth_confirm(tools.mjs:554) + tools.mjs:1244(label)",
    "auth_switch,auth_confirm,auth_status", "函数/fixture",
    "COMMON|<代表: 隔离 HOME + env 三件套>|<证据: confirmToken 流程 + 三端指纹一致>|<阻塞: 需构造双账号>")

add("D11-8", "切换持久性显式化 temporary", "P1",
    "已有 S1 账号",
    "auth_switch{mode:\"memory\",action:\"temporary\",ak,sk,region}",
    "①auth_switch temporary ②读返回字段 ③huaweicloud_auth_status",
    "返回含 persistsAfterRestart==false 且 affects.hcloud==false 且含中文警告字段（不含裸代号 \"A+C\"）；effective.source==\"runtime\"",
    "P: UX-R4 切换语义显式(本改善需求); 实: tools.mjs:540(auth_switch 描述含 A+C warning)",
    "auth_switch,auth_status", "函数/fixture",
    "COMMON|<代表: Hermes 隔离进程>|<证据: persistsAfterRestart/affects 字段>|<阻塞: 无>",
    **{"依赖": dep("persistsAfterRestart / affects{}", "UX-R4")})

add("D11-9", "切换持久性显式化 persist/clear", "P1",
    "同 D11-8",
    "auth_switch{action:\"persist\"} 后 auth_switch{action:\"clear\"}",
    "①auth_switch persist ②读返回 ③auth_switch clear ④huaweicloud_auth_status",
    "persist 返回 persistsAfterRestart==true 且 S1.configuredBySession==true；clear 后 effective.source 回退为 \"s1\"",
    "P: UX-R4; 实: setConfiguredBySession(credentials.mjs:194-198)",
    "auth_switch,auth_status", "函数/fixture",
    "COMMON|<代表: 隔离 HOME>|<证据: configuredBySession 翻转 + source 回退>|<阻塞: 无>",
    **{"依赖": dep("persistsAfterRestart", "UX-R4")})

add("D11-10", "auth init 交互提示中文化", "P1",
    "TTY 终端；无 env 凭证",
    "交互依次输入 AK、SK、安全令牌、region",
    "①TTY 执行 auth init ②捕获四类交互提示文本",
    "AK/SK/安全令牌/region 四类提示均为含中文字符的字符串（不出现 \"Access Key ID (AK): \" / \"Secret Access Key (SK): \" / \"Security Token (optional, press Enter to skip): \" 三处英文原文）",
    "P: UX-R5 登录流程母语化(本改善需求); 实: cmdAuthInit(setup-cli.mjs:4813-4817)",
    "auth", "脚本",
    "COMMON|<代表: Windows/Linux TTY>|<证据: 四类交互提示文本语言>|<阻塞: 需 PTY 捕获>",
    TTY="TTY")

add("D11-11", "auth init region 显式化且缺省不报错", "P1",
    "TTY；HW_REGION/HUAWEICLOUD_REGION 未设",
    "交互全程回车（不填 region）",
    "①auth init 交互跳过 region ②检查 S1 落值 ③检查 stderr",
    "交互中出现 region 询问且含默认值 \"cn-north-4\"；S1.region==\"cn-north-4\"；stderr 不含 \"region, ak, and sk are required\"",
    "P: UX-R5; 实: setup-cli.mjs:4817 + writeObsConfig(credentials.mjs:205)",
    "auth", "函数/fixture",
    "COMMON|<代表: 隔离 HOME TTY>|<证据: region 提示 + S1.region 落值>|<阻塞: 无>",
    TTY="TTY")

add("D11-12", "auth init 无效 SK 前置校验(IAM 401 中文可动作)", "P1",
    "AK 有效、SK 无效（篡改一位）；网络可达 IAM",
    "HW_ACCESS_KEY=<有效 AK>, HW_SECRET_KEY=<篡改后 SK>",
    "①执行 auth init ②捕获输出 ③检查 S1 是否落盘",
    "输出含中文校验失败提示且含可执行动作（指向控制台重新生成访问密钥）；不出现英文 \"IAM rejected the credentials\" 裸串",
    "P: UX-R5 登录即校验(本改善需求); 实: validateIamCredentials(credential-validator.mjs:90); 上游 #900(IAM-401 文案)",
    "auth", "函数/fixture",
    "COMMON|<代表: 隔离 HOME + 真云 IAM>|<证据: 401 中文提示 + 下一步动作>|<阻塞: 需真实 AK>")

add("D11-13", "登录后闭环自检全通过", "P1",
    "已完成 auth init（S1 + OBS + KooCLI 三端落位）",
    "huaweicloud_auth_status",
    "①auth init 完成 ②huaweicloud_auth_status ③读体检项",
    "凭据/OBS/KooCLI(含版本)/project-id/MCP 注册五项 ready==true 且各自 nextStep 为空；返回含中文体检摘要与\"是否需重启会话\"结论，且不含内部代号 \"S1\"/\"S2\"/\"S3\"",
    "P: UX-R6 登录后自检(本改善需求); 实: getAuthStatus(service.mjs:165-186) + tools.mjs:1059(note 含 S1/S2)",
    "auth_status,check_cli,show_profile_redacted", "函数/fixture",
    "COMMON|<代表: Hermes 隔离进程>|<证据: 五项 ready + nextStep 空>|<阻塞: 需真云凭证>",
    **{"依赖": dep("checkup.{items[],ready,nextStep}", "UX-R6")})

add("D11-14", "自检单端破坏定位", "P2",
    "登录完成；删除 OBS 配置",
    "删除 ~/.obsutilconfig 后调用 huaweicloud_auth_status",
    "①删除 OBS 配置 ②huaweicloud_auth_status ③读 obs 项",
    "obs.ready==false 且 obs.nextStep 唯一含 \"huaweicloud_auth_sync\"；其余四项 ready 仍为 true",
    "P: UX-R6; 实: syncAuth(service.mjs:188-218)",
    "auth_status,auth_sync", "函数/fixture",
    "COMMON|<代表: 隔离 HOME>|<证据: 单端 false + 定向 nextStep>|<阻塞: 无>",
    **{"依赖": dep("checkup.obs.nextStep", "UX-R6")})

add("D11-15", "敏感信息安全感披露", "P2",
    "任意登录路径（交互 / 工具）",
    "auth init 与 auth_status 的返回文案",
    "①执行 auth init 或 auth_status ②检查文案与 S1 文件权限",
    "输出显式包含「AK/SK 不进入会话上下文」「不写入 shell 历史」「凭证文件 mode 0600」三项中至少两项",
    "P: UX-R5 安全感知(本改善需求); 实: writeGlobalCredentials(credentials.mjs:189, mode 0o600) + ensurePrivateMode(credentials.mjs:17)",
    "auth_init,auth_status", "函数/fixture",
    "COMMON|<代表: Windows/Linux>|<证据: 安全披露文案 + S1 mode>|<阻塞: Windows 无 POSIX mode>")

add("D11-16", "统一错误卡中文化与可动作化(6 码决策表)", "P1",
    "可注入各错误场景的隔离环境",
    "6 码决策表：HDKIT_CRED_MISSING / IAM-401 / IAM-403 / region-缺失 / KooCLI-未装 / project-id-未设",
    "①逐场景触发错误 ②读取错误对象 ③比对字段",
    "每码均返回 {code,messageZh,action}，messageZh 含中文字符且不含英文整句（如 \"Huawei Cloud credentials are not configured\" / \"KooCLI not ready.\"），action 为可执行命令（以 \"npx huaweicloud-devkit\" 或 \"hcloud\" 开头）；六码 action 互不相同",
    "P: UX-R7 统一错误卡(本改善需求); 实: service.mjs:191-251 + credentials.mjs:266-269; 上游 #900",
    "auth_status,auth_sync,explain_error", "函数/fixture",
    "COMMON|<代表: 隔离 HOME>|<证据: 六码 messageZh/action 字段>|<阻塞: 无>",
    **{"依赖": dep("error.{code,messageZh,action}", "UX-R7")})

add("D11-17", "中文口语意图路由命中率", "P1",
    "serviceCatalog 可用；固定中文意图集就绪",
    "20 条中文口语意图（\"帮我建个服务器\"/\"开个对象存储\"/\"查下账单\"/\"看看我的虚拟机\" 等）",
    "①逐条调用 huaweicloud_service_catalog(intent) ②记录命中服务 ③与人工标注比对",
    "命中率 >= 85%（>=17/20；依据 issue #852 实测基线 21.4%，目标提升至 85%）且无一条返回空路由；命中服务与人工标注全等",
    "P: UX-R8 中文路由(本改善需求); 实: serviceCatalog(tools.mjs:1776); 关联 issue #852(11/14 MISS)",
    "service_catalog", "脚本",
    "COMMON|<代表: Hermes Windows>|<证据: 20 条意图命中矩阵>|<阻塞: 需固定意图集>")

add("D11-18", "路由 MISS 中文澄清追问", "P2",
    "同 D11-17",
    "1 条不可路由的模糊意图（如\"帮我弄一下云上的东西\"）",
    "①调用 huaweicloud_service_catalog 模糊意图 ②读返回体",
    "返回体含非空中文澄清字段（候选服务列表或追问语句），不返回静默空路由",
    "P: UX-R8; 实: service-catalog 返回体",
    "service_catalog", "函数/fixture",
    "COMMON|<代表: Hermes>|<证据: 澄清字段非空>|<阻塞: 无>")

add("D11-19", "写操作审批可解释性", "P1",
    "hook-capable 客户端；已有有效凭证",
    "未审批写命令 hcloud ECS DeleteServers --server_id=<id>",
    "①在会话内直接执行未审批写命令 ②读拦截返回",
    "返回含中文拦截理由且给出\"先 plan 再 approve\"两点可执行指引（含工具名 huaweicloud_plan_cli_command / huaweicloud_run_approved_command）；不出现纯英文 \"unapproved Huawei Cloud write operations must be planned first and explicitly approved by the user.\" 裸串",
    "P: UX-R9 审批可解释(本改善需求); 实: evaluate(huaweicloud-safety.py:185-186)",
    "hook_check_command,plan_cli_command,run_approved_command", "函数/fixture",
    "AGENT_E2E|<代表: Hermes(hook 客户端)>|<证据: 拦截文案 + 批准指引>|<阻塞: 需 hook-capable 客户端>",
    tct="AGENT_E2E", hookSupport="hook-capable（Hermes PreToolUse）")

add("D11-20", "安装/更新后\"需重启会话\"会话内提示", "P2",
    "已安装插件但当前会话未加载",
    "doctor 与 install --target <client> 的输出",
    "①在未加载插件的旧会话内执行 doctor ②读输出",
    "doctor 输出含\"本会话未加载插件\"或\"需重启\"判定项且为中文，与 README「安装后重启会话」表述一致",
    "P: UX-R10 重启可见(本改善需求); 实: setup-cli.mjs cmdDoctor + README.zh-CN.md(9 处 restart)",
    "doctor,check_update,upgrade", "脚本",
    "CLIENT_MATRIX|<代表: 逐客户端 11 目标>|<证据: doctor 重启项命中>|<阻塞: 需各客户端>",
    tct="CLIENT_MATRIX")

add("D11-21", "首次登录成功\"下一步建议\"空态引导", "P2",
    "首次登录完成；无历史使用记录",
    "huaweicloud_auth_init / huaweicloud_auth_status 返回体",
    "①首次完成登录 ②读返回体",
    "返回含 3 条中文示例任务提示语，且覆盖只读查询/资源创建/沙箱预览三类",
    "P: UX-R11 空态引导(本改善需求); 实: computeOnboarding(service.mjs:47-163)",
    "auth_status,auth_init", "函数/fixture",
    "COMMON|<代表: Hermes>|<证据: 示例任务 3 条>|<阻塞: 无>")

# ============ 第二批：使用体验专题（D11-22 ~ D11-35，覆盖自审后补强） ============

add("D11-22", "KooCLI 首跑隐私协议同意体验", "P1",
    "全新 KooCLI（无 ~/.hcloud）：非交互（Agent）环境",
    "首次触发任一 hcloud 命令（如 hcloud version）",
    "①删除 ~/.hcloud ②非交互环境触发 hcloud 命令 ③读返回",
    "返回含中文说明\"KooCLI 首次运行需同意隐私协议\"且给出两条路径（用户授权后由 Agent 代答 stdin=y / 用户自行在终端执行）；不出现英文 \"KooCLI requires accepting its privacy agreement.\" 与 \"您输入的是无效字符\" 裸串",
    "P: UX-R13 KooCLI 隐私协议(本改善需求); 实: hcloud-probe.mjs(privacy_pending) + service.mjs:234-238",
    "check_cli,run_readonly_command", "函数/fixture",
    "COMMON|<代表: 隔离 HOME + 全新 KooCLI>|<证据: 中文同意指引文案>|<阻塞: 需全新 KooCLI 环境>")

add("D11-23", "未检测到客户端的交互询问可读性", "P2",
    "全新环境无任何已装客户端；TTY",
    "npx huaweicloud-devkit install（省略 --target）",
    "①TTY 执行 install 无 --target ②捕获询问文案 ③non-TTY 再执行一次",
    "TTY 询问文案为中文且含三条可选路径（指定 target / 全部安装 / 通用 MCP 接入）与支持列表；non-TTY 以中文报错并列出全部 --target 取值",
    "P: UX-R12 安装交互(本改善需求); 实: setup-cli.mjs cmdInstall(未检测到分支) + README.zh-CN.md 快速开始",
    "install,doctor", "脚本",
    "COMMON|<代表: Windows/Linux（TTY + non-TTY）>|<证据: 询问/报错文案语言与选项完整性>|<阻塞: 需全新环境>",
    installLayout="全新环境（无任何客户端）")

add("D11-24", "码道沙箱阻断 KooCLI 的指引可读性", "P2",
    "码道客户端；沙箱模式开启",
    "npx huaweicloud-devkit install-hcloud",
    "①码道内执行 install-hcloud ②读输出 ③按指引关闭沙箱后复测",
    "输出含中文说明\"码道沙箱模式阻止 KooCLI 运行\"且给出可执行恢复路径（码道外终端安装 / 设置→对话流→智能体→终端命令运行模式→自动运行）；关闭沙箱后 KooCLI 可运行",
    "P: UX-R15 客户端差异化指引(本改善需求); 实: README.zh-CN.md 码道沙箱注释 + setup-cli.mjs install-hcloud",
    "install-hcloud,doctor,check_cli", "手动",
    "CLIENT_MATRIX|<代表: 码道 codearts>|<证据: 沙箱阻断指引文案 + 恢复后可用>|<阻塞: 需码道环境>",
    tct="CLIENT_MATRIX",
    **{"依赖": "环境依赖: 码道客户端 + 沙箱模式（须由码道机器执行，见 CLIENT_MATRIX）；需求来源 UX-R15；独立 manifest；finally 清理"})

add("D11-25", "会话内能力可发现性", "P2",
    "已登录；会话内",
    "用户提问\"你都能干什么\"/\"华为云怎么用\"",
    "①会话内提出能力询问 ②读返回",
    "返回中文能力清单（分组列举核心能力并指向 huaweicloud_retrieve_skill / huaweicloud_service_catalog），不返回空结果或纯英文工具名罗列",
    "P: UX-R16 可发现性(本改善需求); 实: huaweicloud-capability-discovery skill + tools.mjs(40 工具)",
    "retrieve_skill,service_catalog,search_docs", "函数/fixture",
    "AGENT_E2E|<代表: Hermes 会话>|<证据: 中文能力清单>|<阻塞: 需可交互会话>",
    tct="AGENT_E2E")

add("D11-26", "工具描述人话化（无内部代号/无英文整句）", "P1",
    "可读取 MCP tools/list",
    "40 个工具的 name/description/enum 描述全文",
    "①拉取 tools/list ②扫描内部代号与英文整句 ③输出命中清单",
    "面向用户的 description 与 enum 描述中不出现内部代号 S1/S2/S3/A+C/R2/R9/R10/R11；且不含英文整句（如 \"Switch Huawei Cloud credentials within the current session.\"）",
    "P: UX-R17 术语人话化(本改善需求); 实: tools.mjs:540(A+C)/:556(S1)/:1059(S1,S2,R9)/:1244(label 含 S1)",
    "auth_switch,auth_confirm,auth_status", "脚本",
    "COMMON|<代表: Hermes tools/list>|<证据: 代号/英文整句扫描结果清单>|<阻塞: 无>")

add("D11-27", "工具返回中文摘要与长输出可读性", "P1",
    "已登录；可触发长结果（多实例 ECS 列表）",
    "huaweicloud_run_readonly_command args=[\"ecs\",\"ListServersDetails\"]",
    "①执行返回长列表的只读命令 ②读返回体",
    "返回体含中文字段摘要（至少覆盖 资源标识/名称/状态 三项字段映射），长输出有截断或分页提示；原始 JSON 与中文摘要并存不互相覆盖",
    "P: UX-R18 输出可读性(本改善需求); 实: mcp-protocol.mjs(decorateResult) + tools.mjs 返回包装",
    "run_readonly_command", "函数/fixture",
    "COMMON|<代表: Hermes + 真云只读>|<证据: 中文字段摘要 + 截断提示>|<阻塞: 需真云只读凭证>")

add("D11-28", "凭据失效/STS 到期的可动作提示", "P1",
    "已登录；凭据被人为失效（AK 禁用 / STS 过期）",
    "失效后的 auth_status 与一次只读调用",
    "①失效凭证 ②huaweicloud_auth_status ③执行一次只读调用 ④读返回",
    "返回中文提示\"凭证已失效/已过期\"且给定唯一 action（重新执行 auth init）；临时凭证额外标注\"剩余有效期\"；不出现英文 401 裸串",
    "P: UX-R19 凭据生命周期(本改善需求); 实: credential-validator.mjs:139-146 + parseStsExpiry(credentials.mjs:120-159)",
    "auth_status,run_readonly_command,explain_error", "函数/fixture",
    "COMMON|<代表: 隔离 HOME + 失效凭证>|<证据: 失效提示 + 唯一 action + 剩余有效期>|<阻塞: 需可控失效的凭证>",
    **{"依赖": dep("credential.expiresAt / 失效走查字段", "UX-R19")})

add("D11-29", "切号后立即生效验证", "P1",
    "已登录账号 A；另有可用账号 B",
    "auth_switch(账号 B, persist) → 一次只读云调用",
    "①auth_switch 切到 B ②立即执行一次只读云调用 ③比对返回账号标识",
    "无需重启即生效：只读调用返回的账号或项目标识与 B 一致；返回体提示\"已生效，无需重启会话\"",
    "P: UX-R20 切号即时生效(本改善需求); 实: resolveCredentialsWithRuntime(credentials.mjs:396-407)",
    "auth_switch,auth_status,run_readonly_command", "函数/fixture",
    "COMMON|<代表: Hermes + 双账号>|<证据: 切换后调用账号标识=B>|<阻塞: 需两个真实账号>")

add("D11-30", "登录态机迁移全覆盖（状态转换法）", "P1",
    "可构造各登录态；隔离 HOME",
    "状态迁移路径表：未登录→已登录(S1) / →runtime / →persist / →clear / →失效 / →切号 / →冲突",
    "①逐条执行状态迁移 ②每步读 effective.source 与体检项",
    "7 条迁移路径每条 effective.source 与预期唯一值一致，且 clear/失效 均正确回退到上一可用来源；无一条迁移后状态与实际生效账号不符",
    "P: UX-R2/R4 状态机(本改善需求); 实: credentials.mjs:217-308 + service.mjs:47-163",
    "auth_init,auth_switch,auth_status", "函数/fixture",
    "COMMON|<代表: 隔离 HOME 状态机>|<证据: 7 条迁移 × effective.source 矩阵>|<阻塞: 无>",
    **{"依赖": dep("effective.source（状态机断言基础）", "UX-R2/R4")})

add("D11-31", "region 合法性与非法值边界（边界值法）", "P2",
    "已登录；隔离 HOME",
    "region 取值：合法 cn-north-4 / 合法无资源 cn-north-1 / 非法 cn-north-9 / 空串 / 大小写混合 CN-North-4",
    "①逐值写入凭证并调用一次只读命令 ②读返回提示",
    "非法 region 返回中文可动作提示且含可用区域候选（源自 huaweicloud_list_regions）；空串回退默认值 cn-north-4；大小写不规范值给出中文规范化提示；五类取值提示互不混淆",
    "P: UX-R5 边界(本改善需求); 实: writeObsConfig(credentials.mjs:205) + list_regions",
    "auth_switch,list_regions,run_readonly_command", "函数/fixture",
    "COMMON|<代表: 隔离 HOME>|<证据: 5 类 region 取值提示矩阵>|<阻塞: 无>")

add("D11-32", "HOME 不可写/沙箱 home 失败（错误推测法）", "P2",
    "HOME 目录只读或不可解析（沙箱形态）",
    "只读 HOME（或 HUAWEICLOUD_HOME 指向只读路径）下执行 auth init",
    "①设置只读 HOME ②执行 auth init ③读返回 ④改用 HW_ACCESS_KEY/HW_SECRET_KEY 复测",
    "返回中文错误（\"无法写入凭证目录\"或\"沙箱环境无法解析用户主目录\"）且给出替代路径（HUAWEICLOUD_HOME / env 注入）；不出现英文整句 \"KooCLI detected but cannot resolve the user home directory in this agent sandbox.\"",
    "P: UX-R7 错误推测(本改善需求); 实: service.mjs:230-241(sandbox_home_failure) + credentials.mjs:14-35(ensurePrivateMode)",
    "auth,auth_status", "函数/fixture",
    "COMMON|<代表: 只读 HOME>|<证据: 中文错误 + 替代路径>|<阻塞: 需构造只读 HOME>")

add("D11-33", "审批被拒/超时/挂起全路径", "P2",
    "hook-capable 客户端；写操作待审批",
    "写命令 plan → 用户拒绝 / 超时未响应",
    "①plan 出写命令 ②用户拒绝 ③另构造超时未响应 ④读返回并校验零写入",
    "拒绝返回中文\"操作已按你的决定取消\"且说明\"资源未发生变更\"；超时返回中文\"等待审批超时\"且给出可重试指引；两情形经只读复核均无资源变更",
    "P: UX-R21 审批全路径; 实: huaweicloud-safety.py + run_approved_command",
    "plan_cli_command,run_approved_command,hook_check_command", "手动",
    "AGENT_E2E|<代表: Hermes(hook 客户端)>|<证据: 拒绝/超时文案 + 只读复核零写入>|<阻塞: 需可交互会话>",
    tct="AGENT_E2E")

add("D11-34", "资源归零体验（残留提示与清理引导）", "P1",
    "已创建测试资源（ECS/EIP 等，tctest- 前缀）",
    "清理流程产出与只读复核",
    "①创建带前缀测试资源 ②执行清理 ③读清理反馈 ④只读列表复核",
    "清理后返回中文归零报告（逐资源列出\"已释放/未释放\"并给出剩余计数），未释放项附唯一补删命令；不出现静默成功；只读列表复核返回空",
    "P: UX-R23 归零体验(本改善需求); 实: 现有 E2E 归零纪律(D3-C1/D3-C7) + ListEips/ListVolumes 复核",
    "run_approved_command,run_readonly_command", "脚本",
    "COMMON|<代表: 真云贵资源>|<证据: 归零报告 + 只读列表复核为空>|<阻塞: 需真云配额>",
    **{"依赖": dep("归零报告封装（逐资源 已释放/未释放 + 剩余计数 + 补删命令）", "UX-R23")})

add("D11-35", "沙箱连不通的排障引导", "P1",
    "沙箱服务可达性受限（模拟连接超时 / 预览 URL 不可达）",
    "huaweicloud_sandbox_connect → deploy → 访问预览 URL",
    "①connect ②deploy ③访问预览 URL ④读各步返回",
    "连接超时返回中文提示 + 下一步（重试 / 换区域 / 查 devbridge 状态）；预览 URL 不可达返回中文排障清单（nginx 状态 / 隧道 / 端口）而非裸错误；两情形各给出唯一可执行动作",
    "P: UX-R24/R25 沙箱可观测(本改善需求); 实: sandbox/session-manager.mjs + 关联 issue #787/#817",
    "sandbox_connect,sandbox_deploy_nginx,sandbox_deploy_check", "函数/fixture",
    "COMMON|<代表: 真云沙箱>|<证据: 中文排障清单 + 唯一动作>|<阻塞: 需沙箱环境>")


# ============ 第三批：范式升级用例（D11-37 ~ D11-44，2026-10-13 v3） ============
# 判据强度升级：从「字段存在」→「症状消失 / 独立观测 / 指标不劣化」。
# 详见 docs/UX-体验验证案例升级方案-20261013.md

add("D11-37", "引导闭环有效性（范式①：执行 action 后症状消失）", "P1",
    "隔离宿主（USERPROFILE/HOME 置空目录，无真实凭证与码道目录）；Node >=22",
    "eval/harness/fixtures/d11-37-guidance-closure.mjs <hdk src> --evid <dir>",
    "①隔离宿主执行夹具 ②读逐项 PASS/FAIL 与 exit code ③断言「文案达标 3 项 + 闭环有效性 1 项」全 PASS",
    "夹具 exit 0（宿主污染时 exit 2 标 ENV_CONTAMINATED，整例不计入 PASS/FAIL）；闭环有效性断言=按引导完成登录后 resolveCredentials 返回新凭证",
    "P: UX-R1 + 通: 闭环有效性范式(升级方案§2①); 实: eval/harness/fixtures/d11-37-guidance-closure.mjs",
    "run_readonly_command,auth_status", "fixture:eval/harness/fixtures/d11-37-guidance-closure.mjs",
    "COMMON|<代表: 隔离宿主(Hermes/CI)>|<证据: 夹具 stdout + exit code>|<阻塞: 需隔离 USERPROFILE/HOME>",
    installLayout="隔离 USERPROFILE/HOME 空目录 + HUAWEICLOUD_HOME fixture",
    requiredEvidence="强断言：夹具 exit code + 逐项 stdout；含宿主隔离前置门结果；保留 stdout.txt 证据")

add("D11-38", "独立可观测面双轨断言（范式③：不以自述自证）", "P1",
    "真云只读账号 A/B；隔离宿主",
    "auth_init 设 A → huaweicloud_run_readonly_command 执行 STS GetCallerIdentity 或 ECS ListServersDetails",
    "①切换到账号 A ②执行一次真云只读调用 ③从响应体反推账号/项目标识 ④与账号 A 预期标识比对 ⑤与自述字段 effective.source 双轨对照",
    "独立观测面反推的账号标识 == 账号 A 的真实标识，且与 effective.source 结论一致；不得仅以工具自述字段作唯一证据",
    "P: UX-R2 双轨透明 + 通: 自证禁区(升级方案§2③)",
    "auth_init,run_readonly_command,auth_status", "fixture",
    "COMMON|<代表: 真云只读>|<证据: 独立 API 响应反推的账号标识 + 双轨对照>|<阻塞: 需真实双账号>",
    requiredEvidence="强断言：真云只读响应原文(脱敏) + 反推标识 + 自述字段；两轨须一致",
    **{"依赖": dep("effective.{source,fingerprint}（独立观测面双轨对照字段）", "UX-R2")})

add("D11-39", "体验回放差异分类（范式②：基线 + 语义分类）", "P1",
    "已录制体验基线 eval/replay/recordings/ux-baseline-v1.jsonl（未登录/401/冲突/沙箱失败等场景返回体）",
    "eval/replay/replay.mjs + compare.mjs 扩展分类（MISLEADING_HINT/INTERNAL_JARGON_LEAK/ENGLISH_RESIDUE/UNCLEAR_NEXT_STEP）",
    "①录制基线 ②回放逐场景 ③执行语义差异分类 ④落趋势 CSV",
    "分类结果仅出现 PASS 类（SEMANTIC_EQUIVALENT/ORDER_CHANGE/MINOR_FORMAT_CHANGE）；四类新增 FAIL 分类均不出现；趋势 CSV 可按日期比对",
    "P: UX 可量化 + 通: 复用 eval/replay 机制(升级方案§2②); 实: eval/replay/compare.mjs:1-30",
    "auth_status,auth_switch,explain_error", "脚本",
    "COMMON|<代表: 回放驱动 + mcp-server>|<证据: 分类 CSV + 趋势对比>|<阻塞: 需基线录制>",
    requiredEvidence="强断言：分类 CSV（逐场景分类结论）+ 趋势对比；基线变更须版本化")

add("D11-40", "体验度量对照（范式④：步数/失败/求助 三指标）", "P1",
    "基线版与新版本各可运行；agent 当用户（真实客户端）",
    "eval/prompts/eval-set-ux.csv（10 条模糊中文需求） + eval/harness/run-agent-eval.mjs",
    "①对基线版跑评测集，记录 steps/fails/clarifications ②对新版跑同一集 ③逐条比对三指标",
    "新版 steps<=基线 且 fails<=基线 且 clarifications<=基线，且三项中至少一项严格改善；无一条指标恶化",
    "P: UX 可度量 + 通: 对照基准(升级方案§2④); 实: eval/harness/run-agent-eval.mjs",
    "service_catalog,retrieve_skill", "评测集:eval/prompts/eval-set-ux.csv",
    "AGENT_E2E|<代表: 真实客户端 × 多 agent>|<证据: 三指标对照表>|<阻塞: 需评测预算 + 双版本可就绪>",
    tct="AGENT_E2E",
    requiredEvidence="强断言：逐条三指标对照表 + 评测集版本；须注明模型与客户端参数")

add("D11-41", "误导性归因矩阵（4 类已知误导）", "P1",
    "可注入四类误导场景的隔离宿主",
    "决策表：①region 缺失 ②占位符遮蔽凭证 ③KooCLI 未安装 ④STS 已过期",
    "①逐场景触发 ②读错误归因与修复动作 ③与正确根因比对",
    "四场景归因分别指向真实根因（region/占位符/KooCLI/STS 过期），无一场景误报为其他项；每场景提示含修复动作",
    "P: UX-R7 归因正确 + 通: 误导矩阵(升级方案§3.1); 实: SKILL.md:151(domain-id 误导已记录) + issue #570",
    "auth_status,explain_error,run_readonly_command", "fixture:eval/harness/fixtures/d11-41-misleading-attribution.mjs",
    "COMMON|<代表: 隔离宿主>|<证据: 4 场景归因矩阵>|<阻塞: 需可控注入四类场景>",
    requiredEvidence="强断言：4 场景 实际归因 vs 正确根因 对照矩阵；含修复动作文本")

add("D11-42", "输出编码契约：恒为 UTF-8（与代码页/locale 无关）", "P1",
    "Windows cp936 控制台 / 非 Windows LC_ALL=C（管道捕获）；隔离宿主",
    "未登录引导的 stdout 原始字节 + UTF-8 与本地编码双解码结果",
    "①在 cp936(Windows) 或 LC_ALL=C(非 Windows) 环境跑未登录调用 ②捕获 stdout 原始字节 ③分别按 UTF-8 与本地编码解码",
    "正断言：UTF-8 解码含「未配置」；反断言：本地编码(cp936/latin1)解码不含「未配置」（防退化成 GBK 输出）",
    "P: UX 终端兼容（判据修正：原「cp936 可读」为错误判据，见夹具头注）+ 通: 终端编码矩阵(升级方案§3.2)",
    "auth,run_readonly_command", "fixture:eval/harness/fixtures/d11-42-encoding-contract.mjs",
    "OS_MATRIX|<代表: Windows(cp936)/Linux(C locale)>|<证据: 原始字节 + 双解码>|<阻塞: 无>",
    tct="OS_MATRIX", TTY="管道与非 TTY 均可",
    requiredEvidence="强断言：stdout 原始字节 + UTF-8/本地编码双解码文本；单一解码结果不足以判定")

add("D11-43", "窄终端/无颜色/C locale 可读性", "P2",
    "隔离宿主；可控制终端列宽与环境变量",
    "5 种环境：列宽 40 / NO_COLOR=1 / TERM=dumb / LANG=C / LC_ALL=C",
    "①逐环境执行未登录引导与错误返回 ②检查关键信息是否被截断、语义是否丢失、是否乱码",
    "40 列下列宽内\"尚未登录\"结论与\"下一步命令\"完整可见（不被截断）；NO_COLOR/TERM=dumb 下去色后结论仍可辨（语义不依赖颜色）；LANG=C/LC_ALL=C 下无乱码",
    "P: UX 终端兼容 + 通: 环境矩阵(升级方案§3.2)",
    "auth,auth_status", "fixture:eval/harness/fixtures/d11-43-terminal-env-matrix.mjs",
    "OS_MATRIX|<代表: Windows/Linux 终端变体>|<证据: 5 种环境输出对照>|<阻塞: 需可控终端>",
    tct="OS_MATRIX",
    requiredEvidence="强断言：5 种环境输出对照；关键字段清单预先固定，避免\"关键信息\"主观化")

add("D11-44", "故障注入矩阵（超时/限流/404/断网）", "P1",
    "可注入网络故障的隔离宿主（可复用 d9-9 延迟注入能力）",
    "四类故障：挂起 30s 超时 / 429 限流 / CDN 404 / 完全断网",
    "①逐类注入 ②触发对应调用（只读命令/更新检查）③记录等待时长与返回",
    "四类故障均在阈值内返回（有界等待 <=30s，不卡死）；返回含中文可动作且各含唯一下一步；断网不得误导为\"凭证错误\"",
    "P: UX 鲁棒性 + 通: 故障注入(升级方案§3.3); 实: eval/harness/fixtures/d9-9-delay-timeout.mjs",
    "run_readonly_command,check_update,explain_error", "fixture:eval/harness/fixtures/d11-44-fault-injection.mjs",
    "COMMON|<代表: 隔离宿主 + 故障注入>|<证据: 4 类故障的等待时长 + 文案>|<阻塞: 需故障注入能力>",
    requiredEvidence="强断言：逐类故障等待时长（范围断言 <=30s）+ 归因文案；不得以毫秒级相等断言")


def main():
    # 登记守卫：LANDED 里写的夹具必须真实存在于仓库（防止"登记了却没有载体"的幽灵登记）
    repo = os.path.dirname(os.path.dirname(HERE))
    missing = [f"{cid} -> {rel}" for cid, rel in LANDED.items()
               if not os.path.isfile(os.path.join(repo, rel.replace("/", os.sep)))]
    if missing:
        raise SystemExit("[错误] LANDED 登记的夹具不存在：\n  " + "\n  ".join(missing))

    with open(OUT, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(HEADER)
        w.writerows(ROWS)
    print(f"[OK] {len(ROWS)} 条 D11 体验用例 -> {OUT}")
    print(f"[OK] 列数 = {len(HEADER)}（与母版设计级一致：27）")
    n = lambda lo, hi: len([r for r in ROWS if lo <= int(r[0].split('-')[1]) <= hi])
    print(f"[OK] 第一批(登录专题) = {n(1, 21)} 条；"
          f"第二批(使用体验) = {n(22, 35)} 条；"
          f"第三批(范式升级) = {n(36, 99)} 条")
    nfx = len([r for r in ROWS if str(r[10]).startswith("fixture:")])
    print(f"[OK] 已落地可执行载体 = {nfx} 条（LANDED 登记 {len(LANDED)} 条，全部存在）")


if __name__ == "__main__":
    main()
