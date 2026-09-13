#!/bin/bash
# CLI 真机探针：doctor / status / version / check_cli
export PATH=$HOME/nodejs/bin:$HOME/bin:$PATH
DEVKIT=$(command -v huaweicloud-devkit 2>/dev/null || echo "huaweicloud-devkit")

echo "=== which ==="
command -v huaweicloud-devkit || echo "not in PATH"

echo "=== npm global version ==="
npm ls -g huaweicloud-devkit --depth=0 2>&1 | head -5

echo "=== huaweicloud-devkit --version ==="
timeout 60 "$DEVKIT" --version 2>&1 | head -5

echo "=== huaweicloud-devkit doctor ==="
timeout 120 "$DEVKIT" doctor 2>&1 | head -40

echo "=== huaweicloud-devkit status ==="
timeout 60 "$DEVKIT" status 2>&1 | head -40

echo "=== huaweicloud-devkit --help (commands surfaced) ==="
timeout 60 "$DEVKIT" --help 2>&1 | head -40

echo "=== EXIT DONE ==="