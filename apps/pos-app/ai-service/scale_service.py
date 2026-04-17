#!/usr/bin/env python3
"""
电子秤串口通信模块
用于称重收银一体机读取电子秤数据

依赖安装:
    pip install pyserial

支持协议:
    - 通用串口协议 (9600, 8N1)
    - 可扩展支持 CAS / 上海耀华 等品牌秤

作者: 海邻到家技术团队
版本: 1.0.0
"""

import serial
import serial.tools.list_ports
import threading
import time
import logging
from typing import Optional, Callable
from dataclasses import dataclass

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ScaleReading:
    """秤读数数据结构"""
    weight: float      # 重量 (kg)
    stable: bool       # 是否稳定
    unit: str          # 单位 (kg/g)
    raw_data: str      # 原始数据
    timestamp: float   # 时间戳

class ScaleProtocol:
    """秤协议解析基类"""
    
    def parse(self, data: bytes) -> Optional[ScaleReading]:
        """解析秤数据，返回 None 表示无效数据"""
        raise NotImplementedError

class UniversalScaleProtocol(ScaleProtocol):
    """
    通用串口秤协议
    常见格式:
        1. 稳定: "+01.250kg\r\n" 或 "01.250 kg\r\n"
        2. 不稳定: "S01.250kg\r\n" 或 "U01.250kg\r\n"
        3. 零点: "+00.000kg\r\n"
    """
    
    def parse(self, data: bytes) -> Optional[ScaleReading]:
        try:
            raw = data.decode('ascii', errors='ignore').strip()
            logger.debug(f"原始数据: {raw}")
            
            # 去除空白字符
            raw = raw.replace(' ', '').replace('\r', '').replace('\n', '')
            
            # 稳定数据: +01.250kg 或 -00.500kg
            stable_match = raw.match(r'^([+-]?)(\d+\.\d{3})(kg|g)$', raw)
            if stable_match:
                sign = stable_match.group(1)
                weight_str = stable_match.group(2)
                unit = stable_match.group(3)
                
                weight = float(weight_str)
                if sign == '-':
                    weight = -weight
                
                return ScaleReading(
                    weight=weight,
                    stable=True,
                    unit=unit,
                    raw_data=raw,
                    timestamp=time.time()
                )
            
            # 不稳定数据: S01.250kg 或 U01.250kg
            unstable_match = None
            if unstable_match:
                weight = float(unstable_match.group(2))
                return ScaleReading(
                    weight=weight,
                    stable=False,
                    unit=unstable_match.group(3),
                    raw_data=raw,
                    timestamp=time.time()
                )
            
            return None
        except Exception as e:
            logger.warning(f"解析数据失败: {data}, 错误: {e}")
            return None

class CASScaleProtocol(ScaleProtocol):
    """
    CAS 秤协议 (韩国 CAS 电子秤)
    协议格式: ST,GS,+01.250,kg
    """
    
    def parse(self, data: bytes) -> Optional[ScaleReading]:
        try:
            raw = data.decode('ascii', errors='ignore').strip()
            parts = raw.split(',')
            
            if len(parts) >= 4 and parts[0] == 'ST':
                # CAS 协议
                status = parts[1]  # GS=稳定, NG=不稳定
                weight_str = parts[2].strip()
                unit = parts[3].strip()
                
                # 去除符号
                weight = abs(float(weight_str))
                stable = (status == 'GS')
                
                return ScaleReading(
                    weight=weight,
                    stable=stable,
                    unit=unit,
                    raw_data=raw,
                    timestamp=time.time()
                )
            return None
        except Exception as e:
            logger.warning(f"CAS协议解析失败: {data}")
            return None

class ScaleService:
    """电子秤服务"""
    
    def __init__(
        self,
        port: str = 'COM3',
        baudrate: int = 9600,
        bytesize: int = serial.EIGHTBITS,
        parity: str = serial.PARITY_NONE,
        stopbits: int = serial.STOPBITS_ONE,
        timeout: float = 1.0,
        protocol: Optional[ScaleProtocol] = None
    ):
        self.port = port
        self.baudrate = baudrate
        self.serial_params = {
            'bytesize': bytesize,
            'parity': parity,
            'stopbits': stopbits,
            'timeout': timeout
        }
        self.protocol = protocol or UniversalScaleProtocol()
        
        self.serial: Optional[serial.Serial] = None
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._callbacks: list = []
        self._last_reading: Optional[ScaleReading] = None
        
        # 触发识别参数
        self.trigger_weight = 0.01  # 10g 触发
        self.stable_duration = 0.5   # 稳定 500ms 触发识别
        
        self._stable_start: Optional[float] = None
    
    @staticmethod
    def list_ports() -> list:
        """列出所有可用串口"""
        ports = serial.tools.list_ports.comports()
        return [
            {
                'port': p.device,
                'name': p.name,
                'description': p.description,
                'hwid': p.hwid
            }
            for p in ports
        ]
    
    def connect(self) -> bool:
        """连接电子秤"""
        try:
            self.serial = serial.Serial(
                port=self.port,
                baudrate=self.baudrate,
                **self.serial_params
            )
            logger.info(f"已连接到电子秤: {self.port}")
            return True
        except serial.SerialException as e:
            logger.error(f"连接电子秤失败: {e}")
            return False
    
    def disconnect(self):
        """断开连接"""
        self.stop()
        if self.serial and self.serial.is_open:
            self.serial.close()
            logger.info("已断开电子秤连接")
    
    def start(self):
        """启动监听"""
        if self._running:
            return
        
        if not self.serial or not self.serial.is_open:
            if not self.connect():
                raise RuntimeError("无法连接到电子秤")
        
        self._running = True
        self._thread = threading.Thread(target=self._read_loop, daemon=True)
        self._thread.start()
        logger.info("电子秤监听已启动")
    
    def stop(self):
        """停止监听"""
        self._running = False
        if self._thread:
            self._thread.join(timeout=2)
            self._thread = None
        logger.info("电子秤监听已停止")
    
    def _read_loop(self):
        """读取循环"""
        buffer = b''
        
        while self._running:
            try:
                if self.serial.in_waiting:
                    data = self.serial.read(self.serial.in_waiting)
                    buffer += data
                    
                    # 按行分割处理
                    while b'\n' in buffer:
                        line, buffer = buffer.split(b'\n', 1)
                        reading = self.protocol.parse(line)
                        
                        if reading:
                            self._last_reading = reading
                            self._notify_callbacks(reading)
                            self._check_trigger(reading)
                else:
                    time.sleep(0.01)
            except Exception as e:
                logger.error(f"读取数据出错: {e}")
                time.sleep(0.1)
    
    def _check_trigger(self, reading: ScaleReading):
        """检查是否触发识别"""
        if reading.weight >= self.trigger_weight:
            if self._stable_start is None:
                self._stable_start = time.time()
            elif time.time() - self._stable_start >= self.stable_duration:
                if reading.stable:
                    logger.info(f"触发识别! 重量: {reading.weight:.3f}kg")
                    self._emit_trigger(reading)
                    self._stable_start = None
        else:
            self._stable_start = None
    
    def _emit_trigger(self, reading: ScaleReading):
        """发送触发事件"""
        # 触发时会调用注册的回调函数
        # 回调函数中应该拍照并调用 AI 识别
        pass
    
    def _notify_callbacks(self, reading: ScaleReading):
        """通知所有回调"""
        for callback in self._callbacks:
            try:
                callback(reading)
            except Exception as e:
                logger.error(f"回调执行失败: {e}")
    
    def on_reading(self, callback: Callable[[ScaleReading], None]) -> Callable:
        """注册读数回调"""
        self._callbacks.append(callback)
        return lambda: self._callbacks.remove(callback)
    
    def get_last_reading(self) -> Optional[ScaleReading]:
        """获取最后一条读数"""
        return self._last_reading
    
    def is_connected(self) -> bool:
        """检查是否已连接"""
        return self.serial is not None and self.serial.is_open
    
    def is_running(self) -> bool:
        """检查是否正在监听"""
        return self._running


def main():
    """测试主函数"""
    print("=" * 50)
    print("海邻到家 - 电子秤测试程序")
    print("=" * 50)
    
    # 列出可用串口
    print("\n可用串口:")
    ports = ScaleService.list_ports()
    if not ports:
        print("未找到任何串口设备")
        return
    
    for p in ports:
        print(f"  {p['port']}: {p['description']}")
    
    # 连接第一个可用串口（测试用）
    if ports:
        port = ports[0]['port']
        print(f"\n尝试连接: {port}")
        
        scale = ScaleService(port=port)
        
        if scale.connect():
            def on_reading(reading: ScaleReading):
                status = "稳定" if reading.stable else "不稳定"
                print(f"[{status}] {reading.weight:.3f} {reading.unit}")
            
            scale.on_reading(on_reading)
            scale.start()
            
            print("\n按 Ctrl+C 退出...")
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\n正在退出...")
                scale.stop()
                scale.disconnect()
        else:
            print("连接失败")


if __name__ == '__main__':
    main()
