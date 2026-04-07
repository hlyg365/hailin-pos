#!/bin/bash
# 项目打包脚本 - 用于在线构建服务

set -e

echo "=========================================="
echo "  海邻到家项目打包脚本"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}错误：未找到 package.json${NC}"
    echo "请在项目根目录执行此脚本"
    exit 1
fi

# 确认操作
echo -e "${YELLOW}此脚本将：${NC}"
echo "  1. 安装依赖 (pnpm install)"
echo "  2. 构建 Web 应用 (pnpm build)"
echo "  3. 同步 Capacitor (npx cap sync)"
echo "  4. 打包为 zip 文件"
echo ""
read -p "是否继续? (y/n): " confirm

if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 0
fi

echo ""
echo -e "${GREEN}[1/4] 安装依赖...${NC}"
pnpm install

echo ""
echo -e "${GREEN}[2/4] 构建 Web 应用...${NC}"
pnpm build

echo ""
echo -e "${GREEN}[3/4] 添加并同步 Android 平台...${NC}"
npx cap add android
npx cap sync android

echo ""
echo -e "${GREEN}[4/4] 打包项目...${NC}"

# 排除不必要的文件和目录
EXCLUDE_PATTERN=".git|node_modules/.cache|.next/cache|.turbo"

# 创建排除文件
cat > .打包排除.txt << EOF
.git
node_modules
.turbo
.next/cache
*.log
.env
.env.local
*.md
.DS_Store
Thumbs.db
EOF

# Windows PowerShell 打包
if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "使用 zip 打包..."
    zip -r hailin-pos-package.zip . \
        -x ".git/*" \
        -x "node_modules/.*" \
        -x "node_modules/*/.git/*" \
        -x "node_modules/*/node_modules/*" \
        -x ".turbo/*" \
        -x ".next/cache/*" \
        -x "*.log" \
        -x ".env*" \
        -x "*.md" \
        -x ".DS_Store" \
        -x "Thumbs.db"
else
    echo "使用 PowerShell 打包..."
    powershell -command "Compress-Archive -Path '*' -DestinationPath 'hailin-pos-package.zip' -Force"
fi

# 获取包大小
if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "linux-gnu"* ]]; then
    SIZE=$(du -h hailin-pos-package.zip | cut -f1)
else
    SIZE=$(powershell -command "(Get-Item hailin-pos-package.zip).Length / 1MB" | head -1)
    SIZE="${SIZE} MB"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}  打包完成！${NC}"
echo "=========================================="
echo ""
echo -e "打包文件: ${YELLOW}hailin-pos-package.zip${NC}"
echo -e "文件大小: ${YELLOW}${SIZE}${NC}"
echo ""
echo "下一步："
echo "  1. 上传压缩包到 VoltBuilder 或其他在线构建服务"
echo "  2. 或将压缩包发送给有 Android Studio 的朋友"
echo ""
