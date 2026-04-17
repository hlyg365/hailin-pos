# 海邻到家 AI 一体机部署指南

## 概述

本文档说明如何在称重收银一体机（Android/Linux）上部署 AI 视觉识别服务。

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    称重收银一体机                             │
│  ┌───────────┐    ┌───────────┐    ┌───────────────────┐   │
│  │  摄像头    │    │  电子秤    │    │   收银 APP (Web)   │   │
│  │  (眼)     │    │  (触觉)   │    │      (脑)          │   │
│  └─────┬─────┘    └─────┬─────┘    └─────────┬─────────┘   │
│        │                │                    │              │
│        └────────────────┴────────────────────┘              │
│                         │                                   │
│              ┌──────────┴──────────┐                        │
│              │   本地 AI 服务      │                        │
│              │  (Python Flask)     │                        │
│              │  http://127.0.0.1:5000                      │
│              └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## 快速开始

### 方式一：使用模拟模式（开发测试）

```bash
cd ai-service

# 安装依赖
pip install -r requirements.txt

# 启动服务（模拟模式，无需硬件）
python launcher.py --mock
```

### 方式二：连接真实硬件

```bash
# 1. 查看可用串口
python -c "from scale_service import ScaleService; print(ScaleService.list_ports())"

# 2. 启动完整服务
python launcher.py --ai-port 5000 --scale-port /dev/ttyUSB0
```

## 文件说明

```
ai-service/
├── ai_service.py       # AI 视觉识别服务 (Flask)
├── scale_service.py     # 电子秤串口通信服务
├── launcher.py         # 服务启动器（同时启动所有服务）
├── requirements.txt    # Python 依赖
├── best.pt            # YOLOv8 模型文件（需自行训练）
└── README.md          # 本文档
```

## API 接口

### 1. 健康检查

```bash
GET http://127.0.0.1:5000/health
```

响应:
```json
{
  "status": "ok",
  "service": "ai-recognition",
  "version": "1.0.0"
}
```

### 2. 商品识别

```bash
POST http://127.0.0.1:5000/recognize
Content-Type: application/json

{
  "image": "base64编码的图片数据（不含 data:image/... 前缀）"
}
```

响应:
```json
{
  "status": "success",
  "product": "红富士苹果",
  "confidence": 0.95,
  "all_detected": [
    {"name": "红富士苹果", "confidence": 0.95},
    {"name": "黄元帅苹果", "confidence": 0.72}
  ]
}
```

### 3. 带重量的识别

```bash
POST http://127.0.0.1:5000/recognize-with-weight
Content-Type: application/json

{
  "image": "base64...",
  "weight": 1.25,
  "unit": "kg"
}
```

## 收银 APP 集成

### 前端调用示例

```typescript
import { aiService, scaleService, VisionScaleController } from '@/services/aiService';

// 创建控制器
const controller = new VisionScaleController({
  aiServiceUrl: 'http://127.0.0.1:5000',
  autoCapture: true,
});

// 启动服务
await controller.start((result, weight) => {
  if (result.status === 'success') {
    console.log(`识别到: ${result.product}, 重量: ${weight}kg`);
    // 添加到购物车
    addToCart(result.product, weight);
  }
});

// 手动拍照识别
const result = await controller.recognize(imageBase64);
if (result.status === 'success') {
  addToCart(result.product, currentWeight);
}
```

## 模型训练

### 1. 准备数据集

收集便利店商品图片，建议每个商品 50-100 张图片，涵盖：
- 不同角度
- 不同光照
- 不同背景

### 2. 标注数据

使用 [LabelImg](https://github.com/tzutalin/labelImg) 进行标注。

### 3. 训练模型

```python
from ultralytics import YOLO

# 加载预训练模型
model = YOLO('yolov8n.pt')

# 训练
results = model.train(
    data='dataset.yaml',  # 数据集配置
    epochs=100,
    imgsz=640,
    device='0'  # GPU
)

# 导出模型
model.export(format='pt')
```

### 4. 部署模型

将训练好的 `best.pt` 放入 `ai-service/` 目录。

## 硬件连接

### 电子秤接线

```
秤接口 (DB9/RS232)     USB转串口
┌─────────┐            ┌─────────┐
│  2 TX   │ ──────────► │   USB   │
│  3 RX   │ ◄───────── │         │
│  5 GND  │ ──────────► │         │
└─────────┘            └─────────┘
```

常见串口参数：
- 波特率: 9600
- 数据位: 8
- 停止位: 1
- 校验位: None

### 摄像头

推荐配置：
- 分辨率: 1920x1080 (1080P)
- 对焦: 自动对焦
- 接口: USB 3.0
- 角度: 俯视 45-60 度

## 故障排除

### 1. AI 服务无法启动

```bash
# 检查端口占用
netstat -tlnp | grep 5000

# 检查模型文件
ls -la best.pt
```

### 2. 电子秤无数据

```bash
# 列出可用串口
python -c "from scale_service import ScaleService; print(ScaleService.list_ports())"

# 测试串口
python scale_service.py
```

### 3. 识别准确率低

- 检查摄像头角度和光照
- 补充训练数据
- 调整置信度阈值

## 技术支持

如有问题，请联系海邻到家技术支持团队。
