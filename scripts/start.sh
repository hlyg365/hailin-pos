#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
PORT=5000
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"

cd "${COZE_WORKSPACE_PATH}"

echo "Starting Next.js production server on port ${DEPLOY_RUN_PORT}..."

# 设置端口环境变量
export PORT=${DEPLOY_RUN_PORT}
export HOSTNAME="0.0.0.0"

# 检查 standalone 模式是否存在
if [ -f ".next/standalone/server.js" ]; then
  # 使用 standalone 模式启动（更快）
  node .next/standalone/server.js
else
  # 回退到普通模式
  pnpm next start
fi
