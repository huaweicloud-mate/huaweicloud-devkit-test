#!/usr/bin/env bash
# 测试设计外部评审：用 OpenCode 执行（替代 Codex；Codex 429 限流时不可用）
# 用法: bash run_opencode_review.sh [ITER目录] [prompt文件相对名]
#   bash run_opencode_review.sh                                   # 默认 ITER-006 / prompt-round01.txt
#   bash run_opencode_review.sh reviews/ITER-007-2026xxxx prompt-round02.txt
# 评审产物目录：优先 reviewer/（ITER-006 起），回退 codex/（历史迭代）
# 前置：Hermes 已把本轮 prompt 写到 <评审目录>/prompt-roundNN.txt
set -uo pipefail

REPO="/c/Users/Administrator/devkit-test/huaweicloud-devkit-test"
ITER="${1:-reviews/ITER-006-20261029171721}"
PROMPT_NAME="${2:-prompt-round01.txt}"
MODEL="${OPENCODE_MODEL:-deepseek-gw/deepseek-v4-pro-0813}"

cd "$REPO" || exit 1

if [ -d "$REPO/$ITER/reviewer" ]; then
  RDIR="$REPO/$ITER/reviewer"
elif [ -d "$REPO/$ITER/codex" ]; then
  RDIR="$REPO/$ITER/codex"
else
  echo "迭代目录缺 reviewer/ 与 codex/: $REPO/$ITER" >&2
  exit 1
fi

PROMPT="$RDIR/$PROMPT_NAME"
OUT="$RDIR/opencode-run-$(date +%Y%m%d%H%M%S).log"

if [ ! -f "$PROMPT" ]; then
  echo "缺少评审提示词: $PROMPT" >&2
  echo "（每轮由 Hermes 写：输入文件清单 + 本轮整改内容 + 评审要求 + 输出路径 + 完成标记）" >&2
  exit 1
fi

EXTRA=$'\n\n## 执行方补充说明（OpenCode）\n\n1. 你是 OpenCode，执行本轮外部评审，评审纪律与放行标准不变。\n2. 已用 --auto 授权写权限：把完整评审写到本目录下评审轮次对应的 review-round-NN-<主题>.md（UTF-8），最后一行输出【评审完成】。\n3. 若文件写入失败，把完整评审正文直接打印到标准输出，仍在最后一行输出【评审完成】。\n4. 评审文件头部必须注明：评审者 = OpenCode (模型 '"$MODEL"')，评审时间 = 北京时间，以及替代原因（Codex 侧 429 限流不可用）。'

echo "== OpenCode 评审启动 =="
echo "ITER   : $ITER"
echo "MODEL  : $MODEL"
echo "PROMPT : $PROMPT"
echo "LOG    : $OUT"
echo

opencode run --auto --model "$MODEL" --title "外部评审(OpenCode) $ITER" \
  "$(cat "$PROMPT")$EXTRA" 2>&1 | tee "$OUT"

echo
echo "== 结束，日志: $OUT =="
echo "== 产物核实（退出码不可信，只看文件）=="
ls -la "$RDIR"/review-round-*.md 2>/dev/null || echo "⚠ 未发现 review-round-*.md —— 评审未落盘，查日志尾部"