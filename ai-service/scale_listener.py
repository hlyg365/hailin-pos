#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
海邻到家 - 电子秤监听服务

监听串口电子秤数据，检测重量变化，稳定后触发 AI 识别

支持电子秤协议：
- 顶尖 OS2 主动协议

电子秤配置：
- 波特率：9600
- 数据位：8
- 校验位：None
- 停止位：1

启动：
    python scale_listener.py [--port PORT] [--camera CAMERA_INDEX]
    python scale_listener.py --simulate  # 模拟模式

示例：
    # 连接 USB 电子秤
    python scale_listener.py --port /dev/ttyUSB0
    
    # 使用模拟模式
    python scale_listener.py --simulate
"""

import os
import sys
import time
import json
import socket
import threading
import argparse
import logging
from datetime import datetime
from typing import Optional, Callable

import serial
import serial.tools.list_ports

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== 顶尖 OS2 协议定义 ==============

class TopSharpOS2Protocol:
    """
    顶尖 OS2 主动协议解析器
    
    数据格式（ASCII）：
    [STX] [数据1] [数据2] [数据3] [数据4] [数据5] [ETX] [CR]
    
    示例数据：
    +002.450 kg\r\n  表示稳定重量 2.450 kg
    +000.150 kg\r\n  表示不稳定的 0.150 kg
    """
    
    # 协议控制字符
    STX = 0x02  # 起始标志
    ETX = 0x03  # 结束标志
    CR = 0x0D   # 回车
    LF = 0x0A   # 换行
    
    @staticmethod
    def parse_weight(data: bytes) -> dict:
        """
        解析电子秤数据
        
        Args:
            data: 原始字节数据
        
        Returns:
            {
                'stable': True/False,    # 是否稳定
                'weight': 0.0,           # 重量（kg）
                'raw': '...'             # 原始字符串
            }
        """
        try:
            # 解码并清理
            raw = data.decode('ascii', errors='ignore').strip()
            
            # 查找数据部分
            raw_clean = ''
            for char in raw:
                if char in '+-' and len(raw_clean) == 0:
                    raw_clean += char
                elif char.isdigit() or char == '.':
                    raw_clean += char
                elif char == ' ':
                    break
            
            if not raw_clean:
                return {'stable': False, 'weight': 0.0, 'raw': raw}
            
            # 判断稳定性
            stable = 'kg' in raw.lower() and ' ' in raw
            
            # 解析数值
            weight = float(raw_clean) if raw_clean else 0.0
            
            return {
                'stable': stable,
                'weight': abs(weight),
                'raw': raw
            }
            
        except Exception as e:
            logger.error(f"解析电子秤数据失败: {e}")
            return {'stable': False, 'weight': 0.0, 'raw': ''}


# ============== 模拟电子秤 ==============

class SimulatedScale:
    """模拟电子秤（用于开发测试）"""
    
    def __init__(self, min_weight: float = 0.0, max_weight: float = 15.0):
        self.min_weight = min_weight
        self.max_weight = max_weight
        self.current_weight = 0.0
        self.target_weight = 0.0
        self.is_stable = True
        
        # 模拟参数
        self.noise_level = 0.002  # 噪声幅度
        self.stable_delay = 0.5   # 稳定延迟（秒）
        self.last_change_time = time.time()
        
    def set_target_weight(self, weight: float):
        """设置目标重量"""
        self.target_weight = max(0, min(weight, self.max_weight))
        self.last_change_time = time.time()
        
    def read(self) -> dict:
        """读取模拟数据"""
        elapsed = time.time() - self.last_change_time
        
        # 逐渐逼近目标值
        if abs(self.current_weight - self.target_weight) > 0.001:
            diff = self.target_weight - self.current_weight
            step = diff * 0.3  # 渐进调整
            self.current_weight += step
            self.is_stable = False
        else:
            self.current_weight = self.target_weight
            self.is_stable = elapsed > self.stable_delay
        
        # 添加噪声
        import random
        noise = random.uniform(-self.noise_level, self.noise_level)
        weight = max(0, self.current_weight + noise)
        
        # 生成协议数据
        sign = '+' if weight >= 0 else '-'
        weight_str = f"{sign}{weight:07.3f} kg\r\n"
        
        return {
            'stable': self.is_stable,
            'weight': weight,
            'raw': weight_str
        }
    
    def close(self):
        """关闭（空操作）"""
        pass


# ============== 串口电子秤 ==============

class SerialScale:
    """串口电子秤"""
    
    def __init__(self, port: str, baudrate: int = 9600):
        self.port = port
        self.baudrate = baudrate
        self.serial: Optional[serial.Serial] = None
        self.protocol = TopSharpOS2Protocol()
        
    def connect(self) -> bool:
        """连接电子秤"""
        try:
            self.serial = serial.Serial(
                port=self.port,
                baudrate=self.baudrate,
                bytesize=serial.EIGHTBITS,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                timeout=1
            )
            logger.info(f"已连接到电子秤: {self.port}")
            return True
        except serial.SerialException as e:
            logger.error(f"连接电子秤失败: {e}")
            return False
    
    def read(self) -> dict:
        """读取数据"""
        if not self.serial or not self.serial.is_open:
            return {'stable': False, 'weight': 0.0, 'raw': ''}
        
        try:
            if self.serial.in_waiting:
                data = self.serial.read(self.serial.in_waiting)
                return self.protocol.parse_weight(data)
        except Exception as e:
            logger.error(f"读取电子秤数据失败: {e}")
        
        return {'stable': False, 'weight': 0.0, 'raw': ''}
    
    def close(self):
        """关闭连接"""
        if self.serial and self.serial.is_open:
            self.serial.close()
            logger.info("电子秤连接已关闭")


# ============== 摄像头捕获 ==============

class CameraCapture:
    """摄像头捕获"""
    
    def __init__(self, camera_index: int = 0):
        self.camera_index = camera_index
        self.cap = None
        self.initialized = False
        
    def initialize(self) -> bool:
        """初始化摄像头"""
        try:
            import cv2
            self.cap = cv2.VideoCapture(self.camera_index)
            
            if not self.cap.isOpened():
                logger.error(f"无法打开摄像头: {self.camera_index}")
                return False
            
            # 设置分辨率
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            
            self.initialized = True
            logger.info(f"摄像头已初始化: {self.camera_index}")
            return True
            
        except ImportError:
            logger.error("需要安装 opencv-python: pip install opencv-python")
            return False
        except Exception as e:
            logger.error(f"摄像头初始化失败: {e}")
            return False
    
    def capture(self) -> Optional[bytes]:
        """捕获一帧图片"""
        if not self.initialized or not self.cap:
            return None
        
        try:
            ret, frame = self.cap.read()
            if ret:
                import cv2
                # 编码为 JPEG
                _, buffer = cv2.imencode('.jpg', frame)
                return buffer.tobytes()
        except Exception as e:
            logger.error(f"捕获图片失败: {e}")
        
        return None
    
    def close(self):
        """关闭摄像头"""
        if self.cap and self.cap.isOpened():
            self.cap.release()
            logger.info("摄像头已关闭")


# ============== AI 识别客户端 ==============

class AIServiceClient:
    """AI 识别服务客户端"""
    
    def __init__(self, host: str = '127.0.0.1', port: int = 5000):
        self.base_url = f"http://{host}:{port}"
        
    def recognize(self, image_data: bytes, weight: float = 0) -> dict:
        """发送识别请求"""
        import requests
        
        try:
            if weight > 0:
                # 带重量的识别
                import base64
                response = requests.post(
                    f"{self.base_url}/recognize_with_weight",
                    json={
                        'image': base64.b64encode(image_data).decode('utf-8'),
                        'weight': weight,
                        'confidence': 0.75
                    },
                    timeout=10
                )
            else:
                # 普通识别
                files = {'image': ('image.jpg', image_data, 'image/jpeg')}
                response = requests.post(
                    f"{self.base_url}/recognize",
                    files=files,
                    timeout=10
                )
            
            return response.json()
            
        except requests.exceptions.ConnectionError:
            return {'success': False, 'error': '无法连接到 AI 服务'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def check_health(self) -> bool:
        """检查服务健康状态"""
        import requests
        
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            return response.ok
        except:
            return False


# ============== 电子秤监听器 ==============

class ScaleListener:
    """电子秤监听器"""
    
    def __init__(
        self,
        port: Optional[str] = None,
        simulate: bool = False,
        weight_threshold: float = 0.01,
        ai_host: str = '127.0.0.1',
        ai_port: int = 5000
    ):
        self.simulate = simulate
        self.weight_threshold = weight_threshold
        self.weight_stable_threshold = 0.01  # 稳定判定阈值
        
        # 组件
        self.scale: Optional[SerialScale | SimulatedScale] = None
        self.camera = CameraCapture()
        self.ai_client = AIServiceClient(ai_host, ai_port)
        
        # 状态
        self.last_weight = 0.0
        self.last_stable_weight = 0.0
        self.is_running = False
        
        # 回调函数
        self.on_weight_change: Optional[Callable] = None
        self.on_recognition_result: Optional[Callable] = None
        
        # 初始化
        self._init_scale(port)
        
    def _init_scale(self, port: Optional[str]):
        """初始化电子秤"""
        if self.simulate:
            logger.info("使用模拟电子秤")
            self.scale = SimulatedScale()
        else:
            if port is None:
                # 自动检测
                ports = list(serial.tools.list_ports.comports())
                if ports:
                    port = ports[0].device
                    logger.info(f"自动选择串口: {port}")
                else:
                    logger.warning("未找到串口设备，切换到模拟模式")
                    self.simulate = True
                    self.scale = SimulatedScale()
                    return
            
            logger.info(f"连接电子秤: {port}")
            self.scale = SerialScale(port)
            if not self.scale.connect():
                logger.warning("电子秤连接失败，切换到模拟模式")
                self.scale = SimulatedScale()
    
    def start(self, camera_index: int = 0):
        """启动监听"""
        # 初始化摄像头
        if not self.camera.initialize():
            logger.error("摄像头初始化失败，无法进行 AI 识别")
            return
        
        self.is_running = True
        
        # 检查 AI 服务
        if self.ai_client.check_health():
            logger.info("AI 服务已就绪")
        else:
            logger.warning("AI 服务未连接，将在有图片时尝试连接")
        
        # 启动监听线程
        thread = threading.Thread(target=self._listen_loop)
        thread.daemon = True
        thread.start()
        
        logger.info("电子秤监听已启动")
        
        # 主线程保持
        try:
            while self.is_running:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("收到停止信号")
            self.stop()
    
    def _listen_loop(self):
        """监听循环"""
        while self.is_running:
            try:
                # 读取电子秤数据
                data = self.scale.read()
                
                weight = data.get('weight', 0)
                stable = data.get('stable', False)
                
                # 触发回调
                if self.on_weight_change:
                    self.on_weight_change(weight, stable)
                
                # 检测重量变化
                if weight >= self.weight_threshold:
                    # 重量达到阈值
                    if stable and weight != self.last_stable_weight:
                        # 重量稳定，触发识别
                        self.last_stable_weight = weight
                        self._trigger_recognition(weight)
                
                self.last_weight = weight
                
            except Exception as e:
                logger.error(f"监听循环错误: {e}")
                time.sleep(0.1)
    
    def _trigger_recognition(self, weight: float):
        """触发 AI 识别"""
        logger.info(f"触发识别: 重量={weight:.3f}kg")
        
        # 捕获图片
        image_data = self.camera.capture()
        if not image_data:
            logger.error("图片捕获失败")
            return
        
        # 发送识别请求
        result = self.ai_client.recognize(image_data, weight)
        
        logger.info(f"识别结果: {result}")
        
        # 触发回调
        if self.on_recognition_result:
            self.on_recognition_result(result, weight)
    
    def set_target_weight(self, weight: float):
        """设置模拟电子秤的目标重量"""
        if isinstance(self.scale, SimulatedScale):
            self.scale.set_target_weight(weight)
    
    def stop(self):
        """停止监听"""
        self.is_running = False
        self.scale.close()
        self.camera.close()
        logger.info("电子秤监听已停止")


# ============== 主程序 ==============

def parse_arguments():
    """解析命令行参数"""
    parser = argparse.ArgumentParser(description='海邻到家电子秤监听服务')
    
    parser.add_argument(
        '--port', '-p',
        help='串口设备路径，如 /dev/ttyUSB0 或 COM3'
    )
    
    parser.add_argument(
        '--baudrate', '-b',
        type=int,
        default=9600,
        help='波特率（默认 9600）'
    )
    
    parser.add_argument(
        '--camera', '-c',
        type=int,
        default=0,
        help='摄像头索引（默认 0）'
    )
    
    parser.add_argument(
        '--simulate', '-s',
        action='store_true',
        help='使用模拟模式（无需硬件）'
    )
    
    parser.add_argument(
        '--threshold', '-t',
        type=float,
        default=0.01,
        help='重量触发阈值，单位 kg（默认 0.01）'
    )
    
    parser.add_argument(
        '--ai-host',
        default='127.0.0.1',
        help='AI 服务地址（默认 127.0.0.1）'
    )
    
    parser.add_argument(
        '--ai-port',
        type=int,
        default=5000,
        help='AI 服务端口（默认 5000）'
    )
    
    return parser.parse_args()

def main():
    """主入口"""
    args = parse_arguments()
    
    logger.info("=" * 50)
    logger.info("海邻到家 - 电子秤监听服务")
    logger.info("=" * 50)
    
    # 创建监听器
    listener = ScaleListener(
        port=args.port,
        simulate=args.simulate,
        weight_threshold=args.threshold,
        ai_host=args.ai_host,
        ai_port=args.ai_port
    )
    
    # 设置回调
    def on_weight_change(weight: float, stable: bool):
        status = "稳定" if stable else "变化中"
        print(f"\r重量: {weight:.3f} kg [{status}]  ", end='', flush=True)
    
    def on_recognition_result(result: dict, weight: float):
        print()  # 换行
        if result.get('success'):
            products = result.get('products', [])
            total_price = result.get('total_price', 0)
            print(f"识别到 {len(products)} 种商品，总价: ¥{total_price/100:.2f}")
            for p in products:
                print(f"  - {p['name']}: ¥{p['price']/100:.2f}")
        else:
            print(f"识别失败: {result.get('error', '未知错误')}")
    
    listener.on_weight_change = on_weight_change
    listener.on_recognition_result = on_recognition_result
    
    # 启动
    listener.start(camera_index=args.camera)
    
    # 模拟模式交互
    if args.simulate:
        print("\n=== 模拟模式 ===")
        print("输入目标重量（kg），按回车确认，输入 'q' 退出")
        while True:
            try:
                cmd = input("\n> ").strip()
                if cmd.lower() == 'q':
                    break
                weight = float(cmd)
                listener.set_target_weight(weight)
            except ValueError:
                print("请输入有效的数字")
            except KeyboardInterrupt:
                break
    
    listener.stop()

if __name__ == '__main__':
    main()
