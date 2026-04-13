#!/bin/bash
# 自动构建并发布收银台APP

set -e

echo "=========================================="
echo "  海邻到家 收银台APP 构建脚本"
echo "=========================================="

# 1. 生成版本号 (日期+序号)
VERSION=$(date +"%Y.%m.%d")
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
APK_NAME="hailin-pos-${VERSION}.apk"

echo "📦 版本: ${VERSION}"
echo "📱 APK名称: ${APK_NAME}"

# 2. 构建Web应用
echo ""
echo "🔨 构建Web应用..."
pnpm run build

# 3. 导出静态文件
echo ""
echo "📁 导出静态文件..."
pnpm run export

# 4. 同步到Android
echo ""
echo "📲 同步到Android..."
npx cap sync android

# 5. 构建APK
echo ""
echo "🔧 构建APK..."
cd android && ./gradlew assembleDebug && cd ..

# 6. 复制APK到public目录
echo ""
echo "📋 复制APK到public目录..."
cp android/app/build/outputs/apk/debug/app-debug.apk public/${APK_NAME}
cp android/app/build/outputs/apk/debug/app-debug.apk public/hailin-pos-latest.apk

# 7. 获取文件大小
APK_SIZE=$(du -h public/${APK_NAME} | cut -f1)

echo ""
echo "=========================================="
echo "  ✅ 构建完成！"
echo "=========================================="
echo "📦 APK文件: public/${APK_NAME}"
echo "📏 文件大小: ${APK_SIZE}"
echo "🔗 下载地址: /${APK_NAME}"
echo ""
echo "请更新以下文件中的版本号："
echo "  - src/app/page.tsx (quickEntries.pos-app 配置)"
echo "  - src/app/pos/page.tsx (currentVersion 状态)"
echo ""
echo "最新APK: https://hldj365.coze.site/${APK_NAME}"
echo "稳定版本: https://hldj365.coze.site/hailin-pos-latest.apk"
echo "=========================================="
