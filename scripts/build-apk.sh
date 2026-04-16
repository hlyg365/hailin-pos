#!/bin/bash
# ============================================
# 海邻到家收银台APP - Android APK构建脚本
# ============================================

set -e

# 获取提交信息参数
COMMIT_MSG="${1:-Update: 收银台APP构建}"

echo "=========================================="
echo "海邻到家收银台APP - APK构建"
echo "=========================================="

# 检查是否在git仓库中
if [ -d ".git" ]; then
    echo ""
    echo "📦 Git仓库检测到，准备提交..."
    echo "   提交信息: $COMMIT_MSG"
    echo ""
fi

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
echo "1️⃣  安装依赖..."
pnpm install

echo ""
echo "2️⃣  构建Web应用..."
pnpm build

echo ""
echo "3️⃣  同步到Android项目..."
npx cap sync android

echo ""
echo "4️⃣  构建APK..."
cd android
chmod +x gradlew
./gradlew assembleDebug

echo ""
echo "=========================================="
echo "✅ 构建完成！"
echo "=========================================="
echo ""
echo "📱 APK文件位置:"
APK_PATH=$(find app/build/outputs/apk/debug -name "*.apk" 2>/dev/null | head -1)
if [ -n "$APK_PATH" ]; then
    ls -la "$APK_PATH"
    echo ""
    echo "📲 文件大小: $(du -h "$APK_PATH" | cut -f1)"
else
    echo "未找到APK"
fi
echo ""

# Git提交（如果是在git仓库中）
if [ -d "../.git" ] || [ -d ".git" ]; then
    echo ""
    echo "5️⃣  Git提交..."
    cd ..
    
    # 添加变更
    git add -A
    
    # 检查是否有变更
    if git diff --cached --quiet; then
        echo "📝 没有检测到变更，跳过提交"
    else
        git commit -m "$COMMIT_MSG"
        echo "✅ 代码已提交"
        
        # 推送到远程（如果配置了远程仓库）
        if git remote get-url origin &>/dev/null; then
            echo ""
            echo "6️⃣  推送到远程仓库..."
            git push origin main 2>/dev/null || git push origin master 2>/dev/null || echo "⚠️  推送失败，请手动推送"
        fi
    fi
fi

echo ""
echo "=========================================="
echo "🎉 全部完成！"
echo "=========================================="
echo ""
echo "下一步:"
echo "1. 调试APK: ./android/app/build/outputs/apk/debug/*.apk"
echo "2. 安装到设备: adb install ./android/app/build/outputs/apk/debug/app-debug.apk"
echo "3. 构建正式版: cd android && ./gradlew assembleRelease"
echo ""
