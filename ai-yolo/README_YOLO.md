# 海邻到家 - YOLOv8 商品识别快速指南

## 🚀 快速开始

### 方式 A：使用预训练模型（5分钟）

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 创建预训练模型
python quick_create_model.py

# 3. 启动 API 服务
python yolo_api_server.py

# 4. 浏览器测试
# 打开 http://localhost:8000/docs
```

### 方式 B：训练自定义模型

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 准备数据集
python train_yolo.py --prepare
# 将图片放入 dataset/images/train/

# 3. 标注数据（安装 LabelImg）
pip install labelImg
labelImg dataset/images/train

# 4. 训练模型
python train_yolo.py --train --epochs 100

# 5. 使用训练好的模型
python yolo_api_server.py --model models/best.pt
```

## 📡 API 接口

### 健康检查
```bash
GET /health
```

### 图片识别
```bash
POST /api/recognize/base64
Content-Type: application/json

{
  "image": "base64编码的图片",
  "confidence": 0.5
}
```

### 带重量识别
```bash
POST /api/recognize/weight
Content-Type: application/json

{
  "image": "base64编码的图片",
  "weight": 0.5,
  "confidence": 0.5
}
```

## 🔧 收银台配置

在收银台 APP 中配置：

1. 打开 **硬件管理** → **AI 识别**
2. 选择 **自定义 API**
3. 填写地址：`http://<服务器IP>:8000/api/recognize/base64`
4. 保存并测试

## 📁 目录结构

```
ai-yolo/
├── quick_create_model.py   # 快速创建模型
├── yolo_api_server.py      # API 服务
├── train_yolo.py          # 训练脚本
├── requirements.txt      # 依赖
├── install.sh            # 安装脚本
├── models/               # 模型文件
├── dataset/              # 训练数据
│   ├── images/
│   └── labels/
├── test_images/           # 测试图片
└── runs/                  # 训练输出
```

## ❓ 常见问题

### Q: 识别准确率低？
- 训练更多数据（每个商品 100-200 张）
- 调整置信度阈值：`conf=0.3`
- 使用更大的模型：`yolov8s.pt`

### Q: 如何添加新商品？
1. 收集新商品的图片
2. 标注数据
3. 重新训练模型
4. 更新商品价格映射

### Q: 支持哪些格式？
- 输入：JPG, PNG, BMP
- 模型：PyTorch (.pt), ONNX (.onnx), TensorFlow (.tflite)

## 📚 详细文档

参见：[YOLOv8商品识别模型使用指南.md](./YOLOv8商品识别模型使用指南.md)
