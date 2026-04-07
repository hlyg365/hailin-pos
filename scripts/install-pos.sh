#!/bin/bash

# 海邻收银台 - 一键安装脚本
# 自动构建并安装收银台 APP 到 Android 设备

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# 清屏
clear

echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     海邻收银台 - 一键安装            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# 时间统计
START_TIME=$(date +%s)

# 步骤 1: 检查环境
echo -e "${YELLOW}[1/5] 检查构建环境...${NC}"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ 未安装 Node.js${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Node.js: $(node -v)${NC}"

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}✗ 未安装 pnpm${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ pnpm: $(pnpm -v)${NC}"

# 检查 Android 设备
DEVICE_COUNT=$(adb devices 2>/dev/null | grep -v "List of devices" | grep -c "device" || true)
if [ "$DEVICE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}  ✓ 已连接 $DEVICE_COUNT 个设备${NC}"
else
    echo -e "${YELLOW}  ⚠ 未检测到设备（将仅构建 APK）${NC}"
fi

echo ""

# 步骤 2: 安装依赖
echo -e "${YELLOW}[2/5] 安装依赖...${NC}"
pnpm install --prefer-frozen-lockfile --prefer-offline > /dev/null 2>&1
echo -e "${GREEN}  ✓ 依赖安装完成${NC}"
echo ""

# 步骤 3: 构建项目
echo -e "${YELLOW}[3/5] 构建 Next.js 项目...${NC}"
pnpm run build > /tmp/pos-build.log 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✓ 构建成功${NC}"
else
    echo -e "${RED}  ✗ 构建失败${NC}"
    echo "查看日志: tail -n 50 /tmp/pos-build.log"
    exit 1
fi
echo ""

# 步骤 4: 同步到 Android
echo -e "${YELLOW}[4/5] 同步到 Android 项目...${NC}"
npx cap sync android --config=capacitor.pos.config.ts > /tmp/pos-sync.log 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✓ 同步成功${NC}"
else
    echo -e "${YELLOW}  ⚠ 同步警告（可忽略）${NC}"
fi
echo ""

# 步骤 5: 构建 APK
echo -e "${YELLOW}[5/5] 构建 APK...${NC}"
cd android

# 构建 Debug APK
./gradlew assembleDebug > /tmp/pos-apk.log 2>&1

if [ $? -ne 0 ]; then
    echo -e "${RED}  ✗ APK 构建失败${NC}"
    echo "查看日志: tail -n 50 /tmp/pos-apk.log"
    cd ..
    exit 1
fi

cd ..

# APK 路径
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"

if [ ! -f "$APK_PATH" ]; then
    echo -e "${RED}  ✗ APK 文件未找到${NC}"
    exit 1
fi

APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
echo -e "${GREEN}  ✓ APK 构建成功 (大小: $APK_SIZE)${NC}"
echo ""

# 时间统计
END_TIME=$(date +%s)
BUILD_TIME=$((END_TIME - START_TIME))

echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          构建完成！                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "构建时间: ${BLUE}${BUILD_TIME}秒${NC}"
echo -e "APK 位置: ${BLUE}$APK_PATH${NC}"
echo ""

# 如果连接了设备，自动安装
if [ "$DEVICE_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}正在安装到设备...${NC}"
    
    # 卸载旧版本（如果存在）
    adb uninstall com.hailin.pos.cashier > /dev/null 2>&1 || true
    
    # 安装新版本
    if adb install -r "$APK_PATH" > /dev/null 2>&1; then
        echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║     ✓ 已安装到设备                   ║${NC}"
        echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
        echo ""
        echo -e "在设备上打开 ${BLUE}海邻收银台${NC} 即可使用"
        
        # 可选：自动启动应用
        read -p "是否立即启动应用? (y/n): " launch_app
        if [ "$launch_app" = "y" ]; then
            adb shell am start -n com.hailin.pos.cashier/.MainActivity
            echo -e "${GREEN}✓ 应用已启动${NC}"
        fi
    else
        echo -e "${RED}✗ 安装失败${NC}"
        echo "请手动安装: adb install $APK_PATH"
    fi
else
    echo -e "${YELLOW}════════════════════════════════════${NC}"
    echo -e "${YELLOW}未检测到设备，请手动安装：${NC}"
    echo ""
    echo "方法 1: USB 连接后运行"
    echo "  adb install $APK_PATH"
    echo ""
    echo "方法 2: 将 APK 传输到手机安装"
    echo "  APK 文件: $APK_PATH"
    echo ""
    echo "方法 3: 扫码下载安装"
    echo "  上传 APK 到服务器，生成二维码"
    echo -e "${YELLOW}════════════════════════════════════${NC}"
fi

echo ""
echo -e "${BLUE}提示: 查看 ANDROID_QUICK_START.md 了解更多${NC}"
