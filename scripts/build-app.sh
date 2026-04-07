#!/bin/bash
# APP构建脚本 - 海邻到家店长助手

set -e

echo "======================================"
echo "  海邻到家店长助手 APP 构建脚本"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查前置条件
check_requirements() {
    echo -e "${YELLOW}[1/5] 检查前置条件...${NC}"
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Node.js $(node -v)"
    
    # 检查npm/pnpm
    if command -v pnpm &> /dev/null; then
        PKG_MANAGER="pnpm"
    elif command -v npm &> /dev/null; then
        PKG_MANAGER="npm"
    else
        echo -e "${RED}❌ npm/pnpm 未安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} $PKG_MANAGER 已安装"
    
    # 检查Android SDK
    if [ -z "$ANDROID_HOME" ]; then
        if [ -d "$HOME/Android/Sdk" ]; then
            export ANDROID_HOME="$HOME/Android/Sdk"
        elif [ -d "/opt/android-sdk" ]; then
            export ANDROID_HOME="/opt/android-sdk"
        fi
    fi
    
    if [ -n "$ANDROID_HOME" ] && [ -d "$ANDROID_HOME" ]; then
        echo -e "${GREEN}✓${NC} Android SDK: $ANDROID_HOME"
    else
        echo -e "${YELLOW}⚠${NC} Android SDK 未配置（ANDROID_HOME）"
        echo "  如需构建APK，请安装Android SDK并设置ANDROID_HOME"
    fi
    
    # 检查Java
    if command -v java &> /dev/null; then
        JAVA_VERSION=$(java -version 2>&1 | head -1 | cut -d'"' -f2)
        echo -e "${GREEN}✓${NC} Java $JAVA_VERSION"
    else
        echo -e "${YELLOW}⚠${NC} Java 未安装"
    fi
    
    echo ""
}

# 安装依赖
install_deps() {
    echo -e "${YELLOW}[2/5] 安装依赖...${NC}"
    
    if [ -d "node_modules" ]; then
        echo "依赖已安装，跳过"
    else
        $PKG_MANAGER install
    fi
    
    echo ""
}

# 同步Capacitor
sync_capacitor() {
    echo -e "${YELLOW}[3/5] 同步Capacitor到Android...${NC}"
    
    npx cap sync android
    echo -e "${GREEN}✓${NC} 同步完成"
    echo ""
}

# 构建APK
build_apk() {
    echo -e "${YELLOW}[4/5] 构建APK...${NC}"
    
    if [ -z "$ANDROID_HOME" ] || [ ! -d "$ANDROID_HOME" ]; then
        echo -e "${YELLOW}⚠${NC} 跳过APK构建（Android SDK未配置）"
        echo "  要构建APK，请安装Android SDK"
        return 0
    fi
    
    cd android
    
    # 检查gradlew权限
    if [ ! -x "./gradlew" ]; then
        chmod +x ./gradlew
    fi
    
    # 构建
    ./gradlew assembleDebug
    
    cd ..
    
    if [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
        APK_SIZE=$(du -h android/app/build/outputs/apk/debug/app-debug.apk | cut -f1)
        echo -e "${GREEN}✓${NC} APK构建成功！"
        echo -e "   位置: android/app/build/outputs/apk/debug/app-debug.apk"
        echo -e "   大小: $APK_SIZE"
    else
        echo -e "${RED}❌ APK构建失败${NC}"
        exit 1
    fi
    
    echo ""
}

# 部署APK
deploy_apk() {
    echo -e "${YELLOW}[5/5] 部署APK（可选）...${NC}"
    
    read -p "是否将APK复制到public目录? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        mkdir -p public
        cp android/app/build/outputs/apk/debug/app-debug.apk public/assistant.apk
        echo -e "${GREEN}✓${NC} APK已复制到 public/assistant.apk"
        echo -e "   下载地址: /assistant.apk"
    fi
    
    echo ""
}

# 完成
show_result() {
    echo "======================================"
    echo -e "${GREEN}  构建完成！${NC}"
    echo "======================================"
    echo ""
    
    if [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
        echo "APK文件位置："
        echo "  $(pwd)/android/app/build/outputs/apk/debug/app-debug.apk"
        echo ""
        
        echo "下载页面："
        echo "  http://localhost:5000/store-admin/app-download"
        echo ""
        
        echo "部署后访问："
        echo "  https://你的域名/store-admin/app-download"
        echo ""
    fi
    
    echo "下一步："
    echo "  1. 将APK上传到CDN或对象存储"
    echo "  2. 更新下载页面的下载链接"
    echo "  3. 生成二维码供用户扫码下载"
    echo ""
}

# 主函数
main() {
    cd "$(dirname "$0")"
    
    check_requirements
    install_deps
    sync_capacitor
    build_apk
    deploy_apk
    show_result
}

# 执行
main
