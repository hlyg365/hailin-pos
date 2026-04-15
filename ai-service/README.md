# 海邻到家 AI 商品识别服务

基于 YOLOv8 的智能商品识别与电子秤集成方案，用于称重收银一体机的商品自动识别。

## 功能特性

- **AI 商品识别**：基于 YOLOv8 目标检测模型，自动识别放入秤盘的商品
- **电子秤联动**：监听电子秤重量变化，稳定后自动触发拍照识别
- **价格自动计算**：识别结果自动匹配商品价格，支持称重商品按重量计价
- **多协议支持**：支持顶尖 OS2 等主流电子秤协议
- **模拟模式**：无需硬件即可进行开发测试

## 目录结构

```
ai-service/
├── ai_service.py          # AI 识别服务（Flask API）
├── scale_listener.py      # 电子秤监听服务
├── android_startup.py     # Android 启动器
├── requirements.txt      # Python 依赖
├── start.sh             # Linux/macOS 启动脚本
└── README.md            # 本文档
```

## 快速开始

### 1. 安装依赖

```bash
# 克隆项目后
cd ai-service
pip install -r requirements.txt
```

### 2. 启动 AI 识别服务

```bash
# Linux/macOS
./start.sh ai

# 或直接运行
python ai_service.py --port 5000
```

### 3. 启动电子秤监听

```bash
# 自动检测串口
./start.sh scale

# 指定串口
python scale_listener.py --port /dev/ttyUSB0

# 模拟模式（无需硬件）
python scale_listener.py --simulate
```

### 4. 查看服务状态

```bash
./start.sh status
```

## API 接口

### 健康检查

```bash
GET /health
```

响应：
```json
{
  "status": "healthy",
  "service": "ai-recognition",
  "model_loaded": true,
  "model_type": "yolov8"
}
```

### 获取商品列表

```bash
GET /products
```

响应：
```json
{
  "success": true,
  "count": 10,
  "products": [
    {"label": "apple", "name": "苹果", "price": 300}
  ]
}
```

### 图片识别

```bash
POST /recognize
Content-Type: multipart/form-data

image: <图片文件>
```

或：

```bash
POST /recognize
Content-Type: application/json

{
  "image": "<base64编码的图片>",
  "confidence": 0.75
}
```

响应：
```json
{
  "success": true,
  "count": 2,
  "products": [
    {"label": "apple", "name": "苹果", "confidence": 0.95, "price": 300},
    {"label": "banana", "name": "香蕉", "confidence": 0.88, "price": 200}
  ],
  "total_price": 500,
  "processing_time": 0.123
}
```

### 带重量的识别

```bash
POST /recognize_with_weight
Content-Type: application/json

{
  "image": "<base64编码的图片>",
  "weight": 0.5,
  "confidence": 0.75
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

## 电子秤协议

### 顶尖 OS2 主动协议

| 参数 | 值 |
|------|-----|
| 波特率 | 9600 |
| 数据位 | 8 |
| 校验位 | None |
| 停止位 | 1 |
| 量程 | 15kg |

### 数据格式

```
+002.450 kg\r\n  # 稳定重量 2.450 kg
+000.150 kg\r\n  # 不稳定的 0.150 kg
```

## 前端集成

### 安装

```typescript
// 在项目中已集成
import { AIServiceClient, useAIIntegration } from '@/lib/ai-integration';
```

### 使用示例

```typescript
// 使用 Hook
const { 
  isConnected,      // AI 服务连接状态
  isRecognizing,     // 正在识别
  recognize,         // 手动识别
  latestResult,      // 最新识别结果
  weight,           // 当前重量
  scaleStatus       // 电子秤状态
} = useAIIntegration();

// 手动识别
const result = await recognize();

// 带重量识别
const result = await recognize({ weight: 0.5 });
```

### API 端点配置

```typescript
// 设置 API 地址（默认 http://127.0.0.1:5000）
AIServiceClient.configure({
  baseUrl: 'http://192.168.1.100:5000'
});
```

## 开发模式

### 模拟器

使用 `scale-simulator.ts` 进行开发测试，无需连接硬件：

```typescript
import { ScaleSimulator } from '@/lib/scale-simulator';

const simulator = new ScaleSimulator({
  onWeightChange: (weight, stable) => {
    console.log(`重量: ${weight}kg, ${stable ? '稳定' : '变化中'}`);
  },
  onStable: (weight) => {
    console.log(`触发识别: ${weight}kg`);
  }
});

simulator.start();

// 模拟放上商品
simulator.setWeight(0.5);

// 模拟取走商品
simulator.setWeight(0);

// 停止
simulator.stop();
```

## Android 部署

### 安装依赖

```bash
pip install flask pyserial opencv-python-headless
```

### 启动服务

```bash
python android_startup.py
```

### 开机自启动

创建 Termux 服务脚本或使用 Automation 应用实现开机自启动。

## 故障排除

### AI 服务无法启动

1. 检查端口是否被占用：`lsof -i :5000`
2. 检查模型文件是否存在
3. 查看日志：`tail -f logs/ai_service.log`

### 电子秤无法连接

1. 检查串口设备：`ls -l /dev/ttyUSB*`
2. 检查权限：`sudo chmod 666 /dev/ttyUSB0`
3. 使用模拟模式测试：`python scale_listener.py --simulate`

### 识别结果不准确

1. 调整置信度阈值
2. 优化摄像头位置和光线
3. 使用自定义模型进行训练

## License

MIT License
