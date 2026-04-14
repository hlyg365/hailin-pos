#!/bin/bash

# 收银台APP快速构建脚本
# 用于生成Android APK

echo "======================================"
echo "收银台APP快速构建"
echo "======================================"

# 检查环境
echo "1. 检查环境..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装"
    exit 1
fi
echo "✅ Node.js: $(node -v)"

# 检查pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm未安装"
    exit 1
fi
echo "✅ pnpm: $(pnpm -v)"

# 检查Java
if ! command -v java &> /dev/null; then
    echo "❌ Java未安装"
    exit 1
fi
echo "✅ Java: $(java -version 2>&1 | head -n 1)"

# 检查Gradle
if [ ! -f "android/gradlew" ]; then
    echo "❌ Gradle未找到"
    exit 1
fi
echo "✅ Gradle: 已安装"

echo ""
echo "2. 安装依赖..."
pnpm install --frozen-lockfile
echo "✅ 依赖安装完成"

echo ""
echo "3. 构建Next.js..."
pnpm run build
if [ $? -ne 0 ]; then
    echo "❌ Next.js构建失败"
    exit 1
fi
echo "✅ Next.js构建完成"

echo ""
echo "4. 同步到Capacitor..."
npx cap sync android
if [ $? -ne 0 ]; then
    echo "❌ Capacitor同步失败"
    exit 1
fi
echo "✅ Capacitor同步完成"

echo ""
echo "5. 构建APK (Debug)..."
cd android
./gradlew assembleDebug
if [ $? -ne 0 ]; then
    echo "❌ APK构建失败"
    cd ..
    exit 1
fi
cd ..
echo "✅ APK构建完成"

echo ""
echo "======================================"
echo "构建完成！"
echo "======================================"
echo ""
echo "APK文件位置:"
echo "android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "安装APK到设备:"
echo "adb install android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "======================================"
