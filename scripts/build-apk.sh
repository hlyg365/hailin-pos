#!/bin/bash
# ============================================
# 海邻到家收银台APP - Android APK构建脚本
# ============================================

set -e

echo "=========================================="
echo "海邻到家收银台APP - APK构建"
echo "=========================================="

# 检查Node.js版本
if ! command -v node &> /dev/null; then
    echo "错误: 未安装Node.js，请先安装Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "错误: Node.js版本过低，需要18+，当前版本: $(node -v)"
    exit 1
fi

# 检查Java环境
if ! command -v java &> /dev/null; then
    echo "错误: 未安装Java，请安装JDK 11+"
    echo "macOS: brew install openjdk@11"
    echo "Ubuntu: sudo apt install openjdk-11-jdk"
    echo "Windows: 下载并安装OpenJDK 11"
    exit 1
fi

# 检查Android SDK
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
    echo "警告: ANDROID_HOME未设置"
    echo "请设置Android SDK路径:"
    echo "macOS/Linux: export ANDROID_HOME=~/Library/Android/sdk"
    echo "Ubuntu: export ANDROID_HOME=/usr/lib/android-sdk"
fi

echo ""
echo "1. 安装依赖..."
pnpm install

echo ""
echo "2. 构建Web应用..."
pnpm build

echo ""
echo "3. 同步到Android项目..."
npx cap sync android

echo ""
echo "4. 构建APK..."
cd android
chmod +x gradlew
./gradlew assembleDebug

echo ""
echo "=========================================="
echo "构建完成！"
echo "=========================================="
echo ""
echo "APK文件位置:"
ls -la app/build/outputs/apk/debug/*.apk 2>/dev/null || echo "未找到APK"
echo ""
echo "提示:"
echo "1. 调试APK: ./android/app/build/outputs/apk/debug/*.apk"
echo "2. 安装到设备: adb install ./android/app/build/outputs/apk/debug/app-debug.apk"
echo "3. 构建正式版: ./gradlew assembleRelease"
echo ""
