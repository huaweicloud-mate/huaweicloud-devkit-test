# -*- coding: utf-8 -*-
"""file_issue.py 历史查重的回归测试（2026-10-20 收紧口径：行级窗口 + PASS 否决）。

背景（真实事故）：上游 #852 是「打包式每日单」，正文内嵌整份测试报告的表格，
其中 `| 风险规则预检（D4-9/D4-19） | PASS — 公网暴露/破坏性操作被 risk rule 拦截 |`
这类**通过行**含 DEFECT_HINT 里的 deny/allow/拦截，旧口径（±120 字符跨行 + 无 PASS 否决）
把它判成「该用例号是作为缺陷提出的」→ 强关联 → 复核评论被追加到主题无关的 #852 上。

本测试固化两条不变式：
  1. 通过行（含 PASS/通过）不得被判为缺陷语境（即使同行含 deny/拦截）；
  2. 真缺陷表述（FAIL / 未拦截 / 绕过）仍必须判为强关联。
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "scripts"))
import file_issue as fi  # noqa: E402


def issue(num, title, body):
    return {"number": num, "title": title, "body": body}


# 真实形态：内嵌报告表格，通过行含 deny/拦截，且相邻行也含 deny
ISSUE_852_LIKE = issue(
    852,
    "[每日测试] serviceCatalog 中文意图路由覆盖不足（11/14 MISS, 21.4% HIT）- Hermes Windows 2026-10-05",
    "\n".join([
        "## 缺陷详情",
        "",
        "## 六、安全/红线",
        "",
        "| 检查项 | 结果 |",
        "|---|---|",
        "| 凭证文件读取拦截（D4-1） | PASS — `cat ~/.hcloud/credentials.json` → deny |",
        "| 凭证 env 打印拦截（D4-2） | PASS — `printenv HW_ACCESS_KEY` → deny |",
        "| 明文 secret API 拦截（D4-3） | PASS — `ShowSecretVersion` → deny |",
        "| 写操作审批门（D4-4/D4-18） | PASS — 所有写操作 deny/write + approvalToken |",
        "| 风险规则预检（D4-9/D4-19） | PASS — 公网暴露/破坏性操作被 risk rule 拦截 |",
        "| hook 绕过防护（D4-15/D4-16） | PASS — 大小写变体/URL编码/shell包裹均拦截 |",
        "| 风险规则完整性（D10-4） | PASS — 16 rules (9 deny + 7 warn) |",
    ]),
)

ISSUE_REAL_DEFECT = issue(
    9001,
    "[每日测试] D4-19 确认流下预检未拦截破坏性 deploy plan",
    "\n".join([
        "## 缺陷详情",
        "",
        "| 用例 | 结果 |",
        "|---|---|",
        "| D4-19 确认流下预检 | FAIL — force-delete deploy plan 返回 decision=allow，未拦截 |",
    ]),
)

ITEM_D4_19 = {
    "title": "D4-19 确认流下预检未拦截破坏性 deploy plan",
    "现象": "D4-19：确认流下预检对 force-delete deploy plan 返回 allow（未拦截）",
    "根因": "cloud-risk-rules.json 的 hwc-destructive-delete-operation 未匹配自然语言 deploy plan",
    "证据": "evidence/D4-19/stdout.log",
}


class TestDedupPassVeto(unittest.TestCase):
    def test_pass_row_with_deny_is_not_strong(self):
        """通过行（PASS — 被 deny 拦截）不得被判为强关联（#852 事故形态）。"""
        strong, weak = fi.match_history(ITEM_D4_19, [ISSUE_852_LIKE])
        self.assertEqual([], [i["number"] for i in strong],
                         "PASS 行被误判为缺陷语境 —— 复核评论会贴到主题无关的历史单")
        # 允许落弱关联（仅正文出现、不作为缺陷主张），但不得强关联
        self.assertTrue(all(i["number"] in (852,) for i in weak))

    def test_pass_marker_absent_keeps_strong(self):
        """去掉 PASS 标记后同一行仍含 deny → 说明是 PASS 否决在起作用（非误伤解析）。"""
        body = ISSUE_852_LIKE["body"].replace("PASS — ", "")
        strong, _ = fi.match_history(ITEM_D4_19, [issue(852, ISSUE_852_LIKE["title"], body)])
        self.assertEqual([852], [i["number"] for i in strong])

    def test_real_defect_still_strong(self):
        """真缺陷表述（FAIL — 未拦截）必须仍判为强关联。"""
        strong, _ = fi.match_history(ITEM_D4_19, [ISSUE_REAL_DEFECT])
        self.assertEqual([9001], [i["number"] for i in strong])

    def test_title_level_match_unaffected(self):
        """标题含用例号 + 缺陷语义 → 仍强关联（标题本就是主张，不受 PASS 否决影响）。"""
        iss = issue(9002, "[Bug] D4-19 预检未拦截（FAIL）", "无关正文")
        strong, _ = fi.match_history(ITEM_D4_19, [iss])
        self.assertEqual([9002], [i["number"] for i in strong])

    def test_cross_line_contamination_vetoed(self):
        """纯正文表格：本行是通过行、仅相邻行含 deny → 仍必须否决（行级窗口 + PASS 否决）。"""
        body = "\n".join([
            "| 项 | 结果 |",
            "|---|---|",
            "| D4-19 预检 | PASS |",
            "| 其他项 | deny |",
        ])
        strong, _ = fi.match_history(ITEM_D4_19, [issue(9003, "无关标题", body)])
        self.assertEqual([], [i["number"] for i in strong])


if __name__ == "__main__":
    unittest.main()