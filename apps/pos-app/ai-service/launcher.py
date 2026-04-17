#!/usr/bin/env python3
"""
海邻到家 - AI 一体机服务启动器
同时启动 AI 识别服务和电子秤服务

用法:
    python launcher.py                    # 启动所有服务
    python launcher.py --ai-only         # 仅启动 AI 服务
    python launcher.py --scale-only       # 仅启动秤服务
    python launcher.py --mock             # 使用模拟数据（无硬件时）

作者: 海邻到家技术团队
版本: 1.0.0
"""

import argparse
import sys
import time
import logging
from threading import Thread

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 全局标志
running = True

def signal_handler(signum, frame):
    """处理退出信号"""
    global running
    logger.info("收到退出信号，正在停止服务...")
    running = False

def start_ai_service(host: str = '0.0.0.0', port: int = 5000):
    """启动 AI 识别服务"""
    try:
        from ai_service import app
        logger.info(f"启动 AI 服务: http://{host}:{port}")
        app.run(host=host, port=port, debug=False, threaded=True)
    except ImportError as e:
        logger.error(f"无法导入 AI 服务: {e}")
        logger.info("请确保 ai_service.py 存在且 Ultralytics 已安装")

def start_scale_service(port: str = 'COM3'):
    """启动电子秤服务"""
    try:
        from scale_service import ScaleService, ScaleReading
        
        scale = ScaleService(port=port)
        
        if not scale.connect():
            logger.warning(f"无法连接到电子秤 {port}，使用模拟模式")
            # 使用模拟模式
            run_mock_scale()
            return
        
        last_weight = 0
        trigger_count = 0
        
        def on_reading(reading: ScaleReading):
            global last_weight, trigger_count
            status = "✓" if reading.stable else "○"
            print(f"\r[{status}] 重量: {reading.weight:.3f} kg", end='', flush=True)
            
            # 检测放上/拿起的动作
            if reading.weight > 0.01 and last_weight <= 0.01:
                trigger_count += 1
                logger.info(f"检测到商品放置 (触发 #{trigger_count})")
            
            last_weight = reading.weight
        
        scale.on_reading(on_reading)
        scale.start()
        
        logger.info(f"秤服务已启动，监听端口: {port}")
        
        while running:
            time.sleep(0.1)
        
        scale.stop()
        scale.disconnect()
        
    except ImportError as e:
        logger.error(f"无法导入秤服务: {e}")
        run_mock_scale()

def run_mock_scale():
    """模拟电子秤（开发测试用）"""
    logger.info("运行模拟秤模式")
    import random
    
    global running
    weight = 0.0
    direction = 1  # 1=增加, -1=减少
    
    while running:
        # 模拟称重过程
        weight += direction * random.uniform(0.05, 0.15)
        weight = max(0, min(3, weight))  # 限制在 0-3kg
        
        # 随机改变方向（模拟放上/拿起商品）
        if random.random() < 0.02:
            direction *= -1
        
        status = "✓" if abs(weight - round(weight * 2) / 2) < 0.01 else "○"
        print(f"\r[{status}] 模拟重量: {weight:.3f} kg", end='', flush=True)
        
        time.sleep(0.3)

def print_banner():
    """打印启动横幅"""
    banner = """
╔══════════════════════════════════════════════════════════════╗
║                                                                      ║
║     ██╗    ██╗███████╗██╗      ██████╗ ██████╗ ███╗   ███╗███████╗ ║
║     ██║    ██║██╔════╝██║     ██╔════╝██╔═══██╗████╗ ████║██╔════╝ ║
║     ██║ █╗ ██║█████╗  ██║     ██║     ██║   ██║██╔████╔██║█████╗   ║
║     ██║███╗██║██╔══╝  ██║     ██║     ██║   ██║██║╚██╔╝██║██╔══╝   ║
║     ╚███╔███╔╝███████╗███████╗╚██████╗╚██████╔╝██║ ╚═╝ ██║███████╗ ║
║      ╚══╝╚══╝ ╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝ ║
║                                                                      ║
║                    AI 称重收银一体机服务                            ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════╣
║  AI 视觉识别服务:  http://127.0.0.1:5000/recognize              ║
║  电子秤服务:      串口监听中...                                  ║
║                                                                      ║
║  按 Ctrl+C 停止所有服务                                           ║
╚══════════════════════════════════════════════════════════════╝
    """
    print(banner)

def main():
    parser = argparse.ArgumentParser(description='海邻到家 AI 一体机服务启动器')
    parser.add_argument('--ai-only', action='store_true', help='仅启动 AI 服务')
    parser.add_argument('--scale-only', action='store_true', help='仅启动秤服务')
    parser.add_argument('--mock', action='store_true', help='使用模拟模式（无硬件）')
    parser.add_argument('--ai-port', type=int, default=5000, help='AI 服务端口')
    parser.add_argument('--scale-port', type=str, default='COM3', help='秤串口')
    
    args = parser.parse_args()
    
    # 打印横幅
    print_banner()
    
    # 设置信号处理
    import signal
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    threads = []
    
    if args.scale_only:
        # 仅启动秤服务
        start_scale_service(args.scale_port)
    elif args.ai_only:
        # 仅启动 AI 服务
        start_ai_service(port=args.ai_port)
    else:
        # 启动所有服务
        if not args.mock:
            scale_thread = Thread(target=start_scale_service, args=(args.scale_port,))
            scale_thread.daemon = True
            scale_thread.start()
            threads.append(scale_thread)
            time.sleep(0.5)  # 等待秤服务启动
        
        # 启动 AI 服务（主线程）
        start_ai_service(port=args.ai_port)

if __name__ == '__main__':
    main()
