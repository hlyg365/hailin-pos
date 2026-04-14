#!/bin/bash
# 自动构建并发布收银台APP

set -e

echo "=========================================="
echo "  海邻到家 收银台APP 构建脚本"
echo "=========================================="

# 1. 读取当前版本号
CURRENT_VERSION=$(grep -oP "version: '\K[^']*" src/app/page.tsx | head -1)
echo "📦 当前版本: ${CURRENT_VERSION}"

# 2. 递增版本号（第三位数字+1）
# 格式: x.y.z -> x.y.(z+1)
IFS='.' read -ra VER <<< "$CURRENT_VERSION"
MAJOR=${VER[0]}
MINOR=${VER[1]}
PATCH=${VER[2]}
PATCH=$((PATCH + 1))
NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"
APK_NAME="hailin-pos-v${NEW_VERSION}.apk"

echo "📦 新版本: ${NEW_VERSION}"
echo "📱 APK名称: ${APK_NAME}"

# 3. 确认构建
echo ""
read -p "确认构建版本 ${NEW_VERSION}? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "已取消构建"
    exit 0
fi

# 4. 更新 src/app/page.tsx
echo ""
echo "📝 更新首页版本配置..."
sed -i "s/fileName: 'hailin-pos-[^']*'/fileName: '${APK_NAME}'/" src/app/page.tsx
sed -i "s/version: '[^{'\'']*'/version: '${NEW_VERSION}'/" src/app/page.tsx
sed -i "s/buildDate: '[^']*'/buildDate: '$(date +"%Y-%m-%d")'/" src/app/page.tsx

# 5. 更新 public/apk-config.json
cat > public/apk-config.json << EOF
{
  "apkFileName": "${APK_NAME}",
  "version": "${NEW_VERSION}",
  "buildDate": "$(date +"%Y-%m-%d")",
  "downloadUrl": "/${APK_NAME}"
}
EOF

# 6. 构建Web应用
echo ""
echo "🔨 构建Web应用..."
pnpm run build

# 7. 导出静态文件
echo ""
echo "📁 导出静态文件..."
pnpm run export

# 8. 同步到Android
echo ""
echo "📲 同步到Android..."
npx cap sync android

# 9. 构建APK
echo ""
echo "🔧 构建APK..."
cd android && ./gradlew assembleDebug && cd ..

# 10. 复制APK到public目录
echo ""
echo "📋 复制APK到public目录..."
cp android/app/build/outputs/apk/debug/app-debug.apk public/${APK_NAME}

# 11. 获取文件大小
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
