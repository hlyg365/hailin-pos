#!/bin/bash

# 海邻到家收银台 - Android 快速开发脚本

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==================================="
echo "海邻到家收银台 - Android 快速开发"
echo -e "===================================${NC}"
echo ""

# 检查是否连接了 Android 设备
echo -e "${YELLOW}检查 Android 设备连接...${NC}"
DEVICE_COUNT=$(adb devices | grep -v "List of devices" | grep -c "device" || true)

if [ "$DEVICE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ 检测到 $DEVICE_COUNT 个设备${NC}"
    adb devices | grep "device" | while read -r line; do
        echo "  - $line"
    done
else
    echo -e "${YELLOW}⚠ 未检测到设备，将仅构建 APK${NC}"
    echo "提示: 使用 USB 连接设备并开启 USB 调试"
fi

echo ""

# 构建选项
echo -e "${YELLOW}请选择操作:${NC}"
echo "1. 快速构建并安装到设备 (推荐)"
echo "2. 仅构建 Debug APK"
echo "3. 仅构建 Release APK"
echo "4. 同步 Web 代码到 Android"
echo "5. 打开 Android Studio"
echo "6. 查看设备日志"
read -p "请输入选项 (1-6): " choice

case $choice in
    1)
        echo ""
        echo -e "${YELLOW}[1/3] 构建 Next.js 项目...${NC}"
        pnpm run build
        
        echo ""
        echo -e "${YELLOW}[2/3] 同步到 Android 项目...${NC}"
        npx cap sync android
        
        echo ""
        echo -e "${YELLOW}[3/3] 构建 APK 并安装...${NC}"
        cd android
        
        if [ "$DEVICE_COUNT" -gt 0 ]; then
            ./gradlew installDebug
            echo ""
            echo -e "${GREEN}✓ APK 已安装到设备${NC}"
            echo -e "${BLUE}提示: 在设备上打开应用测试${NC}"
        else
            ./gradlew assembleDebug
            echo ""
            echo -e "${GREEN}✓ APK 构建完成${NC}"
            echo "APK 位置: android/app/build/outputs/apk/debug/app-debug.apk"
        fi
        
        cd ..
        ;;
        
    2)
        echo ""
        echo -e "${YELLOW}构建 Debug APK...${NC}"
        pnpm run build
        npx cap sync android
        cd android
        ./gradlew assembleDebug
        cd ..
        
        echo ""
        echo -e "${GREEN}✓ Debug APK 构建完成${NC}"
        echo "APK 位置: android/app/build/outputs/apk/debug/app-debug.apk"
        
        # 显示 APK 大小
        if [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
            SIZE=$(du -h android/app/build/outputs/apk/debug/app-debug.apk | cut -f1)
            echo "APK 大小: $SIZE"
        fi
        ;;
        
    3)
        echo ""
        echo -e "${YELLOW}构建 Release APK...${NC}"
        
        # 检查签名配置
        if [ ! -f "android/release.keystore" ]; then
            echo -e "${YELLOW}⚠ 未检测到签名密钥${NC}"
            read -p "是否创建新的签名密钥? (y/n): " create_key
            if [ "$create_key" = "y" ]; then
                read -p "输入密钥库密码: " -s store_pass
                echo ""
                read -p "输入密钥密码: " -s key_pass
                echo ""
                
                cd android
                keytool -genkey -v -keystore release.keystore \
                    -alias hailin-pos \
                    -keyalg RSA \
                    -keysize 2048 \
                    -validity 10000 \
                    -storepass "$store_pass" \
                    -keypass "$key_pass" \
                    -dname "CN=Hailin, OU=POS, O=Hailin, L=Shenzhen, ST=Guangdong, C=CN"
                cd ..
                
                echo -e "${GREEN}✓ 签名密钥已创建${NC}"
            else
                echo -e "${YELLOW}跳过 Release 构建${NC}"
                exit 0
            fi
        fi
        
        pnpm run build
        npx cap sync android
        cd android
        ./gradlew assembleRelease
        cd ..
        
        echo ""
        echo -e "${GREEN}✓ Release APK 构建完成${NC}"
        echo "APK 位置: android/app/build/outputs/apk/release/app-release.apk"
        
        # 显示 APK 大小
        if [ -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
            SIZE=$(du -h android/app/build/outputs/apk/release/app-release.apk | cut -f1)
            echo "APK 大小: $SIZE"
        fi
        ;;
        
    4)
        echo ""
        echo -e "${YELLOW}同步 Web 代码到 Android...${NC}"
        npx cap sync android
        echo -e "${GREEN}✓ 同步完成${NC}"
        ;;
        
    5)
        echo ""
        echo -e "${YELLOW}打开 Android Studio...${NC}"
        npx cap open android
        ;;
        
    6)
        echo ""
        echo -e "${YELLOW}显示设备日志 (Ctrl+C 退出)...${NC}"
        adb logcat | grep -E "(HailinPOS|Capacitor|WebView)"
        ;;
        
    *)
        echo -e "${RED}无效选项${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}==================================="
echo "操作完成！"
echo -e "===================================${NC}"
