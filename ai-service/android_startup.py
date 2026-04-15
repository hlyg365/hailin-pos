#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
海邻到家 - Android 服务启动器

在 Android 设备上启动 AI 服务和电子秤监听服务

依赖：
    pip install flask pyserial opencv-python

运行：
    python android_startup.py
"""

import subprocess
import sys
import os
import time
import logging
import socket
import threading

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 服务配置
AI_SERVICE_PORT = 5000
AI_SERVICE_SCRIPT = 'ai_service.py'
SCALE_LISTENER_SCRIPT = 'scale_listener.py'

class AndroidServiceManager:
    """Android 服务管理器"""
    
    def __init__(self):
        self.processes = {}
        self.is_running = False
    
    def check_port(self, port: int) -> bool:
        """检查端口是否可用"""
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        try:
            result = sock.connect_ex(('127.0.0.1', port))
            sock.close()
            return result != 0
        except:
            return False
    
    def wait_for_port(self, port: int, timeout: int = 30) -> bool:
        """等待端口可用"""
        start_time = time.time()
        while time.time() - start_time < timeout:
            if self.check_port(port):
                return True
            time.sleep(1)
        return False
    
    def start_ai_service(self) -> bool:
        """启动 AI 服务"""
        try:
            if not self.check_port(AI_SERVICE_PORT):
                logger.info(f"AI 服务已在端口 {AI_SERVICE_PORT} 运行")
                return True
            
            script_path = os.path.join(os.path.dirname(__file__), AI_SERVICE_SCRIPT)
            
            if not os.path.exists(script_path):
                logger.error(f"AI 服务脚本不存在: {script_path}")
                return False
            
            logger.info(f"启动 AI 服务: {script_path}")
            
            process = subprocess.Popen(
                [sys.executable, script_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                cwd=os.path.dirname(__file__)
            )
            
            self.processes['ai_service'] = process
            
            if self.wait_for_port(AI_SERVICE_PORT, timeout=30):
                logger.info(f"AI 服务已启动 (PID: {process.pid})")
                return True
            else:
                logger.error("AI 服务启动超时")
                return False
                
        except Exception as e:
            logger.error(f"启动 AI 服务失败: {e}")
            return False
    
    def start_scale_listener(self, simulate: bool = True) -> bool:
        """启动电子秤监听服务"""
        try:
            script_path = os.path.join(os.path.dirname(__file__), SCALE_LISTENER_SCRIPT)
            
            if not os.path.exists(script_path):
                logger.error(f"电子秤监听脚本不存在: {script_path}")
                return False
            
            logger.info(f"启动电子秤监听服务: {script_path}")
            
            args = [sys.executable, script_path]
            if simulate:
                args.append('--simulate')
            
            process = subprocess.Popen(
                args,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                cwd=os.path.dirname(__file__)
            )
            
            self.processes['scale_listener'] = process
            logger.info(f"电子秤监听服务已启动 (PID: {process.pid})")
            return True
            
        except Exception as e:
            logger.error(f"启动电子秤监听服务失败: {e}")
            return False
    
    def stop_all(self):
        """停止所有服务"""
        logger.info("停止所有服务...")
        
        for name, process in self.processes.items():
            try:
                process.terminate()
                process.wait(timeout=5)
                logger.info(f"{name} 已停止")
            except:
                try:
                    process.kill()
                    logger.info(f"{name} 已强制终止")
                except:
                    pass
        
        self.processes.clear()
    
    def check_health(self) -> dict:
        """检查服务健康状态"""
        try:
            import requests
            
            response = requests.get(
                f'http://127.0.0.1:{AI_SERVICE_PORT}/health',
                timeout=5
            )
            
            if response.ok:
                return {
                    'ai_service': True,
                    'data': response.json()
                }
        except:
            pass
        
        return {
            'ai_service': False,
            'error': 'AI服务不可用'
        }
    
    def run(self, simulate: bool = True):
        """运行所有服务"""
        logger.info("=" * 50)
        logger.info("海邻到家 - Android 服务启动器")
        logger.info("=" * 50)
        
        # 启动 AI 服务
        if not self.start_ai_service():
            logger.error("AI 服务启动失败")
            return False
        
        # 启动电子秤监听（默认模拟模式）
        self.start_scale_listener(simulate=simulate)
        
        # 检查健康状态
        logger.info("检查服务健康状态...")
        time.sleep(2)
        
        health = self.check_health()
        if health.get('ai_service'):
            logger.info("所有服务启动成功！")
            logger.info(f"AI服务地址: http://127.0.0.1:{AI_SERVICE_PORT}")
        else:
            logger.warning("AI服务可能未正常启动")
        
        logger.info("=" * 50)
        
        # 保持运行
        self.is_running = True
        try:
            while self.is_running:
                time.sleep(10)
                
                # 检查进程状态
                for name, process in list(self.processes.items()):
                    if process.poll() is not None:
                        logger.warning(f"{name} 进程已退出")
                        del self.processes[name]
                        
        except KeyboardInterrupt:
            logger.info("收到中断信号")
        finally:
            self.stop_all()
        
        return True

def main():
    """主入口"""
    manager = AndroidServiceManager()
    manager.run(simulate=True)

if __name__ == '__main__':
    main()
