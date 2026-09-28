Eval harness routing test:
Prompt: 我账号下的用户都有哪些权限 帮我审计一下
Expected: IAM
Actual: Run hcloud --help
Result: MISS
Eval harness: node eval/harness/run-eval.mjs