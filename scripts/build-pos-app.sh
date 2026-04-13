#!/bin/bash
# 自动构建并发布收银台APP

set -e

echo "=========================================="
echo "  海邻到家 收银台APP 构建脚本"
echo "=========================================="

# 1. 生成版本号 (格式: v3.0.日期时分)
VERSION_DATE=$(date +"%Y%m%d%H%M")
VERSION_FULL="v3.0.${VERSION_DATE}"
APK_NAME="hailin-pos-${VERSION_FULL}.apk"

echo "📦 版本: ${VERSION_FULL}"
echo "📱 APK名称: ${APK_NAME}"

# 2. 提示用户确认
echo ""
read -p "确认构建此版本? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "已取消构建"
    exit 0
fi

# 3. 更新 src/app/page.tsx 中的版本配置
echo ""
echo "📝 更新首页版本配置..."
sed -i "s/fileName: 'hailin-pos-[^']*'/fileName: '${APK_NAME}'/" src/app/page.tsx
sed -i "s/version: 'v[^']*'/version: '${VERSION_FULL}'/" src/app/page.tsx
sed -i "s/buildDate: '[^']*'/buildDate: '$(date +"%Y-%m-%d")'/" src/app/page.tsx

# 4. 更新 public/apk-config.json
cat > public/apk-config.json << EOF
{
  "apkFileName": "${APK_NAME}",
  "version": "${VERSION_FULL}",
  "buildDate": "$(date +"%Y-%m-%d")",
  "downloadUrl": "/${APK_NAME}"
}
EOF

# 5. 构建Web应用
echo ""
echo "🔨 构建Web应用..."
pnpm run build

# 6. 导出静态文件
echo ""
echo "📁 导出静态文件..."
pnpm run export

# 7. 同步到Android
echo ""
echo "📲 同步到Android..."
npx cap sync android

# 8. 构建APK
echo ""
echo "🔧 构建APK..."
cd android && ./gradlew assembleDebug && cd ..

# 9. 复制APK到public目录
echo ""
echo "📋 复制APK到public目录..."
cp android/app/build/outputs/apk/debug/app-debug.apk public/${APK_NAME}

# 10. 获取文件大小
APK_SIZE=$(du -h public/${APK_NAME} | cut -f1)

echo ""
echo "=========================================="
echo "  ✅ 构建完成！"
echo "=========================================="
echo "📦 APK文件: public/${APK_NAME}"
echo "📏 文件大小: ${APK_SIZE}"
echo ""
echo "请记得提交以下更改到Git："
echo "  - src/app/page.tsx"
echo "  - public/apk-config.json"
echo ""
echo "下载地址: https://hldj365.coze.site/${APK_NAME}"
echo "=========================================="
