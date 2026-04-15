#!/bin/bash
# 海邻到家 - AI 服务启动脚本
# 
# 使用说明：
#   ./start.sh              # 启动所有服务
#   ./start.sh ai           # 仅启动 AI 识别服务
#   ./start.sh scale        # 仅启动电子秤监听服务
#   ./start.sh stop         # 停止所有服务
#   ./start.sh restart      # 重启所有服务
#   ./start.sh status       # 查看服务状态
#   ./start.sh logs         # 查看服务日志

set -e

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

LOG_DIR="$SCRIPT_DIR/logs"
PID_DIR="$SCRIPT_DIR/pids"

AI_SERVICE_PORT=5000

# 创建目录
mkdir -p "$LOG_DIR" "$PID_DIR"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查进程是否存在
is_running() {
    local pid=$1
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        return 0
    fi
    return 1
}

# 获取进程 PID
get_pid() {
    local name=$1
    cat "$PID_DIR/${name}.pid" 2>/dev/null || echo ""
}

# 保存 PID
save_pid() {
    local name=$1
    local pid=$2
    echo "$pid" > "$PID_DIR/${name}.pid"
}

# 启动 AI 识别服务
start_ai_service() {
    log_info "启动 AI 识别服务..."
    
    local pid=$(get_pid "ai_service")
    if is_running "$pid"; then
        log_warn "AI 服务已在运行 (PID: $pid)"
        return 0
    fi
    
    # 检查端口
    if lsof -i :$AI_SERVICE_PORT &>/dev/null; then
        log_warn "端口 $AI_SERVICE_PORT 已被占用"
        # 尝试找到占用端口的进程
        local existing_pid=$(lsof -t -i :$AI_SERVICE_PORT)
        log_info "占用端口的进程: $existing_pid"
    fi
    
    # 启动服务
    python3 ai_service.py --port $AI_SERVICE_PORT > "$LOG_DIR/ai_service.log" 2>&1 &
    local new_pid=$!
    
    sleep 2
    
    if is_running "$new_pid"; then
        save_pid "ai_service" "$new_pid"
        log_success "AI 服务已启动 (PID: $new_pid)"
    else
        log_error "AI 服务启动失败"
        cat "$LOG_DIR/ai_service.log"
        return 1
    fi
}

# 启动电子秤监听服务
start_scale_listener() {
    log_info "启动电子秤监听服务..."
    
    local pid=$(get_pid "scale_listener")
    if is_running "$pid"; then
        log_warn "电子秤监听服务已在运行 (PID: $pid)"
        return 0
    fi
    
    # 启动服务
    python3 scale_listener.py > "$LOG_DIR/scale_listener.log" 2>&1 &
    local new_pid=$!
    
    sleep 2
    
    if is_running "$new_pid"; then
        save_pid "scale_listener" "$new_pid"
        log_success "电子秤监听服务已启动 (PID: $new_pid)"
    else
        log_error "电子秤监听服务启动失败"
        cat "$LOG_DIR/scale_listener.log"
        return 1
    fi
}

# 停止所有服务
stop_all() {
    log_info "停止所有服务..."
    
    for name in "ai_service" "scale_listener"; do
        local pid=$(get_pid "$name")
        if [ -n "$pid" ] && is_running "$pid"; then
            kill "$pid" 2>/dev/null || true
            sleep 1
            if is_running "$pid"; then
                kill -9 "$pid" 2>/dev/null || true
            fi
            log_info "$name 已停止"
        fi
        rm -f "$PID_DIR/${name}.pid"
    done
    
    log_success "所有服务已停止"
}

# 查看服务状态
show_status() {
    echo ""
    echo "=========================================="
    echo "         海邻到家 AI 服务状态"
    echo "=========================================="
    echo ""
    
    # AI 服务状态
    local ai_pid=$(get_pid "ai_service")
    if is_running "$ai_pid"; then
        echo -e "AI 识别服务:    ${GREEN}运行中${NC} (PID: $ai_pid)"
        
        # 检查健康状态
        if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$AI_SERVICE_PORT/health | grep -q "200"; then
            echo -e "  健康检查:      ${GREEN}正常${NC}"
        else
            echo -e "  健康检查:      ${RED}异常${NC}"
        fi
    else
        echo -e "AI 识别服务:    ${RED}已停止${NC}"
    fi
    echo ""
    
    # 电子秤监听状态
    local scale_pid=$(get_pid "scale_listener")
    if is_running "$scale_pid"; then
        echo -e "电子秤监听:     ${GREEN}运行中${NC} (PID: $scale_pid)"
    else
        echo -e "电子秤监听:     ${RED}已停止${NC}"
    fi
    echo ""
    
    # 端口检查
    echo "端口占用情况:"
    echo "  5000 (AI服务):    $(lsof -i :5000 2>/dev/null | grep LISTEN | head -1 || echo '未占用')"
    echo ""
    
    echo "=========================================="
}

# 查看日志
show_logs() {
    local service=${1:-""}
    
    if [ -n "$service" ]; then
        if [ -f "$LOG_DIR/${service}.log" ]; then
            tail -50 "$LOG_DIR/${service}.log"
        else
            log_error "日志文件不存在: $LOG_DIR/${service}.log"
        fi
    else
        echo "=== AI 服务日志 ==="
        tail -30 "$LOG_DIR/ai_service.log" 2>/dev/null || echo "无日志"
        echo ""
        echo "=== 电子秤监听日志 ==="
        tail -30 "$LOG_DIR/scale_listener.log" 2>/dev/null || echo "无日志"
    fi
}

# 安装依赖
install_deps() {
    log_info "安装 Python 依赖..."
    
    pip3 install -r requirements.txt
    
    log_success "依赖安装完成"
}

# 主程序
main() {
    local command=${1:-"start"}
    
    case "$command" in
        start)
            start_ai_service
            start_scale_listener
            show_status
            ;;
        ai)
            start_ai_service
            ;;
        scale)
            start_scale_listener
            ;;
        stop)
            stop_all
            ;;
        restart)
            stop_all
            sleep 2
            start_ai_service
            start_scale_listener
            show_status
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$2"
            ;;
        install)
            install_deps
            ;;
        *)
            echo "用法: $0 {start|ai|scale|stop|restart|status|logs|install}"
            echo ""
            echo "命令说明:"
            echo "  start   - 启动所有服务"
            echo "  ai      - 仅启动 AI 识别服务"
            echo "  scale   - 仅启动电子秤监听服务"
            echo "  stop    - 停止所有服务"
            echo "  restart - 重启所有服务"
            echo "  status  - 查看服务状态"
            echo "  logs    - 查看服务日志"
            echo "  install - 安装依赖"
            exit 1
            ;;
    esac
}

main "$@"
