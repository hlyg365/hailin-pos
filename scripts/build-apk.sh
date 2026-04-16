#!/bin/bash
# ============================================
# 海邻到家收银台APP - Android APK构建脚本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认值
COMMIT_MSG=""
MODE="all"
REMOTE_URL=""

# 解析参数
show_help() {
    echo -e "${BLUE}===========================================${NC}"
    echo -e "${BLUE} 海邻到家收银台APP - 构建脚本${NC}"
    echo -e "${BLUE}===========================================${NC}"
    echo ""
    echo -e "${GREEN}使用方法:${NC}"
    echo "  ./build-apk.sh              完整流程：提交→推送→构建→下载"
    echo "  ./build-apk.sh \"提交信息\"   使用自定义提交信息"
    echo "  ./build-apk.sh -p           仅推送代码"
    echo "  ./build-apk.sh -d           仅下载最新APK"
    echo "  ./build-apk.sh -h           显示帮助"
    echo ""
    echo -e "${GREEN}选项说明:${NC}"
    echo "  -p, --push       仅推送代码到远程仓库"
    echo "  -d, --download   从远程下载最新APK（需要CI/CD支持）"
    echo "  -h, --help       显示帮助信息"
    echo ""
    echo -e "${GREEN}示例:${NC}"
    echo "  ./build-apk.sh"
    echo "  ./build-apk.sh \"feat: 添加收银台新功能\""
    echo "  ./build-apk.sh -p"
    echo ""
    exit 0
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            ;;
        -p|--push)
            MODE="push"
            shift
            ;;
        -d|--download)
            MODE="download"
            shift
            ;;
        -*)
            echo -e "${RED}错误: 未知选项 $1${NC}"
            show_help
            ;;
        *)
            COMMIT_MSG="$1"
            shift
            ;;
    esac
done

# 设置默认提交信息
if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="Update: $(date '+%Y-%m-%d %H:%M') 收银台APP构建"
fi

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE} 海邻到家收银台APP - APK构建${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# 获取远程仓库URL（如果有）
get_remote_url() {
    if git remote get-url origin &>/dev/null; then
        REMOTE_URL=$(git remote get-url origin)
    fi
}

# ============================================
# 模式1: 仅下载APK
# ============================================
download_apk() {
    echo -e "${YELLOW}📥 下载模式${NC}"
    echo ""
    
    # 检查是否有远程构建产物
    get_remote_url
    
    # 这里可以添加从GitHub Releases、Jenkins等下载APK的逻辑
    # 示例：从GitHub Releases下载
    if [[ "$REMOTE_URL" == *"github.com"* ]]; then
        echo "从GitHub Releases下载..."
        # gh release download --dir ./apks
        echo -e "${RED}请配置您的CI/CD下载链接${NC}"
    fi
    
    echo -e "${YELLOW}提示: 下载功能需要配置远程构建产物URL${NC}"
    echo "请访问您的CI/CD平台手动下载APK"
    echo ""
}

# ============================================
# 模式2: 仅推送代码
# ============================================
push_code() {
    echo -e "${YELLOW}📤 推送模式${NC}"
    echo ""
    
    # 检查git仓库
    if [ ! -d ".git" ]; then
        echo -e "${RED}错误: 当前目录不是Git仓库${NC}"
        exit 1
    fi
    
    # 获取远程URL
    get_remote_url
    if [ -z "$REMOTE_URL" ]; then
        echo -e "${RED}错误: 未配置远程仓库${NC}"
        exit 1
    fi
    
    echo "远程仓库: $REMOTE_URL"
    echo ""
    
    # 添加变更
    echo "📝 暂存所有变更..."
    git add -A
    
    # 检查是否有变更
    if git diff --cached --quiet; then
        echo -e "${YELLOW}没有检测到变更，跳过提交${NC}"
    else
        echo "提交信息: $COMMIT_MSG"
        git commit -m "$COMMIT_MSG"
        echo -e "${GREEN}✅ 代码已提交${NC}"
    fi
    
    # 推送
    echo ""
    echo "🚀 推送到远程仓库..."
    BRANCH=$(git branch --show-current 2>/dev/null || git rev-parse --abbrev-ref HEAD)
    git push origin "$BRANCH" 2>/dev/null || git push 2>/dev/null || echo -e "${RED}⚠️ 推送失败，请手动推送${NC}"
    
    echo ""
    echo -e "${GREEN}✅ 推送完成${NC}"
}

# ============================================
# 模式3: 完整流程
# ============================================
full_build() {
    # 检查环境
    echo -e "${YELLOW}🔍 检查环境...${NC}"
    
    # Node.js检查
    if ! command -v node &> /dev/null; then
        echo -e "${RED}错误: 未安装Node.js，请先安装Node.js 18+${NC}"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}错误: Node.js版本过低，需要18+，当前版本: $(node -v)${NC}"
        exit 1
    fi
    echo -e "  ${GREEN}✓${NC} Node.js $(node -v)"
    
    # Java检查
    if ! command -v java &> /dev/null; then
        echo -e "${RED}错误: 未安装Java，请安装JDK 11+${NC}"
        exit 1
    fi
    echo -e "  ${GREEN}✓${NC} Java $(java -version 2>&1 | head -1)"
    
    # Android SDK检查
    if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
        echo -e "${YELLOW}  ⚠ ANDROID_HOME未设置，请确保已配置Android SDK${NC}"
    else
        echo -e "  ${GREEN}✓${NC} Android SDK已配置"
    fi
    
    # Git检查
    if [ -d ".git" ]; then
        get_remote_url
        echo -e "  ${GREEN}✓${NC} Git仓库已初始化"
    else
        echo -e "${YELLOW}  ⚠ 未检测到Git仓库${NC}"
    fi
    
    echo ""
    
    # Step 1: Git提交
    if [ -d ".git" ] && [ -n "$REMOTE_URL" ]; then
        echo -e "${YELLOW}1️⃣ Git提交...${NC}"
        echo "提交信息: $COMMIT_MSG"
        git add -A
        if ! git diff --cached --quiet; then
            git commit -m "$COMMIT_MSG"
            echo -e "${GREEN}   ✅ 提交完成${NC}"
        else
            echo -e "${YELLOW}   ⏭ 无变更，跳过${NC}"
        fi
        echo ""
    fi
    
    # Step 2: 推送代码
    if [ -d ".git" ] && [ -n "$REMOTE_URL" ]; then
        echo -e "${YELLOW}2️⃣ 推送代码...${NC}"
        BRANCH=$(git branch --show-current 2>/dev/null || git rev-parse --abbrev-ref HEAD)
        if git push origin "$BRANCH" 2>/dev/null; then
            echo -e "${GREEN}   ✅ 推送完成${NC}"
        else
            echo -e "${RED}   ⚠️ 推送失败，请检查网络或手动推送${NC}"
        fi
        echo ""
    fi
    
    # Step 3: 安装依赖
    echo -e "${YELLOW}3️⃣ 安装依赖...${NC}"
    pnpm install
    echo -e "${GREEN}   ✅ 依赖安装完成${NC}"
    echo ""
    
    # Step 4: 构建Web应用
    echo -e "${YELLOW}4️⃣ 构建Web应用...${NC}"
    pnpm build
    echo -e "${GREEN}   ✅ Web应用构建完成${NC}"
    echo ""
    
    # Step 5: 同步到Android
    echo -e "${YELLOW}5️⃣ 同步到Android项目...${NC}"
    npx cap sync android
    echo -e "${GREEN}   ✅ 同步完成${NC}"
    echo ""
    
    # Step 6: 构建APK
    echo -e "${YELLOW}6️⃣ 构建APK...${NC}"
    cd android
    chmod +x gradlew
    ./gradlew assembleDebug
    cd ..
    echo ""
    
    # Step 7: 输出结果
    echo -e "${GREEN}===========================================${NC}"
    echo -e "${GREEN} 🎉 构建完成！${NC}"
    echo -e "${GREEN}===========================================${NC}"
    echo ""
    echo -e "${YELLOW}📱 APK文件:${NC}"
    APK_PATH=$(find android/app/build/outputs/apk/debug -name "*.apk" 2>/dev/null | head -1)
    if [ -n "$APK_PATH" ] && [ -f "$APK_PATH" ]; then
        ls -la "$APK_PATH"
        APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
        echo ""
        echo -e "${GREEN}文件大小: $APK_SIZE${NC}"
    else
        echo -e "${RED}未找到APK文件${NC}"
    fi
    echo ""
}

# ============================================
# 执行主流程
# ============================================
case $MODE in
    push)
        push_code
        ;;
    download)
        download_apk
        ;;
    all)
        full_build
        ;;
esac

echo ""
