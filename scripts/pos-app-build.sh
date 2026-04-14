#!/bin/bash

# 海邻收银台 Android APP 快速构建脚本

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     海邻收银台 Android APP 构建       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# 检查必要工具
echo -e "${YELLOW}检查构建环境...${NC}"
command -v pnpm >/dev/null 2>&1 || { echo -e "${RED}✗ 需要安装 pnpm${NC}"; exit 1; }
echo -e "${GREEN}✓ pnpm 已安装${NC}"

# 1. 安装依赖
echo ""
echo -e "${YELLOW}[1/3] 安装依赖...${NC}"
pnpm install

# 2. 构建项目
echo ""
echo -e "${YELLOW}[2/3] 构建 Next.js 项目...${NC}"
pnpm run build

# 3. 同步到 Android
echo ""
echo -e "${YELLOW}[3/3] 同步到 Android 项目...${NC}"
npx cap sync android

echo ""
echo -e "${GREEN}✓ 构建准备完成！${NC}"
echo ""
echo -e "${BLUE}下一步操作:${NC}"
echo "  1. ${YELLOW}打开 Android Studio:${NC}   pnpm run android:open"
echo "  2. ${YELLOW}构建 Debug APK:${NC}        cd android && ./gradlew assembleDebug"
echo "  3. ${YELLOW}构建 Release APK:${NC}      cd android && ./gradlew assembleRelease"
echo ""
