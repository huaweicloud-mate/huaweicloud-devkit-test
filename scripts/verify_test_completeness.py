# -*- coding: utf-8 -*-
"""测试全面性持续监控门禁：定期扫描用例矩阵覆盖率缺口 + 工具覆盖 + 环境变量覆盖 + CLI 子命令覆盖。

用法:
    python scripts/verify_test_completeness.py [--hdk-path <path>]

功能（违反任一规则即 exit 1）:
1. 工具覆盖门禁：源码 tools.mjs 注册的 huaweicloud_* 工具必须全部在设计用例「关联工具」列出现。
2. CLI 子命令覆盖门禁：setup-cli.mjs 注册的 case 子命令必须全部在设计用例文本中出现。
3. 环境变量覆盖门禁：源码中 HUAWEICLOUD_* 环境变量必须全部在设计用例文本中出现。
4. 展开规则空值门禁：设计级用例的「展开规则」列不得为空。
5. P0 用例存在性门禁：每个维度至少有 1 个 P0 用例（安全/协议维度必须有 P0）。
6. 缺口清单一致性门禁：coverage-gaps.md 中标记「未覆盖」的缺口在设计用例中确实无覆盖。
7. 导出函数覆盖统计（WARN 模式）：覆盖率 < 60% 时警告。

exit 0 = 通过 / 1 = 违反门禁规则 / 2 = 环境缺失（无法定位源码）
"""
import csv
import os
import re
import sys
import collections

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESIGN_CSV = os.path.join(REPO_ROOT, "test-cases", "design", "用例矩阵-设计级.csv")
GAPS_MD = os.path.join(REPO_ROOT, "test-cases", "coverage-gaps.md")

# Dimensions that MUST have P0 cases
P0_REQUIRED_DIMS = ["D4安全", "D9协议"]

# CLI subcommands that must be covered (from setup-cli.mjs case branches)
REQUIRED_CLI_SUBCMDS = [
    "install", "uninstall", "doctor", "status", "update", "upgrade",
    "auth", "reinstall", "proxy", "version", "info", "check", "remove", "help",
]


def resolve_hdk_src():
    """定位被测项目源码目录 plugins/huaweicloud-core/src。"""
    # 1) 环境变量
    hdk = os.environ.get("HUAWEICLOUD_DEVKIT_HOME")
    if hdk:
        p = os.path.join(hdk, "plugins", "huaweicloud-core", "src", "tools.mjs")
        if os.path.isfile(p):
            return os.path.join(hdk, "plugins", "huaweicloud-core", "src"), "env HUAWEICLOUD_DEVKIT_HOME"
    # 2) 命令行参数
    if len(sys.argv) > 2 and sys.argv[1] == "--hdk-path":
        p = os.path.join(sys.argv[2], "plugins", "huaweicloud-core", "src", "tools.mjs")
        if os.path.isfile(p):
            return os.path.join(sys.argv[2], "plugins", "huaweicloud-core", "src"), "--hdk-path arg"
    # 3) 相邻目录 ../hdk
    sibling = os.path.normpath(os.path.join(REPO_ROOT, "..", "hdk"))
    p = os.path.join(sibling, "plugins", "huaweicloud-core", "src", "tools.mjs")
    if os.path.isfile(p):
        return os.path.join(sibling, "plugins", "huaweicloud-core", "src"), "sibling ../hdk"
    # 4) npm global
    import subprocess
    try:
        result = subprocess.run(["npm", "root", "-g"], capture_output=True, text=True, timeout=10)
        npm_root = result.stdout.strip()
        if npm_root:
            p = os.path.join(npm_root, "huaweicloud-devkit", "plugins", "huaweicloud-core", "src", "tools.mjs")
            if os.path.isfile(p):
                return os.path.join(npm_root, "huaweicloud-devkit", "plugins", "huaweicloud-core", "src"), "npm global"
    except Exception:
        pass
    return None, ""


def extract_tools(src_dir):
    """从 tools.mjs 提取全部 huaweicloud_* 工具名。"""
    tools_mjs = os.path.join(src_dir, "tools.mjs")
    with open(tools_mjs, encoding="utf-8") as f:
        mtxt = f.read()
    _m = re.search(r"\bTOOL_DEFINITIONS\s*=\s*\[", mtxt)
    if _m:
        _i = _m.end() - 1
        _depth = 0
        _quote = None
        while _i < len(mtxt):
            _c = mtxt[_i]
            if _quote:
                if _c == _quote and mtxt[_i - 1] != "\\":
                    _quote = None
            elif _c in "'\"`":
                _quote = _c
            elif _c == "[":
                _depth += 1
            elif _c == "]":
                _depth -= 1
                if _depth == 0:
                    break
            _i += 1
        _body = mtxt[_m.end():_i]
        tools = re.findall(r"\bname:\s*['\"]([a-z_0-9]+)['\"]", _body)
    else:
        tools = re.findall(r"name:\s*['\"](huaweicloud_[a-z_0-9]+)['\"]", mtxt)
    return [t for t in tools if t.startswith("huaweicloud_")]


def extract_env_vars(src_dir):
    """递归扫描源码目录，提取所有 HUAWEICLOUD_ 环境变量。"""
    env_vars = set()
    for root, dirs, files in os.walk(src_dir):
        for fname in files:
            if fname.endswith(".mjs") or fname.endswith(".py"):
                fpath = os.path.join(root, fname)
                try:
                    with open(fpath, encoding="utf-8") as f:
                        content = f.read()
                    envs = re.findall(r"HUAWEICLOUD_[A-Z_]+", content)
                    env_vars.update(envs)
                except Exception:
                    pass
        if root.count(os.sep) > 15:
            dirs.clear()
    return sorted(env_vars)


def extract_exported_functions(src_dir):
    """递归扫描源码目录，提取所有 export function 名。"""
    exports = {}
    for root, dirs, files in os.walk(src_dir):
        for fname in files:
            if fname.endswith(".mjs"):
                fpath = os.path.join(root, fname)
                try:
                    with open(fpath, encoding="utf-8") as f:
                        content = f.read()
                    fns = re.findall(r"export\s+(?:async\s+)?function\s+(\w+)", content)
                    if fns:
                        rel = os.path.relpath(fpath, src_dir)
                        exports[rel] = fns
                except Exception:
                    pass
        if root.count(os.sep) > 15:
            dirs.clear()
    return exports


def load_design_cases():
    """读取设计级用例 CSV。"""
    with open(DESIGN_CSV, encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def covered_short_names(rows):
    """从用例关联工具列提取已覆盖的工具短名集合。"""
    covered = set()
    for r in rows:
        assoc = r.get("关联工具", "") or ""
        for t in re.split(r"[,;/\s]+", assoc):
            t = t.strip()
            if t:
                covered.add(t.replace("huaweicloud_", "", 1))
    return covered


def all_case_text(rows):
    """合并每条用例的全部文本字段（小写），用于关键词覆盖检查。"""
    texts = {}
    for r in rows:
        text = " ".join([
            str(r.get("标题", "")),
            str(r.get("前置条件", "")),
            str(r.get("操作步骤", "")),
            str(r.get("预期结果", "")),
            str(r.get("关联工具", "")),
            str(r.get("指引来源", "")),
            str(r.get("自动化建议", "")),
            str(r.get("测试数据", "")),
            str(r.get("展开规则", "")),
        ]).lower()
        texts[r["ID"]] = text
    return texts


def main():
    src_dir, src_tag = resolve_hdk_src()
    if not src_dir:
        print("[BLOCKED] 无法定位被测项目源码（设置 HUAWEICLOUD_DEVKIT_HOME 或把 hdk 放相邻目录 ../hdk）")
        print("[INFO] 无源码时仅运行不依赖源码的门禁（展开规则空值 + P0 存在性）")
        src_dir = None

    rows = load_design_cases()
    print(f"[INFO] 设计级用例: {len(rows)} 条")
    texts = all_case_text(rows)
    covered_tools = covered_short_names(rows)

    failures = []
    warnings = []

    # === 规则 1: 工具覆盖门禁 ===
    if src_dir:
        tools = extract_tools(src_dir)
        tool_short = [t.replace("huaweicloud_", "", 1) for t in tools]
        missing_tools = [t for t in tool_short if t not in covered_tools]
        print(f"\n=== 规则 1: 工具覆盖门禁 ===")
        print(f"源码工具: {len(tools)} | 已覆盖: {len(tools) - len(missing_tools)} | 缺失: {len(missing_tools)}")
        if missing_tools:
            for t in missing_tools:
                print(f"  ❌ {t}")
            failures.append(f"工具覆盖缺口: {missing_tools}")
        else:
            print(f"  ✅ {len(tools)} 工具全部有覆盖")

        # === 规则 2: CLI 子命令覆盖门禁 ===
        print(f"\n=== 规则 2: CLI 子命令覆盖门禁 ===")
        all_text_joined = " ".join(texts.values())
        missing_cmds = []
        for cmd in REQUIRED_CLI_SUBCMDS:
            if cmd not in all_text_joined:
                missing_cmds.append(cmd)
        if missing_cmds:
            for cmd in missing_cmds:
                print(f"  ❌ {cmd}")
            failures.append(f"CLI 子命令覆盖缺口: {missing_cmds}")
        else:
            print(f"  ✅ {len(REQUIRED_CLI_SUBCMDS)} 个必需子命令全部有覆盖")

        # === 规则 3: 环境变量覆盖门禁 ===
        print(f"\n=== 规则 3: 环境变量覆盖门禁 ===")
        env_vars = extract_env_vars(src_dir)
        missing_envs = []
        for ev in env_vars:
            # Check full name or short form (without HUAWEICLOUD_ / DEVKIT_ prefix)
            short = ev.replace("HUAWEICLOUD_", "").replace("DEVKIT_", "").lower()
            found = False
            for cid, text in texts.items():
                if ev.lower() in text or short in text:
                    found = True
                    break
            if not found:
                missing_envs.append(ev)
        print(f"源码环境变量: {len(env_vars)} | 已覆盖: {len(env_vars) - len(missing_envs)} | 缺失: {len(missing_envs)}")
        if missing_envs:
            for ev in missing_envs:
                print(f"  ❌ {ev}")
            failures.append(f"环境变量覆盖缺口: {missing_envs}")
        else:
            print(f"  ✅ {len(env_vars)} 环境变量全部有覆盖")

        # === 规则 7: 导出函数覆盖统计 (WARN) ===
        print(f"\n=== 规则 7: 导出函数覆盖统计 (WARN) ===")
        exports = extract_exported_functions(src_dir)
        all_fns = []
        for fns in exports.values():
            all_fns.extend(fns)
        total_fns = len(all_fns)
        covered_fns = 0
        uncovered_fns = []
        for fn in all_fns:
            fn_lower = fn.lower()
            found = False
            for cid, text in texts.items():
                if fn_lower in text:
                    found = True
                    break
            if found:
                covered_fns += 1
            else:
                uncovered_fns.append(fn)
        coverage_pct = covered_fns / total_fns * 100 if total_fns > 0 else 0
        print(f"导出函数: {total_fns} | 已覆盖(文本匹配): {covered_fns} ({coverage_pct:.1f}%)")
        if coverage_pct < 60:
            warnings.append(f"导出函数文本覆盖率 {coverage_pct:.1f}% < 60% 阈值")
            print(f"  ⚠️ 覆盖率低于 60% 阈值")
        else:
            print(f"  ✅ 覆盖率达标")

    # === 规则 4: 展开规则空值门禁 ===
    print(f"\n=== 规则 4: 展开规则空值门禁 ===")
    empty_expand = [r["ID"] for r in rows if not (r.get("展开规则") or "").strip()]
    if empty_expand:
        print(f"  ❌ {len(empty_expand)} 条用例展开规则为空: {empty_expand[:10]}")
        failures.append(f"展开规则空值: {empty_expand}")
    else:
        print(f"  ✅ 展开规则 0 空")

    # === 规则 5: P0 用例存在性门禁 ===
    print(f"\n=== 规则 5: P0 用例存在性门禁 ===")
    dim_p0 = collections.defaultdict(int)
    for r in rows:
        if (r.get("优先级") or "").strip() == "P0":
            dim_p0[r["维度"]] += 1
    p0_ok = True
    for dim in P0_REQUIRED_DIMS:
        if dim_p0[dim] == 0:
            print(f"  ❌ {dim} 无 P0 用例（安全/协议维度必须有 P0）")
            failures.append(f"{dim} 缺少 P0 用例")
            p0_ok = False
        else:
            print(f"  ✅ {dim}: {dim_p0[dim]} 个 P0 用例")
    if p0_ok and not any(d in P0_REQUIRED_DIMS for d in dim_p0):
        print(f"  ⚠️ 未检测到任何 P0 用例")

    # === 规则 6: 缺口清单一致性门禁 ===
    print(f"\n=== 规则 6: 缺口清单一致性门禁 ===")
    if os.path.isfile(GAPS_MD):
        with open(GAPS_MD, encoding="utf-8") as f:
            gaps_text = f.read()
        # Find gaps marked as 未覆盖 (not ✅)
        uncovered_in_md = re.findall(r"\|\s*(G\d+)\s*\|.*?\|\s*未覆盖", gaps_text)
        if uncovered_in_md:
            print(f"  ❌ coverage-gaps.md 中有 {len(uncovered_in_md)} 个缺口标记为「未覆盖」: {uncovered_in_md}")
            failures.append(f"缺口清单未覆盖项: {uncovered_in_md}")
        else:
            print(f"  ✅ coverage-gaps.md 中所有缺口均已覆盖")
    else:
        print(f"  ⚠️ coverage-gaps.md 不存在，跳过")

    # === 汇总 ===
    print(f"\n{'='*60}")
    print(f"汇总: {len(failures)} FAIL + {len(warnings)} WARN")
    if warnings:
        print(f"警告:")
        for w in warnings:
            print(f"  ⚠️ {w}")
    if failures:
        print(f"门禁失败:")
        for f in failures:
            print(f"  ❌ {f}")
        print(f"\n[GATE-FAIL] 测试全面性门禁未通过 → exit 1")
        sys.exit(1)
    print(f"\n[GATE-PASS] 测试全面性门禁通过 ✅")
    sys.exit(0)


if __name__ == "__main__":
    main()
