#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Installing dependencies..."
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

echo "Building the project..."
pnpm next build

# 如果使用 standalone 模式，复制静态资源
if [ -d ".next/standalone" ]; then
  echo "Copying static assets for standalone mode..."
  
  # 复制 public 目录
  if [ -d "public" ]; then
    cp -r public .next/standalone/
  fi
  
  # 复制 .next/static 目录
  if [ -d ".next/static" ]; then
    mkdir -p .next/standalone/.next/static
    cp -r .next/static/* .next/standalone/.next/static/
  fi
  
  echo "Standalone build prepared successfully!"
fi

echo "Build completed successfully!"
