#!/bin/bash

# 海邻到家收银台 - Android 应用构建脚本

set -e

echo "==================================="
echo "海邻到家收银台 Android 应用构建"
echo "==================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查环境
echo -e "${YELLOW}检查构建环境...${NC}"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未安装 Node.js${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js: $(node -v)${NC}"

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}错误: 未安装 pnpm${NC}"
    exit 1
fi
echo -e "${GREEN}✓ pnpm: $(pnpm -v)${NC}"

# 检查 Java（Android 构建需要）
if command -v java &> /dev/null; then
    echo -e "${GREEN}✓ Java: $(java -version 2>&1 | head -n 1)${NC}"
else
    echo -e "${YELLOW}⚠ 未检测到 Java，构建 APK 需要 JDK 11+${NC}"
fi

echo ""

# 步骤 1: 安装依赖
echo -e "${YELLOW}[1/4] 安装依赖...${NC}"
pnpm install
echo -e "${GREEN}✓ 依赖安装完成${NC}"
echo ""

# 步骤 2: 构建 Next.js 项目
echo -e "${YELLOW}[2/4] 构建 Next.js 项目...${NC}"
pnpm run build
echo -e "${GREEN}✓ Next.js 构建完成${NC}"
echo ""

# 步骤 3: 同步到 Android 项目
echo -e "${YELLOW}[3/4] 同步到 Android 项目...${NC}"
npx cap sync android
echo -e "${GREEN}✓ 同步完成${NC}"
echo ""

# 步骤 4: 构建选项
echo -e "${YELLOW}[4/4] 选择构建模式:${NC}"
echo "1. 打开 Android Studio (推荐)"
echo "2. 构建调试版本 (Debug APK)"
echo "3. 构建发布版本 (Release APK)"
echo "4. 仅同步项目"
read -p "请输入选项 (1-4): " choice

case $choice in
    1)
        echo -e "${YELLOW}正在打开 Android Studio...${NC}"
        npx cap open android
        echo -e "${GREEN}✓ Android Studio 已打开${NC}"
        echo ""
        echo "在 Android Studio 中:"
        echo "  1. 等待 Gradle 同步完成"
        echo "  2. 点击 Build > Build Bundle(s) / APK(s) > Build APK(s)"
        echo "  3. 选择 Debug 或 Release 构建"
        ;;
    2)
        echo -e "${YELLOW}正在构建 Debug APK...${NC}"
        cd android
        ./gradlew assembleDebug
        cd ..
        echo -e "${GREEN}✓ Debug APK 构建完成${NC}"
        echo ""
        echo "APK 位置: android/app/build/outputs/apk/debug/app-debug.apk"
        ;;
    3)
        echo -e "${YELLOW}正在构建 Release APK...${NC}"
        echo -e "${YELLOW}注意: 需要先配置签名密钥${NC}"
        echo ""
        # 检查是否已配置签名
        if [ ! -f "android/release.keystore" ]; then
            echo -e "${RED}未找到签名密钥${NC}"
            read -p "是否创建新的签名密钥? (y/n): " create_keystore
            if [ "$create_keystore" = "y" ]; then
                read -p "输入密钥密码: " keystore_password
                read -p "输入密钥别名密码: " key_password
                cd android
                keytool -genkey -v -keystore release.keystore \
                    -alias hailin-pos \
                    -keyalg RSA \
                    -keysize 2048 \
                    -validity 10000 \
                    -storepass "$keystore_password" \
                    -keypass "$key_password"
                cd ..
                echo -e "${GREEN}✓ 密钥已创建${NC}"
            else
                echo -e "${YELLOW}跳过 Release 构建${NC}"
                exit 0
            fi
        fi

        cd android
        ./gradlew assembleRelease
        cd ..
        echo -e "${GREEN}✓ Release APK 构建完成${NC}"
        echo ""
        echo "APK 位置: android/app/build/outputs/apk/release/app-release.apk"
        ;;
    4)
        echo -e "${GREEN}✓ 同步完成，可以手动构建${NC}"
        ;;
    *)
        echo -e "${RED}无效选项${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}==================================="
echo -e "构建流程完成！"
echo -e "===================================${NC}"
echo ""
echo "下一步:"
echo "  1. 在 Android 设备上安装 APK"
echo "  2. 测试硬件功能（扫码枪、打印机等）"
echo "  3. 查看 ANDROID_BUILD_GUIDE.md 了解更多"
echo ""
