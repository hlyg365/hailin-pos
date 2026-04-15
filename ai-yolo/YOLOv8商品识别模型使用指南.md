# YOLOv8 商品识别模型使用指南

## 📖 目录

1. [系统概述](#系统概述)
2. [快速开始](#快速开始)
3. [训练自定义模型](#训练自定义模型)
4. [API 接口](#api-接口)
5. [收银台集成](#收银台集成)
6. [故障排除](#故障排除)

---

## 系统概述

### 什么是 YOLOv8？

YOLOv8 是 YOLO（You Only Look Once）目标检测算法的最新版本，由 Ultralytics 开发。它能够实时识别图片中的多个物体，并给出它们的位置和类别。

### 本系统特点

- ✅ 支持常见商品识别（水果、蔬菜、包装食品）
- ✅ 支持自定义商品训练
- ✅ 提供标准 HTTP API 接口
- ✅ 支持带重量计价
- ✅ 兼容收银台 APP

---

## 快速开始

### 环境要求

- Python 3.8+
- 4GB+ RAM
- GPU（可选，加速推理）

### 安装步骤

```bash
# 1. 克隆或下载本目录

# 2. 安装依赖
pip install -r requirements.txt

# 或使用安装脚本
chmod +x install.sh
./install.sh
```

### 使用预训练模型

```bash
# 1. 创建模型
python quick_create_model.py

# 2. 启动服务
python yolo_api_server.py

# 3. 测试
# 浏览器打开 http://localhost:8000/docs
```

---

## 训练自定义模型

### 步骤 1：准备数据

```bash
# 创建数据集目录
python train_yolo.py --prepare
```

这会创建以下目录结构：

```
dataset/
├── images/
│   ├── train/          # 训练图片
│   └── val/            # 验证图片
└── labels/
    ├── train/          # 训练标签
    └── val/            # 验证标签
```

### 步骤 2：收集图片

为每个要识别的商品收集 100-200 张图片：

- ✅ 多角度拍摄
- ✅ 不同光照条件
- ✅ 不同背景
- ✅ 部分遮挡情况

### 步骤 3：标注数据

```bash
# 安装标注工具
pip install labelImg

# 启动标注
labelImg dataset/images/train
```

标注方法：
1. 打开图片
2. 用鼠标框选目标物体
3. 选择类别名称
4. 保存（生成 .txt 文件）

### 步骤 4：编辑类别

编辑 `dataset/data.yaml`：

```yaml
names:
  0: apple
  1: banana
  2: orange
  3: milk
  4: bread
  # 添加你的商品...
nc: 5  # 类别数量
```

### 步骤 5：训练模型

```bash
# 基本训练
python train_yolo.py --train

# 自定义参数
python train_yolo.py --train --epochs 200 --batch 8 --size 640
```

参数说明：
- `--epochs`: 训练轮次（越多越准确，但耗时更长）
- `--batch`: 批次大小（显存越大可设越大）
- `--size`: 图片大小（越大越准确，但越慢）

### 步骤 6：使用模型

```bash
# 预测单张图片
python train_yolo.py --predict --image test.jpg

# 批量预测
python train_yolo.py --batch --dir ./test_images

# 导出模型
python train_yolo.py --export --model models/best.pt --format onnx
```

---

## API 接口

### 启动服务

```bash
python yolo_api_server.py --port 8000
```

### 接口列表

#### 健康检查

```
GET /health
```

响应：
```json
{
  "status": "healthy",
  "service": "yolo-recognition",
  "model_loaded": true,
  "model": "models/best.pt"
}
```

#### 图片识别

```
POST /api/recognize
Content-Type: multipart/form-data

image: <文件>
confidence: 0.5
```

或 Base64 方式：

```
POST /api/recognize/base64
Content-Type: application/json

{
  "image": "base64编码的图片...",
  "confidence": 0.5
}
```

响应：
```json
{
  "success": true,
  "count": 2,
  "products": [
    {
      "label": "apple",
      "name": "苹果",
      "confidence": 0.95,
      "price": 300
    },
    {
      "label": "banana",
      "name": "香蕉",
      "confidence": 0.88,
      "price": 200
    }
  ],
  "total_price": 500,
  "processing_time": 0.123
}
```

#### 带重量识别

```
POST /api/recognize/weight
Content-Type: application/json

{
  "image": "base64编码的图片...",
  "weight": 0.5,
  "confidence": 0.5
}
```

响应：
```json
{
  "success": true,
  "count": 1,
  "products": [
    {
      "label": "apple",
      "name": "苹果",
      "confidence": 0.95,
      "price": 300,
      "weight": 0.5,
      "is_weighted": true,
      "unit_price": 1298,
      "line_total": 649
    }
  ],
  "total_price": 649,
  "weight": 0.5
}
```

#### 获取商品列表

```
GET /products
```

响应：
```json
{
  "success": true,
  "count": 12,
  "products": [
    {"label": "apple", "name": "苹果", "price": 300},
    {"label": "banana", "name": "香蕉", "price": 200}
  ]
}
```

#### 更新商品价格

```
POST /api/price/update
Content-Type: application/json

{
  "label": "apple",
  "price": 350
}
```

---

## 收银台集成

### 配置步骤

1. **启动 API 服务**
   ```bash
   python yolo_api_server.py --host 0.0.0.0 --port 8000
   ```

2. **获取服务器 IP**
   ```bash
   # Linux/macOS
   hostname -I
   
   # Windows
   ipconfig
   ```

3. **配置收银台 APP**
   - 打开收银台 APP
   - 进入 **设置** → **硬件管理** → **AI 识别**
   - 选择 **自定义 API**
   - 填写地址：`http://<服务器IP>:8000/api/recognize/base64`
   - 保存

### 测试识别

1. 在收银台点击 **AI 识别** 按钮
2. 将商品放在摄像头前
3. 系统自动识别并显示结果
4. 确认后将商品添加到购物车

---

## 故障排除

### 问题：模型加载失败

```
Error: model not loaded
```

解决：
```bash
# 检查模型文件
ls -la models/

# 重新创建模型
python quick_create_model.py
```

### 问题：识别结果为空

可能原因：
1. 图片质量问题 → 改善光线
2. 商品不在训练集中 → 训练自定义模型
3. 置信度太高 → 降低 confidence 参数

### 问题：API 响应慢

优化建议：
1. 使用 GPU 推理
2. 减小图片尺寸
3. 使用更小的模型（yolov8n）

### 问题：CUDA 内存不足

```bash
# 使用 CPU
export CUDA_VISIBLE_DEVICES=-1

# 或减小批次大小
python train_yolo.py --train --batch 4
```

---

## 附录

### 模型选择

| 模型 | 参数量 | 速度 | 准确率 | 适用场景 |
|------|--------|------|--------|----------|
| yolov8n | 3.2M | 最快 | 较低 | 实时应用 |
| yolov8s | 11.2M | 快 | 中等 | 一般场景 |
| yolov8m | 25.9M | 中等 | 较高 | 追求准确 |
| yolov8l | 53.7M | 慢 | 高 | 服务器部署 |

### 推荐的训练参数

| 商品数量 | 建议轮次 | 批次大小 | 图片大小 |
|----------|----------|----------|----------|
| 1-5 | 50-100 | 16 | 640 |
| 5-20 | 100-200 | 8 | 640 |
| 20+ | 200+ | 4 | 640 |

### 商品价格映射

编辑 `yolo_api_server.py` 中的 `PRODUCT_PRICE_MAP`：

```python
PRODUCT_PRICE_MAP = {
    'apple': 300,    # 3.00 元
    'banana': 200,   # 2.00 元
    # 添加更多商品...
}
```

---

## 📞 技术支持

如有问题，请联系开发团队。

---

*文档版本：1.0*
*最后更新：2024-03-20*
